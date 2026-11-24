-- Costa Norte · reservas propias de apartamentos y surf camp Costa Verde
-- Ejecutar UNA vez en Supabase → SQL Editor (proyecto Airmate). Se puede repetir sin romper nada.
--
-- Seguridad:
--  · Las tablas solo las ve el panel de Costa Norte (JWT con business_slug = 'costa-norte').
--  · La web pública (anon) NO lee ninguna tabla: solo llama a 4 funciones
--    (disponibilidad, reservar, ver check-in y guardar check-in), que no devuelven datos de otros huéspedes.

-- ───────── TABLAS ─────────
create table if not exists cn_apt_tipos (
  id int primary key,                 -- mismo id que tenía en Avirato
  nombre text not null,
  capacidad int not null default 4,
  descripcion text,
  precio_base numeric(8,2) not null default 85,   -- precio por noche si no hay tarifa para esa fecha
  estancia_min int not null default 1,
  orden int not null default 0,
  activo boolean not null default true
);

create table if not exists cn_apt_unidades (
  id serial primary key,
  tipo_id int not null references cn_apt_tipos(id),
  nombre text not null,
  activo boolean not null default true
);

create table if not exists cn_apt_tarifas (
  id serial primary key,
  tipo_id int references cn_apt_tipos(id),        -- null = vale para todos los tipos
  nombre text,
  desde date not null,
  hasta date not null,                            -- incluida
  precio_noche numeric(8,2) not null,
  estancia_min int not null default 1
);

create table if not exists cn_apt_packs (
  id serial primary key,
  nombre text not null,
  descripcion text,
  precio_persona numeric(8,2) not null,
  activo boolean not null default true
);

create table if not exists cn_apt_reservas (
  id uuid primary key default gen_random_uuid(),
  codigo text unique not null default ('CN-' || upper(substr(md5(random()::text), 1, 6))),
  tipo_id int not null references cn_apt_tipos(id),
  unidad_id int references cn_apt_unidades(id),
  entrada date not null,
  salida date not null,
  adultos int not null default 2,
  ninos int not null default 0,
  nombre text,
  email text,
  telefono text,
  pack_id int references cn_apt_packs(id),
  pack_personas int not null default 0,
  total numeric(10,2) not null default 0,
  pagado numeric(10,2) not null default 0,
  estado text not null default 'pendiente' check (estado in ('pendiente','confirmada','cancelada','bloqueo')),
  origen text not null default 'web' check (origen in ('web','telefono','whatsapp','booking','airbnb','avirato','otro')),
  notas text,
  checkin jsonb,
  checkin_at timestamptz,
  created_at timestamptz not null default now(),
  check (salida > entrada)
);
create index if not exists cn_apt_reservas_fechas on cn_apt_reservas (entrada, salida);

create table if not exists cn_camp_inscritos (
  id uuid primary key default gen_random_uuid(),
  camp text not null default 'costa-verde',
  semana text,                 -- p. ej. «28 jun – 5 jul 2026»
  nombre text not null,
  edad int,
  nivel text,                  -- nunca / alguna vez / se pone de pie / ya surfea
  alergias text,
  tutor text,
  telefono text,
  notas text,
  created_at timestamptz not null default now()
);

