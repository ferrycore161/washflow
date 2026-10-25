import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Car, ChevronRight, CloudDownload, Database, Download, FileUp, History, RotateCcw, Sparkles, Trash2, Upload } from 'lucide-react';
import { BackHeader, BrandHeader, Sheet, SheetHeader, toast } from '../components/ui';
import { CarArt } from '../components/art/CarArt';
import { useStore } from '../store/useStore';
import { BUNDLED_PRODUCTS, BUNDLED_VERSION, useProducts } from '../store/catalog';
import { parseCatalogImport } from '../domain/catalogSchema';
import { fetchRemoteCatalog, supabaseConfigured } from '../lib/supabase';
import { loadDemoProfile } from '../data/demo';
import { BODY_LABEL } from '../domain/equipment';
import type { BodyType, CarProfile } from '../domain/types';

function download(name: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

export function Profile() {
  const nav = useNavigate();
  const state = useStore();
  const products = useProducts();
  const catalogInput = useRef<HTMLInputElement>(null);
  const backupInput = useRef<HTMLInputElement>(null);
  const [syncing, setSyncing] = useState(false);
  const [confirm, setConfirm] = useState<'reset' | 'demo' | null>(null);
  const [importErrors, setImportErrors] = useState<string[]>([]);

  const verified = products.filter((p) => p.status === 'verified').length;
  const brands = new Set(products.map((p) => p.brand)).size;

  const importCatalog = async (file: File) => {
    try {
      const json = JSON.parse(await file.text());
      const { products: imported, errors } = parseCatalogImport(json);
      setImportErrors(errors);
      if (imported.length) {
        state.upsertProducts(imported);
        toast(`Импортировано карточек: ${imported.length}`);
      } else if (!errors.length) toast('В файле нет карточек');
    } catch {
      setImportErrors(['Файл не является корректным JSON.']);
    }
  };

  const restoreBackup = async (file: File) => {
    try {
      const data = JSON.parse(await file.text());
      if (data?.app !== 'washflow' || !data.state) throw new Error();
      const s = data.state;
      useStore.setState({
        car: s.car ?? null,
        equipment: s.equipment ?? [],
        owned: s.owned ?? [],
        extraProducts: s.extraProducts ?? [],
        favorites: s.favorites ?? [],
        history: s.history ?? [],
        onboarded: true,
      });
      toast('Данные восстановлены');
    } catch {
      toast('Это не резервная копия WASHFLOW');
    }
  };

  const sync = async () => {
    setSyncing(true);
    try {
      const r = await fetchRemoteCatalog();
      state.upsertProducts(r.products, r.syncedAt);
      toast(`Каталог обновлён: ${r.products.length}${r.rejected ? `, отклонено ${r.rejected}` : ''}`);
    } catch (e) {
      toast((e as Error).message);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="screen">
      <BrandHeader right={<span />} />
      <h1 className="h1">Профиль</h1>
      <p className="lead">Всё хранится на этом устройстве — без регистрации.</p>

      <button className="card press row" style={{ marginTop: 18, width: '100%', textAlign: 'left' }} onClick={() => nav('/car')}>
        <div className="icon-tile"><Car size={22} /></div>
        <div style={{ flex: 1 }}>
          <div className="h3">{state.car ? `${state.car.make} ${state.car.model}` : 'Автомобиль не указан'}</div>
          <div className="muted" style={{ fontSize: 13.5 }}>
            {state.car ? [BODY_LABEL[state.car.body], state.car.years].filter(Boolean).join(' · ') : 'Необязательно — уточняет объём раствора'}
          </div>
        </div>
        <ChevronRight size={18} className="muted" />
      </button>

      <section className="section card">
        <div className="row" style={{ marginBottom: 6 }}>
          <div className="icon-tile neutral"><Database size={20} /></div>
          <div>
            <div className="h3">Каталог автохимии</div>
            <div className="muted" style={{ fontSize: 13.5 }}>
              {products.length} позиций · {brands} брендов · {verified} с методикой
            </div>
          </div>
        </div>
        <div className="kv"><span>Встроенная версия</span><span>{BUNDLED_VERSION} · {BUNDLED_PRODUCTS.length} шт.</span></div>
        <div className="kv"><span>Импорт и облако</span><span>{state.extraProducts.length} шт.</span></div>
        {state.catalogSyncedAt && (
          <div className="kv"><span>Синхронизация</span><span>{new Date(state.catalogSyncedAt).toLocaleString('ru-RU')}</span></div>
        )}
        <div className="stack" style={{ marginTop: 12 }}>
          <button className="btn btn-secondary block" onClick={sync} disabled={!supabaseConfigured || syncing}>
            <CloudDownload size={18} /> {syncing ? 'Обновляем…' : supabaseConfigured ? 'Обновить из облака' : 'Облако не подключено'}
          </button>
          <button className="btn btn-secondary block" onClick={() => catalogInput.current?.click()}>
            <FileUp size={18} /> Импорт карточек (JSON)
          </button>
          <input
            ref={catalogInput}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) importCatalog(f);
              e.target.value = '';
            }}
          />
          {importErrors.length > 0 && (
            <div className="notice" role="alert">
              <div>
                <b>Часть данных не прошла проверку:</b>
                {importErrors.slice(0, 5).map((er, i) => <div key={i} style={{ fontSize: 13 }}>{er}</div>)}
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="section card">
        <div className="h3" style={{ marginBottom: 6 }}>Мои данные</div>
        <button
          className="menu-item"
          onClick={() =>
            download(`washflow-backup-${new Date().toISOString().slice(0, 10)}.json`, {
              app: 'washflow',
              version: 1,
              exportedAt: new Date().toISOString(),
              state: {
                car: state.car,
                equipment: state.equipment,
                owned: state.owned,
                extraProducts: state.extraProducts,
                favorites: state.favorites,
                history: state.history,
              },
            })
          }
        >
          <Download size={20} /> Сохранить резервную копию
        </button>
        <button className="menu-item" onClick={() => backupInput.current?.click()}>
          <Upload size={20} /> Восстановить из копии
        </button>
        <input
          ref={backupInput}
          type="file"
          accept="application/json,.json"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) restoreBackup(f);
            e.target.value = '';
          }}
        />
        <button className="menu-item" onClick={() => setConfirm('demo')} data-testid="load-demo">
          <Sparkles size={20} /> Загрузить демо-профиль
        </button>
        <button className="menu-item danger" onClick={() => setConfirm('reset')}>
          <Trash2 size={20} /> Сбросить все данные
        </button>
      </section>

      {state.history.length > 0 && (
        <section className="section card">
          <div className="row" style={{ marginBottom: 6 }}>
            <History size={20} className="accent" />
            <div className="h3">История моек</div>
          </div>
          {state.history.slice(0, 8).map((h) => (
            <div key={h.id} className="kv">
              <span>{new Date(h.at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}</span>
              <span>{h.title} · {Math.round(h.durationSec / 60)} мин</span>
            </div>
          ))}
        </section>
      )}

      <p className="muted" style={{ fontSize: 12.5, marginTop: 22, textAlign: 'center' }}>
        WASHFLOW 1.0 · работает офлайн после первой загрузки.
        <br />
        Дозировки — только из официальных источников; проверяйте этикетку.
      </p>

      <Sheet open={!!confirm} onClose={() => setConfirm(null)} label="Подтверждение">
        <SheetHeader title={confirm === 'demo' ? 'Загрузить демо-профиль?' : 'Сбросить все данные?'} onClose={() => setConfirm(null)} />
        <p className="muted" style={{ marginTop: 0 }}>
          {confirm === 'demo'
            ? 'Текущие автомобиль, оборудование и химия будут заменены демо-набором: Mazda 6, Marolex 2 л, Shine Systems DelicateWash, CherryBomb и FastQuartz.'
            : 'Автомобиль, оборудование, химия и история будут удалены с этого устройства.'}
        </p>
        <button
          className={confirm === 'demo' ? 'btn btn-primary block' : 'btn btn-danger block'}
          style={{ minHeight: 56 }}
          data-testid="confirm-sheet"
          onClick={() => {
            if (confirm === 'demo') {
              loadDemoProfile();
              toast('Демо-профиль загружен');
              nav('/');
            } else {
              state.resetAll();
              toast('Данные сброшены');
              nav('/');
            }
            setConfirm(null);
          }}
        >
          <RotateCcw size={18} /> {confirm === 'demo' ? 'Загрузить' : 'Сбросить'}
        </button>
      </Sheet>
    </div>
  );
}

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
