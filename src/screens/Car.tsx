import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BackHeader, toast } from '../components/ui';
import { CarArt } from '../components/art/CarArt';
import { useStore } from '../store/useStore';
import { BODY_LABEL } from '../domain/equipment';
import type { BodyType, CarProfile } from '../domain/types';

const BODIES = Object.keys(BODY_LABEL) as BodyType[];

export function CarScreen() {
  const nav = useNavigate();
  const { car, setCar } = useStore();
  const [form, setForm] = useState<CarProfile>(car ?? { make: '', model: '', body: 'sedan' });
  const set = (patch: Partial<CarProfile>) => setForm((f) => ({ ...f, ...patch }));

  return (
    <div className="screen no-tabbar">
      <BackHeader title="Мой автомобиль" />
      <div className="eq-hero" style={{ minHeight: 150 }}>
        <CarArt width={300} />
      </div>
      <div className="stack">
        <div className="grid-2">
          <label className="field"><span>Марка</span><input className="input" value={form.make} placeholder="Mazda" onChange={(e) => set({ make: e.target.value })} /></label>
          <label className="field"><span>Модель</span><input className="input" value={form.model} placeholder="6" onChange={(e) => set({ model: e.target.value })} /></label>
        </div>
        <div className="field">
          <span>Кузов</span>
          <div className="chips" style={{ margin: 0, padding: 0, flexWrap: 'wrap' }}>
            {BODIES.map((b) => (
              <button key={b} className="chip" aria-pressed={form.body === b} onClick={() => set({ body: b })}>{BODY_LABEL[b]}</button>
            ))}
          </div>
          <span className="muted" style={{ fontSize: 13, fontWeight: 500 }}>От кузова зависит, сколько раствора готовить в распылитель.</span>
        </div>
        <div className="grid-2">
          <label className="field"><span>Годы / поколение</span><input className="input" value={form.years ?? ''} placeholder="2012–2018" onChange={(e) => set({ years: e.target.value })} /></label>
          <label className="field"><span>Двигатель</span><input className="input" value={form.engine ?? ''} placeholder="2.5 л" onChange={(e) => set({ engine: e.target.value })} /></label>
        </div>
        <label className="field"><span>Цвет</span><input className="input" value={form.color ?? ''} placeholder="Чёрный" onChange={(e) => set({ color: e.target.value })} /></label>
        <button
          className="btn btn-primary block"
          style={{ minHeight: 58 }}
          onClick={() => {
            if (!form.make.trim()) return toast('Укажите марку');
            setCar({ ...form, make: form.make.trim(), model: form.model.trim() });
            toast('Автомобиль сохранён');
            nav(-1);
          }}
        >
          Сохранить
        </button>
        {car && (
          <button className="btn btn-danger block" onClick={() => { setCar(null); toast('Автомобиль удалён'); nav(-1); }}>
            Удалить автомобиль
          </button>
        )}
      </div>
    </div>
  );
}
