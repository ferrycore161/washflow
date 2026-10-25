/**
 * Необязательная синхронизация общего каталога с Supabase.
 * Приложение полностью работает без неё: встроенный каталог + локальное хранилище.
 * Ключ — только публичный anon key; запись в каталог закрыта политиками RLS
 * (см. supabase/migrations/0001_catalog.sql).
 */
import { productSourceSchema, brandFileToProducts } from '../domain/catalogSchema';
import type { Product } from '../domain/types';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const supabaseConfigured = Boolean(url && anonKey);

interface Row {
  id: string;
  brand: string;
  data: unknown;
  updated_at: string;
}

export async function fetchRemoteCatalog(): Promise<{ products: Product[]; rejected: number; syncedAt: string }> {
  if (!supabaseConfigured) throw new Error('Supabase не настроен (.env)');
  const { createClient } = await import('@supabase/supabase-js');
  const client = createClient(url!, anonKey!, { auth: { persistSession: false } });
  const { data, error } = await client
    .from('catalog_products')
    .select('id, brand, data, updated_at')
    .eq('published', true)
    .order('brand');
  if (error) throw new Error(error.message);
  const products: Product[] = [];
  let rejected = 0;
  for (const row of (data ?? []) as Row[]) {
    const parsed = productSourceSchema.safeParse({ ...(row.data as object), id: row.id });
    if (!parsed.success) {
      rejected++;
      continue;
    }
    products.push(...brandFileToProducts({ brand: row.brand, products: [parsed.data] }));
  }
  return { products, rejected, syncedAt: new Date().toISOString() };
}
