import { buildScenario } from './scenario';
import { P1, P2, PROT, UNVERIFIED, WHEELS, bucket, get, own, sprayer, trigger } from './fixtures';
import type { WashSettings } from './types';

const settings = (p: Partial<WashSettings> = {}): WashSettings => ({
  kind: 'standard',
  dirt: 'normal',
  includeWheels: false,
  includeInsects: false,
  ...p,
});
const sedan = { make: 'Mazda', model: '6', body: 'sedan' as const };

describe('buildScenario', () => {
  it('двухфазная мойка: распылитель для 1 фазы, ведро для 2 фазы', () => {
    const s = buildScenario({ settings: settings(), car: sedan, equipment: [sprayer, bucket], owned: [own(P1.id), own(P2.id)], getProduct: get });
    expect(s.title).toBe('Двухфазная мойка');
    const preps = s.steps.filter((x) => x.kind === 'prepare');
    expect(preps).toHaveLength(2);
    const p1 = preps.find((x) => x.productId === P1.id)!;
    expect(p1.equipmentId).toBe(sprayer.id);
    // седан: 1000 мл раствора (заливка распылителя 1500) → 1:100 = 10 мл + 990 мл
    expect(p1.recipe).toMatchObject({ chemMl: 10, waterMl: 990 });
    const p2 = preps.find((x) => x.productId === P2.id)!;
    expect(p2.equipmentId).toBe(bucket.id);
    expect(p2.recipe).toMatchObject({ chemMl: 20, waterMl: 7980 });
    // разные ёмкости → оба раствора готовятся до первого нанесения
    const firstApply = s.steps.findIndex((x) => x.kind === 'apply');
    expect(s.steps.indexOf(p2)).toBeLessThan(firstApply);
  });

  it('после каждого средства — обязательный смыв (химия не смешивается на кузове)', () => {
    const s = buildScenario({
      settings: settings({ kind: 'protect' }),
      car: sedan,
      equipment: [sprayer, bucket],
      owned: [own(P1.id), own(P2.id), own(PROT.id)],
      getProduct: get,
    });
    const productSteps = s.steps.filter((x) => x.kind === 'apply' || x.kind === 'contact');
    expect(productSteps).toHaveLength(3);
    for (const st of productSteps) {
      const rest = s.steps.slice(s.steps.indexOf(st) + 1);
      const nextProduct = rest.findIndex((x) => x.kind === 'apply' || x.kind === 'contact');
      const window = nextProduct < 0 ? rest : rest.slice(0, nextProduct);
      expect(window.some((x) => x.kind === 'rinse' && !x.skippable)).toBe(true);
    }
  });

  it('одна ёмкость на два средства: второй раствор — после смыва и с промывкой ёмкости', () => {
    const s = buildScenario({ settings: settings(), car: sedan, equipment: [sprayer], owned: [own(P1.id), own(P2.id)], getProduct: get });
    const preps = s.steps.filter((x) => x.kind === 'prepare');
    expect(preps).toHaveLength(2);
    const second = preps[1];
    expect(second.tips.join(' ')).toMatch(/промой/i);
    const firstRinse = s.steps.findIndex((x) => x.kind === 'rinse' && !x.skippable);
    expect(s.steps.indexOf(second)).toBeGreaterThan(firstRinse);
  });

  it('нет подтверждённой методики → рецепт не выводится и расход не считается', () => {
    const s = buildScenario({ settings: settings({ kind: 'quick' }), car: sedan, equipment: [sprayer], owned: [own(UNVERIFIED.id)], getProduct: get });
    const prep = s.steps.find((x) => x.kind === 'prepare')!;
    expect(prep.recipe).toBeUndefined();
    expect(prep.noVerifiedRecipe).toBe(true);
    expect(s.consumption).toEqual({});
  });

  it('нет подходящего оборудования → честное сообщение, без рецепта', () => {
    const s = buildScenario({ settings: settings({ kind: 'quick' }), car: sedan, equipment: [bucket], owned: [own(P1.id)], getProduct: get });
    expect(s.notices.join(' ')).toMatch(/Ручной распылитель/);
    expect(s.steps.find((x) => x.kind === 'prepare')!.recipe).toBeUndefined();
  });

  it('предупреждает, если остатка не хватит', () => {
    const s = buildScenario({
      settings: settings(),
      car: sedan,
      equipment: [sprayer, bucket],
      owned: [own(P1.id), { ...own(P2.id), remainingMl: 5 }],
      getProduct: get,
    });
    const p2 = s.steps.find((x) => x.kind === 'prepare' && x.productId === P2.id)!;
    expect(p2.warnings.join(' ')).toMatch(/не хватить/);
  });

  it('выдержка превращается в шаг с таймером', () => {
    const s = buildScenario({ settings: settings({ kind: 'quick' }), car: sedan, equipment: [sprayer], owned: [own(P1.id)], getProduct: get });
    const dwell = s.steps.find((x) => x.kind === 'dwell')!;
    expect(dwell.timerSec).toBe(120);
    expect(dwell.timerRange).toEqual({ from: 120, to: 180 });
  });

  it('нанесение на сухой кузов — без предварительного ополаскивания', () => {
    const s = buildScenario({ settings: settings({ kind: 'quick' }), car: sedan, equipment: [sprayer], owned: [own(P1.id)], getProduct: get });
    expect(s.steps.findIndex((x) => x.kind === 'rinse')).toBeGreaterThan(s.steps.findIndex((x) => x.kind === 'apply'));
  });

  it('готовый состав без указанного расхода: объём не выдумывается', () => {
    const s = buildScenario({
      settings: settings({ includeWheels: true }),
      car: sedan,
      equipment: [sprayer, bucket, trigger],
      owned: [own(P1.id), own(P2.id), own(WHEELS.id)],
      getProduct: get,
    });
    const prep = s.steps.find((x) => x.kind === 'prepare' && x.productId === WHEELS.id)!;
    expect(prep.recipe).toBeUndefined();
    expect(prep.text).toMatch(/без разведения/);
    expect(s.consumption[WHEELS.id]).toBeUndefined();
    expect(s.steps.some((x) => x.stage === 'Диски')).toBe(true);
  });

  it('готовый состав с расходом производителя на машину: только концентрат, без воды', () => {
    const wheels = { ...WHEELS, applications: [{ ...WHEELS.applications[0], consumptionMl: { from: 50, to: 100 } }] };
    const s = buildScenario({
      settings: settings({ includeWheels: true }),
      car: sedan,
      equipment: [sprayer, bucket, trigger],
      owned: [own(P1.id), own(P2.id), own(WHEELS.id)],
      getProduct: (id) => (id === WHEELS.id ? wheels : get(id)),
    });
    const prep = s.steps.find((x) => x.kind === 'prepare' && x.productId === WHEELS.id)!;
    expect(prep.recipe).toMatchObject({ chemMl: 75, waterMl: 0 });
  });

  it('степень загрязнения меняет дозировку внутри диапазона', () => {
    const range = { ...P1, applications: [{ ...P1.applications[0], dilution: { kind: 'ratio' as const, from: 50, to: 100, ratioBasis: 'water' as const } }] };
    const chem = (dirt: 'light' | 'heavy') =>
      buildScenario({ settings: settings({ kind: 'quick', dirt }), car: sedan, equipment: [sprayer], owned: [own(P1.id)], getProduct: () => range })
        .steps.find((x) => x.kind === 'prepare')!.recipe!.chemMl;
    expect(chem('light')).toBe(10); // 1:100
    expect(chem('heavy')).toBe(20); // 1:50
  });

  it('расход считается по всем растворам', () => {
    const s = buildScenario({
      settings: settings({ kind: 'protect' }),
      car: sedan,
      equipment: [sprayer, bucket],
      owned: [own(P1.id), own(P2.id), own(PROT.id)],
      getProduct: get,
    });
    expect(Object.keys(s.consumption).sort()).toEqual([P1.id, P2.id, PROT.id].sort());
    // защита на седан: 700 мл раствора 1:20 → 33 мл
    expect(s.consumption[PROT.id]).toBe(33);
  });

  it('пустой набор — подсказка добавить химию', () => {
    const s = buildScenario({ settings: settings(), car: null, equipment: [], owned: [], getProduct: get });
    expect(s.productIds).toHaveLength(0);
    expect(s.notices[0]).toMatch(/Добавьте/);
  });
});
