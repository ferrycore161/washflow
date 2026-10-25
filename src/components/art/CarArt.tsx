import { useId, type CSSProperties } from 'react';
import type { BodyType } from '../../domain/types';

/**
 * Стилизованные векторные автомобили WASHFLOW (боковой профиль, морда вправо).
 * Всё рисуется inline-SVG — работает офлайн. Глянцевая окраска строится из
 * одного HEX-цвета, поэтому светлые и тёмные цвета выглядят одинаково достойно.
 */

export type CarView = 'side' | 'three-quarter';

export interface CarArtProps {
  width?: number;
  /** @deprecated используйте `paint`. Оставлено для обратной совместимости. */
  color?: string;
  wet?: boolean;
  body?: BodyType;
  /** Цвет кузова (HEX). */
  paint?: string;
  /** Пока поддерживается только боковой профиль; 'three-quarter' рисуется как 'side'. */
  view?: CarView;
  /** Без отражения и подсветки пола — для мелких превью. */
  plain?: boolean;
  className?: string;
  style?: CSSProperties;
}

/* ───────── Палитра ───────── */

export interface CarPaint {
  name: string;
  hex: string;
}

/** Цвета кузова для выбора в профиле (название сохраняется в car.color). */
export const CAR_PAINTS: CarPaint[] = [
  { name: 'Чёрный', hex: '#121619' },
  { name: 'Белый', hex: '#e8ebed' },
  { name: 'Серебристый', hex: '#b3bac0' },
  { name: 'Серый', hex: '#676f75' },
  { name: 'Графит', hex: '#363c41' },
  { name: 'Синий', hex: '#1d3c86' },
  { name: 'Голубой', hex: '#5a8fc8' },
  { name: 'Красный', hex: '#a3161f' },
  { name: 'Бордовый', hex: '#5a1420' },
  { name: 'Зелёный', hex: '#23503b' },
  { name: 'Бежевый', hex: '#c6b190' },
  { name: 'Коричневый', hex: '#573b2a' },
  { name: 'Оранжевый', hex: '#d2621f' },
  { name: 'Жёлтый', hex: '#dcae1f' },
];

const DEFAULT_PAINT = '#14191c';

const PAINT_STEMS: [RegExp, string][] = [
  [/(серебр|silver)/, '#b3bac0'],
  [/(графит|темно-?сер|мокрый асфальт|graphite|gunmetal)/, '#363c41'],
  [/(черн|black)/, '#121619'],
  [/(бел|перламутр|white|pearl)/, '#e8ebed'],
  [/(сер|grey|gray)/, '#676f75'],
  [/(голуб|light blue|sky)/, '#5a8fc8'],
  [/(син|blue|navy)/, '#1d3c86'],
  [/(бордо|вишн|марсал|burgundy|maroon)/, '#5a1420'],
  [/(красн|red)/, '#a3161f'],
  [/(зел|хаки|green|khaki)/, '#23503b'],
  [/(беж|песоч|шампан|beige|sand)/, '#c6b190'],
  [/(корич|шоколад|brown)/, '#573b2a'],
  [/(оранж|orange)/, '#d2621f'],
  [/(желт|yellow)/, '#dcae1f'],
  [/(золот|gold)/, '#b8995a'],
  [/(фиолет|пурпур|purple|violet)/, '#4b2f6e'],
];

/** Русское (или английское) название цвета → аккуратный HEX краски. */
export function carPaintFromName(colorName?: string): string {
  if (!colorName) return DEFAULT_PAINT;
  const s = colorName.trim().toLowerCase().replace(/ё/g, 'е');
  if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/.test(s)) return s;
  for (const [re, hex] of PAINT_STEMS) if (re.test(s)) return hex;
  return DEFAULT_PAINT;
}

/* ───────── Цветовая математика ───────── */

