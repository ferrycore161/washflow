import type { Dilution, DirtLevel, Recipe } from './types';

/**
 * Доля концентрата в готовом растворе (0..1) для заданной точки дозировки.
 * value — число из дозировки производителя: X для 1:X, мл/л, %.
 */
export function concentrateFraction(d: Dilution, value?: number): number {
  switch (d.kind) {
    case 'ready':
      return 1;
    case 'ratio': {
      const x = value ?? d.from;
      if (x <= 0) throw new Error('Некорректная пропорция 1:' + x);
      // 1:X «на воду»: 1 часть концентрата + X частей воды → 1/(1+X).
      // 1:X «на раствор»: 1 часть в X частях готового раствора → 1/X.
      return d.ratioBasis === 'total' ? 1 / x : 1 / (1 + x);
    }
    case 'ml_per_l': {
      const c = value ?? d.from;
      // мл/л раствора → c/1000; мл/л воды → c/(1000+c).
      return d.basis === 'solution' ? c / 1000 : c / (1000 + c);
    }
    case 'percent': {
      const p = value ?? d.from;
      return p / 100;
    }
  }
}

/**
 * Выбор точки внутри диапазона производителя.
 * Лёгкое загрязнение → самая слабая концентрация, сильное → самая крепкая,
 * обычное → середина диапазона. Мы никогда не выходим за пределы диапазона.
 */
export function pickValue(d: Dilution, dirt: DirtLevel): number | undefined {
  if (d.kind === 'ready') return undefined;
  const lo = Math.min(d.from, d.to);
  const hi = Math.max(d.from, d.to);
  // Для 1:X больше X = слабее; для мл/л и % больше = крепче.
  const weakest = d.kind === 'ratio' ? hi : lo;
  const strongest = d.kind === 'ratio' ? lo : hi;
  if (dirt === 'light') return weakest;
  if (dirt === 'heavy') return strongest;
  const mid = (lo + hi) / 2;
  return d.kind === 'ratio' ? Math.round(mid) : Math.round(mid * 10) / 10;
}

export function formatDilutionValue(d: Dilution, value?: number): string {
  switch (d.kind) {
    case 'ready':
      return 'без разведения';
    case 'ratio':
      return `1:${fmtNum(value ?? d.from)}${d.ratioBasis === 'total' ? ' (в объёме раствора)' : ''}`;
    case 'ml_per_l':
      return `${fmtNum(value ?? d.from)} мл/л ${d.basis === 'water' ? 'воды' : 'раствора'}`;
    case 'percent':
      return `${fmtNum(value ?? d.from)}%`;
  }
}

export function formatDilutionRange(d: Dilution): string {
  if (d.kind === 'ready') return 'Без разведения';
  const same = d.from === d.to;
  switch (d.kind) {
    case 'ratio':
      return same ? `1:${fmtNum(d.from)}` : `1:${fmtNum(d.from)} – 1:${fmtNum(d.to)}`;
    case 'ml_per_l':
      return (same ? `${fmtNum(d.from)}` : `${fmtNum(d.from)}–${fmtNum(d.to)}`) + ` мл/л`;
    case 'percent':
      return (same ? `${fmtNum(d.from)}` : `${fmtNum(d.from)}–${fmtNum(d.to)}`) + `%`;
  }
}

function fmtNum(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(1).replace('.', ',');
}

/** Округление концентрата до удобного для отмера значения. */
export function roundChem(ml: number): number {
  if (ml <= 0) return 0;
  if (ml < 100) return Math.max(1, Math.round(ml));
  return Math.round(ml / 5) * 5;
}

/** Округление воды до 10 мл (отмеряют по шкале ёмкости). */
export function roundWater(ml: number): number {
  return Math.max(0, Math.round(ml / 10) * 10);
}

export interface RecipeResult extends Recipe {
  /** Фактическая доля концентрата после округления. */
  fraction: number;
  /** Округление вывело концентрацию за пределы диапазона производителя. */
  outOfRange: boolean;
}

/**
 * Рецепт: сколько мл концентрата и воды налить, чтобы получить totalMl раствора.
 */
export function computeRecipe(d: Dilution, totalMl: number, dirt: DirtLevel = 'normal'): RecipeResult {
  if (!(totalMl > 0)) throw new Error('Объём раствора должен быть больше нуля');
  const value = pickValue(d, dirt);
  const f = concentrateFraction(d, value);
  if (d.kind === 'ready') {
    const chem = roundChem(totalMl);
    return {
      chemMl: chem,
      waterMl: 0,
      totalMl: chem,
      fraction: 1,
      outOfRange: false,
      basisText: 'Без разведения',
    };
  }
  const chemMl = roundChem(totalMl * f);
  const waterMl = roundWater(totalMl - chemMl);
  const total = chemMl + waterMl;
  const fraction = chemMl / total;

  // Проверяем, что после округления мы внутри диапазона производителя (допуск 10%).
  const fA = concentrateFraction(d, d.from);
  const fB = concentrateFraction(d, d.to);
  const fMin = Math.min(fA, fB) * 0.9;
  const fMax = Math.max(fA, fB) * 1.1;
  const outOfRange = fraction < fMin || fraction > fMax;

  const rangeText = formatDilutionRange(d);
  const pointText = formatDilutionValue(d, value);
  const basisText =
    d.from === d.to ? `Разведение ${pointText}` : `Разведение ${pointText} (производитель: ${rangeText})`;

  return { chemMl, waterMl, totalMl: total, fraction, outOfRange, basisText };
}

/** Человекочитаемый объём: «1 980 мл», «2 л», «750 мл». */
export function formatMl(ml: number): string {
  return `${ml.toLocaleString('ru-RU').replace(/ /g, ' ')} мл`;
}

export function formatVolume(ml: number): string {
  if (ml >= 1000 && ml % 100 === 0) {
    const l = ml / 1000;
    return `${Number.isInteger(l) ? l : l.toFixed(1).replace('.', ',')} л`;
  }
  return formatMl(ml);
}
