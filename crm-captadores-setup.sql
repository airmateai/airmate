-- Ejecutar en Supabase → SQL Editor
-- Añade los campos nuevos usados por crm-captadores.html:
--   - canal: como se hizo el contacto (llamada fria / email)
--   - comision_pct: % de comision del captador para ese cierre (10 por defecto, editable por el jefe hasta 15)

alter table am_crm_contactos
  add column if not exists canal text default 'llamada',
  add column if not exists comision_pct numeric default 10;
