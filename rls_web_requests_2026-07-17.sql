-- Ejecutar en Supabase → SQL Editor (proyecto Airmate)
-- Cierra la fuga de web_requests: cualquiera con la anon key podía leer
-- nombre/telefono/email de TODOS los negocios que usan este formulario
-- (Vittorio Milano, Solarium Torrelavega, Josep Toledano, Richard...).

alter table web_requests enable row level security;
revoke all on web_requests from anon;

-- El formulario público (contacto en la web) sigue pudiendo insertar sin login
drop policy if exists "web_requests_anon_insert" on web_requests;
create policy "web_requests_anon_insert" on web_requests
  for insert to anon with check (true);

-- Autenticado: solo ve las filas de SU propio negocio (business_name = su slug),
-- salvo el owner de Airmate, que ve todo.
drop policy if exists "web_requests_auth_scoped" on web_requests;
create policy "web_requests_auth_scoped" on web_requests
  for all to authenticated
  using (
    business_name = (auth.jwt() ->> 'business_slug')
    or (auth.jwt() ->> 'business_slug') = 'airmate-owner'
  )
  with check (
    business_name = (auth.jwt() ->> 'business_slug')
    or (auth.jwt() ->> 'business_slug') = 'airmate-owner'
  );

grant select, insert, update, delete on web_requests to authenticated;
