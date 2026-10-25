import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, CircleDot, Droplet, FlaskConical, LayoutGrid, MoreVertical, Pencil, Plus, ShieldCheck, Trash2, ExternalLink } from 'lucide-react';
import { BrandHeader, Cta, Empty, Progress, Sheet, SheetHeader, toast } from '../components/ui';
import { productColor } from '../components/art/Bottle';
import { ProductImage } from '../components/ProductImage';
import { AddChemSheet } from '../components/AddChemSheet';
import { useStore } from '../store/useStore';
import { useProductMap } from '../store/catalog';
import { CATEGORY_SHORT } from '../domain/equipment';
import { formatMl } from '../domain/dilution';
import type { OwnedChemical, Product, ProductCategory } from '../domain/types';

type Filter = 'all' | 'p1' | 'p2' | 'protect' | 'wheels' | 'other';

export function categoryFilter(c: ProductCategory): Exclude<Filter, 'all'> {
  if (c === 'prewash' || c === 'active_foam') return 'p1';
  if (c === 'contact_shampoo' || c === 'universal_shampoo') return 'p2';
  if (c === 'protection') return 'protect';
  if (c === 'wheel_cleaner') return 'wheels';
  return 'other';
}

export function categoryTagClass(c: ProductCategory) {
  const f = categoryFilter(c);
  return f === 'p1' ? 'c-phase1' : f === 'p2' ? 'c-phase2' : f === 'protect' ? 'c-protect' : f === 'wheels' ? 'c-wheels' : '';
}

export function CategoryIcon({ c, size = 15 }: { c: ProductCategory; size?: number }) {
  const f = categoryFilter(c);
  if (f === 'p1') return <FlaskConical size={size} />;
  if (f === 'p2') return <Droplet size={size} />;
  if (f === 'protect') return <ShieldCheck size={size} />;
  if (f === 'wheels') return <CircleDot size={size} />;
  return <FlaskConical size={size} />;
}

const FILTERS: { value: Filter; label: string; icon: JSX.Element }[] = [
  { value: 'all', label: 'Все', icon: <LayoutGrid size={17} /> },
  { value: 'p1', label: '1 фаза', icon: <FlaskConical size={17} /> },
  { value: 'p2', label: '2 фаза', icon: <Droplet size={17} /> },
  { value: 'protect', label: 'Защита', icon: <ShieldCheck size={17} /> },
  { value: 'wheels', label: 'Диски', icon: <CircleDot size={17} /> },
  { value: 'other', label: 'Другое', icon: <FlaskConical size={17} /> },
];

export function Chemistry() {
  const nav = useNavigate();
  const { owned, removeOwned } = useStore();
  const products = useProductMap();
  const [filter, setFilter] = useState<Filter>('all');
  const [menu, setMenu] = useState<{ o: OwnedChemical; p: Product } | null>(null);
  const [editing, setEditing] = useState<{ o: OwnedChemical; p: Product } | null>(null);

  const items = useMemo(
    () =>
      owned
        .map((o) => ({ o, p: products.get(o.productId) }))
        .filter((x): x is { o: OwnedChemical; p: Product } => !!x.p)
        .filter((x) => filter === 'all' || categoryFilter(x.p.category) === filter),
    [owned, products, filter],
  );

  return (
    <div className="screen">
      <BrandHeader />
      <h1 className="h1">Моя химия</h1>
      <p className="lead">Средства, из которых WASHFLOW собирает сценарий мойки</p>

      <div className="chips" style={{ marginTop: 16 }}>
        {FILTERS.map((f) => (
          <button key={f.value} className="chip" aria-pressed={filter === f.value} onClick={() => setFilter(f.value)}>
            {f.icon}
            {f.label}
          </button>
        ))}
      </div>

      <div className="stack" style={{ marginTop: 14 }}>
        {items.map(({ o, p }) => {
          const color = productColor(p);
          const share = o.packageMl ? o.remainingMl / o.packageMl : 0;
          return (
            <div key={o.id} className="card chem-card fade-up" data-testid="owned-chem">
              <button className="chem-art" onClick={() => nav(`/product/${p.id}`)} aria-label={`Карточка ${p.name}`} style={{ ['--c' as string]: color }}>
                <ProductImage product={p} size={108} />
              </button>
              <div className="chem-body">
                <div className="row" style={{ alignItems: 'flex-start', gap: 6 }}>
                  <button style={{ flex: 1, textAlign: 'left', minWidth: 0 }} onClick={() => nav(`/product/${p.id}`)}>
                    <div className="muted" style={{ fontSize: 13 }}>{p.brand}</div>
                    <div className="h2 chem-name">{p.name}</div>
                  </button>
                  <button className="icon-btn" style={{ width: 40, height: 40, borderRadius: 12 }} aria-label={`Действия: ${p.name}`} onClick={() => setMenu({ o, p })}>
                    <MoreVertical size={18} />
                  </button>
                </div>
                <div className="row" style={{ gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                  <span className={`tag ${categoryTagClass(p.category)}`}>
                    <CategoryIcon c={p.category} /> {CATEGORY_SHORT[p.category]}
                  </span>
                  {p.applications.length === 0 && <span className="tag c-warn">Нет методики</span>}
                </div>
                <div className="row" style={{ justifyContent: 'space-between', marginTop: 12, fontSize: 13.5 }}>
                  <span>
                    <span className="muted">Осталось </span>
                    <b className="num">{formatMl(o.remainingMl)}</b>
                  </span>
                  <span className="muted num">из {formatMl(o.packageMl)}</span>
                </div>
                <div style={{ marginTop: 8 }}>
                  <Progress value={share} color={share < 0.15 ? 'var(--warn)' : color} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {owned.length === 0 && (
        <Empty
          icon={<FlaskConical size={26} />}
          title="Пока пусто"
          text="Найдите свои средства в каталоге и укажите объём упаковки."
          action={
            <button className="btn btn-outline" onClick={() => nav('/catalog')}>
              <Plus size={18} /> Открыть каталог
            </button>
          }
        />
      )}
      {owned.length > 0 && items.length === 0 && <p className="muted" style={{ textAlign: 'center' }}>В этой категории ничего нет</p>}

      <div style={{ marginTop: 18 }}>
        <Cta icon={<Plus size={24} />} onClick={() => nav('/catalog')} testId="add-chem">
          Добавить химию
        </Cta>
      </div>

      <Sheet open={!!menu} onClose={() => setMenu(null)} label="Действия со средством">
        {menu && (
          <>
            <SheetHeader title={menu.p.name} onClose={() => setMenu(null)} />
            <button className="menu-item" onClick={() => { nav(`/product/${menu.p.id}`); setMenu(null); }}>
              <ExternalLink size={20} /> Карточка и методика <ChevronRight size={18} style={{ marginLeft: 'auto' }} />
            </button>
            <button className="menu-item" onClick={() => { setEditing(menu); setMenu(null); }}>
              <Pencil size={20} /> Изменить остаток
            </button>
            <button
              className="menu-item danger"
              onClick={() => {
                removeOwned(menu.o.id);
                toast('Удалено из «Моей химии»');
                setMenu(null);
              }}
            >
              <Trash2 size={20} /> Удалить
            </button>
          </>
        )}
      </Sheet>
      <AddChemSheet product={editing?.p ?? null} editing={editing?.o} onClose={() => setEditing(null)} />
    </div>
  );
}
