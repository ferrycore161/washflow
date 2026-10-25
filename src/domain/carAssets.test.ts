import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import manifest from '../data/carAssets.json';
import { VEHICLE_MODELS } from '../data/vehicleCatalog';
import { assetIdFor, resolveCarImage, type CarAssetManifest } from './vehicles';

const M = manifest as unknown as CarAssetManifest;
const assets = Object.values(M);

describe('библиотека изображений автомобилей', () => {
  it('каждый ассет привязан к существующему поколению и кузову каталога', () => {
    for (const a of assets) {
      const gen = VEHICLE_MODELS.flatMap((m) => m.generations).find((g) => g.id === a.generationId);
      expect(gen, a.assetId).toBeTruthy();
      expect(gen!.bodies.some((b) => b.body === a.body && (b.variant ?? undefined) === (a.variant ?? undefined)), a.assetId).toBe(true);
      expect(assetIdFor(a.generationId, a.body, a.variant)).toBe(a.assetId);
    }
  });

  it('все файлы существуют, лёгкие и уникальны (нет одной картинки под разными моделями)', () => {
    const hashes = new Map<string, string>();
    for (const a of assets) {
      for (const file of Object.values(a.colors)) {
        const path = join('public', file!);
        expect(existsSync(path), path).toBe(true);
        const buf = readFileSync(path);
        expect(buf.length).toBeLessThan(150 * 1024);
        expect(buf.subarray(8, 12).toString()).toBe('WEBP');
        const h = createHash('sha1').update(buf).digest('hex');
        expect(hashes.get(h), `${a.assetId} дублирует ${hashes.get(h)}`).toBeUndefined();
        hashes.set(h, a.assetId);
      }
    }
  });

  it('у каждого ассета указаны источник и условия использования', () => {
    for (const a of assets) {
      expect(a.source).toMatch(/Car Image API/);
      expect(a.license).toBeTruthy();
      expect(a.colors[a.defaultColor]).toBeTruthy();
    }
  });

  it('цвет, которого нет, показывается в цвете по умолчанию с пометкой; без ассета — fallback', () => {
    const a = assets[0];
    const r = resolveCarImage(M, { generationId: a.generationId, body: a.body, variant: a.variant, color: 'orange' });
    expect(r.kind).toBe('asset');
    expect(r.shownColor).toBe(a.defaultColor);
    expect(r.colorUnavailable).toBe(true);
    expect(resolveCarImage(M, { generationId: 'hyundai-solaris-hcr', body: 'sedan' }).kind).toBe('fallback');
  });
});
