-- Arregla "Error al guardar" en el formulario de reservas de Jose Acosta
-- (reservas-jose-acosta.html).
--
-- La tabla appointments se creó originalmente para el widget genérico de
-- Airmate (columnas client_name, client_phone, client_email, service,
-- duration_minutes... todas NOT NULL). El formulario de Jose usa su propio
-- esquema (nombre, apellido, telefono, email, service_type...) y no rellena
-- esas columnas legacy, así que Postgres rechazaba el insert por violar los
-- NOT NULL. Las dejamos opcionales para que convivan los dos esquemas.

alter table appointments add column if not exists email text;
alter table appointments add column if not exists notas text;

alter table appointments alter column client_name drop not null;
alter table appointments alter column service drop not null;
alter table appointments alter column duration_minutes drop not null;
alter table appointments alter column starts_at drop not null;
alter table appointments alter column ends_at drop not null;
