// Proxy seguro para la API de Holded — solo lectura
// Cada cliente tiene su key (env var). Por ahora hardcode de Jose Acosta para empezar.
const KEYS = {
  'jose-acosta': process.env.HOLDED_KEY_JOSE_ACOSTA || '36b92686213c3974569efc5959a08263',
};

const ALLOWED = new Set([
  'treasury',
  'expensesaccounts',
  'contacts',
  'documents/invoice',
  'documents/salesreceipt',
  'documents/creditnote',
  'documents/purchase',
  'documents/estimate',
  'products',
  'payments',
  'warehouse',
  'services',
]);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const slug = (req.query.slug || 'jose-acosta').toString();
  const endpoint = (req.query.endpoint || '').toString();
  const params = (req.query.params || '').toString();

  if (!ALLOWED.has(endpoint)) {
    return res.status(400).json({ error: `Endpoint no permitido: ${endpoint}` });
  }
  const key = KEYS[slug];
  if (!key) return res.status(403).json({ error: 'Sin key para ' + slug });

  try {
    const url = `https://api.holded.com/api/invoicing/v1/${endpoint}${params ? '?' + params : ''}`;
    const r = await fetch(url, { headers: { key } });
    const text = await r.text();
    // Cache 60s en CDN para no machacar la API
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
    res.setHeader('Content-Type', 'application/json');
    return res.status(r.status).send(text);
  } catch (e) {
    return res.status(500).json({ error: 'Proxy error', message: String(e) });
  }
}
