-- Costa Norte · surf camp a medida (apartamento + clases) con descuentos automáticos
-- Reglas (las cambia Costa Norte desde el panel → Apartamentos → Precios y temporadas → Descuentos):
--   · clases para alojados: −10 %
--   · alojamiento en surf camp: −5 % con 3 noches, −10 % desde 4 noches
--   · precio de la web = precio predeterminado del panel + 5 %
-- Se puede ejecutar varias veces.

create table if not exists cn_config (
  clave text primary key,
  valor jsonb not null,
  updated_at timestamptz not null default now()
);
alter table cn_config enable row level security;
revoke all on cn_config from anon;
grant select, insert, update on cn_config to authenticated;
drop policy if exists "cn_solo_costa_norte_cn_config" on cn_config;
create policy "cn_solo_costa_norte_cn_config" on cn_config for all to authenticated
  using ((auth.jwt() ->> 'business_slug') = 'costa-norte')
  with check ((auth.jwt() ->> 'business_slug') = 'costa-norte');
insert into cn_config (clave, valor) values
  ('descuentos', '{"clases_pct":10,"aloj_pct_a":5,"aloj_noches_a":3,"aloj_pct_b":10,"aloj_noches_b":4,"web_recargo_pct":5}')
on conflict (clave) do nothing;

alter table cn_apt_reservas add column if not exists clases jsonb;   -- {tipo,nivel,personas,num,precio,descuento}

-- Reglas en vigor (con valores por defecto si faltan)
create or replace function cn_descuentos() returns jsonb
language sql stable security definer set search_path = public as $$
  select '{"clases_pct":10,"aloj_pct_a":5,"aloj_noches_a":3,"aloj_pct_b":10,"aloj_noches_b":4,"web_recargo_pct":5}'::jsonb
         || coalesce((select valor from cn_config where clave = 'descuentos'), '{}'::jsonb);
$$;

-- Precio de la web = predeterminado + recargo (redondeado al euro)
create or replace function cn_apt_precio(p_tipo int, p_entrada date, p_salida date)
returns table(total numeric, estancia_min int)
language sql stable security definer set search_path = public as $$
  with noches as (select generate_series(p_entrada, p_salida - 1, interval '1 day')::date d),
  p as (
    select n.d,
      coalesce((select precio_noche from cn_apt_tarifas r where (r.tipo_id = p_tipo or r.tipo_id is null) and n.d between r.desde and r.hasta order by (r.tipo_id is null), r.id desc limit 1),
               (select precio_base from cn_apt_tipos where id = p_tipo)) precio,
      coalesce((select r.estancia_min from cn_apt_tarifas r where (r.tipo_id = p_tipo or r.tipo_id is null) and n.d between r.desde and r.hasta order by (r.tipo_id is null), r.id desc limit 1),
               (select t.estancia_min from cn_apt_tipos t where id = p_tipo)) em
    from noches n)
  select round(sum(precio) * (1 + coalesce((cn_descuentos() ->> 'web_recargo_pct')::numeric, 0) / 100))::numeric, max(em)::int from p;
$$;

-- Tarifas de las clases (las mismas que el sistema de reservas de la escuela)
create or replace function cn_clases_precio(p_tipo text, p_nivel text, p_personas int, p_num int)
returns numeric language plpgsql immutable as $$
declare n int := least(greatest(coalesce(p_num,0),0),20); per int := least(greatest(coalesce(p_personas,0),0),20);
        t int[]; v int[]; k int; best int; i int; base numeric; p4 int; marg numeric;
begin
  if n = 0 or per = 0 then return 0; end if;
  if p_tipo = 'surf' then
    if coalesce(p_nivel,'') = 'Avanzado' then t := array[1,2,3,5,7,10,15,20]; v := array[50,100,135,175,220,280,390,500];
    else return (array[35,65,85,113,140,163,185,200,215,230,242,254,266,278,290,308,326,344,362,380])[n] * per; end if;
  elsif p_tipo = 'sup' then t := array[1,5]; v := array[35,140];
  elsif p_tipo = 'particular' then
    n := least(n, 10); p4 := least(per, 6);
    if least(p4,4) = 4 then base := (array[180,340,495,648,800,948,1092,1232,1368,1500])[n];
    else
      base := case least(p4,4) when 1 then 75 when 2 then 120 else 150 end;
      if n >= 2 then base := case least(p4,4) when 1 then 145 when 2 then 230 else 270 end; end if;
      for i in 3..n loop
        marg := case least(p4,4) when 1 then (case when i >= 10 then 60 else 70 end) when 2 then 110 else 120 end;
        base := base + marg;
      end loop;
    end if;
    if p4 = 5 then base := round(base * 1.25); elsif p4 = 6 then base := round(base * 1.5); end if;
    return base;
  else return 0; end if;
  -- tramo más cercano al número de clases (como en la escuela)
  best := 1;
  for i in 1..array_length(t,1) loop if abs(t[i] - n) < abs(t[best] - n) then best := i; end if; end loop;
  return v[best] * per;
