import { useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Check, Cloud, LayoutGrid, MoreHorizontal, Pencil, Plus, Search, SprayCan, Star, Trash2, X } from 'lucide-react';
import { BackHeader, BrandHeader, Cta, Empty, Sheet, SheetHeader, Toggle, VolumeStepper, toast } from '../components/ui';
import { EquipmentArt } from '../components/art/EquipmentArt';
import { useStore, uid } from '../store/useStore';
import { EQUIPMENT_META, defaultFill } from '../domain/equipment';
import { formatVolume } from '../domain/dilution';
import type { Equipment, EquipmentType } from '../domain/types';

type Filter = 'all' | 'sprayer' | 'bucket' | 'foam';
const FILTERS: { value: Filter; label: string; icon: JSX.Element }[] = [
  { value: 'all', label: 'Все', icon: <LayoutGrid size={18} /> },
  { value: 'sprayer', label: 'Распылители', icon: <SprayCan size={18} /> },
  { value: 'bucket', label: 'Вёдра', icon: <BucketIcon /> },
  { value: 'foam', label: 'Пена', icon: <Cloud size={18} /> },
];

function BucketIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <path d="M4 7h16l-1.6 12.2A2 2 0 0 1 16.4 21H7.6a2 2 0 0 1-2-1.8z" />
      <path d="M4 7c0-5 16-5 16 0" />
    </svg>
  );
}

function matches(f: Filter, t: EquipmentType) {
  if (f === 'all') return true;
  if (f === 'sprayer') return t === 'sprayer' || t === 'trigger';
  if (f === 'bucket') return t === 'bucket';
  return t === 'foam_generator' || t === 'foam_lance' || t === 'hpw_injector';
}

export function EquipmentList() {
  const nav = useNavigate();
  const { equipment, removeEquipment, setDefaultEquipment } = useStore();
  const [filter, setFilter] = useState<Filter>('all');
  const [q, setQ] = useState('');
  const [menu, setMenu] = useState<Equipment | null>(null);

  const list = useMemo(
    () =>
      equipment.filter(
        (e) =>
          matches(filter, e.type) &&
          (q.trim() === '' || `${e.name} ${EQUIPMENT_META[e.type].label}`.toLowerCase().includes(q.trim().toLowerCase())),
      ),
    [equipment, filter, q],
  );

  return (
    <div className="screen">
      <BrandHeader />
      <h1 className="h1">Моё оборудование</h1>
      <p className="lead">Добавьте ёмкости один раз — дальше WASHFLOW сам посчитает раствор под каждую.</p>

      <div className="search" style={{ marginTop: 18 }}>
        <Search size={20} />
        <input className="input" placeholder="Поиск оборудования…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Поиск оборудования" />
        {q && (
          <button className="clear" aria-label="Очистить поиск" onClick={() => setQ('')}>
            <X size={18} />
          </button>
        )}
      </div>

      <div className="chips" style={{ marginTop: 12 }}>
        {FILTERS.map((f) => (
          <button key={f.value} className="chip" aria-pressed={filter === f.value} onClick={() => setFilter(f.value)}>
            {f.icon}
            {f.label}
          </button>
        ))}
      </div>

      <div className="grid-2" style={{ marginTop: 14 }}>
        {list.map((e) => (
          <div key={e.id} className="card eq-card fade-up">
            <button className="icon-btn eq-more" aria-label={`Действия: ${e.name}`} onClick={() => setMenu(e)}>
              <MoreHorizontal size={18} />
            </button>
            {e.isDefault && (
              <span className="tag c-ok eq-default">
                <Star size={11} fill="currentColor" /> Основной
              </span>
            )}
            <button className="eq-art" onClick={() => nav(`/equipment/${e.id}`)} aria-label={`Открыть ${e.name}`}>
              <EquipmentArt type={e.type} size={112} />
            </button>
            <div className="eq-name">{e.name}</div>
            <div className="muted" style={{ fontSize: 12.5, marginTop: 2 }}>{EQUIPMENT_META[e.type].label}</div>
            <div className="row" style={{ marginTop: 10, gap: 6 }}>
              <span className="tag num">{formatVolume(e.volumeMl)}</span>
              <button className="btn btn-secondary eq-edit" onClick={() => nav(`/equipment/${e.id}`)}>
                <Pencil size={15} /> Изменить
              </button>
            </div>
          </div>
        ))}
        <button className="card eq-add" onClick={() => nav('/equipment/new')}>
          <span className="eq-add-circle">
            <Plus size={28} />
          </span>
          Добавить оборудование
        </button>
      </div>

      {equipment.length > 0 && list.length === 0 && (
        <p className="muted" style={{ textAlign: 'center', marginTop: 16 }}>Ничего не найдено</p>
      )}

      <div style={{ marginTop: 18 }}>
        <Cta icon={<Plus size={24} />} onClick={() => nav('/equipment/new')}>
          Добавить оборудование
        </Cta>
      </div>

      <Sheet open={!!menu} onClose={() => setMenu(null)} label="Действия с оборудованием">
        {menu && (
          <>
            <SheetHeader title={menu.name} onClose={() => setMenu(null)} />
            <button className="menu-item" onClick={() => { nav(`/equipment/${menu.id}`); setMenu(null); }}>
              <Pencil size={20} /> Изменить
            </button>
            <button
              className="menu-item"
              onClick={() => {
                setDefaultEquipment(menu.id);
                toast('Сделано основным');
                setMenu(null);
              }}
            >
              <Star size={20} /> Сделать основным для «{EQUIPMENT_META[menu.type].label.toLowerCase()}»
            </button>
            <button
              className="menu-item danger"
              onClick={() => {
                removeEquipment(menu.id);
                toast('Оборудование удалено');
                setMenu(null);
              }}
            >
              <Trash2 size={20} /> Удалить
            </button>
          </>
        )}
      </Sheet>
    </div>
  );
}