-- ───────── SEGURIDAD ─────────
do $$
declare t text;
begin
  foreach t in array array['cn_apt_tipos','cn_apt_unidades','cn_apt_tarifas','cn_apt_packs','cn_apt_reservas','cn_camp_inscritos'] loop
    execute format('alter table %I enable row level security;', t);
    execute format('revoke all on %I from anon;', t);
    execute format('grant select, insert, update, delete on %I to authenticated;', t);
    execute format('drop policy if exists "cn_solo_costa_norte_%1$s" on %1$I;', t);
    execute format('create policy "cn_solo_costa_norte_%1$s" on %1$I for all to authenticated
                      using ((auth.jwt() ->> ''business_slug'') = ''costa-norte'')
                      with check ((auth.jwt() ->> ''business_slug'') = ''costa-norte'');', t);
  end loop;
end $$;
grant usage, select on sequence cn_apt_unidades_id_seq, cn_apt_tarifas_id_seq, cn_apt_packs_id_seq to authenticated;

-- ───────── DATOS INICIALES (sacados de Avirato el 24-nov-2026) ─────────
insert into cn_apt_tipos (id, nombre, capacidad, precio_base, orden, descripcion) values
 (36, 'Bajo con terraza',            4,  85, 1, 'Planta baja con terraza privada, salón con sofá cama, dormitorio y cocina equipada.'),
 (39, 'Bajo',                        4,  85, 2, 'Planta baja amplia: salón comedor con sofá cama, dormitorio y cocina equipada.'),
 (44, 'Apartamento de 1 dormitorio', 4,  85, 3, 'Salón, dormitorio independiente, baño con ducha y cocina completa.'),
 (47, 'Apartamento estándar',        3,  85, 4, 'Dormitorio independiente, salón y cocina equipada. Hasta 3 personas.'),
 (31, 'Apartamento con terraza',     4,  85, 5, 'Planta baja con terraza privada, dormitorio con cama de matrimonio y sofá cama.'),
 (34, 'Apartamento planta baja',     5,  95, 6, 'Planta baja luminosa con terraza, dormitorio y salón con sofá cama.'),
 (28, 'Piso',                        2,  85, 7, 'Para dos: dormitorio con cama de matrimonio, salón y baño con bañera.'),
 (46, 'Loft',                        4,  55, 8, 'Planta abierta con literas, cocina y baño. Ideal para grupos y surf camps.'),
 (48, 'Estudio',                     4,  55, 9, 'Estudio con literas, sofá y cocina. Ideal para grupos y surf camps.')
on conflict (id) do nothing;

insert into cn_apt_unidades (tipo_id, nombre)
select t.tipo_id, t.nombre from (values
 (36,'Bajo terraza 1'),(36,'Bajo terraza 2'),(36,'Bajo terraza 3'),(36,'Bajo terraza 4'),(36,'Bajo terraza 5'),(36,'Bajo terraza 6'),
 (39,'Bajo 1'),(39,'Bajo 2'),
 (44,'1 dormitorio A'),(44,'1 dormitorio B'),(44,'1 dormitorio C'),
 (47,'Estándar'),
 (31,'Terraza 1'),(31,'Terraza 2'),
 (34,'Planta baja'),
 (28,'Piso'),
 (46,'Loft 1'),(46,'Loft 2'),
 (48,'Estudio 1'),(48,'Estudio 2')
) as t(tipo_id, nombre)
where not exists (select 1 from cn_apt_unidades);

-- Verano 2027 con los precios que tenía Avirato (revisar en el panel → Apartamentos → Tarifas)
insert into cn_apt_tarifas (tipo_id, nombre, desde, hasta, precio_noche, estancia_min)
select t.* from (values
 (36,'Verano 2027','2027-07-01'::date,'2027-08-31'::date,200::numeric,3),
 (39,'Verano 2027','2027-07-01','2027-08-31',200,3),
 (44,'Verano 2027','2027-07-01','2027-08-31',250,3),
 (47,'Verano 2027','2027-07-01','2027-08-31',250,3),
 (31,'Verano 2027','2027-07-01','2027-08-31',200,3),
 (34,'Verano 2027','2027-07-01','2027-08-31',250,3),
 (28,'Verano 2027','2027-07-01','2027-08-31',260,3),
 (46,'Verano 2027','2027-07-01','2027-08-31',200,3),
 (48,'Verano 2027','2027-07-01','2027-08-31',200,3)
) as t(tipo_id, nombre, desde, hasta, precio_noche, estancia_min)
where not exists (select 1 from cn_apt_tarifas);

insert into cn_apt_packs (nombre, descripcion, precio_persona)
select * from (values
 ('Surf Camp 2 días', 'Dos días de clases de surf, 2 horas al día, con todo el material.', 190::numeric),
 ('Extreme 2 días',   'Dos días de clases de surf, 4 horas al día, con todo el material.', 240),
 ('Rip Curl 2 días',  'Dos días de surf 4 horas al día, surfskate, grabación y vídeo-corrección.', 260)
) as p(nombre, descripcion, precio_persona)
where not exists (select 1 from cn_apt_packs);

-- ───────── FUNCIONES PÚBLICAS (las usa la web) ─────────
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
  select sum(precio)::numeric, max(em)::int from p;
$$;

create or replace function cn_apt_disponibilidad(p_entrada date, p_salida date, p_personas int default 1)
returns table(tipo_id int, nombre text, capacidad int, libres int, noches int, total numeric, estancia_min int)
language sql stable security definer set search_path = public as $$
  select t.id, t.nombre, t.capacidad,
    (select count(*) from cn_apt_unidades u where u.tipo_id = t.id and u.activo
       and not exists (select 1 from cn_apt_reservas r where r.unidad_id = u.id and r.estado <> 'cancelada'
                       and r.entrada < p_salida and r.salida > p_entrada))::int,
    (p_salida - p_entrada)::int, pr.total, pr.estancia_min
  from cn_apt_tipos t cross join lateral cn_apt_precio(t.id, p_entrada, p_salida) pr
  where t.activo and t.capacidad >= p_personas and p_salida > p_entrada and p_entrada >= current_date and (p_salida - p_entrada) <= 30
  order by t.orden;
$$;

create or replace function cn_apt_reservar(
  p_tipo int, p_entrada date, p_salida date, p_adultos int, p_ninos int,
  p_nombre text, p_email text, p_telefono text, p_pack int default null, p_pack_personas int default 0, p_notas text default null)
returns json language plpgsql security definer set search_path = public as $$
declare v_unidad int; v_total numeric; v_min int; v_pack numeric := 0; v_cap int; v_codigo text;
begin
  if p_entrada < current_date or p_salida <= p_entrada or (p_salida - p_entrada) > 30 then raise exception 'Fechas no válidas'; end if;
  if coalesce(trim(p_nombre),'') = '' or coalesce(trim(p_email),'') !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then raise exception 'Faltan nombre o email'; end if;
  select capacidad into v_cap from cn_apt_tipos where id = p_tipo and activo;
  if v_cap is null then raise exception 'Alojamiento no disponible'; end if;
  if p_adultos < 1 or p_adultos + coalesce(p_ninos,0) > v_cap then raise exception 'Demasiadas personas para este alojamiento'; end if;
  select total, estancia_min into v_total, v_min from cn_apt_precio(p_tipo, p_entrada, p_salida);
  if (p_salida - p_entrada) < v_min then raise exception 'La estancia mínima en esas fechas es de % noches', v_min; end if;
  perform pg_advisory_xact_lock(hashtext('cn_apt_' || p_tipo));
  select u.id into v_unidad from cn_apt_unidades u
   where u.tipo_id = p_tipo and u.activo
     and not exists (select 1 from cn_apt_reservas r where r.unidad_id = u.id and r.estado <> 'cancelada' and r.entrada < p_salida and r.salida > p_entrada)
   order by u.id limit 1;
  if v_unidad is null then raise exception 'Ya no queda libre en esas fechas'; end if;
  if p_pack is not null and coalesce(p_pack_personas,0) > 0 then
    select precio_persona * least(p_pack_personas, p_adultos + coalesce(p_ninos,0)) into v_pack from cn_apt_packs where id = p_pack and activo;
  end if;
  insert into cn_apt_reservas (tipo_id, unidad_id, entrada, salida, adultos, ninos, nombre, email, telefono, pack_id, pack_personas, total, notas, origen, estado)
  values (p_tipo, v_unidad, p_entrada, p_salida, p_adultos, coalesce(p_ninos,0), trim(p_nombre), lower(trim(p_email)), trim(p_telefono),
          case when v_pack > 0 then p_pack end, case when v_pack > 0 then p_pack_personas else 0 end,
          v_total + coalesce(v_pack,0), left(p_notas, 1000), 'web', 'pendiente')
  returning codigo into v_codigo;
  return json_build_object('codigo', v_codigo, 'total', v_total + coalesce(v_pack,0));
end $$;

create or replace function cn_apt_checkin_ver(p_codigo text, p_email text)
returns json language sql stable security definer set search_path = public as $$
  select json_build_object('codigo', r.codigo, 'alojamiento', t.nombre, 'entrada', r.entrada, 'salida', r.salida,
                           'adultos', r.adultos, 'ninos', r.ninos, 'hecho', r.checkin_at is not null)
  from cn_apt_reservas r join cn_apt_tipos t on t.id = r.tipo_id
  where upper(r.codigo) = upper(trim(p_codigo)) and lower(r.email) = lower(trim(p_email)) and r.estado in ('pendiente','confirmada');
$$;

create or replace function cn_apt_checkin_guardar(p_codigo text, p_email text, p_huespedes jsonb)
returns boolean language plpgsql security definer set search_path = public as $$
begin
  if jsonb_typeof(p_huespedes) <> 'array' or jsonb_array_length(p_huespedes) = 0 or jsonb_array_length(p_huespedes) > 8 then raise exception 'Datos no válidos'; end if;
  update cn_apt_reservas set checkin = p_huespedes, checkin_at = now()
   where upper(codigo) = upper(trim(p_codigo)) and lower(email) = lower(trim(p_email)) and estado in ('pendiente','confirmada');
  return found;
end $$;

revoke all on function cn_apt_precio(int, date, date) from public;
grant execute on function cn_apt_disponibilidad(date, date, int) to anon, authenticated;
grant execute on function cn_apt_reservar(int, date, date, int, int, text, text, text, int, int, text) to anon, authenticated;
grant execute on function cn_apt_checkin_ver(text, text) to anon, authenticated;
grant execute on function cn_apt_checkin_guardar(text, text, jsonb) to anon, authenticated;
grant execute on function cn_apt_precio(int, date, date) to authenticated;

create or replace function cn_apt_packs_publicos()
returns table(id int, nombre text, descripcion text, precio_persona numeric)
language sql stable security definer set search_path = public as $$
  select id, nombre, descripcion, precio_persona from cn_apt_packs where activo order by precio_persona;
$$;
grant execute on function cn_apt_packs_publicos() to anon, authenticated;

-- ───────── PAGO POR TRANSFERENCIA + JUSTIFICANTE (mismo sistema que las clases, sin Stripe) ─────────
alter table cn_apt_reservas add column if not exists justificante_url text;
alter table cn_apt_reservas add column if not exists pago_estado text not null default 'sin_pagar';

create or replace function cn_apt_vincular_justificante(p_codigo text, p_email text, p_url text)
returns boolean language plpgsql security definer set search_path = public as $$
begin
  if p_url !~ '^https://vjofxmfwdybktpwiuanc\.supabase\.co/storage/v1/object/public/JUSTIFICANTES/costa-norte/apt-' then raise exception 'Archivo no válido'; end if;
  update cn_apt_reservas set justificante_url = p_url, pago_estado = 'justificante'
   where upper(codigo) = upper(trim(p_codigo)) and lower(email) = lower(trim(p_email)) and estado in ('pendiente','confirmada');
  return found;
end $$;
grant execute on function cn_apt_vincular_justificante(text, text, text) to anon, authenticated;
