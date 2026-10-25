/**
 * Публикация собранного каталога (src/data/catalog.json) в Supabase.
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... npm run catalog:push
 * Ключ service_role используется только здесь (локально/CI), в клиент не попадает.
 */
import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';
import type { Product } from '../src/domain/types';

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error('Задайте SUPABASE_URL и SUPABASE_SERVICE_ROLE_KEY (см. .env.example)');
  process.exit(1);
}
const catalog = JSON.parse(readFileSync('src/data/catalog.json', 'utf8')) as { products: Product[] };
const rows = catalog.products.map(({ brand, id, custom: _c, ...rest }) => ({
  id,
  brand,
  data: { ...rest, status: rest.status === 'verified' ? 'verified' : 'unverified' },
  published: true,
}));
const client = createClient(url, key, { auth: { persistSession: false } });
const { error } = await client.from('catalog_products').upsert(rows, { onConflict: 'id' });
if (error) {
  console.error(error.message);
  process.exit(1);
}
console.log(`Опубликовано карточек: ${rows.length}`);
