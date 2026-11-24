-- ============================================================
-- Skema awal: products, user_roles, RLS, dan RPC checkout
-- Jalankan lewat Supabase SQL Editor.
-- ============================================================

create extension if not exists pgcrypto;

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  price numeric(10,2) not null check (price >= 0),
  category text not null default 'Umum',
  image_url text,
  stock integer not null default 0 check (stock >= 0),
  is_available boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role = 'admin'),
  created_at timestamptz not null default now()
);

-- Helper admin: SECURITY DEFINER menghindari rekursi RLS.
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = auth.uid() and role = 'admin'
  );
$$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_products_updated on public.products;
create trigger trg_products_updated
before update on public.products
for each row execute function public.touch_updated_at();

alter table public.products enable row level security;
alter table public.user_roles enable row level security;

drop policy if exists products_public_read on public.products;
create policy products_public_read on public.products
for select to anon, authenticated
using (is_available = true);

drop policy if exists products_admin_all on public.products;
create policy products_admin_all on public.products
for all to authenticated
using (public.is_admin())
with check (public.is_admin());

-- Pembeli hanya bisa membaca role sendiri. Tidak ada policy INSERT/UPDATE/DELETE
-- untuk user_roles, sehingga role tidak bisa diberikan dari frontend.
drop policy if exists roles_self_read on public.user_roles;
create policy roles_self_read on public.user_roles
for select to authenticated
using (user_id = auth.uid() or public.is_admin());

-- Harga dihitung ulang oleh database, bukan dipercaya dari browser.
create or replace function public.get_checkout_summary(p_items jsonb)
returns table (name text, qty integer, unit_price numeric, line_total numeric)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if p_items is null then
    return;
  end if;

  return query
  select
    p.name,
    (item->>'qty')::int,
    p.price,
    p.price * (item->>'qty')::int
  from jsonb_array_elements(p_items) as item
  join public.products p on p.id::text = item->>'id'
  where p.is_available = true
    and (item->>'qty')::int > 0
    and (item->>'qty')::int <= 99;
end;
$$;
revoke all on function public.get_checkout_summary(jsonb) from public;
grant execute on function public.get_checkout_summary(jsonb) to anon, authenticated;

-- Grant level tabel (RLS tetap pembatas utama).
grant usage on schema public to anon, authenticated;
grant select on public.products to anon, authenticated;
grant insert, update, delete on public.products to authenticated;
grant select on public.user_roles to authenticated;
