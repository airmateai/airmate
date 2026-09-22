-- Crea la tabla que falta para "Recepción de Stock" en el panel de Jose Acosta.
-- Sin esto, el historial se queda cargando para siempre y las recepciones
-- (foto de albarán o entrada manual) no se guardan nunca.
-- Ejecutar en el SQL Editor de Supabase antes de usar la sección.

create table if not exists stock_recepciones (
  id uuid primary key default gen_random_uuid(),
  business_slug text not null,
  proveedor text,
  fecha_albaran date,
  numero_albaran text,
  lineas jsonb not null default '[]'::jsonb,
  tiene_imagen boolean default false,
  updated_en_holded integer default 0,
  created_at timestamptz not null default now()
);

alter table stock_recepciones enable row level security;

drop policy if exists "stock_recepciones_anon_all" on stock_recepciones;
create policy "stock_recepciones_anon_all" on stock_recepciones
  for all using (true) with check (true);

-- El gotcha real: una policy permisiva no basta si al rol anon le falta el GRANT.
grant select, insert, update, delete on stock_recepciones to anon;
