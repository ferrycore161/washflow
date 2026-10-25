import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart3, ShoppingBag, Box, ChevronRight, Clock, Droplet, FlaskConical, Play, Plus, Sparkles } from 'lucide-react';
import { BrandHeader, Cta } from '../components/ui';
import { CarArt } from '../components/art/CarArt';
import { CarImage, selectionFromCar } from '../components/CarImage';
import { EquipmentArt } from '../components/art/EquipmentArt';
import { ProductBottle } from '../components/art/Bottle';
import { useStore } from '../store/useStore';
import { useProductMap } from '../store/catalog';
import { BODY_LABEL, CATEGORY_SHORT } from '../domain/equipment';
import { equipmentSubtitle } from './Equipment';
import { buildScenario } from '../domain/scenario';
import { analyzeNeeds } from '../domain/shopping';
import { SHOP } from '../store/shop';
import { useProducts } from '../store/catalog';

const SHORT_NEED = { phase1: '1 фаза', phase2: '2 фаза', wheels: 'диски', iron: 'Iron', protection: 'защита', drying: 'сушка' } as const;

export function Home() {
  const nav = useNavigate();
  const { car, equipment, owned, settings, active } = useStore();
  const products = useProductMap();
  const productList = useProducts();
  const missing = useMemo(
    () => analyzeNeeds({ products: productList, owned, equipment, offers: SHOP.offers }).filter((n) => !n.covered),
    [productList, owned, equipment],
  );

  const scenario = useMemo(
    () =>
      buildScenario({
        settings: { ...settings, kind: 'protect' },
        car,
        equipment,
        owned,
        getProduct: (id) => products.get(id),
      }),
    [settings, car, equipment, owned, products],
  );

  const ownedProducts = owned
    .map((o) => ({ o, p: products.get(o.productId) }))
    .filter((x) => x.p)
    .slice(0, 6);

  return (
    <div className="screen">
      <BrandHeader />

      {active && (
        <button className="notice info card press" style={{ width: '100%', marginBottom: 14, textAlign: 'left' }} onClick={() => nav('/wash/run')}>
          <Play size={18} />
          <span style={{ flex: 1 }}>
            <b>Мойка не завершена</b> — этап {active.index + 1} из {active.scenario.steps.length}. Продолжить
          </span>
          <ChevronRight size={18} />
        </button>
      )}

      <button className="card press car-card" onClick={() => nav('/car')} aria-label="Профиль автомобиля">
        <div className="car-card-head">
          <span className="eyebrow">Мой автомобиль</span>
          <span className="car-card-edit">
            {car ? 'Изменить' : 'Добавить'} <ChevronRight size={16} />
          </span>
        </div>
        {car ? (
          <>
            <div className="car-card-title">{car.make} {car.model}</div>
            {car.years && <div className="car-card-sub">{car.years}</div>}
            <div className="car-card-art">
              <CarImage selection={selectionFromCar(car)} width={320} paintName={car.color} eager />
            </div>
            <div className="car-card-specs">
              <span className="tag">{BODY_LABEL[car.body]}</span>
              {car.engine && <span className="tag">{car.engine}</span>}
              {car.color && <span className="tag">{car.color}</span>}
            </div>
          </>
        ) : (
          <>
            <div className="car-card-title">Добавить авто</div>
            <div className="car-card-sub">По желанию — для точного объёма раствора</div>
            <div className="car-card-art"><CarArt width={280} /></div>
          </>
        )}
      </button>

      <div style={{ marginTop: 16 }}>
        <Cta icon={<Droplet size={26} fill="currentColor" />} onClick={() => nav('/wash')} testId="start-wash">
          Начать мойку
        </Cta>
      </div>

      <section className="section card">
        <div className="section-head">
          <h2 className="h3">
            <Box size={20} className="accent" /> Моё оборудование
          </h2>
          <button className="link-all" onClick={() => nav('/equipment')}>
            Все <ChevronRight size={16} />
          </button>
        </div>
        <div className="h-scroll">
          {equipment.map((e) => (
            <button key={e.id} className="mini-tile" onClick={() => nav(`/equipment/${e.id}`)}>
              <div className="mini-art">
                <EquipmentArt type={e.type} size={84} />
              </div>
              <div className="mini-name">{e.name}</div>
              <div className="mini-sub">{equipmentSubtitle(e, products)}</div>
            </button>
          ))}
          <button className="mini-tile add" onClick={() => nav('/equipment/new')}>
            <div className="icon-tile">
              <Plus size={22} />
            </div>
            <div className="mini-name">Добавить</div>
          </button>
        </div>
      </section>

      <section className="section card">
        <div className="section-head">
          <h2 className="h3">
            <FlaskConical size={20} className="accent" /> Моя химия
          </h2>
          <button className="link-all" onClick={() => nav('/chemistry')}>
            Все <ChevronRight size={16} />
          </button>
        </div>
        <div className="h-scroll">
          {ownedProducts.map(({ o, p }) => (
            <button key={o.id} className="mini-tile" onClick={() => nav(`/product/${p!.id}`)}>
              <div className="mini-art">
                <ProductBottle product={p!} size={92} />
              </div>
              <div className="mini-name">{p!.name}</div>
              <div className="mini-sub">{CATEGORY_SHORT[p!.category]}</div>
            </button>
          ))}
          <button className="mini-tile add" onClick={() => nav('/catalog')}>
            <div className="icon-tile">
              <Plus size={22} />
            </div>
            <div className="mini-name">Из каталога</div>
          </button>
        </div>
      </section>

      {missing.length > 0 && (
        <button className="section card press ready-card shop-cta" onClick={() => nav('/shop')} data-testid="home-shop">
          <div className="icon-tile" style={{ width: 56, height: 56 }}>
            <ShoppingBag size={24} />
          </div>
          <div style={{ flex: 1, textAlign: 'left', minWidth: 0 }}>
            <div className="muted" style={{ fontSize: 13.5 }}>Покупки</div>
            <div className="h3" style={{ fontSize: 17, marginTop: 2 }}>Не хватает: {missing.map((n) => SHORT_NEED[n.def.id]).join(', ')}</div>
            <div className="muted" style={{ fontSize: 13, marginTop: 4 }}>Подберём составы под ваше оборудование</div>
          </div>
          <ChevronRight size={20} className="muted" />
        </button>
      )}

      {scenario.productIds.length > 0 && (
        <button className="section card press ready-card" onClick={() => { useStore.getState().setSettings({ kind: 'protect' }); nav('/wash'); }}>
          <div className="icon-tile" style={{ width: 56, height: 56 }}>
            <Sparkles size={24} />
          </div>
          <div style={{ flex: 1, textAlign: 'left' }}>
            <div className="muted" style={{ fontSize: 13.5 }}>Готов сценарий</div>
            <div className="h3" style={{ fontSize: 18, marginTop: 2 }}>{scenario.title}</div>
            <div className="row muted" style={{ gap: 12, fontSize: 13, marginTop: 8 }}>
              <span className="row" style={{ gap: 5 }}><Clock size={14} /> ≈ {scenario.estMinutes} мин</span>
              <span className="row" style={{ gap: 5 }}><BarChart3 size={14} /> {scenario.steps.length} этапов</span>
            </div>
          </div>
          <ChevronRight size={20} className="muted" />
        </button>
      )}
    </div>
  );
}
