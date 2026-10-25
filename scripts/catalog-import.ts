/**
 * Импорт/обновление карточек из файла в формате каталога.
 *   npm run catalog:import -- path/to/brand.json [--dry]
 * Карточки сливаются с catalog-src/<бренд>.json по id. Методика (application)
 * заменяется только если у новой более свежая дата проверки checkedAt.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { brandFileSchema, type BrandFile } from '../src/domain/catalogSchema';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const [, , input, ...flags] = process.argv;
if (!input) {
  console.error('Использование: npm run catalog:import -- <файл.json> [--dry]');
  process.exit(1);
}
const dry = flags.includes('--dry');

const slug = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'brand';

export function mergeBrand(base: BrandFile, inc: BrandFile) {
  const out: BrandFile = { ...base, brandSite: inc.brandSite ?? base.brandSite, products: [...base.products] };
  let added = 0;
  let updated = 0;
  for (const p of inc.products) {
    const i = out.products.findIndex((x) => x.id === p.id);
    if (i < 0) {
      out.products.push(p);
      added++;
      continue;
    }
    const old = out.products[i];
    const apps = [...old.applications];
    for (const a of p.applications) {
      const j = apps.findIndex((x) => x.method === a.method);
      if (j < 0) apps.push(a);
      else if (a.checkedAt >= apps[j].checkedAt) apps[j] = a;
    }
    out.products[i] = { ...old, ...p, applications: apps, status: apps.length ? 'verified' : p.status };
    updated++;
  }
  return { out, added, updated };
}

const raw = JSON.parse(readFileSync(input, 'utf8'));
const parsed = brandFileSchema.safeParse(raw);
if (!parsed.success) {
  console.error(parsed.error.issues.map((i) => `${i.path.join('.')} — ${i.message}`).join('\n'));
  process.exit(1);
}
const target = join(root, 'catalog-src', `${slug(parsed.data.brand)}.json`);
const base: BrandFile = existsSync(target)
  ? brandFileSchema.parse(JSON.parse(readFileSync(target, 'utf8')))
  : { brand: parsed.data.brand, products: [] };
const { out, added, updated } = mergeBrand(base, parsed.data);
console.log(`${parsed.data.brand}: добавлено ${added}, обновлено ${updated} → ${target}`);
if (!dry) writeFileSync(target, JSON.stringify(out, null, 2) + '\n');
