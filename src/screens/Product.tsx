import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AlertTriangle, Check, Clock, ExternalLink, Layers, Pencil, Plus, ShieldAlert, ShieldCheck, Trash2 } from 'lucide-react';
import { BackHeader, Empty, Progress, Segmented, toast } from '../components/ui';
import { productColor } from '../components/art/Bottle';
import { ProductImage } from '../components/ProductImage';
import { AddChemSheet } from '../components/AddChemSheet';
import { useStore, uid } from '../store/useStore';
import { useProductMap } from '../store/catalog';
import { CATEGORY_LABEL, METHOD_LABEL } from '../domain/equipment';
import { formatDilutionRange, formatMl } from '../domain/dilution';
import type { Application, ApplicationMethod, Dilution, Product, ProductCategory, Surface } from '../domain/types';
import { categoryTagClass } from './Chemistry';

function fmtDwell(a: Application) {
  if (!a.dwellSec) return null;
  const f = (s: number) => (s < 60 ? `${s} с` : `${Math.round((s / 60) * 10) / 10} мин`.replace('.', ','));
  return a.dwellSec.from === a.dwellSec.to ? f(a.dwellSec.from) : `${f(a.dwellSec.from)} – ${f(a.dwellSec.to)}`;
}

const SURFACE: Record<Surface, string> = { dry: 'На сухой кузов', wet: 'На влажный кузов', any: 'На сухой или влажный' };

