-- UNIKO · app de stock (proyecto AIRMATE 1). Se puede ejecutar varias veces.
-- Nau apunta ventas y entradas en el móvil; la app le dice qué cambiar en su web al llegar a casa.
create table if not exists public.uniko_usuarios (
  user_id uuid primary key references auth.users(id) on delete cascade,
  nombre text not null,
  created_at timestamptz not null default now()
);
create table if not exists public.uniko_stock (
  product_id bigint not null,
  vid bigint not null default 0,          -- variación (color + talla) de WooCommerce; 0 = producto sin variaciones
  cantidad int not null default 0 check (cantidad >= 0),
  updated_at timestamptz not null default now(),
  primary key (product_id, vid)
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
  vid bigint not null default 0,
  nombre text, color text, talla text,
  tipo text not null check (tipo in ('venta','entrada','recuento')),
  delta int not null,
  stock_despues int not null,
  canal text,
  autor text,
  web_hecho_at timestamptz                -- cuándo lo cambió en la web (null = pendiente)
);
create index if not exists uniko_mov_fecha on public.uniko_movimientos (created_at desc);
create index if not exists uniko_mov_pend on public.uniko_movimientos (product_id) where web_hecho_at is null;

-- Mover stock de una vez: venta/entrada suman delta, recuento fija la cantidad. Devuelve antes/después.
create or replace function public.uniko_mover(p_product bigint, p_vid bigint, p_tipo text, p_delta int, p_cantidad int,
  p_nombre text, p_color text, p_talla text, p_canal text, p_autor text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare v_antes int; v_despues int; v_nuevo boolean;
begin
  -- primer recuento de una talla = está copiando lo que ya tiene; no hay nada que cambiar en la web
  v_nuevo := not exists (select 1 from uniko_stock where product_id = p_product and vid = coalesce(p_vid, 0));
  insert into uniko_stock (product_id, vid, cantidad) values (p_product, coalesce(p_vid, 0), 0) on conflict do nothing;
  select cantidad into v_antes from uniko_stock where product_id = p_product and vid = coalesce(p_vid, 0) for update;
  if p_tipo = 'recuento' then v_despues := greatest(0, coalesce(p_cantidad, 0));
  elsif p_tipo = 'venta' then v_despues := v_antes - abs(p_delta); if v_despues < 0 then raise exception 'sin_stock'; end if;
  elsif p_tipo = 'entrada' then v_despues := v_antes + abs(p_delta);
  else raise exception 'tipo no válido'; end if;
  update uniko_stock set cantidad = v_despues, updated_at = now() where product_id = p_product and vid = coalesce(p_vid, 0);
  insert into uniko_movimientos (product_id, vid, nombre, color, talla, tipo, delta, stock_despues, canal, autor, web_hecho_at)
    values (p_product, coalesce(p_vid, 0), p_nombre, p_color, p_talla, p_tipo, v_despues - v_antes, v_despues, p_canal, p_autor,
            case when p_tipo = 'recuento' and v_nuevo then now() end);
  return jsonb_build_object('antes', v_antes, 'despues', v_despues);
end $$;

-- Nadie entra desde el navegador: todo pasa por la función uniko-stock (service role).
alter table public.uniko_usuarios enable row level security;
alter table public.uniko_stock enable row level security;
alter table public.uniko_costes enable row level security;
alter table public.uniko_movimientos enable row level security;
revoke all on public.uniko_usuarios, public.uniko_stock, public.uniko_costes, public.uniko_movimientos from anon, authenticated;
revoke all on function public.uniko_mover(bigint,bigint,text,int,int,text,text,text,text,text) from public, anon, authenticated;

-- Quién entra (después de crear el usuario en Authentication → Users). Volver a ejecutar tras crearlo.
insert into public.uniko_usuarios (user_id, nombre) select id, 'Nau' from auth.users where email = 'nau@uniko.airmate.es' on conflict do nothing;
insert into public.uniko_usuarios (user_id, nombre) select id, 'Fabio' from auth.users where email = 'fabio@uniko.airmate.es' on conflict do nothing;
select nombre from public.uniko_usuarios;