end $$;

-- Presupuesto (lo usa la web para enseñar el desglose y la reserva para cobrar lo mismo)
create or replace function cn_surfcamp_presupuesto(
  p_tipo int, p_entrada date, p_salida date, p_cantidad int default 1,
  p_clases_tipo text default null, p_clases_nivel text default null, p_clases_personas int default 0, p_clases_num int default 0,
  p_promo text default null)
returns json language plpgsql stable security definer set search_path = public as $$
declare d jsonb := cn_descuentos(); v_tot numeric; v_min int; v_n int := greatest(least(coalesce(p_cantidad,1),6),1);
        v_noches int := p_salida - p_entrada; v_alo numeric; v_pct_promo numeric := 0; v_pct_alo numeric := 0; v_pct numeric;
        v_cla numeric := 0; v_cla_desc numeric := 0; v_sc boolean;
begin
  select total, estancia_min into v_tot, v_min from cn_apt_precio(p_tipo, p_entrada, p_salida);
  v_alo := coalesce(v_tot,0) * v_n;
  if coalesce(trim(p_promo),'') <> '' then
    select coalesce(descuento_pct,0) into v_pct_promo from cn_apt_codigos where upper(codigo) = upper(trim(p_promo)) and activo;
  end if;
  v_sc := coalesce(p_clases_tipo,'') in ('surf','sup','particular') and coalesce(p_clases_num,0) > 0 and coalesce(p_clases_personas,0) > 0;
  if v_sc then
    v_cla := cn_clases_precio(p_clases_tipo, p_clases_nivel, p_clases_personas, p_clases_num);
    v_cla_desc := round(v_cla * coalesce((d->>'clases_pct')::numeric,0) / 100, 2);
    if v_noches >= coalesce((d->>'aloj_noches_b')::int, 4) then v_pct_alo := coalesce((d->>'aloj_pct_b')::numeric,0);
    elsif v_noches >= coalesce((d->>'aloj_noches_a')::int, 3) then v_pct_alo := coalesce((d->>'aloj_pct_a')::numeric,0); end if;
  end if;
  v_pct := greatest(coalesce(v_pct_promo,0), v_pct_alo);   -- no se suman: se aplica el mayor
  return json_build_object(
    'noches', v_noches, 'estancia_min', v_min, 'alojamiento', v_alo,
    'aloj_pct', v_pct, 'aloj_desc', round(v_alo * v_pct / 100, 2), 'aloj_por', case when v_pct = 0 then null when v_pct_alo >= coalesce(v_pct_promo,0) then 'surfcamp' else 'codigo' end,
    'clases', v_cla, 'clases_pct', case when v_sc then coalesce((d->>'clases_pct')::numeric,0) else 0 end, 'clases_desc', v_cla_desc,
    'total', v_alo - round(v_alo * v_pct / 100, 2) + v_cla - v_cla_desc, 'surfcamp', v_sc);
end $$;

-- Reservar (añade las clases del surf camp; el precio lo calcula el servidor)
drop function if exists cn_apt_reservar(int, date, date, int, int, text, text, text, int, int, text, int, text);
create or replace function cn_apt_reservar(
  p_tipo int, p_entrada date, p_salida date, p_adultos int, p_ninos int,
  p_nombre text, p_email text, p_telefono text, p_pack int default null, p_pack_personas int default 0,
  p_notas text default null, p_cantidad int default 1, p_promo text default null,
  p_clases_tipo text default null, p_clases_nivel text default null, p_clases_personas int default 0, p_clases_num int default 0)
returns json language plpgsql security definer set search_path = public as $$
declare v_cap int; v_min int; v_base text; v_cod text; v_pre json; v_pack numeric := 0;
        v_uds int[]; v_n int := greatest(least(coalesce(p_cantidad,1), 6), 1); v_tot1 numeric; v_desc1 numeric; v_suma numeric := 0; i int;
        v_sc boolean; v_cla jsonb; v_pers int := p_adultos + coalesce(p_ninos,0);
