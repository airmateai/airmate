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
