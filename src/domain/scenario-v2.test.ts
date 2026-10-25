import { buildScenario } from './scenario';
import { IRON, P1, P2, PROT, QUARTZ_READY, bottleTrigger, bucket, get, own, sprayer } from './fixtures';
import type { WashSettings } from './types';

const settings = (p: Partial<WashSettings> = {}): WashSettings => ({
  kind: 'standard',
  dirt: 'normal',
  includeWheels: false,
  includeInsects: false,
  ...p,
});
const sedan = { make: 'Mazda', model: '6', body: 'sedan' as const };

describe('распылитель на флакон', () => {
  const run = () =>
    buildScenario({
      settings: settings({ kind: 'protect' }),
      car: sedan,
      equipment: [sprayer, bucket, bottleTrigger],
      owned: [own(P1.id), own(P2.id), own(QUARTZ_READY.id, 750)],
      getProduct: get,
    });

  it('готовый состав наносится из флакона: без шага приготовления и без воды', () => {
    const s = run();
    expect(s.steps.some((x) => x.kind === 'prepare' && x.productId === QUARTZ_READY.id)).toBe(false);
    const apply = s.steps.find((x) => x.kind === 'apply' && x.productId === QUARTZ_READY.id)!;
    expect(apply.equipmentId).toBe(bottleTrigger.id);
    expect(apply.recipe).toMatchObject({ mode: 'consumption', waterMl: 0, chemMl: 75, rangeMl: { from: 50, to: 100 } });
    expect(apply.tips[0]).toMatch(/прямо на флакон/);
  });

  it('расход по инструкции списывается из остатка', () => {
    expect(run().consumption[QUARTZ_READY.id]).toBe(75);
  });

  it('распылитель, закреплённый за другим средством, не используется', () => {
    const s = buildScenario({
      settings: settings({ kind: 'protect' }),
      car: sedan,
      equipment: [sprayer, bucket, { ...bottleTrigger, productId: 'other' }],
      owned: [own(P1.id), own(P2.id), own(QUARTZ_READY.id)],
      getProduct: get,
    });
    const apply = s.steps.find((x) => x.kind === 'apply' && x.productId === QUARTZ_READY.id)!;
    expect(apply.equipmentId).toBe(sprayer.id);
  });

  it('распылитель на флакон не используется для разведения концентратов', () => {
    const s = buildScenario({
      settings: settings({ kind: 'protect' }),
      car: sedan,
      equipment: [bucket, { ...bottleTrigger, productId: undefined }],
      owned: [own(P1.id), own(P2.id), own(PROT.id)],
      getProduct: get,
    });
    expect(s.steps.some((x) => x.equipmentId === bottleTrigger.id)).toBe(false);
  });
});

describe('сценарий с Iron', () => {
  const run = (owned = [own(P1.id), own(P2.id), own(IRON.id), own(PROT.id)]) =>
    buildScenario({ settings: settings({ kind: 'iron' }), car: sedan, equipment: [sprayer, bucket], owned, getProduct: get });

  it('порядок: 1 фаза → 2 фаза → Iron → защита, каждый с обязательным смывом', () => {
    const s = run();
    const stages = s.steps.filter((x) => x.kind === 'apply' || x.kind === 'contact').map((x) => x.productId);
    expect(stages).toEqual([P1.id, P2.id, IRON.id, PROT.id]);
    const ironIdx = s.steps.findIndex((x) => x.kind === 'apply' && x.productId === IRON.id);
    const after = s.steps.slice(ironIdx + 1);
    const rinse = after.findIndex((x) => x.kind === 'rinse' && !x.skippable);
    const protect = after.findIndex((x) => x.productId === PROT.id);
    expect(rinse).toBeGreaterThanOrEqual(0);
    expect(rinse).toBeLessThan(protect);
  });

  it('Iron на сухую поверхность: шаг подготовки поверхности, таймер выдержки', () => {
    const s = run();
    const ironApply = s.steps.findIndex((x) => x.kind === 'apply' && x.productId === IRON.id);
    expect(s.steps[ironApply - 1].title).toBe('Подготовь поверхность');
    const dwell = s.steps.find((x) => x.kind === 'dwell' && x.productId === IRON.id)!;
    expect(dwell.timerSec).toBe(180);
    expect(s.steps[ironApply].text).toMatch(/кузов и диски/);
  });

  it('без Iron — честное сообщение и пометка для «Покупок»', () => {
    const s = run([own(P1.id), own(P2.id)]);
    expect(s.missingRoles).toContain('iron');
    expect(s.notices.join(' ')).toMatch(/Iron/);
    expect(s.title).toBe('Мойка с Iron');
  });
});
