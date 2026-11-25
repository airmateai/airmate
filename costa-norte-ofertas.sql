-- Costa Norte · ofertas de alojamiento (temporada baja, fines de semana…)
-- Se crean y se pausan en el panel → Apartamentos → Precios y temporadas → Ofertas.
-- La rebaja se aplica noche a noche en el precio de la web (buscador, calendario, reserva y surf camp).
-- Ejecutar en Supabase → SQL Editor DESPUÉS de costa-norte-surfcamp.sql. Se puede repetir.

create table if not exists cn_apt_ofertas (
  id serial primary key,
  nombre text not null,
  tipo_id int references cn_apt_tipos(id),          -- null = todos los apartamentos
  desde date not null,
  hasta date not null,                               -- noche incluida
  pct numeric(5,2) not null check (pct > 0 and pct <= 50),
  dias text not null default 'todos' check (dias in ('todos','finde','semana')),  -- finde = noches de viernes y sábado; semana = de domingo a jueves
  min_noches int not null default 1 check (min_noches >= 1),
  activo boolean not null default true,
  created_at timestamptz not null default now(),
  check (hasta >= desde)
);
alter table cn_apt_ofertas enable row level security;
revoke all on cn_apt_ofertas from anon;
grant select, insert, update, delete on cn_apt_ofertas to authenticated;
grant usage, select on sequence cn_apt_ofertas_id_seq to authenticated;
drop policy if exists "cn_solo_costa_norte_cn_apt_ofertas" on cn_apt_ofertas;
create policy "cn_solo_costa_norte_cn_apt_ofertas" on cn_apt_ofertas for all to authenticated
  using ((auth.jwt() ->> 'business_slug') = 'costa-norte')
  with check ((auth.jwt() ->> 'business_slug') = 'costa-norte');

-- ¿Cuánto rebaja la oferta esta noche? (la mayor si coinciden varias)
create or replace function cn_apt_oferta_noche(p_tipo int, p_dia date, p_noches int)
returns numeric language sql stable security definer set search_path = public as $$
  select coalesce(max(o.pct), 0) from cn_apt_ofertas o
  where o.activo and (o.tipo_id is null or o.tipo_id = p_tipo)
    and p_dia between o.desde and o.hasta
    and p_noches >= o.min_noches
    and (o.dias = 'todos'
      or (o.dias = 'finde'  and extract(isodow from p_dia) in (5, 6))
      or (o.dias = 'semana' and extract(isodow from p_dia) not in (5, 6)));
$$;

-- Precio de la web = (precio de cada noche − oferta de esa noche) + recargo de la web
create or replace function cn_apt_precio(p_tipo int, p_entrada date, p_salida date)
returns table(total numeric, estancia_min int)
language sql stable security definer set search_path = public as $$
  with noches as (select generate_series(p_entrada, p_salida - 1, interval '1 day')::date d),
  p as (
    select n.d,
      coalesce((select precio_noche from cn_apt_tarifas r where (r.tipo_id = p_tipo or r.tipo_id is null) and n.d between r.desde and r.hasta order by (r.tipo_id is null), r.id desc limit 1),
               (select precio_base from cn_apt_tipos where id = p_tipo)) precio,
      coalesce((select r.estancia_min from cn_apt_tarifas r where (r.tipo_id = p_tipo or r.tipo_id is null) and n.d between r.desde and r.hasta order by (r.tipo_id is null), r.id desc limit 1),
               (select t.estancia_min from cn_apt_tipos t where id = p_tipo)) em,
      cn_apt_oferta_noche(p_tipo, n.d, (p_salida - p_entrada)::int) dto
    from noches n)
  select round(sum(precio * (1 - dto / 100)) * (1 + coalesce((cn_descuentos() ->> 'web_recargo_pct')::numeric, 0) / 100))::numeric, max(em)::int from p;
$$;

-- Lo que la web enseña: ofertas activas que no han terminado
create or replace function cn_apt_ofertas_publicas()
returns table(nombre text, tipo_id int, tipo text, desde date, hasta date, pct numeric, dias text, min_noches int)
language sql stable security definer set search_path = public as $$
  select o.nombre, o.tipo_id, t.nombre, o.desde, o.hasta, o.pct, o.dias, o.min_noches
  from cn_apt_ofertas o left join cn_apt_tipos t on t.id = o.tipo_id
  where o.activo and o.hasta >= current_date
  order by o.desde;
$$;

grant execute on function cn_apt_oferta_noche(int, date, int) to anon, authenticated;
grant execute on function cn_apt_precio(int, date, date) to anon, authenticated;
grant execute on function cn_apt_ofertas_publicas() to anon, authenticated;
