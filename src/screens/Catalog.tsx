import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, ChevronDown, ChevronRight, Heart, Info, Plus, Search, ShieldCheck, X } from 'lucide-react';
import { BackHeader, Empty, Sheet, SheetHeader } from '../components/ui';
import { ProductBottle } from '../components/art/Bottle';
import { AddChemSheet } from '../components/AddChemSheet';
import { useStore } from '../store/useStore';
import { useProducts } from '../store/catalog';
import { searchProducts } from '../domain/search';
import { CATEGORY_LABEL } from '../domain/equipment';
import type { Product } from '../domain/types';
import { CategoryIcon, categoryFilter, categoryTagClass } from './Chemistry';

type Cat = 'all' | 'p1' | 'p2' | 'protect' | 'wheels' | 'other' | 'fav';

export function Catalog() {
  const nav = useNavigate();
  const products = useProducts();
  const { owned, favorites, toggleFavorite } = useStore();
  const [q, setQ] = useState('');
  const [brand, setBrand] = useState<string | null>(null);
  const [cat, setCat] = useState<Cat>('all');
  const [onlyVerified, setOnlyVerified] = useState(false);
  const [brandSheet, setBrandSheet] = useState(false);
  const [adding, setAdding] = useState<Product | null>(null);
  const [limit, setLimit] = useState(30);
  useEffect(() => setLimit(30), [q, brand, cat, onlyVerified]);

  const brands = useMemo(() => {
    const m = new Map<string, number>();
    products.forEach((p) => m.set(p.brand, (m.get(p.brand) ?? 0) + 1));
    return [...m.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [products]);

  const list = useMemo(() => {
    let l = searchProducts(products, q);
    if (brand) l = l.filter((p) => p.brand === brand);
    if (cat === 'fav') l = l.filter((p) => favorites.includes(p.id));
    else if (cat !== 'all') l = l.filter((p) => categoryFilter(p.category) === cat);
    if (onlyVerified) l = l.filter((p) => p.applications.length > 0);
    return l;
  }, [products, q, brand, cat, onlyVerified, favorites]);

  const ownedIds = new Set(owned.map((o) => o.productId));
  const verifiedCount = products.filter((p) => p.status === 'verified').length;

  return (
    <div className="screen">
      <BackHeader />
      <h1 className="h1">
        Каталог <span className="accent">автохимии</span>
      </h1>
      <p className="lead" style={{ fontSize: 14 }}>
        {products.length} позиций · {verifiedCount} с подтверждённой методикой
      </p>

      <div className="search" style={{ marginTop: 16 }}>
        <Search size={20} />
        <input
          className="input"
          type="search"
          placeholder="Найти средство, бренд…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          aria-label="Поиск по каталогу"
          data-testid="catalog-search"
        />
        {q && (
          <button className="clear" aria-label="Очистить поиск" onClick={() => setQ('')}>
            <X size={18} />
          </button>
        )}
      </div>

      <div className="chips" style={{ marginTop: 12 }}>
        <button className="chip" aria-pressed={!!brand} onClick={() => setBrandSheet(true)}>
          {brand ?? 'Все бренды'} <ChevronDown size={16} />
        </button>
        {(
          [
            ['all', 'Все'],
            ['p1', '1 фаза'],
            ['p2', '2 фаза'],
            ['protect', 'Защита'],
            ['wheels', 'Диски'],
            ['other', 'Другое'],
            ['fav', 'Избранное'],
          ] as [Cat, string][]
        ).map(([v, l]) => (
          <button key={v} className="chip" aria-pressed={cat === v} onClick={() => setCat(v)}>
            {l}
          </button>
        ))}
        <button className="chip" aria-pressed={onlyVerified} onClick={() => setOnlyVerified(!onlyVerified)}>
          <ShieldCheck size={16} /> С методикой
        </button>
      </div>

      <div className="stack" style={{ marginTop: 14 }}>
        {list.slice(0, limit).map((p) => {
          const isOwned = ownedIds.has(p.id);
          const fav = favorites.includes(p.id);
          return (
            <div key={p.id} className="card cat-card" data-testid="catalog-item">
              <button className="cat-art" onClick={() => nav(`/product/${p.id}`)} aria-label={`Карточка ${p.brand} ${p.name}`}>
                <ProductBottle product={p} size={104} />
              </button>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div className="row" style={{ alignItems: 'flex-start', gap: 4 }}>
                  <button style={{ flex: 1, minWidth: 0, textAlign: 'left' }} onClick={() => nav(`/product/${p.id}`)}>
                    <div className="eyebrow" style={{ letterSpacing: '0.08em' }}>{p.brand}</div>
                    <div className="h3 cat-name">{p.name}</div>
                    <div className="muted cat-sub">{p.subtitle || CATEGORY_LABEL[p.category]}</div>
                  </button>
                  <button
                    className="icon-btn ghost"
                    style={{ width: 40, height: 40 }}
                    aria-label={fav ? 'Убрать из избранного' : 'В избранное'}
                    aria-pressed={fav}
                    onClick={() => toggleFavorite(p.id)}
                  >
                    <Heart size={20} fill={fav ? 'var(--phase2)' : 'none'} color={fav ? 'var(--phase2)' : 'currentColor'} />
                  </button>
                </div>
                <div className="row" style={{ gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                  <span className={`tag ${categoryTagClass(p.category)}`}>
                    <CategoryIcon c={p.category} size={13} /> {CATEGORY_LABEL[p.category].split(' · ')[0]}
                  </span>
                  {p.applications.length > 0 ? (
                    <span className="tag c-ok">
                      <ShieldCheck size={13} /> Методика
                    </span>
                  ) : (
                    <span className="tag c-warn">Нет методики</span>
                  )}
                </div>
                <div className="row" style={{ marginTop: 10, justifyContent: 'flex-end' }}>
                  {isOwned ? (
                    <button className="btn btn-secondary cat-add" onClick={() => nav('/chemistry')}>
                      <Check size={18} className="accent" /> В моей химии
                    </button>
                  ) : (
                    <button className="btn btn-primary cat-add" onClick={() => setAdding(p)} data-testid="catalog-add">
                      <Plus size={18} /> Добавить
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {list.length > limit && (
        <button className="btn btn-secondary block" style={{ marginTop: 12 }} onClick={() => setLimit((l) => l + 30)}>
          Показать ещё · {list.length - limit}
        </button>
      )}

      {list.length === 0 && (
        <Empty
          icon={<Search size={24} />}
          title="Ничего не нашли"
          text="Проверьте написание или добавьте средство вручную — по данным с этикетки."
          action={
            <button className="btn btn-outline" onClick={() => nav('/product/new')}>
              <Plus size={18} /> Добавить своё средство
            </button>
          }
        />
      )}

      <button className="card press row" style={{ marginTop: 16, width: '100%', textAlign: 'left' }} onClick={() => nav('/product/new')}>
        <div className="icon-tile neutral">
          <Plus size={20} />
        </div>
        <div style={{ flex: 1 }}>
          <div className="h3" style={{ fontSize: 15.5 }}>Нет вашего средства?</div>
          <div className="muted" style={{ fontSize: 13.5 }}>Добавьте вручную по инструкции с этикетки</div>
        </div>
        <ChevronRight size={18} className="muted" />
      </button>

      <div className="notice info" style={{ marginTop: 14 }}>
        <Info size={20} />
        <div>
          <b>Данные из открытых источников</b>
          <div style={{ marginTop: 4, opacity: 0.85 }}>
            Методики взяты с официальных страниц производителей; у каждой указаны ссылка и дата проверки. Если методики нет —
            WASHFLOW не придумывает дозировку.
          </div>
        </div>
      </div>

      <Sheet open={brandSheet} onClose={() => setBrandSheet(false)} label="Выбор бренда">
        <SheetHeader title="Бренд" onClose={() => setBrandSheet(false)} />
        <button className="menu-item" onClick={() => { setBrand(null); setBrandSheet(false); }}>
          Все бренды {!brand && <Check size={18} className="accent" style={{ marginLeft: 'auto' }} />}
        </button>
        {brands.map(([b, n]) => (
          <button key={b} className="menu-item" onClick={() => { setBrand(b); setBrandSheet(false); }}>
            {b} <span className="muted" style={{ marginLeft: 6 }}>{n}</span>
            {brand === b && <Check size={18} className="accent" style={{ marginLeft: 'auto' }} />}
          </button>
        ))}
      </Sheet>
      <AddChemSheet product={adding} onClose={() => setAdding(null)} />
    </div>
  );
}
