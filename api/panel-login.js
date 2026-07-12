import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const SB_URL = process.env.SUPABASE_URL;
const SB_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZqb2Z4bWZ3ZHlia3Rwd2l1YW5jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ0NzU5NDYsImV4cCI6MjA5MDA1MTk0Nn0.ixU-33c0FEkO7F5xjWb3YHkvj_pQuR0gsJETrGA8ZTE';
// Contraseña interna fija para los usuarios "vehículo" que generan la sesión real
// de Supabase Auth (no es la contraseña del negocio — esa ya se valida arriba
// contra bot_configs.password_hash antes de llegar aquí).
const INTERNAL_PASSWORD = 'Airmate!Internal-2026-fXk9qLp3zVwR8mNc';

const admin = createClient(SB_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function sha256Hex(str) {
  return crypto.createHash('sha256').update(str).digest('hex');
}

async function ensureAuthUser(slug) {
  const email = `panel+${slug}@internal.airmate.es`;
  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email,
    password: INTERNAL_PASSWORD,
    email_confirm: true,
    user_metadata: { business_slug: slug },
  });
  if (!createErr) return email;
  // Ya existía — seguimos, el login normal se encarga de autenticar
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

  const { slug, password } = req.body || {};
  if (!slug) return res.status(400).json({ error: 'slug requerido' });

  const { data: cfg, error } = await admin
    .from('bot_configs')
    .select('slug,bot_name,password_hash')
    .eq('slug', slug)
    .maybeSingle();

  if (error || !cfg) {
    return res.status(404).json({ error: 'Negocio no encontrado' });
  }

  if (cfg.password_hash) {
    if (!password) return res.status(401).json({ error: 'Introduce la contraseña' });
    const hash = await sha256Hex(password);
    if (hash !== cfg.password_hash) {
      return res.status(401).json({ error: 'Contraseña incorrecta' });
    }
  }

  try {
    const email = await ensureAuthUser(slug);
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
      business_slug: cfg.slug,
      bot_name: cfg.bot_name,
    });
  } catch (e) {
    return res.status(500).json({ error: 'Error interno: ' + (e.message || e) });
  }
}
