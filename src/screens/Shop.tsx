import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Check,
  ChevronDown,
  CircleDot,
  Droplet,
  ExternalLink,
  FlaskConical,
  Info,
  Magnet,
  Search,
  ShieldCheck,
  ShoppingBag,
  Wind,
} from 'lucide-react';
import { BrandHeader } from '../components/ui';
import { ProductImage } from '../components/ProductImage';
import { AddChemSheet } from '../components/AddChemSheet';
import { EquipmentArt } from '../components/art/EquipmentArt';
import { useStore } from '../store/useStore';
import { useProducts } from '../store/catalog';
import { SHOP, offersFor } from '../store/shop';
import { analyzeNeeds, compatibility, missingMethodsText, shopLinks, type NeedId, type NeedStatus } from '../domain/shopping';
import type { Accessory } from '../domain/shopSchema';
import type { EquipmentType, Product } from '../domain/types';
import { equipmentSubtitle } from './Equipment';

const NEED_ICON: Record<NeedId, JSX.Element> = {
  phase1: <FlaskConical size={20} />,
  phase2: <Droplet size={20} />,
  wheels: <CircleDot size={20} />,
  iron: <Magnet size={20} />,
  protection: <ShieldCheck size={20} />,
  drying: <Wind size={20} />,
};

const ACCESSORY_EQUIPMENT: Partial<Record<Accessory['kind'], EquipmentType>> = {
  sprayer: 'sprayer',
  bucket: 'bucket',
  foam_lance: 'foam_lance',
  trigger_sprayer: 'bottle_trigger',
};

const ACCESSORY_ART: Record<Accessory['kind'], EquipmentType> = {
  drying_towel: 'other',
  wash_mitt: 'other',
  grit_guard: 'bucket',
  wheel_brush: 'other',
  applicator: 'other',
  sprayer: 'sprayer',
  foam_lance: 'foam_lance',
  bucket: 'bucket',
  trigger_sprayer: 'bottle_trigger',
};

function StoreLinks({ query, productId, officialUrl, offers }: { query: string; productId?: string; officialUrl?: string; offers?: Accessory['offers'] }) {
  const links = shopLinks(query, offers ?? (productId ? offersFor(productId) : []), officialUrl);
  return (
    <div className="store-links">
      {links.map((l) => (
        <a
          key={l.store + l.url}
          className={`store-link s-${l.store} ${l.direct ? 'direct' : ''}`}
          href={l.url}
          target="_blank"
          rel="noreferrer noopener"
          title={l.direct ? 'Проверенная ссылка на товар' : `Поиск «${query}»`}
        >
          {l.direct ? <ExternalLink size={13} /> : <Search size={13} />}
          {l.label}
        </a>
      ))}
    </div>
  );
}

function ProductShopCard({ p, onBought }: { p: Product; onBought: (p: Product) => void }) {
  const nav = useNavigate();
  const equipment = useStore((s) => s.equipment);
  const products = useProducts();
  const comp = compatibility(p, equipment);
  const map = useMemo(() => new Map(products.map((x) => [x.id, x])), [products]);
  return (
    <article className="card shop-card fade-up" data-testid="shop-card">
      <div className="shop-card-top">
        <button className="shop-art" onClick={() => nav(`/product/${p.id}`)} aria-label={`Карточка ${p.brand} ${p.name}`}>
          <ProductImage product={p} size={112} />
        </button>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div className="eyebrow" style={{ letterSpacing: '0.08em' }}>{p.brand}</div>
          <button className="h3 shop-name" onClick={() => nav(`/product/${p.id}`)}>{p.name}</button>
          {p.subtitle && <div className="muted shop-sub">{p.subtitle}</div>}
          <div className="shop-fit">
            {comp.equipment.length > 0 ? (
              <span className="tag c-ok">
                <Check size={13} /> Подходит: {comp.equipment.slice(0, 2).map((e) => e.name + (e.type === 'bottle_trigger' ? ` (${equipmentSubtitle(e, map)})` : '')).join(', ')}
              </span>
            ) : (
              <span className="tag c-warn">Нужно: {missingMethodsText(comp.missingMethods)}</span>
            )}
          </div>
        </div>
      </div>
      <StoreLinks query={`${p.brand} ${p.name}`} productId={p.id} officialUrl={p.productUrl} />
      <button className="btn btn-outline block shop-bought" onClick={() => onBought(p)} data-testid="shop-bought">
        <Check size={18} /> Купил — в мою химию
      </button>
    </article>
  );
}

