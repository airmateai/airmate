-- Costa Norte · reservas de apartamentos, parte 2: lo que faltaba de Avirato
-- (códigos de descuento, varios apartamentos en una reserva, calendario de precios y días libres)
-- Ejecutar en Supabase → SQL Editor DESPUÉS de costa-norte-apartamentos.sql. Se puede repetir.

create table if not exists cn_apt_codigos (
  codigo text primary key,
  descuento_pct numeric(5,2) not null check (descuento_pct > 0 and descuento_pct <= 50),
  activo boolean not null default true,
  created_at timestamptz not null default now()
);
alter table cn_apt_codigos enable row level security;
revoke all on cn_apt_codigos from anon;
grant select, insert, update, delete on cn_apt_codigos to authenticated;
drop policy if exists "cn_solo_costa_norte_cn_apt_codigos" on cn_apt_codigos;
create policy "cn_solo_costa_norte_cn_apt_codigos" on cn_apt_codigos for all to authenticated
  using ((auth.jwt() ->> 'business_slug') = 'costa-norte') with check ((auth.jwt() ->> 'business_slug') = 'costa-norte');
insert into cn_apt_codigos (codigo, descuento_pct) values ('COSTANORTE5', 5) on conflict do nothing;

alter table cn_apt_reservas add column if not exists codigo_promo text;
alter table cn_apt_reservas add column if not exists descuento numeric(10,2) not null default 0;
alter table cn_apt_reservas add column if not exists grupo text;

-- descuento de un código (la web lo enseña antes de reservar)
create or replace function cn_apt_promo(p_codigo text)
returns numeric language sql stable security definer set search_path = public as $$
  select descuento_pct from cn_apt_codigos where upper(codigo) = upper(trim(p_codigo)) and activo;
$$;

-- calendario: por cada día, cuántos quedan libres de ese tipo y su precio
create or replace function cn_apt_calendario(p_tipo int, p_desde date, p_dias int default 62)
returns table(dia date, libres int, precio numeric, estancia_min int)
language sql stable security definer set search_path = public as $$
  select d::date,
    (select count(*) from cn_apt_unidades u where u.tipo_id = p_tipo and u.activo
       and not exists (select 1 from cn_apt_reservas r where r.unidad_id = u.id and r.estado <> 'cancelada' and r.entrada <= d::date and r.salida > d::date))::int,
    pr.total, pr.estancia_min
  from generate_series(greatest(p_desde, current_date), greatest(p_desde, current_date) + least(greatest(p_dias,1), 120) - 1, interval '1 day') d
  cross join lateral cn_apt_precio(p_tipo, d::date, d::date + 1) pr
  where exists (select 1 from cn_apt_tipos t where t.id = p_tipo and t.activo);
$$;

-- reservar (ahora con varios apartamentos y código de descuento)
drop function if exists cn_apt_reservar(int, date, date, int, int, text, text, text, int, int, text);
create or replace function cn_apt_reservar(
  p_tipo int, p_entrada date, p_salida date, p_adultos int, p_ninos int,
  p_nombre text, p_email text, p_telefono text, p_pack int default null, p_pack_personas int default 0,
  p_notas text default null, p_cantidad int default 1, p_promo text default null)
returns json language plpgsql security definer set search_path = public as $$
declare v_total numeric; v_min int; v_pack numeric := 0; v_cap int; v_base text; v_cod text; v_pct numeric := 0;
        v_uds int[]; v_n int := greatest(least(coalesce(p_cantidad,1), 6), 1); v_alo numeric; v_desc numeric; v_suma numeric := 0; i int;
