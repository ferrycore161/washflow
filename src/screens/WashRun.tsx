import { useEffect, useRef, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  Check,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Droplet,
  Droplets,
  FlaskConical,
  Info,
  Lightbulb,
  MoreHorizontal,
  Pause,
  Play,
  RotateCcw,
  SkipForward,
  Timer,
  Wind,
  X,
} from 'lucide-react';
import { Logo, Sheet, SheetHeader, toast } from '../components/ui';
import { ProductBottle } from '../components/art/Bottle';
import { EquipmentArt } from '../components/art/EquipmentArt';
import { useStore } from '../store/useStore';
import { useProductMap } from '../store/catalog';
import { formatVolume } from '../domain/dilution';
import { EQUIPMENT_META, METHOD_VERB } from '../domain/equipment';
import type { ScenarioStep } from '../domain/types';

function useNow(active: boolean, interval = 250) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!active) return;
    const t = setInterval(() => setNow(Date.now()), interval);
    return () => clearInterval(t);
  }, [active, interval]);
  return now;
}

function beep() {
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    [0, 0.25, 0.5].forEach((t) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.frequency.value = 880;
      g.gain.setValueAtTime(0.0001, ctx.currentTime + t);
      g.gain.exponentialRampToValueAtTime(0.3, ctx.currentTime + t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + t + 0.18);
      o.connect(g).connect(ctx.destination);
      o.start(ctx.currentTime + t);
      o.stop(ctx.currentTime + t + 0.2);
    });
    navigator.vibrate?.([200, 100, 200]);
  } catch {
    /* звук недоступен */
  }
}

