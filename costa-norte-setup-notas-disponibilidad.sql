-- Ejecutar en Supabase → SQL Editor (una sola vez)
-- Tabla para anotar el motivo cuando un monitor no puede un día concreto
-- (ej. "Enara no puede por la mañana, tiene médico"). Es solo informativa,
-- no afecta a la disponibilidad real (eso lo sigue marcando el checkbox).

create table if not exists cn_notas_disponibilidad (
  id uuid primary key default gen_random_uuid(),
  business_slug text not null default 'costa-norte',
  fecha date not null,
  monitor text not null,
  nota text,
  created_at timestamptz default now(),
  unique(business_slug, fecha, monitor)
);

alter table cn_notas_disponibilidad enable row level security;
create policy "allow all costa-norte notas" on cn_notas_disponibilidad for all using (true) with check (true);
