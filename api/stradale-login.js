import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const SB_URL = process.env.SUPABASE_URL;
const SB_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZqb2Z4bWZ3ZHlia3Rwd2l1YW5jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ0NzU5NDYsImV4cCI6MjA5MDA1MTk0Nn0.ixU-33c0FEkO7F5xjWb3YHkvj_pQuR0gsJETrGA8ZTE';
// Usuario "vehículo" único para Stradale (single-tenant: cualquier empleado
// válido puede entrar, no hace falta un claim por persona) que genera la
// sesión real de Supabase Auth. No es la contraseña de ningún empleado.
const INTERNAL_PASSWORD = 'Airmate!Internal-Stradale-2026-qN7vXe2pLk';

const admin = createClient(SB_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function sha256Hex(str) {
  return crypto.createHash('sha256').update(str).digest('hex');
}

async function ensureAuthUser() {
  const email = 'panel+stradale-interno@internal.airmate.es';
  const { error: createErr } = await admin.auth.admin.createUser({
    email,
    password: INTERNAL_PASSWORD,
    email_confirm: true,
    user_metadata: { business_slug: 'stradale-interno' },
  });
  if (!createErr) return email;
  if (createErr.message && /already been registered|already exists/i.test(createErr.message)) {
    return email;
  }
  throw createErr;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });

  const { usuario, password } = req.body || {};
  if (!usuario || !password) return res.status(400).json({ error: 'usuario y password requeridos' });

  const { data: emp, error } = await admin
    .from('stradale_empleados')
    .select('id,nombre,usuario,password_hash,activo')
    .eq('usuario', usuario)
    .maybeSingle();

  if (error || !emp || !emp.activo) {
    return res.status(401).json({ error: 'Usuario no encontrado' });
  }

  const hash = await sha256Hex(password);
  if (hash !== emp.password_hash) {
    return res.status(401).json({ error: 'Contraseña incorrecta' });
  }

  try {
    const email = await ensureAuthUser();
    const authClient = createClient(SB_URL, SB_ANON_KEY);
    const { data: session, error: signInErr } = await authClient.auth.signInWithPassword({
      email,
      password: INTERNAL_PASSWORD,
    });
    if (signInErr || !session?.session) {
      return res.status(500).json({ error: 'No se pudo generar la sesión' });
    }
    return res.status(200).json({
      token: session.session.access_token,
      refresh_token: session.session.refresh_token,
      nombre: emp.nombre,
      usuario: emp.usuario,
    });
  } catch (e) {
    return res.status(500).json({ error: 'Error interno: ' + (e.message || e) });
  }
}
