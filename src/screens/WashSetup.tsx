import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Bug, CircleDot, Clock, Box, FlaskConical, Magnet, Play, ShieldCheck, ShoppingBag, Sparkles, Zap } from 'lucide-react';
import { BackHeader, Cta, Segmented, Toggle } from '../components/ui';
import { StepVisual } from '../components/StepVisual';
import { useStore } from '../store/useStore';
import { useProductMap } from '../store/catalog';
import { buildScenario } from '../domain/scenario';
import type { ScenarioKind } from '../domain/types';
import { CarArt } from '../components/art/CarArt';

const KINDS: { value: ScenarioKind; label: string; hint: string; icon: JSX.Element }[] = [
  { value: 'quick', label: 'Быстрая', hint: 'без варежки', icon: <Zap size={20} /> },
  { value: 'standard', label: 'Стандартная', hint: 'две фазы', icon: <Sparkles size={20} /> },
  { value: 'protect', label: 'С защитой', hint: '+ защитный слой', icon: <ShieldCheck size={20} /> },
  { value: 'iron', label: 'С Iron', hint: 'металл. вкрапления', icon: <Magnet size={20} /> },
];

export function WashSetup() {
  const nav = useNavigate();
  const { settings, setSettings, car, equipment, owned, startWash, active } = useStore();
  const products = useProductMap();

  const scenario = useMemo(
    () => buildScenario({ settings, car, equipment, owned, getProduct: (id) => products.get(id) }),
    [settings, car, equipment, owned, products],
  );

  const ownedCats = new Set(owned.map((o) => products.get(o.productId)?.category));
  const canWash = scenario.productIds.length > 0;

  const begin = () => {
    startWash(scenario);
    nav('/wash/run');
  };

  return (
    <div className="screen">
      <div className="wash-hero-art" aria-hidden="true">
        <CarArt width={330} wet />
      </div>
      <BackHeader />
      <div className="eyebrow">Сценарий мойки</div>
      <h1 className="h1" style={{ marginTop: 6, maxWidth: '85%' }} data-testid="scenario-title">{scenario.title}</h1>
      <p className="lead" style={{ maxWidth: '80%' }}>{scenario.subtitle}</p>

      <div className="kind-grid" style={{ marginTop: 18 }} role="radiogroup" aria-label="Тип мойки">
        {KINDS.map((k) => (
          <button key={k.value} role="radio" aria-checked={settings.kind === k.value} className="kind-tile" onClick={() => setSettings({ kind: k.value })}>
            <span className="kind-ico">{k.icon}</span>
            <span className="kind-txt">
              <b>{k.label}</b>
              <span>{k.hint}</span>
            </span>
          </button>
        ))}
      </div>

      <div className="field" style={{ marginTop: 16 }}>
        <span className="eyebrow">Загрязнение</span>
        <Segmented
          label="Степень загрязнения"
          value={settings.dirt}
          onChange={(dirt) => setSettings({ dirt })}
          options={[
            { value: 'light', label: 'Лёгкое' },
            { value: 'normal', label: 'Обычное' },
            { value: 'heavy', label: 'Сильное' },
          ]}
        />
        <span className="muted" style={{ fontSize: 12.5 }}>
          Дозировка выбирается внутри диапазона производителя: лёгкое — слабее, сильное — крепче.
        </span>
      </div>

      {(ownedCats.has('wheel_cleaner') || ownedCats.has('insect_remover')) && (
        <div className="stack" style={{ marginTop: 12 }}>
          {ownedCats.has('wheel_cleaner') && (
            <Toggle checked={settings.includeWheels} onChange={(v) => setSettings({ includeWheels: v })} title="Помыть диски" icon={<CircleDot size={20} className="accent" />} />
          )}
          {ownedCats.has('insect_remover') && (
            <Toggle checked={settings.includeInsects} onChange={(v) => setSettings({ includeInsects: v })} title="Удалить следы насекомых" icon={<Bug size={20} className="accent" />} />
          )}
        </div>
      )}

      <div className="grid-3 stat-row" style={{ marginTop: 16 }}>
        <div className="stat">
          <Clock size={20} className="accent" />
          <b className="num">≈ {scenario.estMinutes} мин</b>
          <span>время</span>
        </div>
        <div className="stat">
          <FlaskConical size={20} className="accent" />
          <b className="num">{scenario.productIds.length}</b>
          <span>средства</span>
        </div>
        <div className="stat">
          <Box size={20} className="accent" />
          <b className="num">{scenario.equipmentIds.length}</b>
          <span>оборудование</span>
        </div>
      </div>

      {scenario.notices.length > 0 && (
        <div className="stack" style={{ marginTop: 14 }}>
          {scenario.notices.map((n, i) => (
            <div key={i} className="notice">
              <AlertTriangle size={18} />
              <div>{n}</div>
            </div>
          ))}
        </div>
      )}

      {scenario.missingRoles.length > 0 && (
        <button
          className="card press row shop-cta"
          style={{ width: '100%', marginTop: 12, textAlign: 'left' }}
          onClick={() => nav(`/shop?need=${scenario.missingRoles.join(',')}`)}
          data-testid="shop-missing"
        >
          <div className="icon-tile"><ShoppingBag size={20} /></div>
          <div style={{ flex: 1 }}>
            <div className="h3" style={{ fontSize: 15.5 }}>Подобрать недостающее</div>
            <div className="muted" style={{ fontSize: 13 }}>Что докупить, чтобы закрыть все этапы</div>
          </div>
        </button>
      )}

      {canWash ? (
        <ol className="step-cards" aria-label="Этапы мойки">
          {scenario.steps.map((s, i) => {
            const p = s.productId ? products.get(s.productId) : undefined;
            const eq = s.equipmentId ? equipment.find((e) => e.id === s.equipmentId) : undefined;
            return (
              <li key={s.id} className="step-card fade-up" style={{ animationDelay: `${Math.min(i, 10) * 30}ms` }}>
                <span className="step-num num">{i + 1}</span>
                <div className="step-visual">
                  <StepVisual step={s} product={p} equipment={eq} size={58} />
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div className="muted" style={{ fontSize: 12 }}>{s.stage}</div>
                  <div className="h3" style={{ fontSize: 15.5 }}>
                    {s.title}
                    {p && <span className="muted" style={{ fontWeight: 600 }}> · {p.name}</span>}
                  </div>
                  <div className="step-card-text">
                    {s.recipe?.mode === 'consumption'
                      ? `≈${s.recipe.chemMl} мл прямо из флакона, без разбавления`
                      : s.recipe
                      ? s.recipe.waterMl > 0
                        ? `${s.recipe.chemMl} мл химии + ${s.recipe.waterMl.toLocaleString('ru-RU')} мл воды`
                        : `${s.recipe.chemMl} мл без разведения`
                      : s.noVerifiedRecipe
                        ? 'Нет подтверждённой методики — по этикетке'
                        : s.text}
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      ) : (
        <div className="empty" style={{ marginTop: 18 }}>
          <div className="h3">Сценарий пока не собрать</div>
          <p className="muted" style={{ fontSize: 14.5 }}>Добавьте химию и оборудование — остальное WASHFLOW сделает сам.</p>
          <div className="row" style={{ justifyContent: 'center', gap: 8 }}>
            <button className="btn btn-outline" onClick={() => nav('/catalog')}>Химия</button>
            <button className="btn btn-outline" onClick={() => nav('/equipment/new')}>Оборудование</button>
          </div>
        </div>
      )}

      <div className="stack" style={{ marginTop: 18 }}>
        {active && (
          <button className="btn btn-secondary block" onClick={() => nav('/wash/run')}>
            Продолжить начатую мойку · этап {active.index + 1}
          </button>
        )}
        <Cta icon={<Play size={24} fill="currentColor" />} onClick={begin} disabled={!canWash} testId="begin-scenario">
          {active ? 'Начать заново' : 'Начать сценарий'}
        </Cta>
      </div>
    </div>
  );
}