const TYPES: EquipmentType[] = ['sprayer', 'foam_generator', 'foam_lance', 'bucket', 'trigger', 'other'];

export function EquipmentForm() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const nav = useNavigate();
  const { equipment, upsertEquipment, removeEquipment } = useStore();
  const existing = equipment.find((e) => e.id === id);
  const initialType = (existing?.type ?? (params.get('type') as EquipmentType) ?? 'sprayer') as EquipmentType;

  const [type, setType] = useState<EquipmentType>(EQUIPMENT_META[initialType] ? initialType : 'sprayer');
  const [name, setName] = useState(existing?.name ?? '');
  const [volume, setVolume] = useState(existing?.volumeMl ?? EQUIPMENT_META[initialType]?.presets[0] ?? 2000);
  const [fill, setFill] = useState(existing?.fillMl ?? defaultFill(initialType, volume));
  const [fillTouched, setFillTouched] = useState(!!existing);
  const [isDefault, setIsDefault] = useState(existing?.isDefault ?? !equipment.some((e) => e.type === initialType));

  if (id && id !== 'new' && !existing) {
    return (
      <div className="screen no-tabbar">
        <BackHeader title="Оборудование" />
        <Empty icon={<Box />} title="Оборудование не найдено" />
      </div>
    );
  }

  const meta = EQUIPMENT_META[type];
  const changeType = (t: EquipmentType) => {
    setType(t);
    const v = EQUIPMENT_META[t].presets[0] ?? volume;
    if (!existing) setVolume(v);
    if (!fillTouched) setFill(defaultFill(t, existing ? volume : v));
    if (!existing) setIsDefault(!equipment.some((e) => e.type === t));
  };
  const changeVolume = (v: number) => {
    setVolume(v);
    if (!fillTouched) setFill(defaultFill(type, v));
    else if (fill > v) setFill(v);
  };

  const save = () => {
    const e: Equipment = {
      id: existing?.id ?? uid(),
      type,
      name: name.trim() || meta.label,
      volumeMl: volume,
      fillMl: Math.min(fill, volume),
      isDefault,
      createdAt: existing?.createdAt ?? Date.now(),
    };
    upsertEquipment(e);
    toast(existing ? 'Сохранено' : 'Оборудование добавлено');
    nav(-1);
  };

  return (
    <div className="screen no-tabbar">
      <BackHeader title={existing ? 'Изменить оборудование' : 'Новое оборудование'} />

      <div className="eq-hero">
        <EquipmentArt type={type} size={150} />
      </div>

      <div className="eyebrow" style={{ marginBottom: 10 }}>Тип</div>
      <div className="grid-3" role="radiogroup" aria-label="Тип оборудования">
        {TYPES.map((t) => (
          <button key={t} role="radio" aria-checked={type === t} className="type-tile" onClick={() => changeType(t)}>
            <EquipmentArt type={t} size={52} />
            <span>{EQUIPMENT_META[t].label}</span>
          </button>
        ))}
      </div>
      <p className="muted" style={{ fontSize: 13.5, marginTop: 10 }}>{meta.hint}</p>

      <div className="stack" style={{ marginTop: 18 }}>
        <label className="field">
          <span>Название</span>
          <input className="input" placeholder={type === 'sprayer' ? 'Например, Marolex Industry Ergo' : meta.label} value={name} onChange={(e) => setName(e.target.value)} />
        </label>

        {meta.method && (
          <>
            <div className="field">
              <span>Объём ёмкости</span>
              {meta.presets.length > 0 && (
                <div className="chips" style={{ margin: 0, padding: 0 }}>
                  {meta.presets.map((p) => (
                    <button key={p} className="chip" aria-pressed={volume === p} onClick={() => changeVolume(p)}>
                      {formatVolume(p)}
                    </button>
                  ))}
                </div>
              )}
              <VolumeStepper value={volume} onChange={changeVolume} step={type === 'bucket' ? 1000 : 100} min={100} label="Объём ёмкости" />
            </div>

            <div className="field">
              <span>Сколько раствора заливать</span>
              <VolumeStepper
                value={fill}
                onChange={(v) => {
                  setFillTouched(true);
                  setFill(Math.min(v, volume));
                }}
                step={type === 'bucket' ? 500 : 50}
                min={50}
                max={volume}
                label="Объём заливки"
              />
              <span className="muted" style={{ fontSize: 13, fontWeight: 500 }}>
                {type === 'sprayer' || type === 'foam_generator'
                  ? 'Помповым ёмкостям нужен воздух — обычно заливают ~¾ объёма.'
                  : type === 'bucket'
                    ? 'Воду в ведро наливают не до края, чтобы не расплескать.'
                    : 'Можно заливать полный объём.'}
              </span>
            </div>
          </>
        )}

        <Toggle checked={isDefault} onChange={setIsDefault} title="Основной" hint="Использовать в первую очередь для этого типа" icon={<Check size={20} className="accent" />} />
      </div>

      <div className="stack" style={{ marginTop: 24 }}>
        <button className="btn btn-primary block" style={{ minHeight: 58 }} onClick={save} data-testid="save-equipment">
          <Check size={20} /> Сохранить
        </button>
        {existing && (
          <button
            className="btn btn-danger block"
            onClick={() => {
              removeEquipment(existing.id);
              toast('Оборудование удалено');
              nav('/equipment');
            }}
          >
            <Trash2 size={18} /> Удалить
          </button>
        )}
      </div>
    </div>
  );
}

function Box() {
  return <LayoutGrid />;
}
