/**
 * Сборка каталога: catalog-src/*.json → src/data/catalog.json
 * Валидирует каждую карточку, проверяет дубликаты, печатает отчёт.
 *   npm run catalog:build            — собрать
 *   npm run catalog:report           — собрать и показать подробный отчёт
 */
import { readdirSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { brandFileSchema, brandFileToProducts } from '../src/domain/catalogSchema';
import type { Product } from '../src/domain/types';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const srcDir = join(root, 'catalog-src');
const outFile = join(root, 'src', 'data', 'catalog.json');
const report = process.argv.includes('--report');

export function buildCatalog(dir: string) {
  const products: Product[] = [];
  const errors: string[] = [];
  const files = readdirSync(dir).filter((f) => f.endsWith('.json')).sort();
  for (const f of files) {
    let json: unknown;
    try {
      json = JSON.parse(readFileSync(join(dir, f), 'utf8'));
    } catch (e) {
      errors.push(`${f}: невалидный JSON (${(e as Error).message})`);
      continue;
    }
    const r = brandFileSchema.safeParse(json);
    if (!r.success) {
      for (const iss of r.error.issues) errors.push(`${f}: ${iss.path.join('.')} — ${iss.message}`);
      continue;
    }
    products.push(...brandFileToProducts(r.data));
  }
  const seen = new Set<string>();
  for (const p of products) {
    if (seen.has(p.id)) errors.push(`Дубликат id: ${p.id}`);
    seen.add(p.id);
  }
  products.sort((a, b) => a.brand.localeCompare(b.brand) || a.name.localeCompare(b.name));
  return { products, errors, files };
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  const { products, errors, files } = buildCatalog(srcDir);
  if (errors.length) {
    console.error('Ошибки каталога:\n' + errors.map((e) => '  • ' + e).join('\n'));
    process.exit(1);
  }
  const checked = products.flatMap((p) => p.applications.map((a) => a.checkedAt)).sort();
  mkdirSync(dirname(outFile), { recursive: true });
  writeFileSync(
    outFile,
    JSON.stringify(
      { version: checked.at(-1) ?? 'empty', builtAt: new Date().toISOString(), products },
      null,
      1,
    ),
  );
  const verified = products.filter((p) => p.status === 'verified').length;
  console.log(
    `Каталог собран: ${products.length} позиций из ${files.length} файлов · подтверждено ${verified} · без методики ${products.length - verified}`,
  );
  if (report) {
    const byBrand = new Map<string, Product[]>();
    for (const p of products) byBrand.set(p.brand, [...(byBrand.get(p.brand) ?? []), p]);
    for (const [brand, list] of byBrand) {
      console.log(`\n${brand}`);
      for (const p of list) {
        const m = p.applications.map((a) => `${a.method}:${a.dilutionText}`).join('; ');
        console.log(`  ${p.status === 'verified' ? '✔' : '○'} ${p.name} — ${m || 'нет подтверждённой методики'}`);
      }
    }
  }
}
