import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, PenLine, Search, Trash2, X } from 'lucide-react';
import { BackHeader, toast } from '../components/ui';
import { CarImage, CAR_MANIFEST, selectionFromCar, type CarSelection } from '../components/CarImage';
import { useStore } from '../store/useStore';
import { BODY_LABEL } from '../domain/equipment';
import { CAR_COLORS, assetIdFor, type CarColorKey } from '../domain/vehicles';
import { VEHICLE_MODELS, findGeneration, findVehicleModel } from '../data/vehicleCatalog';
import { searchCars, type CarModel } from '../data/cars';
import type { BodyType, CarProfile } from '../domain/types';
import '../styles/car.css';

const BODIES = Object.keys(BODY_LABEL) as BodyType[];

/** Модель из общего списка поиска → модель библиотеки (Vesta SW → Vesta, кузов универсал). */
function toVehicle(c: CarModel) {
  const exact = findVehicleModel(c.make, c.model);
  if (exact) return { vehicle: exact, body: c.body };
  const base = VEHICLE_MODELS.find(
    (v) => v.make === c.make && c.model.toLowerCase().startsWith(v.model.toLowerCase() + ' '),
  );
  return base ? { vehicle: base, body: c.body } : null;
}

export function CarScreen() {
  const nav = useNavigate();
  const { car, setCar } = useStore();
  const initial = selectionFromCar(car);
  const initialGen = findGeneration(initial.generationId);

  const [modelId, setModelId] = useState<string | undefined>(initialGen?.model.id);
  const [generationId, setGenerationId] = useState<string | undefined>(initial.generationId);
  const [body, setBody] = useState<BodyType>(car?.body ?? 'sedan');
  const [variant, setVariant] = useState<string | undefined>(car?.bodyVariant);
  const [color, setColor] = useState<CarColorKey>(initial.color ?? 'black');
  const [engine, setEngine] = useState(car?.engine ?? '');
  const [manual, setManual] = useState(!!car && !initialGen);
  const [make, setMake] = useState(car?.make ?? '');
  const [modelName, setModelName] = useState(car?.model ?? '');
  const [q, setQ] = useState('');
  const [showAll, setShowAll] = useState(false);

  const vehicle = VEHICLE_MODELS.find((v) => v.id === modelId);
  const generation = vehicle?.generations.find((g) => g.id === generationId);
  const selection: CarSelection = { generationId: manual ? undefined : generationId, body, variant, color };
  const asset = generationId ? CAR_MANIFEST[assetIdFor(generationId, body, variant)] : undefined;
  const colors = asset ? CAR_COLORS.filter((c) => asset.colors[c.key]) : CAR_COLORS;
  const colorName = CAR_COLORS.find((c) => c.key === color)?.name ?? '';

  const results = useMemo(() => (q.trim() ? searchCars(q, 8) : []), [q]);
  const popular = VEHICLE_MODELS.filter((v) => v.popular);

  const pickVehicle = (vid: string, preferBody?: BodyType) => {
    const v = VEHICLE_MODELS.find((x) => x.id === vid)!;
    const gen = v.generations.find((g) => g.bodies.some((b) => b.body === preferBody)) ?? v.generations[0];
    const b = gen.bodies.find((x) => x.body === preferBody) ?? gen.bodies[0];
    setManual(false);
    setModelId(v.id);
    setGenerationId(gen.id);
    setBody(b.body);
    setVariant(b.variant);
    setQ('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const pickGeneration = (gid: string) => {
    const gen = vehicle!.generations.find((g) => g.id === gid)!;
    setGenerationId(gid);
    const keep = gen.bodies.find((b) => b.body === body && b.variant === variant) ?? gen.bodies.find((b) => b.body === body);
    const b = keep ?? gen.bodies[0];
    setBody(b.body);
    setVariant(b.variant);
  };

  const save = () => {
    let profile: CarProfile;
    if (!manual && vehicle && generation) {
      profile = {
        make: vehicle.make,
        model: vehicle.model,
        body,
        bodyVariant: variant,
        generationId: generation.id,
        years: `${generation.years} (${generation.code})`,
        color: colorName,
        colorKey: color,
        engine: engine.trim() || undefined,
      };
    } else {
      if (!make.trim()) return toast('Укажите марку');
      profile = { make: make.trim(), model: modelName.trim(), body, color: colorName, colorKey: color, engine: engine.trim() || undefined };
    }
    setCar(profile);
    toast('Автомобиль сохранён');
    nav(-1);
  };

  const title = manual ? `${make} ${modelName}`.trim() || 'Мой автомобиль' : vehicle ? `${vehicle.make} ${vehicle.model}` : 'Выберите автомобиль';
  const bodyLabel = generation?.bodies.find((b) => b.body === body && b.variant === variant)?.label ?? BODY_LABEL[body];

  return (
    <div className="screen no-tabbar car-screen">
      <BackHeader title="Мой автомобиль" />

      <section className="car-stage" aria-live="polite">
        <div className="car-stage-img">
          <CarImage selection={selection} width={360} paintName={colorName} eager />
        </div>
        <div className="car-stage-meta">
          <div className="h2" data-testid="car-title">{title}</div>
          <div className="muted" style={{ fontSize: 14, marginTop: 4 }}>
            {[generation && !manual ? `${generation.code} · ${generation.years}` : null, bodyLabel, colorName].filter(Boolean).join(' · ')}
          </div>
          {!asset && (vehicle || manual) && (
            <div className="car-stage-note">Иллюстрация по типу кузова — изображения этой модели пока нет в библиотеке</div>
          )}
        </div>
      </section>

      {vehicle && !manual && (
        <div className="stack" style={{ marginTop: 18 }}>
          {vehicle.generations.length > 1 && (
            <div className="field">
              <span>Поколение</span>
              <div className="chips" style={{ margin: 0, padding: 0, flexWrap: 'wrap' }}>
                {vehicle.generations.map((g) => (
                  <button key={g.id} className="chip" aria-pressed={g.id === generationId} onClick={() => pickGeneration(g.id)}>
                    {g.code} <span className="muted" style={{ fontWeight: 500 }}>{g.years}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
          {generation && generation.bodies.length > 1 && (
            <div className="field">
              <span>Кузов</span>
              <div className="chips" style={{ margin: 0, padding: 0, flexWrap: 'wrap' }}>
                {generation.bodies.map((b) => (
                  <button
                    key={b.body + (b.variant ?? '')}
                    className="chip"
                    aria-pressed={b.body === body && b.variant === variant}
                    onClick={() => {
                      setBody(b.body);
                      setVariant(b.variant);
                    }}
                  >
                    {b.label ?? BODY_LABEL[b.body]}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {manual && (
        <div className="stack" style={{ marginTop: 18 }}>
          <div className="grid-2">
            <label className="field"><span>Марка</span><input className="input" value={make} onChange={(e) => setMake(e.target.value)} /></label>
            <label className="field"><span>Модель</span><input className="input" value={modelName} onChange={(e) => setModelName(e.target.value)} /></label>
          </div>
          <div className="field">
            <span>Кузов</span>
            <div className="chips" style={{ margin: 0, padding: 0, flexWrap: 'wrap' }}>
              {BODIES.map((b) => (
                <button key={b} className="chip" aria-pressed={body === b} onClick={() => setBody(b)}>{BODY_LABEL[b]}</button>
              ))}
            </div>
          </div>
        </div>
      )}

      {(vehicle || manual) && (
        <div className="stack" style={{ marginTop: 16 }}>
          <div className="field">
            <span>Цвет · {colorName}</span>
            <div className="car-swatches" role="radiogroup" aria-label="Цвет">
              {colors.map((c) => (
                <button
                  key={c.key}
                  role="radio"
                  aria-checked={c.key === color}
                  aria-label={c.name}
                  className="car-swatch"
                  style={{ ['--sw' as string]: c.hex }}
                  onClick={() => setColor(c.key)}
                >
                  {c.key === color && <Check size={16} />}
                </button>
              ))}
            </div>
          </div>
          <label className="field">
            <span>Двигатель (необязательно)</span>
            <input className="input" value={engine} placeholder="2.5 л" onChange={(e) => setEngine(e.target.value)} />
          </label>
          <button className="btn btn-primary block" style={{ minHeight: 58 }} onClick={save} data-testid="car-save">
            <Check size={20} /> Сохранить
          </button>
        </div>
      )}

      <div className="eyebrow" style={{ margin: '24px 0 10px' }}>Сменить автомобиль</div>
      <div className="search">
        <Search size={20} />
        <input className="input" placeholder="Марка или модель: «мазда 6», «camry»" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Поиск автомобиля" data-testid="car-search" />
        {q && (
          <button className="clear" aria-label="Очистить" onClick={() => setQ('')}>
            <X size={18} />
          </button>
        )}
      </div>

      {q.trim() && (
        <div className="car-results">
          {results.map((c) => {
            const v = toVehicle(c);
            return (
              <button
                key={c.id}
                className="car-result"
                onClick={() => {
                  if (v) pickVehicle(v.vehicle.id, v.body);
                  else {
                    setManual(true);
                    setModelId(undefined);
                    setGenerationId(undefined);
                    setMake(c.make);
                    setModelName(c.model);
                    setBody(c.body);
                    setVariant(undefined);
                    setQ('');
                  }
                }}
              >
                <span className="car-result-art">
                  <CarImage selection={v ? { generationId: v.vehicle.generations[0].id, body: v.body } : { body: c.body }} width={92} />
                </span>
                <span style={{ flex: 1, textAlign: 'left' }}>
                  <b>{c.make} {c.model}</b>
                  <span className="muted" style={{ display: 'block', fontSize: 12.5 }}>{c.bodyName ?? BODY_LABEL[c.body]}</span>
                </span>
              </button>
            );
          })}
          {results.length === 0 && <p className="muted" style={{ padding: '6px 4px' }}>Не нашли — введите вручную ниже.</p>}
        </div>
      )}

      {!q.trim() && (
        <>
          <div className="eyebrow" style={{ margin: '14px 0 10px' }}>Популярные</div>
          <div className="car-popular">
            {popular.slice(0, showAll ? undefined : 8).map((v) => {
              const gen = v.generations[0];
              const b = gen.bodies[0];
              return (
                <button key={v.id} className={`car-pop ${v.id === modelId && !manual ? 'on' : ''}`} onClick={() => pickVehicle(v.id)} data-testid="car-pop">
                  <CarImage selection={{ generationId: gen.id, body: b.body, variant: b.variant }} width={132} />
                  <b>{v.make} {v.model}</b>
                  <span>{gen.code}</span>
                </button>
              );
            })}
          </div>
          {!showAll && popular.length > 8 && (
            <button className="btn btn-secondary block" style={{ marginTop: 10 }} onClick={() => setShowAll(true)}>
              Все модели · {popular.length}
            </button>
          )}
        </>
      )}

      {!manual && (
        <button className="btn btn-ghost block" style={{ marginTop: 10 }} onClick={() => { setManual(true); setModelId(undefined); setGenerationId(undefined); }}>
          <PenLine size={16} /> Моей машины нет в списке
        </button>
      )}
      {car && (
        <button className="btn btn-danger block" style={{ marginTop: 10 }} onClick={() => { setCar(null); toast('Автомобиль удалён'); nav(-1); }}>
          <Trash2 size={18} /> Удалить автомобиль
        </button>
      )}
    </div>
  );
}