const fmtClock = (sec: number) => {
  const s = Math.max(0, Math.round(sec));
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, '0')}`;
};

function useWakeLock() {
  useEffect(() => {
    let lock: { release: () => Promise<void> } | null = null;
    const nav = navigator as Navigator & { wakeLock?: { request: (t: 'screen') => Promise<{ release: () => Promise<void> }> } };
    const req = () => nav.wakeLock?.request('screen').then((l) => (lock = l)).catch(() => {});
    req();
    const onVis = () => document.visibilityState === 'visible' && req();
    document.addEventListener('visibilitychange', onVis);
    return () => {
      document.removeEventListener('visibilitychange', onVis);
      lock?.release().catch(() => {});
    };
  }, []);
}

function StepTimer({ step }: { step: ScenarioStep }) {
  const { active, startTimer, clearTimer } = useStore();
  const end = active?.timers[step.id];
  const total = step.timerSec ?? 0;
  const running = !!end;
  const now = useNow(running);
  const left = end ? Math.max(0, (end - now) / 1000) : total;
  const finished = running && left <= 0;
  const fired = useRef(false);
  const [paused, setPaused] = useState<number | null>(null);

  useEffect(() => {
    fired.current = false;
    setPaused(null);
  }, [step.id]);
  useEffect(() => {
    if (finished && !fired.current) {
      fired.current = true;
      beep();
    }
  }, [finished]);

  const shown = paused ?? left;
  const r = 70;
  const c = 2 * Math.PI * r;
  const progress = total ? 1 - shown / total : 0;
  const range = step.timerRange && step.timerRange.to > step.timerRange.from ? step.timerRange : null;

  return (
    <div className={`timer ${finished ? 'done' : ''}`}>
      <svg width="170" height="170" viewBox="0 0 170 170" aria-hidden="true">
        <circle cx="85" cy="85" r={r} stroke="rgba(255,255,255,0.08)" strokeWidth="10" fill="none" />
        <circle
          cx="85"
          cy="85"
          r={r}
          stroke={finished ? 'var(--protect)' : 'var(--accent)'}
          strokeWidth="10"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - progress)}
          transform="rotate(-90 85 85)"
          style={{ transition: 'stroke-dashoffset 0.3s linear' }}
        />
      </svg>
      <div className="timer-center">
        <div className="timer-value num" role="timer" aria-live="off">{finished ? 'Готово' : fmtClock(shown)}</div>
        <div className="muted" style={{ fontSize: 12.5 }}>
          {finished ? 'можно смывать' : range ? `можно до ${fmtClock(range.to)}` : 'выдержка'}
        </div>
      </div>
      <div className="row" style={{ justifyContent: 'center', gap: 10, marginTop: 12 }}>
        {!running && paused === null && (
          <button className="btn btn-outline" onClick={() => startTimer(step.id, total)} data-testid="timer-start">
            <Play size={18} fill="currentColor" /> Запустить таймер
          </button>
        )}
        {running && !finished && paused === null && (
          <button className="btn btn-secondary" onClick={() => { setPaused(left); clearTimer(step.id); }}>
            <Pause size={18} /> Пауза
          </button>
        )}
        {paused !== null && (
          <button className="btn btn-outline" onClick={() => { startTimer(step.id, paused); setPaused(null); }}>
            <Play size={18} fill="currentColor" /> Продолжить
          </button>
        )}
        {(running || paused !== null) && (
          <button className="btn btn-secondary" aria-label="Сбросить таймер" onClick={() => { clearTimer(step.id); setPaused(null); fired.current = false; }}>
            <RotateCcw size={18} />
          </button>
        )}
      </div>
    </div>
  );
}

const KIND_ICON = {
  prepare: FlaskConical,
  apply: Droplet,
  dwell: Timer,
  rinse: Droplets,
  contact: Droplet,
  dry: Wind,
  info: ClipboardList,
};

export function WashRun() {
  const nav = useNavigate();
  const { active, goToStep, markStep, abortWash, equipment } = useStore();
  const products = useProductMap();
  const [menu, setMenu] = useState(false);
  const [confirmExit, setConfirmExit] = useState(false);
  const [why, setWhy] = useState(false);
  useWakeLock();
  const now = useNow(!!active, 1000);

  useEffect(() => setWhy(false), [active?.index]);

  if (!active) return <Navigate to="/wash" replace />;
  const { scenario, index } = active;
  const step = scenario.steps[index];
  const total = scenario.steps.length;
  const product = step.productId ? products.get(step.productId) : undefined;
  const eq = step.equipmentId ? equipment.find((e) => e.id === step.equipmentId) : undefined;
  const Icon = KIND_ICON[step.kind];
  const isLast = index === total - 1;
  const elapsed = (now - active.startedAt) / 1000;

  const next = () => {
    markStep(step.id, 'done');
    if (isLast) nav('/wash/done');
    else {
      goToStep(index + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };
  const skip = () => {
    markStep(step.id, 'skipped');
    if (isLast) nav('/wash/done');
    else {
      goToStep(index + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="screen no-tabbar run">
      <div className="topbar">
        <button className="icon-btn" aria-label="Выйти из мойки" onClick={() => setConfirmExit(true)}>
          <X size={20} />
        </button>
        <Logo size={20} sub={false} />
        <button className="icon-btn" aria-label="Все этапы" onClick={() => setMenu(true)}>
          <MoreHorizontal size={20} />
        </button>
      </div>

      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <div className="h3" data-testid="step-counter">Этап {index + 1} из {total}</div>
          <div className="muted" style={{ fontSize: 13.5, marginTop: 2 }}>{step.stage}</div>
        </div>
        <div className="elapsed num" aria-label="Время мойки">
          <Timer size={15} /> {fmtClock(elapsed)}
        </div>
      </div>
      <div className="segbar" aria-hidden="true">
        {scenario.steps.map((s, i) => (
          <i key={s.id} className={i < index ? (active.skipped.includes(s.id) ? 'skip' : 'on') : i === index ? 'cur' : ''} />
        ))}
      </div>

      <section className="run-card card" key={step.id} aria-live="polite">
        <div className="row" style={{ alignItems: 'flex-start', gap: 14 }}>
          <div className="icon-tile" style={{ width: 54, height: 54, borderRadius: 17 }}>
            <Icon size={24} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div className="eyebrow">Текущий шаг</div>
            <h1 className="h1 run-title" data-testid="step-title">{step.title}</h1>
            {product && (
              <div className="run-product">
                <span className="muted">{product.brand}</span> <b>{product.name}</b>
              </div>
            )}
          </div>
        </div>

        <p className="run-text">{step.text}</p>

        {step.kind === 'prepare' && product && (
          <div className="mix">
            <div className="mix-visual">
              <div className="mix-bottle"><ProductBottle product={product} size={120} /></div>
              {eq && (
                <>
                  <span className="mix-plus" aria-hidden="true">+</span>
                  <div className="mix-eq">
                    <EquipmentArt type={eq.type} size={92} />
                    <div>
                      <div className="muted" style={{ fontSize: 12 }}>Моё оборудование</div>
                      <b style={{ fontSize: 15 }}>{eq.name}</b>
                      <div className="muted" style={{ fontSize: 12.5 }}>{formatVolume(eq.volumeMl)}</div>
                    </div>
                  </div>
                </>
              )}
            </div>
            {step.recipe && (
              <div className="grid-2" style={{ marginTop: 12 }}>
                <div className="dose chem">
                  <Droplet size={26} fill="currentColor" />
                  <div>
                    <div className="dose-v num" data-testid="dose-chem">{step.recipe.chemMl.toLocaleString('ru-RU')}<small> мл</small></div>
                    <div className="dose-l">{step.recipe.waterMl === 0 ? 'средства без воды' : 'химии'}</div>
                  </div>
                </div>
                <div className="dose water">
                  <Droplet size={26} fill="currentColor" />
                  <div>
                    <div className="dose-v num" data-testid="dose-water">{step.recipe.waterMl.toLocaleString('ru-RU')}<small> мл</small></div>
                    <div className="dose-l">воды</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {step.recipe?.mode === 'consumption' && product && (
          <div className="mix">
            <div className="mix-visual">
              <div className="mix-bottle"><ProductBottle product={product} size={120} /></div>
              {eq && (
                <div className="mix-eq">
                  <EquipmentArt type={eq.type} size={92} />
                  <div>
                    <div className="muted" style={{ fontSize: 12 }}>Моё оборудование</div>
                    <b style={{ fontSize: 15 }}>{eq.name}</b>
                    <div className="muted" style={{ fontSize: 12.5 }}>прямо на флакон</div>
                  </div>
                </div>
              )}
            </div>
            <div className="grid-2" style={{ marginTop: 12 }}>
              <div className="dose chem">
                <Droplet size={26} fill="currentColor" />
                <div>
                  <div className="dose-v num" data-testid="dose-consumption">≈{step.recipe.chemMl}<small> мл</small></div>
                  <div className="dose-l">
                    на машину
                    {step.recipe.rangeMl && ` · ${step.recipe.rangeMl.from}–${step.recipe.rangeMl.to}`}
                  </div>
                </div>
              </div>
              <div className="dose water off">
                <Droplet size={26} />
                <div>
                  <div className="dose-v">0<small> мл</small></div>
                  <div className="dose-l">без воды</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {step.noVerifiedRecipe && (
          <div className="notice" style={{ marginTop: 14 }} role="alert">
            <AlertTriangle size={20} />
            <div>
              <b>Нет подтверждённой методики.</b> Мы не придумываем дозировку — используйте инструкцию на этикетке.
              {step.warnings[0] && <div style={{ marginTop: 4, opacity: 0.85 }}>{step.warnings[0]}</div>}
            </div>
          </div>
        )}

        {step.timerSec ? <StepTimer step={step} /> : null}

        {(step.method || step.timerRange) && (
          <div className="facts">
            {step.method && eq && (
              <div className="fact">
                <span className="muted">Чем</span>
                <b>
                  {eq.type === 'bottle_trigger'
                    ? 'распылителем на флаконе'
                    : step.kind === 'prepare'
                      ? EQUIPMENT_META[eq.type].label
                      : METHOD_VERB[step.method]}
                </b>
              </div>
            )}
            {step.timerRange && (
              <div className="fact">
                <span className="muted">Выдержка</span>
                <b className="num">
                  {step.timerRange.from === step.timerRange.to
                    ? fmtClock(step.timerRange.from)
                    : `${fmtClock(step.timerRange.from)}–${fmtClock(step.timerRange.to)}`}
                </b>
              </div>
            )}
          </div>
        )}

        {step.tips.length > 0 && (
          <ul className="tips">
            {step.tips.map((t, i) => (
              <li key={i}><Lightbulb size={16} /> {t}</li>
            ))}
          </ul>
        )}
        {!step.noVerifiedRecipe && step.warnings.length > 0 && (
          <ul className="tips warn">
            {step.warnings.map((t, i) => (
              <li key={i}><AlertTriangle size={16} /> {t}</li>
            ))}
          </ul>
        )}

        {step.recipe && (
          <div style={{ marginTop: 12 }}>
            <button className="btn btn-ghost" style={{ minHeight: 40, padding: 0, fontSize: 14 }} onClick={() => setWhy(!why)} aria-expanded={why}>
              <Info size={16} /> Откуда эти цифры
            </button>
            {why && (
              <div className="why">
                {step.recipe.basisText}. Объём раствора — {formatVolume(step.recipe.totalMl)}.
                {step.sourceUrl && (
                  <>
                    {' '}
                    <a href={step.sourceUrl} target="_blank" rel="noreferrer" className="src-link">Методика производителя</a>
                    {step.checkedAt && <span>, проверено {new Date(step.checkedAt).toLocaleDateString('ru-RU')}</span>}
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </section>

      <div className="run-actions">
        <button className="btn btn-primary cta" onClick={next} data-testid="next-step">
          <span className="cta-icon"><Check size={24} /></span>
          {isLast ? 'Завершить мойку' : 'Готово, следующий шаг'}
          <span className="cta-arrow" aria-hidden="true"><ChevronRight size={22} /></span>
        </button>
        <div className="row" style={{ marginTop: 10, gap: 10 }}>
          <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => goToStep(index - 1)} disabled={index === 0} data-testid="prev-step">
            <ChevronLeft size={18} /> Назад
          </button>
          <button className="btn btn-secondary" style={{ flex: 1 }} onClick={skip} disabled={!step.skippable} title={step.skippable ? '' : 'Этот этап нельзя пропускать'} data-testid="skip-step">
            <SkipForward size={18} /> {step.skippable ? 'Пропустить' : 'Обязательно'}
          </button>
        </div>
      </div>

      <Sheet open={menu} onClose={() => setMenu(false)} label="Все этапы">
        <SheetHeader title="Все этапы" onClose={() => setMenu(false)} />
        {scenario.steps.map((s, i) => {
          const p = s.productId ? products.get(s.productId) : undefined;
          const state = active.done.includes(s.id) ? 'done' : active.skipped.includes(s.id) ? 'skip' : '';
          return (
            <button key={s.id} className="menu-item" onClick={() => { goToStep(i); setMenu(false); }} aria-current={i === index ? 'step' : undefined}>
              <span className={`step-dot ${state} ${i === index ? 'cur' : ''}`}>{state === 'done' ? <Check size={14} /> : i + 1}</span>
              <span style={{ flex: 1 }}>
                {s.title}
                {p && <span className="muted"> · {p.name}</span>}
              </span>
            </button>
          );
        })}
        <button className="btn btn-outline block" style={{ marginTop: 16 }} onClick={() => { setMenu(false); nav('/wash/done'); }}>
          Завершить мойку сейчас
        </button>
      </Sheet>

      <Sheet open={confirmExit} onClose={() => setConfirmExit(false)} label="Выход из мойки">
        <SheetHeader title="Выйти из мойки?" onClose={() => setConfirmExit(false)} />
        <p className="muted" style={{ marginTop: 0 }}>Прогресс сохранится — продолжить можно с главного экрана.</p>
        <div className="stack">
          <button className="btn btn-secondary block" onClick={() => nav('/')}>Выйти, сохранить прогресс</button>
          <button
            className="btn btn-danger block"
            onClick={() => {
              abortWash();
              toast('Мойка отменена');
              nav('/');
            }}
          >
            Отменить мойку
          </button>
        </div>
      </Sheet>
    </div>
  );
}
