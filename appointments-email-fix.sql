-- Arregla "Error al guardar" en el formulario de reservas de Jose Acosta
-- (reservas-jose-acosta.html). La tabla appointments tenía nombre, apellido,
-- telefono, fecha_cita, hora_cita, confirm_code... pero le faltaban columnas
-- que el formulario también intenta guardar. Sin ellas, Supabase rechaza el
-- insert entero (PGRST204) y no se guarda ninguna reserva.

alter table appointments add column if not exists email text;
alter table appointments add column if not exists notas text;
