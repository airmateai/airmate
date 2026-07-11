-- Ejecutar en Supabase → SQL Editor (proyecto Airmate)
-- Cierra la fuga de datos entre clientes: cada panel ahora usa un JWT firmado
-- (via /api/panel-login) con el claim business_slug, y RLS solo deja pasar
-- filas de ese negocio. La anon key deja de tener acceso directo a estas tablas.

-- 1) bot_configs: quitar acceso a password_hash desde la anon key
--    (el login ahora pasa por /api/panel-login con la service_role key).
--    El resto de columnas (slug, bot_name, schedule, config...) se mantienen
--    legibles por anon porque el widget público (chat) las necesita sin login.
revoke select (password_hash) on bot_configs from anon;
alter table bot_configs enable row level security;
drop policy if exists "bot_configs_anon_select" on bot_configs;
create policy "bot_configs_anon_select" on bot_configs
  for select to anon using (true);
drop policy if exists "bot_configs_own_update" on bot_configs;
create policy "bot_configs_own_update" on bot_configs
  for update to authenticated
  using (slug = (auth.jwt() ->> 'business_slug'))
  with check (slug = (auth.jwt() ->> 'business_slug'));

-- 2) appointments y leads — caso especial: el widget público (chat en la web
--    del cliente) necesita seguir pudiendo INSERTAR sin login (un visitante
--    reservando cita o dejando un lead no tiene sesión). Pero SÍ hay que
--    quitarle a la anon key la lectura de columnas con datos personales:
--    solo puede leer lo necesario para calcular huecos libres (horario/estado).
alter table appointments enable row level security;
alter table leads enable row level security;

revoke select on appointments from anon;
revoke select on leads from anon;
grant select (starts_at, ends_at, status, service, business_slug) on appointments to anon;

drop policy if exists "appointments_anon_insert" on appointments;
create policy "appointments_anon_insert" on appointments for insert to anon with check (true);
drop policy if exists "appointments_anon_select_slots" on appointments;
create policy "appointments_anon_select_slots" on appointments for select to anon using (true);
drop policy if exists "appointments_tenant" on appointments;
create policy "appointments_tenant" on appointments for all to authenticated
  using (business_slug = (auth.jwt() ->> 'business_slug'))
  with check (business_slug = (auth.jwt() ->> 'business_slug'));
grant select, insert, update, delete on appointments to authenticated;

drop policy if exists "leads_anon_insert" on leads;
create policy "leads_anon_insert" on leads for insert to anon with check (true);
drop policy if exists "leads_tenant" on leads;
create policy "leads_tenant" on leads for all to authenticated
  using (business_slug = (auth.jwt() ->> 'business_slug'))
  with check (business_slug = (auth.jwt() ->> 'business_slug'));
grant select, insert, update, delete on leads to authenticated;

-- 3) ja_ventas usa "biz_slug" en vez de "business_slug" — caso aparte
alter table ja_ventas enable row level security;
revoke all on ja_ventas from anon;
grant select, insert, update, delete on ja_ventas to authenticated;
drop policy if exists "tenant_isolation_ja_ventas" on ja_ventas;
create policy "tenant_isolation_ja_ventas" on ja_ventas for all to authenticated
  using (biz_slug = (auth.jwt() ->> 'business_slug'))
  with check (biz_slug = (auth.jwt() ->> 'business_slug'));

-- 4) Resto de tablas de negocio — RLS por business_slug, sin acceso anon
do $$
declare
  t text;
  tables text[] := array[
    'crm_clients','crm_orders','crm_inventory',
    'crm_invoices','crm_corporate_groups','crm_corporate_members',
    'panel_admins','crm_inventory_movements','facturas_compra',
    'cn_alquileres','cn_alumnos','cn_clases','cn_gastos','cn_instructores',
    'cn_packs','cn_stock'
  ];
begin
  foreach t in array tables loop
    execute format('alter table %I enable row level security;', t);
    execute format('revoke all on %I from anon;', t);
    execute format('grant select, insert, update, delete on %I to authenticated;', t);
    execute format(
      'drop policy if exists "tenant_isolation_%1$s" on %1$I;', t
    );
    execute format(
      'create policy "tenant_isolation_%1$s" on %1$I for all to authenticated
         using (business_slug = (auth.jwt() ->> ''business_slug''))
         with check (business_slug = (auth.jwt() ->> ''business_slug''));',
      t
    );
  end loop;
end $$;