type RGB = [number, number, number];
function hexToRgb(hex: string): RGB {
  let h = hex.replace('#', '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  const n = parseInt(h, 16);
  if (Number.isNaN(n)) return [20, 25, 28];
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
const toHex = (c: RGB) => '#' + c.map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('');
function mix(hex: string, to: string, t: number) {
  const a = hexToRgb(hex);
  const b = hexToRgb(to);
  return toHex([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]);
}
function luma(hex: string) {
  const [r, g, b] = hexToRgb(hex);
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
}

/* ───────── Геометрия кузовов ───────── */

const G = 132; // линия пола
const VB_W = 360;
const VB_H = 150;

interface Spec {
  /** колёса: радиус, центр заднего и переднего */
  r: number;
  xr: number;
  xf: number;
  /** радиус арки и нижняя линия порога */
  arch: number;
  sill: number;
  /** габариты по X */
  x0: number;
  x1: number;
  roofY: number;
  beltY: number;
  shoulderY: number;
  /** верхний контур от низа заднего бампера до низа переднего */
  top: string;
  /** точка начала (низ заднего бампера) — для замыкания */
  start: [number, number];
  end: [number, number];
  /** линия крыши/капота для контрового света */
  ridge: string;
  dlo: string;
  pillars: string[];
  /** узкое стекло двери багажника (хэтчбек/универсал) */
  rearGlass?: string;
  seams: string[];
  shoulder: string;
  crease: string;
  mirror: string;
  head: string;
  drl: string;
  tail: string;
  handles: [number, number][];
  rails?: [number, number, number];
  cladding?: boolean;
  step?: [number, number];
  spokes: { n: number; twin: boolean; w: number };
}

const SPECS: Record<BodyType, Spec> = {
  sedan: {
    r: 25, xr: 88, xf: 276, arch: 28.5, sill: 120, x0: 19, x1: 343, roofY: 34, beltY: 65, shoulderY: 75,
    start: [24, 118], end: [334, 120],
    top: 'M24 118 C20 112 19 100 20 90 C20 80 22 72 28 68 C44 65 62 63 76 62 C92 58 108 48 126 41 C146 35 170 34 190 36 C210 38 226 50 242 61 C252 66 268 69 296 73 C318 76 334 79 339 85 C343 92 343 104 340 112 C339 116 337 119 334 120',
    ridge: 'M28 68 C44 65 62 63 76 62 C92 58 108 48 126 41 C146 35 170 34 190 36 C210 38 226 50 242 61 C252 66 268 69 296 73 C318 76 334 79 339 85',
    dlo: 'M103 64 C118 52 134 45 152 42 C168 40 184 40 196 41.5 C208 43 220 53 231 65.5 Z',
    pillars: ['M166 40.6 L170.5 40.6 L172.5 66 L168 66 Z'],
    seams: ['M238 66 C239 80 241 96 244 116', 'M170 66 L172 119', 'M108 64.5 C109 75 112 84 117 92'],
    shoulder: 'M326 80 C290 75 200 72 112 70 C80 69 50 69 26 71',
    crease: 'M248 107 C200 104.5 160 104.5 118 106',
    mirror: 'M224 62.5 C227 59 236 59.5 239 62 L240 67.5 C236 70 229 70 225 68 Z',
    head: 'M310 76.5 C322 77.5 332 79.5 338 84 L336.5 87.5 C328 85.5 318 83 309 80.5 Z',
    drl: 'M311 77 C322 78 331 80 337.5 84.2',
    tail: 'M21.5 72 C25 69 33 67 45 66 L45 69.5 C36 70.5 28 72 21.5 76.5 Z',
    handles: [[186, 74.5], [124, 73]],
    spokes: { n: 5, twin: true, w: 2.4 },
  },
  hatchback: {
    r: 24.5, xr: 86, xf: 267, arch: 28, sill: 120, x0: 38, x1: 324, roofY: 27, beltY: 62, shoulderY: 71,
    start: [42, 118], end: [314, 120],
    top: 'M42 118 C39 112 38 102 39 94 C39 86 40 78 42 70 C44 62 48 52 56 42 C60 37 66 33 76 31 C104 27.5 140 27 168 29 C190 31 210 44 230 58 C240 64 256 68 282 72 C302 75 316 79 320 86 C324 94 324 106 321 114 C320 118 318 120 314 120',
    ridge: 'M42 70 C44 62 48 52 56 42 C60 37 66 33 76 31 C104 27.5 140 27 168 29 C190 31 210 44 230 58 C240 64 256 68 282 72 C302 75 316 79 320 86',
    dlo: 'M84 60.5 C88 51 92 43 98 37.5 C120 34 150 33.5 166 35 C186 37 204 48 220 63 Z',
    pillars: ['M146 34.2 L150.5 34.2 L152.5 62 L148 61.8 Z'],
    rearGlass: 'M57 43 C52 50 48 57 45.5 64 L48.5 64 C51 57 55 50 60 43.5 Z',
    seams: ['M226 63 C227 78 229 96 232 116', 'M150 62 L152 119', 'M103 61 C105 73 108 83 112 90'],
    shoulder: 'M310 78 C280 75 200 71 120 68 C90 67 66 66.5 44 68',
    crease: 'M240 106 C190 104 150 104 112 106',
    mirror: 'M212 58.5 C215 55 224 55.5 227 58 L228 63.5 C224 66 217 66 213 64 Z',
    head: 'M298 75 C310 76.5 318 79 322 84 L320.5 87.5 C312 84.5 303 81.5 296 79 Z',
    drl: 'M299 75.5 C310 77 317 79.5 321.5 84',
    tail: 'M41 68 C44 65.5 50 64 60 63.5 L60 67.5 C52 68.5 45 70 41 72.5 Z',
    handles: [[162, 70.5], [112, 68.5]],
    spokes: { n: 5, twin: false, w: 4.4 },
  },
  wagon: {
    r: 25, xr: 91, xf: 277, arch: 28.5, sill: 120, x0: 19, x1: 343, roofY: 29, beltY: 62.5, shoulderY: 73,
    start: [24, 118], end: [334, 120],
    top: 'M24 118 C20 112 19 102 20 92 C20 82 21 72 24 62 C27 52 31 43 38 37 C42 33.5 48 31.5 58 31 C110 30 170 30 196 32 C214 34 230 48 246 60 C256 65 272 69 298 73 C320 76 334 79 339 85 C343 92 343 104 340 112 C339 116 337 119 334 120',
    ridge: 'M24 62 C27 52 31 43 38 37 C42 33.5 48 31.5 58 31 C110 30 170 30 196 32 C214 34 230 48 246 60 C256 65 272 69 298 73 C320 76 334 79 339 85',
    dlo: 'M54 61 C55 52 58 45 63 38.5 L196 37.5 C210 39.5 223 51 235 64 Z',
    pillars: ['M169 37.6 L173.5 37.6 L175.5 64 L171 63.8 Z', 'M102 37.8 L106.5 37.8 L107.5 62.2 L103 62 Z'],
    rearGlass: 'M38.5 38 C34 44 30 52 27.5 61 L30.5 61 C33 52 37 45 42 39 Z',
    seams: ['M242 66 C243 80 245 96 248 116', 'M173 64 L175 119', 'M109 62.5 C110.5 74 113.5 84 119 91'],
    shoulder: 'M326 80 C290 75.5 200 72 120 69.5 C80 68.5 50 68 25 69',
    crease: 'M250 107 C200 104.5 160 104.5 120 106',
    mirror: 'M228 61 C231 57.5 240 58 243 60.5 L244 66 C240 68.5 233 68.5 229 66.5 Z',
    head: 'M310 76.5 C322 77.5 332 79.5 338 84 L336.5 87.5 C328 85.5 318 83 309 80.5 Z',
    drl: 'M311 77 C322 78 331 80 337.5 84.2',
    tail: 'M23.5 64 C27 62 34 61 43 60.5 L43 64.5 C35 65.5 28.5 67 23.5 70 Z',
    handles: [[188, 72.5], [124, 70.5]],
    rails: [62, 192, 28.6],
    spokes: { n: 5, twin: true, w: 2.4 },
  },
  crossover: {
    r: 25.5, xr: 97.5, xf: 264.5, arch: 29.5, sill: 112, x0: 38, x1: 323, roofY: 26, beltY: 55.5, shoulderY: 66,
    start: [42, 112], end: [314, 113],
    top: 'M42 112 C39 106 38 96 39 86 C39 78 40 70 43 62 C46 52 50 44 56 38 C61 33 68 30.5 80 30 C116 27.5 160 27 190 29 C208 31 222 42 236 54 C246 59 262 62 290 65 C308 67 318 70 321 77 C324 86 324 98 321 106 C320 110 318 112 314 113',
    ridge: 'M43 62 C46 52 50 44 56 38 C61 33 68 30.5 80 30 C116 27.5 160 27 190 29 C208 31 222 42 236 54 C246 59 262 62 290 65 C308 67 318 70 321 77',
    dlo: 'M78 54 C80 47 84 41 90 37 C96 35.2 104 35 112 35 L186 35 C200 37 213 46 225 57 Z',
    pillars: ['M160 35 L164.5 35 L166.5 56.6 L162 56.4 Z', 'M117 35 L121.5 35 L122.5 55 L118 54.8 Z'],
    rearGlass: 'M57 39 C52 45 48 52 45.5 60 L48.5 60 C51 52 55 46 60 40 Z',
    seams: ['M228 58 C229 72 229.5 90 230 108', 'M164 57 L166 108', 'M123 55 C124 68 126 78 128 86'],
    shoulder: 'M312 74 C280 70 200 66 120 63 C90 62 66 61 44 62',
    crease: 'M234 96 C190 94 160 94 128 96',
    mirror: 'M216 54 C219 50.5 229 51 232 53.5 L233 59.5 C229 62 221 62 217 60 Z',
    head: 'M292 66 C303 67 314 70 320.5 75 L319.5 78.5 C311 75.5 301 72.5 290 70.5 Z',
    drl: 'M293 66.5 C303 67.6 313 70.5 320 75.2',
    tail: 'M42 62 C46 59 54 57 66 56.5 L66 60.5 C56 61.5 48 63.5 42 66.5 Z',
    handles: [[178, 64], [132, 62]],
    rails: [82, 186, 26.6],
    cladding: true,
    spokes: { n: 6, twin: true, w: 2.2 },
  },
  suv: {
    r: 25, xr: 110, xf: 262, arch: 29, sill: 110, x0: 47, x1: 314, roofY: 25, beltY: 56.5, shoulderY: 64,
    start: [50, 112], end: [305, 112],
    top: 'M50 112 C48 106 47 96 47 86 L47 64 C47 50 48 40 50 34 C51 30 54 28 60 28 L192 27 C202 28 210 34 220 44 C226 50 232 54 240 55 L296 58 C306 59 311 62 312 68 C314 78 314 94 312 104 C311 109 309 111 305 112',
    ridge: 'M47 64 C47 50 48 40 50 34 C51 30 54 28 60 28 L192 27 C202 28 210 34 220 44 C226 50 232 54 240 55 L296 58 C306 59 311 62 312 68',
    dlo: 'M62 57 L62 40 C62 36 64 34 68 34 L190 33 C198 34 205 41 212 51 L214 56.5 Z',
    pillars: ['M148 33.3 L152.5 33.2 L153.5 56.7 L149 56.7 Z', 'M98 33.6 L102.5 33.5 L102.5 56.9 L98 56.9 Z'],
    rearGlass: 'M50.5 35 C49.2 41 48.5 48 48.3 56 L51 56 C51.2 48 51.8 41 53 35.5 Z',
    seams: ['M222 57 C223 70 224 90 226 108', 'M151 57 L152 109', 'M104 57 L104.5 76.5'],
    shoulder: 'M308 66 C280 64 200 62 120 61 C90 60.5 70 60.5 49 61',
    crease: 'M232 94 C200 93 170 93 140 94',
    mirror: 'M206 50 C209 46 220 46.5 224 49.5 L225 57 C220 59.5 211 59.5 207 57 Z',
    head: 'M294 59 L309.5 60.8 C311.5 62.5 312.2 65 312.4 68.5 L294 66.5 Z',
    drl: 'M294.5 59.4 L309.5 61.2',
    tail: 'M47.6 60.5 C50.5 60 54 60 57 60.5 L57 75 C54 75.5 50.5 75.5 47.6 75 Z',
    handles: [[166, 63], [116, 63]],
    rails: [64, 188, 25],
    cladding: true,
    step: [140, 232],
    spokes: { n: 6, twin: false, w: 4.6 },
  },
  minivan: {
    r: 24, xr: 91, xf: 272, arch: 27.5, sill: 119, x0: 29, x1: 331, roofY: 25, beltY: 60.5, shoulderY: 69,
    start: [33, 116], end: [320, 117],
    top: 'M33 116 C30 110 29 100 30 90 C30 80 31 68 32 58 C33 48 34 40 37 34 C40 30 46 28 56 28 L196 27 C214 28 232 42 252 57 C262 62 274 65 294 68 C311 71 322 75 327 81 C330 90 330 102 327 110 C326 114 324 116 320 117',
    ridge: 'M32 58 C33 48 34 40 37 34 C40 30 46 28 56 28 L196 27 C214 28 232 42 252 57 C262 62 274 65 294 68 C311 71 322 75 327 81',
    dlo: 'M44 60 C44 50 45 42 48 36 C52 34 58 34 66 34 L196 33 C210 34 226 46 240 59 L241.5 61 Z',
    pillars: ['M175 33.2 L179.5 33.1 L180.5 60.8 L176 60.7 Z', 'M115 33.6 L119.5 33.5 L120 60.4 L115.5 60.3 Z'],
    rearGlass: 'M37.5 35 C35.5 41 34 49 33.3 58 L36 58 C36.8 49 38.2 42 40.5 36 Z',
    seams: ['M239 63 C239.5 77 240 95 241 114', 'M178 61 L179 118', 'M121 61 L122 96'],
    shoulder: 'M316 77 C280 74 200 70 120 67 C90 66 60 65 33 66',
    crease: 'M240 105 C200 103 160 103 124 105',
    mirror: 'M231 58 C234 54.5 244 55 247 57.5 L248 63.5 C244 66 236 66 232 64 Z',
    head: 'M298 69 C309 70.5 320 74 326 79.5 L324.5 83 C316 79 306 76 296 74 Z',
    drl: 'M299 69.5 C309 71 319 74.5 325.5 79.7',
    tail: 'M31 62 C34 60 41 59 50 58.6 L50 62.6 C42 63.6 35.5 65 31 67.5 Z',
    handles: [[192, 68], [134, 67.5]],
    rails: [60, 196, 25.6],
    spokes: { n: 5, twin: true, w: 2.4 },
  },
};

/** Дуга арки над порогом (с запасом под порог), для колёсной ниши. */
function archPath(xc: number, s: Spec, extra = 0) {
  const yc = G - s.r - 1;
  const ra = s.arch + extra;
  const dy = s.sill - yc;
  const dx = Math.sqrt(Math.max(1, ra * ra - dy * dy));
  return { yc, ra, dx, d: `M${(xc + dx).toFixed(2)} ${s.sill} A${ra} ${ra} 0 1 0 ${(xc - dx).toFixed(2)} ${s.sill}` };
}

function bodyPath(s: Spec) {
  const f = archPath(s.xf, s);
  const r = archPath(s.xr, s);
  return (
    s.top +
    ` L${(s.xf + f.dx).toFixed(2)} ${s.sill}` +
    ` A${f.ra} ${f.ra} 0 1 0 ${(s.xf - f.dx).toFixed(2)} ${s.sill}` +
    ` L${(s.xr + r.dx).toFixed(2)} ${s.sill}` +
    ` A${r.ra} ${r.ra} 0 1 0 ${(s.xr - r.dx).toFixed(2)} ${s.sill}` +
    ` L${s.start[0] + 4} ${s.sill} C${s.start[0] + 1.5} ${s.sill} ${s.start[0]} ${s.start[1] + 1} ${s.start[0]} ${s.start[1]} Z`
  );
}

/** Детерминированный псевдослучайный генератор для капель. */
function rand(seed: number) {
  let t = seed;
  return () => {
    t = (t * 1664525 + 1013904223) % 4294967296;
    return t / 4294967296;
  };
}

function Wheel({ cx, s, id }: { cx: number; s: Spec; id: string }) {
  const r = s.r;
  const cy = G - r;
  const rim = r * (s.cladding && !s.spokes.twin ? 0.64 : 0.7);
  const hub = r * 0.15;
  const spokes: JSX.Element[] = [];
  const { n, twin, w } = s.spokes;
  for (let i = 0; i < n; i++) {
    const base = (i * 360) / n - 90 + (cx % 17);
    const angles = twin ? [base - 7, base + 7] : [base];
    for (const a of angles) {
      const rad = (a * Math.PI) / 180;
      const nx = -Math.sin(rad);
      const ny = Math.cos(rad);
      const x1 = cx + Math.cos(rad) * hub;
      const y1 = cy + Math.sin(rad) * hub;
      const x2 = cx + Math.cos(rad) * (rim - 1);
      const y2 = cy + Math.sin(rad) * (rim - 1);
      const w1 = (twin ? w * 0.8 : w) / 2;
      const w2 = (twin ? w * 0.55 : w * 0.7) / 2;
      spokes.push(
        <path
          key={`${i}-${a}`}
          d={`M${x1 + nx * w1} ${y1 + ny * w1} L${x2 + nx * w2} ${y2 + ny * w2} L${x2 - nx * w2} ${y2 - ny * w2} L${x1 - nx * w1} ${y1 - ny * w1} Z`}
          fill={`url(#spoke${id})`}
        />,
      );
    }
  }
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill="#0a0c0d" />
      <circle cx={cx} cy={cy} r={r - 1.2} fill="none" stroke="#1b2125" strokeWidth="0.9" />
      <circle cx={cx} cy={cy} r={r - 0.6} fill="none" stroke={`url(#tyreHi${id})`} strokeWidth="1.2" />
      <circle cx={cx} cy={cy} r={rim} fill={`url(#rimBg${id})`} />
      <circle cx={cx} cy={cy} r={rim * 0.72} fill="none" stroke="#3a4448" strokeWidth={rim * 0.12} opacity="0.7" />
      <path
        d={`M${cx + rim * 0.5} ${cy - rim * 0.35} a${rim * 0.6} ${rim * 0.6} 0 0 1 ${-rim * 0.2} ${rim * 0.75}`}
        stroke="#121619"
        strokeWidth={rim * 0.22}
        fill="none"
        strokeLinecap="round"
      />
      {spokes}
      <circle cx={cx} cy={cy} r={rim} fill="none" stroke={`url(#lip${id})`} strokeWidth="1.1" />
      <circle cx={cx} cy={cy} r={hub * 1.25} fill="#1a2023" stroke="#7d898e" strokeWidth="0.7" />
      <circle cx={cx} cy={cy} r={hub * 0.45} fill="#33e3d4" opacity="0.75" />
    </g>
  );
}

export function CarArt({
  width = 300,
  color,
  wet = false,
  body = 'sedan',
  paint,
  plain = false,
  className,
  style,
}: CarArtProps) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, '');
  const s = SPECS[body] ?? SPECS.sedan;
  const base = paint ?? color ?? DEFAULT_PAINT;
  const L = luma(base);
  const light = L > 0.55;

  const span = G - s.roofY;
  const o = (y: number) => Math.max(0, Math.min(1, (y - s.roofY) / span)).toFixed(4);
  const W = '#ffffff';
  const K = '#000000';
  const stops: [string, string][] = [
    [o(s.roofY), mix(base, W, light ? 0.5 : 0.3)],
    [o(s.beltY - 4), mix(base, W, light ? 0.2 : 0.08)],
    [o(s.beltY + 1), mix(base, K, light ? 0.16 : 0.3)],
    [o(s.shoulderY - 2), mix(base, W, light ? 0.3 : 0.14)],
    [o(s.shoulderY + 0.6), mix(base, W, light ? 0.7 : 0.4)],
    [o(s.shoulderY + 3), mix(base, W, light ? 0.12 : 0.04)],
    [o((s.shoulderY + s.sill) / 2), mix(base, K, light ? 0.1 : 0.2)],
    [o(s.sill - 9), mix(base, K, light ? 0.3 : 0.45)],
    [o(s.sill + 2), mix(base, K, light ? 0.55 : 0.72)],
  ];
  const d = bodyPath(s);
  const cx = (s.x0 + s.x1) / 2;
  const len = s.x1 - s.x0;
  const specAlpha = light ? 0.55 : 0.32;
  const seamDark = light ? 0.28 : 0.55;
  const seamLight = light ? 0.35 : 0.1;

  const drops: JSX.Element[] = [];
  if (wet) {
    const rnd = rand(body.length * 97 + 13);
    for (let i = 0; i < 70; i++) {
      const x = s.x0 + 8 + rnd() * (len - 16);
      const y = s.roofY + 6 + rnd() * (s.sill - s.roofY - 10);
      const r = 0.6 + rnd() * rnd() * 2.2;
      drops.push(
        <g key={i}>
          <circle cx={x} cy={y + r * 0.25} r={r} fill="#000" opacity="0.22" />
          <circle cx={x} cy={y} r={r} fill={`url(#drop${id})`} />
          <circle cx={x - r * 0.35} cy={y - r * 0.4} r={r * 0.28} fill="#fff" opacity="0.85" />
        </g>,
      );
    }
  }

  return (
    <svg
      width={width}
      height={plain ? (width * 118) / 336 : (width * VB_H) / VB_W}
      viewBox={plain ? '12 18 336 118' : `0 0 ${VB_W} ${VB_H}`}
      aria-hidden="true"
      className={className}
      style={style}
    >
      <defs>
        <linearGradient id={`paint${id}`} gradientUnits="userSpaceOnUse" x1="0" y1={s.roofY} x2="0" y2={G}>
          {stops.map(([off, c], i) => (
            <stop key={i} offset={off} stopColor={c} />
          ))}
        </linearGradient>
        <linearGradient id={`ends${id}`} gradientUnits="userSpaceOnUse" x1={s.x0} y1="0" x2={s.x1} y2="0">
          <stop offset="0" stopColor="#000" stopOpacity={light ? 0.28 : 0.45} />
          <stop offset="0.12" stopColor="#000" stopOpacity="0" />
          <stop offset="0.86" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity={light ? 0.3 : 0.5} />
        </linearGradient>
        <linearGradient id={`glass${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#24353c" />
          <stop offset="0.4" stopColor="#0a1114" />
          <stop offset="1" stopColor="#0f1a1e" />
        </linearGradient>
        <linearGradient id={`rimLight${id}`} gradientUnits="userSpaceOnUse" x1={s.x0} y1="0" x2={s.x1} y2="0">
          <stop offset="0" stopColor="#33e3d4" stopOpacity="0" />
          <stop offset="0.3" stopColor="#33e3d4" stopOpacity="0.55" />
          <stop offset="0.62" stopColor="#33e3d4" stopOpacity="0.85" />
          <stop offset="1" stopColor="#33e3d4" stopOpacity="0.05" />
        </linearGradient>
        <linearGradient id={`spec${id}`} gradientUnits="userSpaceOnUse" x1={s.x0} y1="0" x2={s.x1} y2="0">
          <stop offset="0" stopColor="#fff" stopOpacity="0" />
          <stop offset="0.35" stopColor="#fff" stopOpacity={specAlpha} />
          <stop offset="0.7" stopColor="#fff" stopOpacity={specAlpha * 0.6} />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <linearGradient id={`spoke${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#dde5e8" />
          <stop offset="1" stopColor="#6d797e" />
        </linearGradient>
        <linearGradient id={`lip${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#c9d3d6" />
          <stop offset="1" stopColor="#4a5559" />
        </linearGradient>
        <linearGradient id={`tyreHi${id}`} x1="0" y1="0" x2="0.6" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.14" />
          <stop offset="0.5" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <radialGradient id={`rimBg${id}`}>
          <stop offset="0" stopColor="#2b3337" />
          <stop offset="0.8" stopColor="#14191c" />
          <stop offset="1" stopColor="#0b0e10" />
        </radialGradient>
        <radialGradient id={`head${id}`} cx="0.8" cy="0.4" r="0.9">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.5" stopColor="#cfe9ee" />
          <stop offset="1" stopColor="#56666c" />
        </radialGradient>
        <linearGradient id={`tail${id}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#ff4d5e" />
          <stop offset="0.6" stopColor="#b3121f" />
          <stop offset="1" stopColor="#5c0910" />
        </linearGradient>
        <radialGradient id={`drop${id}`} cx="0.4" cy="0.35" r="0.65">
          <stop offset="0" stopColor="#fff" stopOpacity="0.05" />
          <stop offset="0.75" stopColor="#dffcff" stopOpacity="0.28" />
          <stop offset="1" stopColor="#fff" stopOpacity="0.6" />
        </radialGradient>
        <linearGradient id={`band${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0" />
          <stop offset="0.45" stopColor="#fff" stopOpacity={light ? 0.1 : 0.07} />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <radialGradient id={`floor${id}`}>
          <stop offset="0" stopColor="#33e3d4" stopOpacity="0.2" />
          <stop offset="1" stopColor="#33e3d4" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`refl${id}`} gradientUnits="userSpaceOnUse" x1="0" y1={G} x2="0" y2={VB_H}>
          <stop offset="0" stopColor="#fff" stopOpacity="0.32" />
          <stop offset="0.7" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <mask id={`reflMask${id}`} maskUnits="userSpaceOnUse" x="0" y={G} width={VB_W} height={VB_H - G}>
          <rect x="0" y={G} width={VB_W} height={VB_H - G} fill={`url(#refl${id})`} />
        </mask>
        <clipPath id={`clip${id}`}>
          <path d={d} />
        </clipPath>
        <clipPath id={`gclip${id}`}>
          <path d={s.dlo} />
        </clipPath>
        <filter id={`blur${id}`} x="-20%" y="-50%" width="140%" height="200%">
          <feGaussianBlur stdDeviation="2.2" />
        </filter>
        <filter id={`soft${id}`} x="-20%" y="-50%" width="140%" height="200%">
          <feGaussianBlur stdDeviation="1" />
        </filter>
      </defs>

      {!plain && <ellipse cx={cx} cy={G + 3} rx={len * 0.56} ry="13" fill={`url(#floor${id})`} />}

      <g id={`car${id}`}>
        {/* колёсные ниши */}
        {[s.xr, s.xf].map((x) => (
          <path key={x} d={archPath(x, s, -0.5).d + ' Z'} fill="#040506" />
        ))}
        {/* колёса */}
        <Wheel cx={s.xr} s={s} id={id} />
        <Wheel cx={s.xf} s={s} id={id} />

        {/* кузов */}
        <path d={d} fill={`url(#paint${id})`} />
        <g clipPath={`url(#clip${id})`}>
          <rect x={s.x0} y={s.roofY - 4} width={len} height={G - s.roofY + 4} fill={`url(#ends${id})`} />
          {/* блик плеча и отражение горизонта */}
          <path d={s.shoulder} stroke={`url(#spec${id})`} strokeWidth="2.6" fill="none" filter={`url(#soft${id})`} />
          <path d={s.shoulder} stroke="#fff" strokeOpacity={light ? 0.5 : 0.28} strokeWidth="0.6" fill="none" />
          <path d={s.shoulder} transform="translate(0 1.6)" stroke="#000" strokeOpacity={light ? 0.12 : 0.3} strokeWidth="1" fill="none" />
          <path d={s.crease} stroke="#000" strokeOpacity={light ? 0.14 : 0.35} strokeWidth="1.4" fill="none" filter={`url(#soft${id})`} />
          <path d={s.crease} transform="translate(0 -1)" stroke="#fff" strokeOpacity={light ? 0.3 : 0.08} strokeWidth="0.6" fill="none" />
          {/* мягкий блик на верхних поверхностях */}
          <path d={s.ridge} transform="translate(0 2.2)" stroke="#fff" strokeOpacity={light ? 0.45 : 0.18} strokeWidth="3.5" fill="none" filter={`url(#blur${id})`} />
          {/* тёмные пороги / пластиковый обвес */}
          {s.cladding ? (
            <rect x={s.x0} y={s.sill - 8} width={len} height="20" fill="#0c0f11" />
          ) : (
            <rect x={s.x0} y={s.sill - 4.5} width={len} height="10" fill="#000" opacity={light ? 0.35 : 0.5} filter={`url(#soft${id})`} />
          )}
          {/* отражение софтбокса и подсветка от пола */}
          <rect x={s.x0} y={s.shoulderY + 5} width={len} height="16" fill={`url(#band${id})`} />
          <path d={s.crease} transform={`translate(0 ${s.sill - 108})`} stroke="#fff" strokeOpacity={light ? 0.18 : 0.1} strokeWidth="1.2" fill="none" filter={`url(#soft${id})`} />
          {drops}
        </g>

        {/* накладки арок для кроссоверов/внедорожников */}
        {s.cladding &&
          [s.xr, s.xf].map((x) => (
            <path key={x} d={archPath(x, s, 1.6).d} stroke="#0c0f11" strokeWidth="4.4" fill="none" />
          ))}
        {/* кромка арки */}
        {[s.xr, s.xf].map((x) => (
          <path key={`e${x}`} d={archPath(x, s, s.cladding ? 3.9 : 0.3).d} stroke="#fff" strokeOpacity={s.cladding ? 0.08 : light ? 0.3 : 0.12} strokeWidth="0.7" fill="none" />
        ))}

        {/* рейлинги */}
        {s.rails && (
          <g>
            <path d={`M${s.rails[0]} ${s.rails[2]} L${s.rails[1]} ${s.rails[2] - 0.4}`} stroke="#0b0e10" strokeWidth="2.4" strokeLinecap="round" />
            <path d={`M${s.rails[0]} ${s.rails[2] - 0.9} L${s.rails[1]} ${s.rails[2] - 1.3}`} stroke="#fff" strokeOpacity="0.18" strokeWidth="0.5" />
          </g>
        )}

        {/* остекление */}
        {s.rearGlass && <path d={s.rearGlass} fill="#0b1215" />}
        <path d={s.dlo} fill={`url(#glass${id})`} />
        <g clipPath={`url(#gclip${id})`}>
          <path
            d={`M${s.x0 + len * 0.42} ${s.roofY} L${s.x0 + len * 0.52} ${s.roofY} L${s.x0 + len * 0.44} ${s.beltY + 4} L${s.x0 + len * 0.34} ${s.beltY + 4} Z`}
            fill="#fff"
            opacity="0.07"
          />
          <path
            d={`M${s.x0 + len * 0.55} ${s.roofY} L${s.x0 + len * 0.58} ${s.roofY} L${s.x0 + len * 0.5} ${s.beltY + 4} L${s.x0 + len * 0.47} ${s.beltY + 4} Z`}
            fill="#fff"
            opacity="0.05"
          />
          <rect x={s.x0} y={s.beltY - 7} width={len} height="10" fill="#000" opacity="0.35" filter={`url(#blur${id})`} />
        </g>
        <path d={s.dlo} fill="none" stroke="#fff" strokeOpacity="0.16" strokeWidth="0.7" />
        {s.pillars.map((p, i) => (
          <path key={i} d={p} fill="#030506" opacity="0.92" />
        ))}

        {/* стыки дверей */}
        {s.seams.map((p, i) => (
          <g key={i}>
            <path d={p} stroke="#000" strokeOpacity={seamDark} strokeWidth="0.9" fill="none" />
            <path d={p} transform="translate(0.9 0)" stroke="#fff" strokeOpacity={seamLight} strokeWidth="0.5" fill="none" />
          </g>
        ))}
        {s.handles.map(([x, y]) => (
          <g key={x}>
            <rect x={x} y={y} width="12" height="2.6" rx="1.3" fill="#000" opacity={light ? 0.25 : 0.5} />
            <rect x={x} y={y} width="12" height="1.2" rx="0.6" fill="#fff" opacity={light ? 0.5 : 0.22} />
          </g>
        ))}

        {/* зеркало */}
        <path d={s.mirror} fill={`url(#paint${id})`} />
        <path d={s.mirror} fill="none" stroke="#000" strokeOpacity="0.4" strokeWidth="0.6" />

        {/* оптика */}
        <path d={s.head} fill={`url(#head${id})`} />
        <path d={s.drl} stroke="#bff9f3" strokeWidth="1.1" strokeLinecap="round" fill="none" />
        <path d={s.drl} stroke="#33e3d4" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.25" filter={`url(#soft${id})`} />
        <path d={s.tail} fill={`url(#tail${id})`} />
        <path d={s.tail} fill="none" stroke="#ff8a96" strokeOpacity="0.5" strokeWidth="0.5" />

        {/* подножка */}
        {s.step && (
          <g>
            <rect x={s.step[0]} y={s.sill - 1} width={s.step[1] - s.step[0]} height="4" rx="1.5" fill="#101416" />
            <rect x={s.step[0]} y={s.sill - 1} width={s.step[1] - s.step[0]} height="0.8" rx="0.4" fill="#fff" opacity="0.14" />
          </g>
        )}

        {/* контровой бирюзовый свет */}
        <path d={s.ridge} stroke="#fff" strokeOpacity={light ? 0.6 : 0.22} strokeWidth="0.6" fill="none" />
        <path d={s.ridge} transform="translate(0 -0.4)" stroke={`url(#rimLight${id})`} strokeWidth="1.1" fill="none" />
      </g>

      {/* отражение и тень на полу */}
      {!plain && (
        <g mask={`url(#reflMask${id})`} opacity="0.75">
          <use href={`#car${id}`} transform={`matrix(1 0 0 -1 0 ${2 * G})`} />
        </g>
      )}
      <ellipse cx={cx} cy={G} rx={len * 0.47} ry="3.6" fill="#000" opacity="0.75" filter={`url(#blur${id})`} />
      {[s.xr, s.xf].map((x) => (
        <ellipse key={x} cx={x} cy={G} rx={s.r * 0.95} ry="1.6" fill="#000" opacity="0.9" filter={`url(#soft${id})`} />
      ))}
    </svg>
  );
}
