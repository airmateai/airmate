-- Arregla "Error al guardar" en el formulario de reservas de Jose Acosta
-- (reservas-jose-acosta.html). La tabla appointments tiene nombre, apellido,
-- telefono, fecha_cita, hora_cita, confirm_code... pero le falta la columna
-- email que el formulario también intenta guardar. Sin ella, Supabase
-- rechaza el insert entero (PGRST204) y no se guarda ninguna reserva.

alter table appointments add column if not exists email text;