function AccessoryCard({ a }: { a: Accessory }) {
  const nav = useNavigate();
  const eqType = ACCESSORY_EQUIPMENT[a.kind];
  const [imgFailed, setImgFailed] = useState(false);
  return (
    <article className="card shop-card fade-up">
      <div className="shop-card-top">
        <div className="shop-art">
          {a.imageUrl && !imgFailed ? (
            <span className="product-photo" style={{ width: 100, height: 104 }}>
              <img src={a.imageUrl} alt={a.name} loading="lazy" referrerPolicy="no-referrer" onError={() => setImgFailed(true)} />
            </span>
          ) : (
            <EquipmentArt type={ACCESSORY_ART[a.kind]} size={96} />
          )}
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div className="eyebrow" style={{ letterSpacing: '0.08em' }}>{a.brand}</div>
          <div className="h3 shop-name">{a.name}</div>
          {a.description && <div className="muted shop-sub">{a.description}</div>}
        </div>
      </div>
      <StoreLinks query={`${a.brand} ${a.name}`} officialUrl={a.sourceUrl} offers={a.offers} />
      {eqType && (
        <button className="btn btn-outline block shop-bought" onClick={() => nav(`/equipment/new?type=${eqType}`)}>
          <Check size={18} /> Купил — в оборудование
        </button>
      )}
    </article>
  );
}

function NeedSection({ need, open, onToggle, onBought }: { need: NeedStatus; open: boolean; onToggle: () => void; onBought: (p: Product) => void }) {
  const [limit, setLimit] = useState(3);
  const accessories = SHOP.accessories.filter((a) => need.def.accessoryKinds.includes(a.kind));
  const nothing = need.recommendations.length === 0 && accessories.length === 0;
  return (
    <section className={`need card ${need.covered ? 'covered' : 'missing'}`} id={`need-${need.def.id}`} data-testid={`need-${need.def.id}`}>
      <button className="need-head" onClick={onToggle} aria-expanded={open}>
        <span className="icon-tile need-ico">{NEED_ICON[need.def.id]}</span>
        <span style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
          <span className="h3" style={{ display: 'block' }}>{need.def.title}</span>
          <span className="muted" style={{ fontSize: 13 }}>{need.def.stage}</span>
        </span>
        <span className={`need-pill ${need.covered ? 'ok' : need.def.essential ? 'bad' : 'opt'}`}>
          {need.covered ? 'Есть' : need.def.essential ? 'Нужно' : 'Нет'}
        </span>
        <ChevronDown size={18} className="muted need-chev" />
      </button>
      {open && (
        <div className="need-body">
          <p className="need-why">{need.def.why}</p>
          {need.covered && (
            <div className="need-owned">
              <Check size={16} className="accent" /> У вас: {need.owned.map((x) => x.product.name).join(', ')}
            </div>
          )}
          {need.recommendations.length > 0 && (
            <>
              <div className="eyebrow" style={{ margin: '14px 0 10px' }}>{need.covered ? 'Альтернативы' : 'Подойдут'}</div>
              <div className="stack">
                {need.recommendations.slice(0, limit).map((p) => (
                  <ProductShopCard key={p.id} p={p} onBought={onBought} />
                ))}
              </div>
              {need.recommendations.length > limit && (
                <button className="btn btn-secondary block" style={{ marginTop: 10 }} onClick={() => setLimit((l) => l + 4)}>
                  Ещё варианты · {need.recommendations.length - limit}
                </button>
              )}
            </>
          )}
          {accessories.length > 0 && (
            <>
              <div className="eyebrow" style={{ margin: '16px 0 10px' }}>Принадлежности</div>
              <div className="stack">
                {accessories.map((a) => (
                  <AccessoryCard key={a.id} a={a} />
                ))}
              </div>
            </>
          )}
          {nothing && <p className="muted" style={{ fontSize: 14 }}>В каталоге пока нет проверенных вариантов для этого этапа.</p>}
        </div>
      )}
    </section>
  );
}

