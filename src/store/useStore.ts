import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type {
  CarProfile,
  Equipment,
  OwnedChemical,
  Product,
  Scenario,
  WashSettings,
} from '../domain/types';

export interface ActiveWash {
  scenario: Scenario;
  index: number;
  startedAt: number;
  done: string[];
  skipped: string[];
  /** Время окончания запущенного таймера шага: stepId → timestamp. */
  timers: Record<string, number>;
}

export interface WashRecord {
  id: string;
  at: number;
  title: string;
  durationSec: number;
  steps: number;
  consumption: Record<string, number>;
}

export interface AppState {
  onboarded: boolean;
  car: CarProfile | null;
  equipment: Equipment[];
  owned: OwnedChemical[];
  /** Карточки из импорта/синхронизации и созданные пользователем; перекрывают встроенные по id. */
  extraProducts: Product[];
  favorites: string[];
  settings: WashSettings;
  active: ActiveWash | null;
  history: WashRecord[];
  catalogSyncedAt: string | null;

  setOnboarded: (v: boolean) => void;
  setCar: (car: CarProfile | null) => void;
  upsertEquipment: (e: Equipment) => void;
  removeEquipment: (id: string) => void;
  setDefaultEquipment: (id: string) => void;
  addOwned: (productId: string, packageMl: number, remainingMl?: number) => void;
  updateOwned: (id: string, patch: Partial<OwnedChemical>) => void;
  removeOwned: (id: string) => void;
  upsertProducts: (products: Product[], syncedAt?: string) => void;
  removeExtraProduct: (id: string) => void;
  toggleFavorite: (productId: string) => void;
  setSettings: (patch: Partial<WashSettings>) => void;
  startWash: (scenario: Scenario) => void;
  goToStep: (index: number) => void;
  markStep: (stepId: string, how: 'done' | 'skipped') => void;
  startTimer: (stepId: string, seconds: number) => void;
  clearTimer: (stepId: string) => void;
  finishWash: (applyConsumption: boolean) => WashRecord | null;
  abortWash: () => void;
  resetAll: () => void;
}

export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);

const initial = {
  onboarded: false,
  car: null,
  equipment: [] as Equipment[],
  owned: [] as OwnedChemical[],
  extraProducts: [] as Product[],
  favorites: [] as string[],
  settings: { kind: 'standard', dirt: 'normal', includeWheels: false, includeInsects: false } as WashSettings,
  active: null as ActiveWash | null,
  history: [] as WashRecord[],
  catalogSyncedAt: null as string | null,
};

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      ...initial,
      setOnboarded: (v) => set({ onboarded: v }),
      setCar: (car) => set({ car }),
      upsertEquipment: (e) =>
        set((s) => {
          const exists = s.equipment.some((x) => x.id === e.id);
          let list = exists ? s.equipment.map((x) => (x.id === e.id ? e : x)) : [...s.equipment, e];
          if (e.isDefault) list = list.map((x) => (x.type === e.type && x.id !== e.id ? { ...x, isDefault: false } : x));
          return { equipment: list };
        }),
      removeEquipment: (id) => set((s) => ({ equipment: s.equipment.filter((e) => e.id !== id) })),
      setDefaultEquipment: (id) =>
        set((s) => {
          const target = s.equipment.find((e) => e.id === id);
          if (!target) return {};
          return {
            equipment: s.equipment.map((e) =>
              e.type === target.type ? { ...e, isDefault: e.id === id } : e,
            ),
          };
        }),
      addOwned: (productId, packageMl, remainingMl) =>
        set((s) => ({
          owned: [
            ...s.owned,
            { id: uid(), productId, packageMl, remainingMl: remainingMl ?? packageMl, addedAt: Date.now() },
          ],
        })),
      updateOwned: (id, patch) =>
        set((s) => ({ owned: s.owned.map((o) => (o.id === id ? { ...o, ...patch } : o)) })),
      removeOwned: (id) => set((s) => ({ owned: s.owned.filter((o) => o.id !== id) })),
      upsertProducts: (products, syncedAt) =>
        set((s) => {
          const map = new Map(s.extraProducts.map((p) => [p.id, p]));
          for (const p of products) map.set(p.id, p);
          return { extraProducts: [...map.values()], catalogSyncedAt: syncedAt ?? s.catalogSyncedAt };
        }),
      removeExtraProduct: (id) => set((s) => ({ extraProducts: s.extraProducts.filter((p) => p.id !== id) })),
      toggleFavorite: (productId) =>
        set((s) => ({
          favorites: s.favorites.includes(productId)
            ? s.favorites.filter((f) => f !== productId)
            : [...s.favorites, productId],
        })),
      setSettings: (patch) => set((s) => ({ settings: { ...s.settings, ...patch } })),
      startWash: (scenario) =>
        set({ active: { scenario, index: 0, startedAt: Date.now(), done: [], skipped: [], timers: {} } }),
      goToStep: (index) =>
        set((s) => {
          if (!s.active) return {};
          const max = s.active.scenario.steps.length - 1;
          return { active: { ...s.active, index: Math.max(0, Math.min(max, index)) } };
        }),
      markStep: (stepId, how) =>
        set((s) => {
          if (!s.active) return {};
          const done = s.active.done.filter((x) => x !== stepId);
          const skipped = s.active.skipped.filter((x) => x !== stepId);
          (how === 'done' ? done : skipped).push(stepId);
          return { active: { ...s.active, done, skipped } };
        }),
      startTimer: (stepId, seconds) =>
        set((s) =>
          s.active ? { active: { ...s.active, timers: { ...s.active.timers, [stepId]: Date.now() + seconds * 1000 } } } : {},
        ),
      clearTimer: (stepId) =>
        set((s) => {
          if (!s.active) return {};
          const timers = { ...s.active.timers };
          delete timers[stepId];
          return { active: { ...s.active, timers } };
        }),
      finishWash: (applyConsumption) => {
        const a = get().active;
        if (!a) return null;
        const record: WashRecord = {
          id: uid(),
          at: Date.now(),
          title: a.scenario.title,
          durationSec: Math.round((Date.now() - a.startedAt) / 1000),
          steps: a.done.length,
          consumption: a.scenario.consumption,
        };
        set((s) => {
          let owned = s.owned;
          if (applyConsumption) {
            // списываем только средства, чьи шаги приготовления не были пропущены
            const preparedProducts = new Set(
              a.scenario.steps
                .filter((st) => st.kind === 'prepare' && st.productId && !a.skipped.includes(st.id))
                .map((st) => st.productId as string),
            );
            owned = owned.map((o) => {
              const used = a.scenario.consumption[o.productId];
              if (!used || !preparedProducts.has(o.productId)) return o;
              return { ...o, remainingMl: Math.max(0, o.remainingMl - used) };
            });
            // если одно средство куплено несколькими упаковками — списываем с первой
            const seen = new Set<string>();
            owned = owned.map((o, i) => {
              if (seen.has(o.productId)) return s.owned[i];
              seen.add(o.productId);
              return o;
            });
          }
          return { active: null, owned, history: [record, ...s.history].slice(0, 50) };
        });
        return record;
      },
      abortWash: () => set({ active: null }),
      resetAll: () => set({ ...initial }),
    }),
    {
      name: 'washflow:v1',
      version: 1,
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