export function ProductScreen() {
  const { id } = useParams();
  const nav = useNavigate();
  const products = useProductMap();
  const { owned, removeExtraProduct } = useStore();
  const p = id ? products.get(id) : undefined;
  const mine = owned.filter((o) => o.productId === id);
  const [adding, setAdding] = useState(false);
  const [editingIdx, setEditingIdx] = useState<number | null>(null);

  if (!p) {
    return (
      <div className="screen no-tabbar">
        <BackHeader />
        <Empty icon={<AlertTriangle size={24} />} title="Средство не найдено" text="Возможно, карточка была удалена из каталога." />
      </div>
    );
  }
  const color = productColor(p);

  return (
    <div className="screen no-tabbar">
      <BackHeader title={p.brand} />
      <div className="product-hero" style={{ ['--c' as string]: color }}>
        <ProductImage product={p} size={190} />
      </div>
      <div className="eyebrow">{p.brand}</div>
      <h1 className="h1" style={{ marginTop: 4 }}>{p.name}</h1>
      {p.subtitle && <p className="lead">{p.subtitle}</p>}
      <div className="row" style={{ gap: 6, marginTop: 12, flexWrap: 'wrap' }}>
        <span className={`tag ${categoryTagClass(p.category)}`}>{CATEGORY_LABEL[p.category]}</span>
        {p.ph !== null && <span className="tag">pH {p.ph}</span>}
        {p.custom ? (
          <span className="tag c-warn">Данные введены вами</span>
        ) : p.status === 'verified' ? (
          <span className="tag c-ok"><ShieldCheck size={13} /> Методика подтверждена</span>
        ) : (
          <span className="tag c-warn"><ShieldAlert size={13} /> Нет подтверждённой методики</span>
        )}
      </div>

      {mine.length > 0 && (
        <div className="card" style={{ marginTop: 18 }}>
          <div className="eyebrow" style={{ marginBottom: 10 }}>В моей химии</div>
          {mine.map((o, i) => (
            <div key={o.id} style={{ marginTop: i ? 12 : 0 }}>
              <div className="row" style={{ justifyContent: 'space-between', fontSize: 14 }}>
                <span>
                  Осталось <b className="num">{formatMl(o.remainingMl)}</b> <span className="muted">из {formatMl(o.packageMl)}</span>
                </span>
                <button className="btn btn-ghost" style={{ minHeight: 40, padding: '0 8px' }} onClick={() => setEditingIdx(i)}>
                  <Pencil size={15} /> Остаток
                </button>
              </div>
              <Progress value={o.remainingMl / o.packageMl} color={color} />
            </div>
          ))}
        </div>
      )}

      <div className="section">
        <h2 className="h3" style={{ marginBottom: 12 }}>Методика по способам нанесения</h2>
        {p.applications.length === 0 ? (
          <div className="notice">
            <ShieldAlert size={20} />
            <div>
              Для этого средства мы не нашли подтверждённой инструкции по разведению. WASHFLOW не будет рассчитывать дозировку — в
              сценарии будет подсказка следовать этикетке.
              {p.productUrl && (
                <a className="src-link" href={p.productUrl} target="_blank" rel="noreferrer">
                  Страница производителя <ExternalLink size={13} />
                </a>
              )}
            </div>
          </div>
        ) : (
          <div className="stack">
            {p.applications.map((a) => (
              <div key={a.method} className="card app-card">
                <div className="row" style={{ justifyContent: 'space-between' }}>
                  <span className="h3">{METHOD_LABEL[a.method]}</span>
                  <span className="dil num">{formatDilutionRange(a.dilution)}</span>
                </div>
                {a.dilutionText && a.dilutionText !== formatDilutionRange(a.dilution) && (
                  <div className="muted" style={{ fontSize: 13, marginTop: 4 }}>В источнике: «{a.dilutionText}»</div>
                )}
                <div className="row" style={{ gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
                  {a.surface && <span className="tag"><Layers size={13} /> {SURFACE[a.surface]}</span>}
                  {fmtDwell(a) && <span className="tag"><Clock size={13} /> Выдержка {fmtDwell(a)}</span>}
                </div>
                {a.steps.length > 0 && (
                  <ol className="steps-list">
                    {a.steps.map((s, i) => <li key={i}>{s}</li>)}
                  </ol>
                )}
                {a.restrictions.length > 0 && (
                  <ul className="warn-list">
                    {a.restrictions.map((s, i) => <li key={i}><AlertTriangle size={14} /> {s}</li>)}
                  </ul>
                )}
                {!p.custom && (
                  <div className="src">
                    {a.sourceQuote && <div className="src-quote">«{a.sourceQuote}»</div>}
                    <a className="src-link" href={a.sourceUrl} target="_blank" rel="noreferrer">
                      {a.sourceType === 'retailer' ? 'Инструкция со страницы магазина' : 'Источник'} <ExternalLink size={13} />
                    </a>
                    {a.sourceType === 'retailer' && <div className="muted" style={{ marginTop: 4 }}>Не с сайта производителя — сверяйтесь с этикеткой.</div>}
                    <span className="muted"> · проверено {new Date(a.checkedAt).toLocaleDateString('ru-RU')}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {p.warnings.length > 0 && (
        <div className="section notice">
          <AlertTriangle size={20} />
          <div>
            {p.warnings.map((w, i) => <div key={i}>{w}</div>)}
          </div>
        </div>
      )}

      <div className="stack" style={{ marginTop: 22 }}>
        <button className="btn btn-primary block" style={{ minHeight: 58 }} onClick={() => setAdding(true)} data-testid="product-add">
          <Plus size={20} /> {mine.length ? 'Добавить ещё упаковку' : 'Добавить в мою химию'}
        </button>
        {p.custom && (
          <button
            className="btn btn-danger block"
            onClick={() => {
              removeExtraProduct(p.id);
              mine.forEach((o) => useStore.getState().removeOwned(o.id));
              toast('Карточка удалена');
              nav('/chemistry');
            }}
          >
            <Trash2 size={18} /> Удалить свою карточку
          </button>
        )}
      </div>

      <AddChemSheet product={adding ? p : null} onClose={() => setAdding(false)} />
      <AddChemSheet product={editingIdx !== null ? p : null} editing={editingIdx !== null ? mine[editingIdx] : null} onClose={() => setEditingIdx(null)} />
    </div>
  );
}

const CATS: ProductCategory[] = ['prewash', 'active_foam', 'contact_shampoo', 'universal_shampoo', 'protection', 'wheel_cleaner', 'insect_remover', 'tar_remover', 'other'];
const METHODS: ApplicationMethod[] = ['sprayer', 'foam_generator', 'foam_lance', 'bucket', 'trigger'];

/** Своё средство: пользователь переносит методику с этикетки. */
export function CustomProduct() {
  const nav = useNavigate();
  const { upsertProducts, addOwned } = useStore();
  const [brand, setBrand] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState<ProductCategory>('prewash');
  const [method, setMethod] = useState<ApplicationMethod>('sprayer');
  const [kind, setKind] = useState<Dilution['kind']>('ratio');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [dwellMin, setDwellMin] = useState('');
  const [surface, setSurface] = useState<Surface>('dry');
  const [pkg, setPkg] = useState('1000');
  const [error, setError] = useState('');

  const save = () => {
    const f = Number(from.replace(',', '.'));
    const t = to ? Number(to.replace(',', '.')) : f;
    if (!brand.trim() || !name.trim()) return setError('Укажите бренд и название.');
    if (kind !== 'ready' && (!(f > 0) || !(t > 0))) return setError('Укажите дозировку с этикетки.');
    if (kind === 'percent' && (f > 100 || t > 100)) return setError('Процент не может быть больше 100.');
    const dilution: Dilution =
      kind === 'ready'
        ? { kind: 'ready' }
        : kind === 'ratio'
          ? { kind: 'ratio', from: f, to: t, ratioBasis: 'water' }
          : kind === 'ml_per_l'
            ? { kind: 'ml_per_l', from: f, to: t, basis: 'solution' }
            : { kind: 'percent', from: f, to: t };
    const dm = Number(dwellMin.replace(',', '.'));
    const product: Product = {
      id: `custom-${uid()}`,
      brand: brand.trim(),
      name: name.trim(),
      subtitle: 'Своя карточка',
      aliases: [],
      category,
      phase: category === 'prewash' ? 1 : category === 'contact_shampoo' ? 2 : null,
      ph: null,
      packages: [],
      applications: [
        {
          method,
          dilution,
          dilutionText: formatDilutionRange(dilution),
          surface,
          dwellSec: dm > 0 ? { from: Math.round(dm * 60), to: Math.round(dm * 60) } : null,
          steps: [],
          restrictions: [],
          sourceUrl: '',
          checkedAt: new Date().toISOString().slice(0, 10),
        },
      ],
      warnings: [],
      status: 'unverified',
      custom: true,
    };
    upsertProducts([product]);
    const pk = Number(pkg) || 1000;
    addOwned(product.id, pk, pk);
    toast('Средство добавлено');
    nav('/chemistry');
  };

  return (
    <div className="screen no-tabbar">
      <BackHeader title="Своё средство" />
      <div className="notice" style={{ marginBottom: 16 }}>
        <AlertTriangle size={20} />
        <div>Переносите дозировку только с этикетки или официальной инструкции. Карточка будет помечена как «введено вами».</div>
      </div>
      <div className="stack">
        <label className="field"><span>Бренд</span><input className="input" value={brand} onChange={(e) => setBrand(e.target.value)} /></label>
        <label className="field"><span>Название</span><input className="input" value={name} onChange={(e) => setName(e.target.value)} /></label>
        <label className="field">
          <span>Назначение</span>
          <select className="input" value={category} onChange={(e) => setCategory(e.target.value as ProductCategory)}>
            {CATS.map((c) => <option key={c} value={c}>{CATEGORY_LABEL[c]}</option>)}
          </select>
        </label>
        <label className="field">
          <span>Способ нанесения (для чего указана дозировка)</span>
          <select className="input" value={method} onChange={(e) => setMethod(e.target.value as ApplicationMethod)}>
            {METHODS.map((m) => <option key={m} value={m}>{METHOD_LABEL[m]}</option>)}
          </select>
        </label>
        <div className="field">
          <span>Формат дозировки</span>
          <Segmented
            label="Формат дозировки"
            value={kind}
            onChange={setKind}
            options={[
              { value: 'ratio', label: '1:X' },
              { value: 'ml_per_l', label: 'мл/л' },
              { value: 'percent', label: '%' },
              { value: 'ready', label: 'Готов' },
            ]}
          />
        </div>
        {kind !== 'ready' && (
          <div className="grid-2">
            <label className="field">
              <span>{kind === 'ratio' ? 'От 1:' : 'От'}</span>
              <input className="input" inputMode="decimal" value={from} onChange={(e) => setFrom(e.target.value)} placeholder={kind === 'ratio' ? '50' : '10'} />
            </label>
            <label className="field">
              <span>{kind === 'ratio' ? 'До 1: (необяз.)' : 'До (необяз.)'}</span>
              <input className="input" inputMode="decimal" value={to} onChange={(e) => setTo(e.target.value)} />
            </label>
          </div>
        )}
        <div className="field">
          <span>Поверхность</span>
          <Segmented label="Поверхность" value={surface} onChange={setSurface} options={[{ value: 'dry', label: 'Сухая' }, { value: 'wet', label: 'Влажная' }, { value: 'any', label: 'Любая' }]} />
        </div>
        <div className="grid-2">
          <label className="field"><span>Выдержка, мин</span><input className="input" inputMode="decimal" value={dwellMin} onChange={(e) => setDwellMin(e.target.value)} placeholder="—" /></label>
          <label className="field"><span>Упаковка, мл</span><input className="input" inputMode="numeric" value={pkg} onChange={(e) => setPkg(e.target.value.replace(/\D/g, ''))} /></label>
        </div>
        {error && <div className="notice" role="alert"><AlertTriangle size={18} />{error}</div>}
        <button className="btn btn-primary block" style={{ minHeight: 58, marginTop: 6 }} onClick={save}>
          <Check size={20} /> Сохранить
        </button>
      </div>
    </div>
  );
}
