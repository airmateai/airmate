-- Ejecutar en Supabase → SQL Editor (proyecto Airmate)
-- Permite que un visitante anónimo actualice SOLO la columna "notes" de su
-- propia reserva (para marcar el justificante de pago como subido), sin darle
-- acceso a leer ni cambiar nada más de la tabla.

grant update (notes) on appointments to anon;

drop policy if exists "appointments_anon_update_notes" on appointments;
create policy "appointments_anon_update_notes" on appointments
  for update to anon using (true) with check (true);
