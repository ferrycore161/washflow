import { z } from 'zod';
import type { Product } from './types';

/**
 * Схема исходного файла каталога (catalog-src/<бренд>.json).
 * Такой же формат принимает импорт в приложении и таблица Supabase.
 */
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Дата в формате ГГГГ-ММ-ДД');
const positive = z.number().positive();

const rangeNum = z.object({ from: positive, to: positive });

export const dilutionSchema = z.discriminatedUnion('kind', [
  rangeNum.extend({
    kind: z.literal('ratio'),
    ratioBasis: z.enum(['water', 'total']).default('water'),
  }),
  rangeNum.extend({
    kind: z.literal('ml_per_l'),
    basis: z.enum(['water', 'solution']).default('solution'),
  }),
  rangeNum.extend({
    kind: z.literal('percent'),
    from: positive.max(100),
    to: positive.max(100),
  }),
  z.object({ kind: z.literal('ready') }),
]);

export const applicationSchema = z.object({
  method: z.enum(['sprayer', 'bucket', 'foam_lance', 'foam_generator', 'trigger', 'hpw_injector']),
  dilution: dilutionSchema,
  dilutionText: z.string().min(1),
  surface: z.enum(['dry', 'wet', 'any']).nullable().default(null),
  // to: null — «не менее from» (верхняя граница не указана производителем)
  dwellSec: z
    .object({ from: z.number().min(0), to: z.number().min(0).nullable() })
    .transform((d) => ({ from: d.from, to: d.to ?? d.from }))
    .nullable()
    .default(null),
  steps: z.array(z.string()).default([]),
  restrictions: z.array(z.string()).default([]),
  sourceUrl: z.string().url(),
  checkedAt: isoDate,
  sourceQuote: z.string().optional(),
  consumptionMl: z.object({ from: positive, to: positive }).optional(),
});

/**
 * Расход на автомобиль из текста источника: «50–100 мл …». Используется только
 * для средств без разведения, где объём иначе взять неоткуда.
 */
export function extractConsumption(texts: string[]): { from: number; to: number } | undefined {
  for (const t of texts) {
    const m = t.match(/(\d+)\s*[–—-]\s*(\d+)\s*мл/i) ?? t.match(/(\d+)()\s*мл/i);
    if (!m) continue;
    const from = Number(m[1]);
    const to = m[2] ? Number(m[2]) : from;
    if (from > 0 && to > 0 && to <= 2000) return { from: Math.min(from, to), to: Math.max(from, to) };
  }
  return undefined;
}

export const categorySchema = z.enum([
  'prewash',
  'active_foam',
  'contact_shampoo',
  'universal_shampoo',
  'protection',
  'wheel_cleaner',
  'insect_remover',
  'tar_remover',
  'iron_remover',
  'glass_cleaner',
  'drying_aid',
  'other',
]);

export const productSourceSchema = z
  .object({
    id: z.string().regex(/^[a-z0-9-]+$/, 'id: латиница, цифры, дефис'),
    name: z.string().min(1),
    subtitle: z.string().default(''),
    aliases: z.array(z.string()).default([]),
    category: categorySchema,
    phase: z.union([z.literal(1), z.literal(2), z.null()]).default(null),
    ph: z.union([z.string(), z.number(), z.null()]).default(null),
    packages: z.array(positive).default([]),
    applications: z.array(applicationSchema).default([]),
    warnings: z.array(z.string()).default([]),
    status: z.enum(['verified', 'unverified']),
    productUrl: z.string().url().optional(),
  })
  .superRefine((p, ctx) => {
    if (p.status === 'verified' && p.applications.length === 0) {
      ctx.addIssue({ code: 'custom', message: 'verified без applications' });
    }
    if (p.status === 'unverified' && p.applications.length > 0) {
      ctx.addIssue({ code: 'custom', message: 'unverified не должен содержать дозировок' });
    }
    const methods = p.applications.map((a) => a.method);
    if (new Set(methods).size !== methods.length) {
      ctx.addIssue({ code: 'custom', message: 'Дублируется способ нанесения' });
    }
  });

export const brandFileSchema = z.object({
  brand: z.string().min(1),
  brandSite: z.string().url().optional(),
  products: z.array(productSourceSchema),
});

export type BrandFile = z.infer<typeof brandFileSchema>;

export function brandFileToProducts(file: BrandFile): Product[] {
  return file.products.map((p) => ({
    id: p.id,
    brand: file.brand,
    name: p.name,
    subtitle: p.subtitle,
    aliases: p.aliases,
    category: p.category,
    phase: p.phase,
    ph: p.ph,
    packages: p.packages,
    applications: p.applications.map((a) => ({
      ...a,
      consumptionMl:
        a.consumptionMl ??
        (a.dilution.kind === 'ready' ? extractConsumption([...a.steps, a.sourceQuote ?? '']) : undefined),
    })),
    warnings: p.warnings,
    status: p.status,
    productUrl: p.productUrl,
  }));
}

/** Разбор файла импорта: один бренд или массив брендов. */
export function parseCatalogImport(json: unknown): { products: Product[]; errors: string[] } {
  const files = Array.isArray(json) ? json : [json];
  const products: Product[] = [];
  const errors: string[] = [];
  files.forEach((f, i) => {
    const r = brandFileSchema.safeParse(f);
    if (!r.success) {
      errors.push(
        ...r.error.issues.slice(0, 10).map((iss) => `Файл ${i + 1}: ${iss.path.join('.')} — ${iss.message}`),
      );
      return;
    }
    products.push(...brandFileToProducts(r.data));
  });
  return { products, errors };
}
