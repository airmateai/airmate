-- UNIKO · app de stock (proyecto AIRMATE 1). Se puede ejecutar dos veces.
-- El stock vive en WooCommerce; aquí solo: quién entra, el coste de cada prenda y el historial de movimientos.
create table if not exists public.uniko_usuarios (
  user_id uuid primary key references auth.users(id) on delete cascade,
  nombre text not null,
  created_at timestamptz not null default now()
);
create table if not exists public.uniko_costes (
  product_id bigint primary key,
  coste numeric not null check (coste >= 0),
  updated_at timestamptz not null default now()
);
create table if not exists public.uniko_movimientos (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  product_id bigint not null,
  variation_id bigint,
  nombre text, color text, talla text,
  tipo text not null check (tipo in ('venta','entrada','recuento','ajuste')),
  delta int not null,
  stock_despues int,
  canal text,
  autor text
);
create index if not exists uniko_mov_fecha on public.uniko_movimientos (created_at desc);

-- Nadie lee ni escribe directamente desde el navegador: todo pasa por la función uniko-stock (service role).
alter table public.uniko_usuarios enable row level security;
alter table public.uniko_costes enable row level security;
alter table public.uniko_movimientos enable row level security;
revoke all on public.uniko_usuarios, public.uniko_costes, public.uniko_movimientos from anon, authenticated;

-- Dar de alta a Nau (después de crear su usuario en Authentication → Users con el email nau@uniko.airmate.es):
-- insert into public.uniko_usuarios (user_id, nombre) select id, 'Nau' from auth.users where email = 'nau@uniko.airmate.es' on conflict do nothing;
-- insert into public.uniko_usuarios (user_id, nombre) select id, 'Fabio' from auth.users where email = 'fabio@uniko.airmate.es' on conflict do nothing;
