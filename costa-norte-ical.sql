-- Costa Norte · calendarios de Booking, Airbnb y Expedia sincronizados con el panel (iCal)
-- Entra: lo ocupado en cada plataforma aparece en el panel como «Ocupado en Booking/Airbnb/Expedia»
--        y la web ya no deja reservar esas noches.
-- Sale:  cada apartamento tiene su enlace de calendario para pegarlo en Booking/Airbnb/Expedia,
--        así lo reservado en la web o a mano se cierra allí.
-- La sincronización la hace https://airmate-phi.vercel.app/api/cn-ical cada 15 minutos (pg_cron).
-- Se puede ejecutar varias veces.

-- Expedia como origen
alter table cn_apt_reservas drop constraint if exists cn_apt_reservas_origen_check;
alter table cn_apt_reservas add constraint cn_apt_reservas_origen_check
  check (origen in ('web','telefono','whatsapp','booking','airbnb','expedia','avirato','otro'));

-- Reservas que vienen de un calendario externo
alter table cn_apt_reservas add column if not exists ext_uid text;
alter table cn_apt_reservas add column if not exists ext_url text;      -- enlace a la reserva en la plataforma (Airbnb lo da)
do $$ begin
  alter table cn_apt_reservas add constraint cn_apt_reservas_ext unique (unidad_id, origen, ext_uid);
exception when duplicate_object or duplicate_table then null; end $$;

-- Enlace secreto de cada apartamento para que las plataformas lean su calendario
alter table cn_apt_unidades add column if not exists ical_token text;
update cn_apt_unidades set ical_token = replace(gen_random_uuid()::text, '-', '') where ical_token is null;
alter table cn_apt_unidades alter column ical_token set default replace(gen_random_uuid()::text, '-', '');

-- Enlaces de calendario de cada plataforma, por apartamento
create table if not exists cn_apt_ical (
  id serial primary key,
  unidad_id int not null references cn_apt_unidades(id) on delete cascade,
  plataforma text not null check (plataforma in ('booking','airbnb','expedia')),
  url text not null check (url ~* '^https://'),
  activo boolean not null default true,
  ultima_sync timestamptz,
  ultimo_error text,
  eventos int,
  created_at timestamptz not null default now(),
  unique (unidad_id, plataforma)
);
alter table cn_apt_ical enable row level security;
revoke all on cn_apt_ical from anon;
grant select, insert, update, delete on cn_apt_ical to authenticated;
grant usage, select on sequence cn_apt_ical_id_seq to authenticated;
drop policy if exists "cn_solo_costa_norte_cn_apt_ical" on cn_apt_ical;
create policy "cn_solo_costa_norte_cn_apt_ical" on cn_apt_ical for all to authenticated
  using ((auth.jwt() ->> 'business_slug') = 'costa-norte')
  with check ((auth.jwt() ->> 'business_slug') = 'costa-norte');

-- Sincronizar cada 15 minutos (llama a la función de Airmate; no lleva datos ni claves)
create extension if not exists pg_cron;
create extension if not exists pg_net;
do $$ begin
  perform cron.unschedule('cn-ical-sync');
exception when others then null; end $$;
select cron.schedule('cn-ical-sync', '*/15 * * * *',
  $$ select net.http_post(url := 'https://airmate-phi.vercel.app/api/cn-ical', body := '{"accion":"sync"}'::jsonb, headers := '{"Content-Type":"application/json"}'::jsonb) $$);