begin
  if p_entrada < current_date or p_salida <= p_entrada or (p_salida - p_entrada) > 30 then raise exception 'Fechas no válidas'; end if;
  if coalesce(trim(p_nombre),'') = '' or coalesce(trim(p_email),'') !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then raise exception 'Faltan nombre o email'; end if;
  select capacidad into v_cap from cn_apt_tipos where id = p_tipo and activo;
  if v_cap is null then raise exception 'Alojamiento no disponible'; end if;
  if p_adultos < 1 or v_pers > v_cap * v_n then raise exception 'Demasiadas personas para % apartamento(s)', v_n; end if;
  if coalesce(p_clases_num,0) > 0 then
    if p_clases_tipo not in ('surf','sup','particular') then raise exception 'Tipo de clase no válido'; end if;
    if p_clases_personas < 1 or p_clases_personas > v_pers then raise exception 'Revisa cuántas personas hacen clase'; end if;
    if p_clases_num > least(20, greatest((p_salida - p_entrada) * 2, 1)) then raise exception 'Demasiadas clases para esos días'; end if;
  end if;
  if coalesce(trim(p_promo),'') <> '' and not exists (select 1 from cn_apt_codigos where upper(codigo) = upper(trim(p_promo)) and activo) then
    raise exception 'El código de descuento no es válido';
  end if;
  v_pre := cn_surfcamp_presupuesto(p_tipo, p_entrada, p_salida, v_n, p_clases_tipo, p_clases_nivel, p_clases_personas, p_clases_num, p_promo);
  v_min := (v_pre->>'estancia_min')::int;
  if (p_salida - p_entrada) < v_min then raise exception 'La estancia mínima en esas fechas es de % noches', v_min; end if;
  v_sc := (v_pre->>'surfcamp')::boolean;
  perform pg_advisory_xact_lock(hashtext('cn_apt_' || p_tipo));
  select array_agg(id) into v_uds from (
    select u.id from cn_apt_unidades u where u.tipo_id = p_tipo and u.activo
      and not exists (select 1 from cn_apt_reservas r where r.unidad_id = u.id and r.estado <> 'cancelada' and r.entrada < p_salida and r.salida > p_entrada)
    order by u.id limit v_n) x;
  if coalesce(array_length(v_uds,1),0) < v_n then raise exception 'Solo quedan % libres en esas fechas', coalesce(array_length(v_uds,1),0); end if;
  if not v_sc and p_pack is not null and coalesce(p_pack_personas,0) > 0 then
    select precio_persona * least(p_pack_personas, v_pers) into v_pack from cn_apt_packs where id = p_pack and activo;
  end if;
  if v_sc then
    v_cla := jsonb_build_object('tipo', p_clases_tipo, 'nivel', p_clases_nivel, 'personas', p_clases_personas, 'num', p_clases_num,
                                'precio', (v_pre->>'clases')::numeric, 'descuento', (v_pre->>'clases_desc')::numeric);
  end if;
  v_base := 'CN-' || upper(substr(md5(random()::text), 1, 6));
  for i in 1..v_n loop
    v_cod := case when i = 1 then v_base else v_base || '-' || i end;
    v_desc1 := round((v_pre->>'aloj_desc')::numeric / v_n, 2);
    v_tot1 := (v_pre->>'alojamiento')::numeric / v_n - v_desc1
              + case when i = 1 then coalesce(v_pack,0) + coalesce((v_pre->>'clases')::numeric - (v_pre->>'clases_desc')::numeric, 0) else 0 end;
    insert into cn_apt_reservas (codigo, grupo, tipo_id, unidad_id, entrada, salida, adultos, ninos, nombre, email, telefono, pack_id, pack_personas,
                                 total, descuento, codigo_promo, notas, origen, estado, clases)
    values (v_cod, case when v_n > 1 then v_base end, p_tipo, v_uds[i], p_entrada, p_salida,
            case when i = 1 then p_adultos else 0 end, case when i = 1 then coalesce(p_ninos,0) else 0 end,
            trim(p_nombre), lower(trim(p_email)), trim(p_telefono),
            case when i = 1 and v_pack > 0 then p_pack end, case when i = 1 and v_pack > 0 then p_pack_personas else 0 end,
            v_tot1, v_desc1 + case when i = 1 and v_sc then (v_pre->>'clases_desc')::numeric else 0 end,
            case when (v_pre->>'aloj_por') = 'codigo' then nullif(upper(trim(p_promo)),'') end,
            left(case when v_sc and i = 1 then 'SURF CAMP. ' else '' end || case when v_n > 1 then 'Reserva de ' || v_n || ' apartamentos (' || v_base || '). ' else '' end || coalesce(p_notas,''), 1000),
            'web', 'pendiente', case when i = 1 then v_cla end);
    v_suma := v_suma + v_tot1;
  end loop;
  return json_build_object('codigo', v_base, 'total', v_suma, 'apartamentos', v_n, 'descuento_pct', (v_pre->>'aloj_pct')::numeric, 'surfcamp', v_sc);
end $$;

revoke all on function cn_descuentos() from public;
grant execute on function cn_descuentos() to anon, authenticated;
grant execute on function cn_clases_precio(text, text, int, int) to anon, authenticated;
grant execute on function cn_surfcamp_presupuesto(int, date, date, int, text, text, int, int, text) to anon, authenticated;
grant execute on function cn_apt_reservar(int, date, date, int, int, text, text, text, int, int, text, int, text, text, text, int, int) to anon, authenticated;
