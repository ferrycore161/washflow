import type { BodyType } from './types';

/**
 * Библиотека автомобилей: Марка → Модель → Поколение → Кузов → Цвет.
 *
 * Изображения не зашиты в код: они описаны в манифесте `src/data/carAssets.json`
 * (генерируется `scripts/car-assets.ts`) и лежат в `public/cars/<assetId>/<color>.webp`.
 * Ассет привязан к связке «поколение + кузов». Если точного ассета нет —
 * показываем иллюстрацию по типу кузова (CarArt), и только в этом случае.
 */

export interface VehicleBody {
  body: BodyType;
  /** Подпись кузова, если отличается от стандартной («Лифтбек», «Хэтчбек 3 дв.»). */
  label?: string;
  /** Вариант при одинаковом типе кузова (например, 3d / 5d) — у каждого своё изображение. */
  variant?: string;
}

export interface VehicleGeneration {
  /** Стабильный id: <make>-<model>-<code>, например mazda-6-gj. */
  id: string;
  /** Код поколения: GJ, XV70, G20… */
  code: string;
  years: string;
  bodies: VehicleBody[];
  /** Год, по которому рендерится изображение (типичный для поколения в РФ). */
  renderYear?: number;
  /** Пояснение к изображению: отличие от версии для РФ или причина, почему изображения нет. */
  imageNote?: string;
}

export interface VehicleModel {
  id: string;
  make: string;
  model: string;
  /** Альтернативные написания для поиска. */
  alias?: string[];
  generations: VehicleGeneration[];
  popular?: boolean;
}

export type CarColorKey =
  | 'graphite'
  | 'black'
  | 'white'
  | 'silver'
  | 'gray'
  | 'blue'
  | 'red'
  | 'green'
  | 'brown'
  | 'beige'
  | 'orange';

export interface CarColor {
  key: CarColorKey;
  name: string;
  hex: string;
}

/** Палитра, в которой подготовлены изображения моделей. */
export const CAR_COLORS: CarColor[] = [
  { key: 'graphite', name: 'Графит', hex: '#3a4045' },
  { key: 'black', name: 'Чёрный', hex: '#14181b' },
  { key: 'white', name: 'Белый', hex: '#eef1f2' },
  { key: 'silver', name: 'Серебристый', hex: '#b9c0c4' },
  { key: 'gray', name: 'Серый', hex: '#6b7378' },
  { key: 'blue', name: 'Синий', hex: '#1f4fa0' },
  { key: 'red', name: 'Красный', hex: '#b3141f' },
  { key: 'green', name: 'Зелёный', hex: '#2f5d43' },
  { key: 'brown', name: 'Коричневый', hex: '#5a3b2a' },
  { key: 'beige', name: 'Бежевый', hex: '#c9b48f' },
  { key: 'orange', name: 'Оранжевый', hex: '#d9661c' },
];

export function colorByName(name?: string): CarColor | undefined {
  if (!name) return undefined;
  const n = name.trim().toLowerCase().replace('ё', 'е');
  return CAR_COLORS.find((c) => c.name.toLowerCase().replace('ё', 'е') === n || c.key === n);
}

export interface CarAsset {
  assetId: string;
  generationId: string;
  body: BodyType;
  variant?: string;
  /** Файлы по цветам: путь относительно корня сайта. */
  colors: Partial<Record<CarColorKey, string>>;
  defaultColor: CarColorKey;
  width: number;
  height: number;
  /** Откуда изображение и на каких условиях используется. */
  source: string;
  license: string;
  createdAt: string;
}

export type CarAssetManifest = Record<string, CarAsset>;

export const assetIdFor = (generationId: string, body: BodyType, variant?: string) =>
  `${generationId}-${body}${variant ? `-${variant}` : ''}`;

export interface ResolvedCarImage {
  kind: 'asset' | 'fallback';
  src?: string;
  asset?: CarAsset;
  /** Цвет, в котором реально показан автомобиль. */
  shownColor?: CarColorKey;
  /** Выбранный цвет недоступен для этого ассета. */
  colorUnavailable?: boolean;
  body: BodyType;
}

/**
 * Подбор изображения: точный ассет «поколение + кузов» в выбранном цвете;
 * если цвета нет — ассет в цвете по умолчанию с пометкой; если ассета нет — fallback по кузову.
 */
export function resolveCarImage(
  manifest: CarAssetManifest,
  sel: { generationId?: string; body: BodyType; variant?: string; color?: CarColorKey },
): ResolvedCarImage {
  const asset = sel.generationId ? manifest[assetIdFor(sel.generationId, sel.body, sel.variant)] : undefined;
  if (!asset) return { kind: 'fallback', body: sel.body };
  const want = sel.color && asset.colors[sel.color] ? sel.color : asset.defaultColor;
  return {
    kind: 'asset',
    asset,
    src: asset.colors[want],
    shownColor: want,
    colorUnavailable: !!sel.color && want !== sel.color,
    body: sel.body,
  };
}
