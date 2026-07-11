import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function base64url(input) {
  return Buffer.from(input).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function signJwt(payload, secret) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const encHeader = base64url(JSON.stringify(header));
  const encPayload = base64url(JSON.stringify(payload));
  const data = `${encHeader}.${encPayload}`;
  const sig = crypto.createHmac('sha256', secret).update(data).digest('base64')
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return `${data}.${sig}`;
}

async function sha256Hex(str) {
  return crypto.createHash('sha256').update(str).digest('hex');
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });

  const { slug, password } = req.body || {};
  if (!slug) return res.status(400).json({ error: 'slug requerido' });

  const { data: cfg, error } = await supabase
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

  const now = Math.floor(Date.now() / 1000);
  const payload = {
    role: 'authenticated',
    business_slug: slug,
    sub: slug,
    iss: 'supabase',
    iat: now,
    exp: now + 60 * 60 * 24 * 30, // 30 días
  };
  const token = signJwt(payload, process.env.SUPABASE_JWT_SECRET);

  return res.status(200).json({ token, business_slug: cfg.slug, bot_name: cfg.bot_name });
}
