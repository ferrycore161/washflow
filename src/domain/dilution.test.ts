import { computeRecipe, concentrateFraction, formatDilutionRange, pickValue, roundChem } from './dilution';
import type { Dilution } from './types';

const ratio = (from: number, to = from, ratioBasis: 'water' | 'total' = 'water'): Dilution => ({
  kind: 'ratio',
  from,
  to,
  ratioBasis,
});

describe('concentrateFraction', () => {
  it('1:X на воду — 1 часть концентрата на X частей воды', () => {
    expect(concentrateFraction(ratio(100))).toBeCloseTo(1 / 101);
  });
  it('1:X на общий объём', () => {
    expect(concentrateFraction(ratio(100, 100, 'total'))).toBeCloseTo(0.01);
  });
  it('мл/л раствора и мл/л воды', () => {
    expect(concentrateFraction({ kind: 'ml_per_l', from: 20, to: 20, basis: 'solution' })).toBeCloseTo(0.02);
    expect(concentrateFraction({ kind: 'ml_per_l', from: 20, to: 20, basis: 'water' })).toBeCloseTo(20 / 1020);
  });
  it('проценты', () => {
    expect(concentrateFraction({ kind: 'percent', from: 5, to: 5 })).toBeCloseTo(0.05);
  });
  it('готовый состав', () => {
    expect(concentrateFraction({ kind: 'ready' })).toBe(1);
  });
});

describe('pickValue — никогда не выходит за диапазон производителя', () => {
  it('для 1:X лёгкое = самое слабое (большее X), сильное = меньшее X', () => {
    const d = ratio(50, 100);
    expect(pickValue(d, 'light')).toBe(100);
    expect(pickValue(d, 'heavy')).toBe(50);
    expect(pickValue(d, 'normal')).toBe(75);
  });
  it('для мл/л лёгкое = меньше', () => {
    const d: Dilution = { kind: 'ml_per_l', from: 10, to: 30, basis: 'solution' };
    expect(pickValue(d, 'light')).toBe(10);
    expect(pickValue(d, 'heavy')).toBe(30);
  });
  it('диапазон в обратном порядке обрабатывается корректно', () => {
    expect(pickValue(ratio(100, 50), 'light')).toBe(100);
  });
});

describe('computeRecipe', () => {
  it('2 л раствора 1:99 → 20 мл химии + 1980 мл воды', () => {
    const r = computeRecipe(ratio(99), 2000);
    expect(r.chemMl).toBe(20);
    expect(r.waterMl).toBe(1980);
    expect(r.totalMl).toBe(2000);
  });
  it('сумма химии и воды равна объёму раствора', () => {
    const r = computeRecipe(ratio(100), 2000);
    expect(r.chemMl + r.waterMl).toBe(r.totalMl);
    expect(r.chemMl).toBe(20);
  });
  it('ведро 10 л, 50 мл/л раствора → 500 мл химии + 9500 мл воды', () => {
    const r = computeRecipe({ kind: 'ml_per_l', from: 50, to: 50, basis: 'solution' }, 10000);
    expect(r.chemMl).toBe(500);
    expect(r.waterMl).toBe(9500);
  });
  it('готовый состав — без воды', () => {
    const r = computeRecipe({ kind: 'ready' }, 500);
    expect(r.waterMl).toBe(0);
    expect(r.chemMl).toBe(500);
  });
  it('фактическая концентрация после округления остаётся в диапазоне производителя', () => {
    for (const total of [300, 750, 1000, 1500, 2000, 5000, 8000, 10000]) {
      for (const [a, b] of [
        [5, 10],
        [10, 20],
        [50, 100],
        [100, 200],
        [200, 400],
      ]) {
        for (const dirt of ['light', 'normal', 'heavy'] as const) {
          const r = computeRecipe(ratio(a, b), total, dirt);
          if (r.outOfRange) continue;
          expect(r.fraction).toBeGreaterThanOrEqual((1 / (1 + b)) * 0.9);
          expect(r.fraction).toBeLessThanOrEqual((1 / (1 + a)) * 1.1);
        }
      }
    }
  });
  it('помечает слишком малый объём для точного отмера', () => {
    expect(computeRecipe(ratio(1000), 200).outOfRange).toBe(true);
  });
  it('отклоняет нулевой объём', () => {
    expect(() => computeRecipe(ratio(10), 0)).toThrow();
  });
});

describe('форматирование', () => {
  it('диапазоны', () => {
    expect(formatDilutionRange(ratio(50, 100))).toBe('1:50 – 1:100');
    expect(formatDilutionRange({ kind: 'percent', from: 1, to: 2 })).toBe('1–2%');
    expect(formatDilutionRange({ kind: 'ready' })).toBe('Без разведения');
  });
  it('округление концентрата', () => {
    expect(roundChem(0.3)).toBe(1);
    expect(roundChem(19.6)).toBe(20);
    expect(roundChem(333)).toBe(335);
  });
});
