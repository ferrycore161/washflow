import { useEffect, useState } from 'react';
import manifestJson from '../data/carAssets.json';
import { findGeneration, findVehicleModel } from '../data/vehicleCatalog';
import { colorByName, resolveCarImage, type CarAssetManifest, type CarColorKey } from '../domain/vehicles';
import type { BodyType, CarProfile } from '../domain/types';
import { CarArt, carPaintFromName } from './art/CarArt';

export const CAR_MANIFEST = manifestJson as unknown as CarAssetManifest;

export interface CarSelection {
  generationId?: string;
  body: BodyType;
  variant?: string;
  color?: CarColorKey;
}

/** Выбор для изображения из профиля; старые профили сопоставляются с поколением по названию и годам. */
export function selectionFromCar(car: CarProfile | null | undefined): CarSelection {
  if (!car) return { body: 'sedan' };
  let generationId = car.generationId;
  if (!generationId) {
    const m = findVehicleModel(car.make, car.model);
    if (m) {
      const byCode = m.generations.find((g) => car.years && new RegExp(`\b${g.code}\b`, 'i').test(car.years));
      const byBody = m.generations.find((g) => g.bodies.some((b) => b.body === car.body));
      generationId = (byCode ?? byBody)?.id;
    }
  }
  const color = (car.colorKey as CarColorKey | undefined) ?? colorByName(car.color)?.key;
  return { generationId, body: car.body, variant: car.bodyVariant, color };
}

/**
 * Иллюстрация автомобиля: точное изображение модели/поколения/кузова, иначе — иллюстрация по типу кузова.
 * Смена машины или цвета — плавная (кроссфейд).
 */
export function CarImage({
  selection,
  width,
  paintName,
  className = '',
  eager = false,
}: {
  selection: CarSelection;
  width: number;
  paintName?: string;
  className?: string;
  eager?: boolean;
}) {
  const r = resolveCarImage(CAR_MANIFEST, selection);
  const [loaded, setLoaded] = useState<string | null>(null);
  const [failed, setFailed] = useState<string | null>(null);
  useEffect(() => setFailed(null), [r.src]);

  if (r.kind === 'fallback' || !r.src || failed === r.src) {
    return (
      <span className={`car-image fallback ${className}`} style={{ width }}>
        <CarArt width={width} body={selection.body} paint={carPaintFromName(paintName)} key={`${selection.body}-${paintName}`} />
      </span>
    );
  }
  const a = r.asset!;
  const src = import.meta.env.BASE_URL + r.src.replace(/^\//, '');
  return (
    <span className={`car-image ${className}`} style={{ width, aspectRatio: `${a.width} / ${a.height}` }}>
      <img
        key={src}
        src={src}
        alt={findGeneration(selection.generationId)?.model.model ?? ''}
        width={a.width}
        height={a.height}
        loading={eager ? 'eager' : 'lazy'}
        decoding="async"
        className={loaded === src ? 'in' : ''}
        onLoad={() => setLoaded(src)}
        onError={() => setFailed(r.src!)}
      />
    </span>
  );
}
