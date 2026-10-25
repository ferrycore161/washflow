import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Search, X } from 'lucide-react';
import { BackHeader, toast } from '../components/ui';
import { CAR_PAINTS, CarArt, carPaintFromName } from '../components/art/CarArt';
import { useStore } from '../store/useStore';
import { BODY_LABEL } from '../domain/equipment';
import type { BodyType, CarProfile } from '../domain/types';
import { POPULAR_CARS, findCarModel, searchCars, type CarModel } from '../data/cars';
import '../styles/car.css';

const BODIES: BodyType[] = ['sedan', 'hatchback', 'wagon', 'crossover', 'suv', 'minivan'];

const norm = (s?: string) => (s ?? '').trim().toLowerCase().replace(/ё/g, 'е');

export function CarScreen() {
  const nav = useNavigate();
  const { car, setCar } = useStore();
  const [form, setForm] = useState<CarProfile>(car ?? { make: '', model: '', body: 'sedan', color: 'Чёрный' });
  const [query, setQuery] = useState('');
  const set = (patch: Partial<CarProfile>) => setForm((f) => ({ ...f, ...patch }));

  const results = useMemo(() => searchCars(query, 6), [query]);
  const matched = useMemo(() => findCarModel(form.make, form.model), [form.make, form.model]);
  const paint = carPaintFromName(form.color);
  const knownPaint = CAR_PAINTS.some((p) => norm(p.name) === norm(form.color));
  const title = [form.make, form.model].filter((s) => s.trim()).join(' ');
  const bodyName = matched?.body === form.body && matched.bodyName ? matched.bodyName : BODY_LABEL[form.body];

  const pick = (c: CarModel) => {
    set({ make: c.make, model: c.model, body: c.body, years: c.generations?.includes(form.years ?? '') ? form.years : '' });
    setQuery('');
  };

  const save = () => {
    if (!form.make.trim()) return toast('Укажите марку');
    setCar({
      ...form,
      make: form.make.trim(),
      model: form.model.trim(),
      years: form.years?.trim() || undefined,
      engine: form.engine?.trim() || undefined,
      color: form.color?.trim() || undefined,
    });
    toast('Автомобиль сохранён');
    nav(-1);
  };

  return (
    <div className="screen no-tabbar car-screen">
      <BackHeader title="Мой автомобиль" />

      {/* ── Сцена ── */}
      <section className="car-stage" aria-label="Предпросмотр автомобиля">
        <div className="car-stage-art" key={form.body}>
          <CarArt body={form.body} paint={paint} width={340} className="car-stage-svg" />
        </div>
        <div className="car-stage-meta">
          <div className="eyebrow">{bodyName}{form.color ? ` · ${form.color}` : ''}</div>
          <div className="car-stage-title">{title || 'Ваш автомобиль'}</div>
          {(form.years || form.engine) && (
            <div className="car-stage-sub">{[form.years, form.engine].filter(Boolean).join(' · ')}</div>
          )}
        </div>
      </section>

      {/* ── Поиск ── */}
      <div className="car-block">
        <div className="search car-search">
          <Search size={20} />
          <input
            className="input"
            type="search"
            inputMode="search"
            enterKeyHint="search"
            autoComplete="off"
            value={query}
            placeholder="Найти модель: «мазда 6», «camry»"
            aria-label="Поиск модели"
            onChange={(e) => setQuery(e.target.value)}
          />
          {query && (
            <button className="clear" aria-label="Очистить поиск" onClick={() => setQuery('')}>
              <X size={18} />
            </button>
          )}
        </div>

        {query.trim() ? (
          results.length ? (
            <ul className="car-results" role="listbox" aria-label="Найденные модели">
              {results.map((c) => (
                <li key={c.id}>
                  <button className="car-result" role="option" aria-selected={false} onClick={() => pick(c)}>
                    <span className="car-result-art">
                      <CarArt body={c.body} paint={paint} width={86} plain />
                    </span>
                    <span className="car-result-text">
                      <b>{c.make} {c.model}</b>
                      <small>{c.bodyName ?? BODY_LABEL[c.body]}</small>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="car-hint">Такой модели нет в списке — просто впишите марку и модель ниже.</p>
          )
        ) : (
          <div className="chips car-quick" aria-label="Популярные модели">
            {POPULAR_CARS.map((c) => {
              const on = matched?.id === c.id;
              return (
                <button key={c.id} className="chip" aria-pressed={on} onClick={() => pick(c)}>
                  {c.make} {c.model}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Марка / модель ── */}
      <div className="grid-2 car-block">
        <label className="field">
          <span>Марка</span>
          <input className="input" value={form.make} placeholder="Mazda" autoComplete="off" onChange={(e) => set({ make: e.target.value })} />
        </label>
        <label className="field">
          <span>Модель</span>
          <input className="input" value={form.model} placeholder="6" autoComplete="off" onChange={(e) => set({ model: e.target.value })} />
        </label>
      </div>

      {/* ── Кузов ── */}
      <div className="car-block">
        <div className="car-label">
          <span>Кузов</span>
          <small>От кузова зависит, сколько раствора готовить</small>
        </div>
        <div className="car-bodies" role="radiogroup" aria-label="Тип кузова">
          {BODIES.map((b) => {
            const on = form.body === b;
            return (
              <button key={b} className="car-body" role="radio" aria-checked={on} onClick={() => set({ body: b })}>
                <CarArt body={b} paint={on ? paint : '#2a353b'} width={100} plain className="car-body-svg" />
                <span>{BODY_LABEL[b]}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Цвет ── */}
      <div className="car-block">
        <div className="car-label">
          <span>Цвет</span>
          <small>{form.color || 'Не выбран'}</small>
        </div>
        <div className="car-paints" role="radiogroup" aria-label="Цвет кузова">
          {CAR_PAINTS.map((p) => {
            const on = norm(form.color) === norm(p.name);
            return (
              <button
                key={p.name}
                className="car-paint"
                role="radio"
                aria-checked={on}
                aria-label={p.name}
                title={p.name}
                style={{ ['--paint' as string]: p.hex }}
                onClick={() => set({ color: p.name })}
              >
                <i />
                {on && <Check size={16} strokeWidth={3} />}
              </button>
            );
          })}
          {form.color && !knownPaint && (
            <button className="car-paint" role="radio" aria-checked aria-label={form.color} title={form.color} style={{ ['--paint' as string]: paint }}>
              <i />
              <Check size={16} strokeWidth={3} />
            </button>
          )}
        </div>
      </div>

      {/* ── Годы / двигатель ── */}
      <div className="car-block">
        {matched?.generations && (
          <div className="car-label">
            <span>Поколение</span>
          </div>
        )}
        {matched?.generations && (
          <div className="chips car-gens" aria-label="Поколение">
            {matched.generations.map((g) => (
              <button key={g} className="chip" aria-pressed={form.years === g} onClick={() => set({ years: form.years === g ? '' : g })}>
                {g}
              </button>
            ))}
          </div>
        )}
        <div className="grid-2">
          <label className="field">
            <span>Годы / поколение</span>
            <input className="input" value={form.years ?? ''} placeholder="2012–2018" onChange={(e) => set({ years: e.target.value })} />
          </label>
          <label className="field">
            <span>Двигатель</span>
            <input className="input" value={form.engine ?? ''} placeholder="2.5 л" onChange={(e) => set({ engine: e.target.value })} />
          </label>
        </div>
      </div>

      <div className="car-actions">
        <button className="btn btn-primary block" style={{ minHeight: 58 }} onClick={save}>
          Сохранить
        </button>
        {car && (
          <button
            className="btn btn-danger block"
            onClick={() => {
              setCar(null);
              toast('Автомобиль удалён');
              nav(-1);
            }}
          >
            Удалить автомобиль
          </button>
        )}
      </div>
    </div>
  );
}
