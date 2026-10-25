-- WASHFLOW: общий обновляемый каталог автохимии (необязательный облачный слой).
-- Приложение работает и без него: встроенный каталог + локальное хранилище.
-- Данные пользователя (оборудование, химия, авто) в облако НЕ отправляются.

create table if not exists public.catalog_products (
  id          text primary key check (id ~ '^[a-z0-9-]+$'),
  brand       text not null,
  -- карточка в формате productSourceSchema (src/domain/catalogSchema.ts)
  data        jsonb not null,
  published   boolean not null default false,
  updated_at  timestamptz not null default now()
);

create index if not exists catalog_products_brand_idx on public.catalog_products (brand);

create or replace function public.touch_catalog_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists catalog_products_touch on public.catalog_products;
create trigger catalog_products_touch
  before update on public.catalog_products
  for each row execute function public.touch_catalog_updated_at();

-- RLS: все читают только опубликованные карточки; запись — только service_role
-- (скрипт импорта/модерации на сервере), anon и authenticated писать не могут.
alter table public.catalog_products enable row level security;

drop policy if exists "read published catalog" on public.catalog_products;
create policy "read published catalog"
  on public.catalog_products
  for select
  to anon, authenticated
  using (published = true);

revoke insert, update, delete on public.catalog_products from anon, authenticated;
grant select on public.catalog_products to anon, authenticated;
