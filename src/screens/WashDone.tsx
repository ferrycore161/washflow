import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Check, Clock, ListChecks, Sparkles } from 'lucide-react';
import { Toggle } from '../components/ui';
import { ProductBottle } from '../components/art/Bottle';
import { useStore, type WashRecord } from '../store/useStore';
import { useProductMap } from '../store/catalog';
import { formatMl } from '../domain/dilution';

const fmtDur = (s: number) => {
  const m = Math.round(s / 60);
  return m < 60 ? `${m} мин` : `${Math.floor(m / 60)} ч ${m % 60} мин`;
};

export function WashDone() {
  const nav = useNavigate();
  const { active, finishWash, owned } = useStore();
  const products = useProductMap();
  const [apply, setApply] = useState(true);
  const [record, setRecord] = useState<WashRecord | null>(null);

  if (record) {
    return (
      <div className="screen no-tabbar done-screen">
        <div className="done-badge"><Check size={46} strokeWidth={2.5} /></div>
        <h1 className="h1" style={{ textAlign: 'center' }}>Машина чистая!</h1>
        <p className="lead" style={{ textAlign: 'center' }}>{record.title} · {fmtDur(record.durationSec)}</p>
        <div className="stack" style={{ marginTop: 28 }}>
          <button className="btn btn-primary block" style={{ minHeight: 58 }} onClick={() => nav('/')}>На главную</button>
          <button className="btn btn-secondary block" onClick={() => nav('/chemistry')}>Остатки химии</button>
        </div>
      </div>
    );
  }
  if (!active) return <Navigate to="/" replace />;

  const elapsed = Math.round((Date.now() - active.startedAt) / 1000);
  const consumption = Object.entries(active.scenario.consumption);
  const skippedPrep = new Set(
    active.scenario.steps.filter((s) => s.kind === 'prepare' && active.skipped.includes(s.id)).map((s) => s.productId),
  );

  return (
    <div className="screen no-tabbar">
      <div className="done-badge sm"><Sparkles size={30} /></div>
      <h1 className="h1" style={{ textAlign: 'center' }}>Мойка завершена</h1>
      <p className="lead" style={{ textAlign: 'center' }}>{active.scenario.title}</p>

      <div className="grid-2" style={{ marginTop: 20 }}>
        <div className="stat"><Clock size={20} className="accent" /><b className="num">{fmtDur(elapsed)}</b><span>время</span></div>
        <div className="stat"><ListChecks size={20} className="accent" /><b className="num">{active.done.length} / {active.scenario.steps.length}</b><span>этапов выполнено</span></div>
      </div>

      {consumption.length > 0 && (
        <div className="card" style={{ marginTop: 16 }}>
          <div className="eyebrow" style={{ marginBottom: 10 }}>Расход концентрата</div>
          {consumption.map(([pid, ml]) => {
            const p = products.get(pid);
            const o = owned.find((x) => x.productId === pid);
            if (!p) return null;
            return (
              <div key={pid} className="row" style={{ padding: '8px 0', opacity: skippedPrep.has(pid) ? 0.45 : 1 }}>
                <ProductBottle product={p} size={46} />
                <div style={{ flex: 1 }}>
                  <b>{p.name}</b>
                  <div className="muted" style={{ fontSize: 13 }}>
                    {skippedPrep.has(pid) ? 'шаг пропущен — не списываем' : o ? `останется ${formatMl(Math.max(0, o.remainingMl - ml))}` : ''}
                  </div>
                </div>
                <b className="num">−{formatMl(ml)}</b>
              </div>
            );
          })}
          <div style={{ marginTop: 10 }}>
            <Toggle checked={apply} onChange={setApply} title="Списать из остатков" hint="Обновить «Осталось» в «Моей химии»" />
          </div>
        </div>
      )}

      <button
        className="btn btn-primary block"
        style={{ minHeight: 60, marginTop: 22 }}
        data-testid="finish-wash"
        onClick={() => setRecord(finishWash(apply))}
      >
        <Check size={20} /> Сохранить
      </button>
      <button className="btn btn-ghost block" style={{ marginTop: 6 }} onClick={() => nav('/wash/run')}>
        Вернуться к этапам
      </button>
    </div>
  );
}
