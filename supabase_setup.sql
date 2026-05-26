-- Ejecutar en Supabase > SQL Editor

-- Tabla para pendientes de envío de link de mensualidad tras setup
CREATE TABLE IF NOT EXISTS pending_maintenance (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  email text NOT NULL,
  plan text NOT NULL,
  maintenance_link text NOT NULL,
  created_at timestamptz DEFAULT now(),
  sent boolean DEFAULT false
);

-- Index para búsquedas por email
CREATE INDEX IF NOT EXISTS pending_maintenance_email_idx ON pending_maintenance(email);

-- Tabla para persistencia cross-device de la agenda del owner
CREATE TABLE IF NOT EXISTS owner_data (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  updated_at timestamptz DEFAULT now()
);

-- Permitir acceso con service role (solo servidor/webhook) y anon con RLS
ALTER TABLE owner_data ENABLE ROW LEVEL SECURITY;

-- Solo lectura/escritura desde service role (el front usa la anon key pero con política abierta
-- porque es datos internos del owner — no hay datos de clientes aquí)
CREATE POLICY "owner_data_open" ON owner_data
  FOR ALL USING (true) WITH CHECK (true);
