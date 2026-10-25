/**
 * ТЕСТОВЫЕ фикстуры для модульных тестов. Вымышленные средства «Test …»
 * с условными дозировками — не попадают в каталог и не являются рекомендациями.
 */
import type { Application, Equipment, OwnedChemical, Product } from './types';

const app = (method: Application['method'], x: number, extra: Partial<Application> = {}): Application => ({
  method,
  dilution: { kind: 'ratio', from: x, to: x, ratioBasis: 'water' },
  dilutionText: `1:${x}`,
  surface: null,
  dwellSec: null,
  steps: [],
  restrictions: [],
  sourceUrl: 'https://example.test/src',
  checkedAt: '2026-10-25',
  ...extra,
});

const base = { subtitle: '', aliases: [], ph: null, packages: [], warnings: [], status: 'verified' as const };

export const P1: Product = {
  ...base,
  id: 'test-prewash',
  brand: 'Test',
  name: 'Prewash',
  category: 'prewash',
  phase: 1,
  warnings: ['Не смешивать с другими средствами'],
  applications: [app('sprayer', 100, { surface: 'dry', dwellSec: { from: 120, to: 180 } }), app('foam_lance', 10)],
};
export const P2: Product = {
  ...base,
  id: 'test-shampoo',
  brand: 'Test',
  name: 'Shampoo',
  category: 'contact_shampoo',
  phase: 2,
  applications: [app('bucket', 400), app('sprayer', 100, { dwellSec: { from: 60, to: 60 } })],
};
export const PROT: Product = {
  ...base,
  id: 'test-quartz',
  brand: 'Test',
  name: 'Quartz',
  category: 'protection',
  phase: null,
  applications: [app('sprayer', 20, { surface: 'wet', steps: ['Нанести на влажный кузов', 'Смыть водой'] })],
};
export const UNVERIFIED: Product = {
  ...base,
  id: 'test-unknown',
  brand: 'Test',
  name: 'Unknown',
  category: 'prewash',
  phase: 1,
  status: 'unverified',
  applications: [],
};
export const WHEELS: Product = {
  ...base,
  id: 'test-wheels',
  brand: 'Test',
  name: 'Wheels',
  category: 'wheel_cleaner',
  phase: null,
  applications: [{ ...app('trigger', 1), dilution: { kind: 'ready' }, dilutionText: 'готов' }],
};

export const ALL: Product[] = [P1, P2, PROT, UNVERIFIED, WHEELS];
export const get = (id: string) => ALL.find((p) => p.id === id);

export const sprayer: Equipment = { id: 'eq-spr', type: 'sprayer', name: 'Распылитель', volumeMl: 2000, fillMl: 1500, isDefault: true, createdAt: 1 };
export const bucket: Equipment = { id: 'eq-bkt', type: 'bucket', name: 'Ведро', volumeMl: 10000, fillMl: 8000, createdAt: 2 };
export const trigger: Equipment = { id: 'eq-trg', type: 'trigger', name: 'Триггер', volumeMl: 500, fillMl: 500, createdAt: 3 };

export const own = (productId: string, ml = 1000): OwnedChemical => ({
  id: 'o-' + productId,
  productId,
  packageMl: ml,
  remainingMl: ml,
  addedAt: 1,
});

export const IRON: Product = {
  ...base,
  id: 'test-iron',
  brand: 'Test',
  name: 'Iron',
  category: 'iron_remover',
  phase: null,
  targets: ['body', 'wheels'],
  applications: [
    {
      ...app('sprayer', 1, { surface: 'dry', dwellSec: { from: 180, to: 300 }, restrictions: ['Не допускать высыхания'] }),
      dilution: { kind: 'ready' },
      dilutionText: 'готов к применению',
      consumptionMl: { from: 100, to: 200 },
    },
  ],
};
export const QUARTZ_READY: Product = {
  ...base,
  id: 'test-quartz-ready',
  brand: 'Test',
  name: 'QuartzReady',
  category: 'protection',
  phase: null,
  applications: [
    {
      ...app('sprayer', 1, { surface: 'wet', steps: ['Распылить на влажный кузов', 'Сразу смыть водой'] }),
      dilution: { kind: 'ready' },
      dilutionText: 'в неразведённом виде',
      consumptionMl: { from: 50, to: 100 },
    },
  ],
};
export const bottleTrigger: Equipment = {
  id: 'eq-bt',
  type: 'bottle_trigger',
  name: 'Распылитель на флакон',
  volumeMl: 0,
  fillMl: 0,
  createdAt: 4,
  productId: 'test-quartz-ready',
};

ALL.push(IRON, QUARTZ_READY);
