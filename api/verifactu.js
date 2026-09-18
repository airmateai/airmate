// Proxy hacia Invocash (Verifactu). Guarda el email/contraseña de la cuenta de
// Invocash como variables de entorno en Vercel (INVOCASH_EMAIL, INVOCASH_PASSWORD)
// — nunca en el código ni en el panel del cliente. Este endpoint hace login por
// su cuenta, cachea el token en memoria mientras el proceso siga vivo, y lo
// renueva solo cuando caduca.

const INVOCASH_BASE = 'https://app.verifactuapi.es/api';

let _tokenCache = { token: null, expiresAt: 0 };

async function getToken() {
  if (_tokenCache.token && Date.now() < _tokenCache.expiresAt) return _tokenCache.token;

  const email = process.env.INVOCASH_EMAIL;
  const password = process.env.INVOCASH_PASSWORD;
  if (!email || !password) throw new Error('Faltan INVOCASH_EMAIL / INVOCASH_PASSWORD en Vercel');

  const r = await fetch(`${INVOCASH_BASE}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await r.json();
  if (!data.success || !data.token) throw new Error('Login Invocash falló: ' + JSON.stringify(data));

  _tokenCache.token = data.token;
  // Si viene expires_at lo respetamos (con 5 min de margen); si no, cacheamos 50 min.
  _tokenCache.expiresAt = data.expires_at
    ? new Date(data.expires_at).getTime() - 5 * 60 * 1000
    : Date.now() + 50 * 60 * 1000;

  return _tokenCache.token;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });

  try {
    const token = await getToken();
    const { action, payload } = req.body || {};

    if (action === 'alta_factura') {
      const r = await fetch(`${INVOCASH_BASE}/alta-registro-facturacion`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const text = await r.text();
      res.setHeader('Content-Type', 'application/json');
      return res.status(r.status).send(text);
    }

    return res.status(400).json({ error: 'Acción no reconocida: ' + action });
  } catch (e) {
    return res.status(500).json({ error: 'Proxy Verifactu error', message: String(e.message || e) });
  }
}