export function Shop() {
  const products = useProducts();
  const { owned, equipment } = useStore();
  const [params] = useSearchParams();
  const highlight = (params.get('need') ?? '').split(',').filter(Boolean) as NeedId[];
  const [buying, setBuying] = useState<Product | null>(null);

  const needs = useMemo(
    () => analyzeNeeds({ products, owned, equipment, offers: SHOP.offers }),
    [products, owned, equipment],
  );
  const [openIds, setOpenIds] = useState<Set<NeedId>>(
    () => {
      if (highlight.length) return new Set(highlight);
      const essential = needs.filter((n) => !n.covered && n.def.essential).map((n) => n.def.id);
      const first = needs.find((n) => !n.covered);
      return new Set(essential.length ? essential : first ? [first.def.id] : []);
    },
  );
  useEffect(() => {
    if (highlight[0]) document.getElementById(`need-${highlight[0]}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const covered = needs.filter((n) => n.covered).length;
  const toggle = (id: NeedId) =>
    setOpenIds((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  return (
    <div className="screen">
      <BrandHeader />
      <h1 className="h1">Покупки</h1>
      <p className="lead">Что докупить, чтобы закрыть все этапы мойки — с учётом вашей химии и оборудования.</p>

      <div className="card shop-summary">
        <div className="ring" style={{ ['--p' as string]: covered / needs.length }}>
          <svg viewBox="0 0 64 64" aria-hidden="true">
            <circle cx="32" cy="32" r="27" />
            <circle cx="32" cy="32" r="27" className="on" />
          </svg>
          <b className="num">{covered}/{needs.length}</b>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="h3">Этапов закрыто</div>
          <div className="muted" style={{ fontSize: 13, marginTop: 2 }}>Нажмите на этап, чтобы перейти к нему</div>
        </div>
          <div className="mini-needs">
            {needs.map((n) => (
              <button
                key={n.def.id}
                className={`mini-need ${n.covered ? 'ok' : ''}`}
                onClick={() => {
                  setOpenIds((s) => new Set(s).add(n.def.id));
                  setTimeout(() => document.getElementById(`need-${n.def.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
                }}
                aria-label={`${n.def.title}: ${n.covered ? 'есть' : 'нет'}`}
              >
                {NEED_ICON[n.def.id]}
              </button>
            ))}
          </div>
      </div>

      <div className="stack" style={{ marginTop: 14 }}>
        {needs.map((n) => (
          <NeedSection key={n.def.id} need={n} open={openIds.has(n.def.id)} onToggle={() => toggle(n.def.id)} onBought={setBuying} />
        ))}
      </div>

      <div className="notice info" style={{ marginTop: 16 }}>
        <Info size={20} />
        <div>
          <b>Без выдуманных цен и ссылок.</b>
          <div style={{ marginTop: 4, opacity: 0.85 }}>
            <ExternalLink size={12} /> — проверенная страница товара, <Search size={12} /> — поиск по точному названию в магазине. Цены и
            наличие смотрите на сайте продавца.
          </div>
        </div>
      </div>
      <p className="muted" style={{ textAlign: 'center', fontSize: 12.5, marginTop: 12 }}>
        <ShoppingBag size={12} /> Ссылки проверены {SHOP.checkedAt ? new Date(SHOP.checkedAt).toLocaleDateString('ru-RU') : '—'}
      </p>

      <AddChemSheet product={buying} onClose={() => setBuying(null)} />
    </div>
  );
}