begin
  if p_entrada < current_date or p_salida <= p_entrada or (p_salida - p_entrada) > 30 then raise exception 'Fechas no válidas'; end if;
  if coalesce(trim(p_nombre),'') = '' or coalesce(trim(p_email),'') !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then raise exception 'Faltan nombre o email'; end if;
  select capacidad into v_cap from cn_apt_tipos where id = p_tipo and activo;
  if v_cap is null then raise exception 'Alojamiento no disponible'; end if;
  if p_adultos < 1 or p_adultos + coalesce(p_ninos,0) > v_cap * v_n then raise exception 'Demasiadas personas para % apartamento(s)', v_n; end if;
  select total, estancia_min into v_total, v_min from cn_apt_precio(p_tipo, p_entrada, p_salida);
  if (p_salida - p_entrada) < v_min then raise exception 'La estancia mínima en esas fechas es de % noches', v_min; end if;
  if coalesce(trim(p_promo),'') <> '' then
    select descuento_pct into v_pct from cn_apt_codigos where upper(codigo) = upper(trim(p_promo)) and activo;
    if v_pct is null then raise exception 'El código de descuento no es válido'; end if;
  end if;
  perform pg_advisory_xact_lock(hashtext('cn_apt_' || p_tipo));
  select array_agg(id) into v_uds from (
    select u.id from cn_apt_unidades u where u.tipo_id = p_tipo and u.activo
      and not exists (select 1 from cn_apt_reservas r where r.unidad_id = u.id and r.estado <> 'cancelada' and r.entrada < p_salida and r.salida > p_entrada)
    order by u.id limit v_n) x;
  if coalesce(array_length(v_uds,1),0) < v_n then raise exception 'Solo quedan % libres en esas fechas', coalesce(array_length(v_uds,1),0); end if;
  if p_pack is not null and coalesce(p_pack_personas,0) > 0 then
    select precio_persona * least(p_pack_personas, p_adultos + coalesce(p_ninos,0)) into v_pack from cn_apt_packs where id = p_pack and activo;
  end if;
  v_base := 'CN-' || upper(substr(md5(random()::text), 1, 6));
  for i in 1..v_n loop
    v_cod := case when i = 1 then v_base else v_base || '-' || i end;
    v_alo := v_total + case when i = 1 then coalesce(v_pack,0) else 0 end;
    v_desc := round(v_total * coalesce(v_pct,0) / 100, 2);
    insert into cn_apt_reservas (codigo, grupo, tipo_id, unidad_id, entrada, salida, adultos, ninos, nombre, email, telefono, pack_id, pack_personas,
                                 total, descuento, codigo_promo, notas, origen, estado)
    values (v_cod, case when v_n > 1 then v_base end, p_tipo, v_uds[i], p_entrada, p_salida,
            case when i = 1 then p_adultos else 0 end, case when i = 1 then coalesce(p_ninos,0) else 0 end,
            trim(p_nombre), lower(trim(p_email)), trim(p_telefono),
            case when i = 1 and v_pack > 0 then p_pack end, case when i = 1 and v_pack > 0 then p_pack_personas else 0 end,
            v_alo - v_desc, v_desc, nullif(upper(trim(p_promo)),''),
            left(case when v_n > 1 then 'Reserva de ' || v_n || ' apartamentos (' || v_base || '). ' else '' end || coalesce(p_notas,''), 1000), 'web', 'pendiente');
    v_suma := v_suma + v_alo - v_desc;
  end loop;
  return json_build_object('codigo', v_base, 'total', v_suma, 'apartamentos', v_n, 'descuento_pct', coalesce(v_pct,0));
end $$;

grant execute on function cn_apt_promo(text) to anon, authenticated;
grant execute on function cn_apt_calendario(int, date, int) to anon, authenticated;
grant execute on function cn_apt_reservar(int, date, date, int, int, text, text, text, int, int, text, int, text) to anon, authenticated;

-- el check-in de una reserva de varios apartamentos se hace con el código principal: recoge a todos los adultos del grupo
create or replace function cn_apt_checkin_ver(p_codigo text, p_email text)
returns json language sql stable security definer set search_path = public as $$
  select json_build_object('codigo', r.codigo, 'alojamiento', t.nombre || case when g.n > 1 then ' × ' || g.n else '' end, 'entrada', r.entrada, 'salida', r.salida,
                           'adultos', r.adultos, 'ninos', r.ninos, 'hecho', r.checkin_at is not null)
  from cn_apt_reservas r join cn_apt_tipos t on t.id = r.tipo_id
  cross join lateral (select count(*) n from cn_apt_reservas x where x.grupo is not null and x.grupo = r.grupo) g
  where upper(r.codigo) = upper(trim(p_codigo)) and lower(r.email) = lower(trim(p_email)) and r.estado in ('pendiente','confirmada');
$$;
