const KEYS = {
  'jose-acosta': process.env.HOLDED_KEY_JOSE_ACOSTA || 'pat_6a4244076c77500e41039686_11a27d3f1775f1606499bcdf87ff9bcd68c662ae0264a0c8c9b585b33f5b13d0',
};

const ALLOWED_GET = new Set([
  'treasury','expensesaccounts','contacts','documents/invoice',
  'documents/salesreceipt','documents/creditnote','documents/purchase',
  'documents/estimate','products','payments','warehouse','services',
]);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const slug = (req.query.slug || req.body?.slug || 'jose-acosta').toString();
  const key = KEYS[slug];
  if (!key) return res.status(403).json({ error: 'Sin key para ' + slug });

  const BASE = 'https://api.holded.com/api/invoicing/v1';

  try {
    // POST: acciones de escritura (update stock, etc.)
    if (req.method === 'POST') {
      const { action, payload } = req.body || {};

      if (action === 'update_stock') {
        const { product_id, quantity } = payload;
        const r = await fetch(`${BASE}/products/${product_id}/stock`, {
          method: 'POST',
          headers: { key, 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({ quantity, type: 'add' }),
        });
        const text = await r.text();
        res.setHeader('Content-Type', 'application/json');
        return res.status(r.status).send(text);
      }

      if (action === 'search_product') {
        const { name, sku } = payload;
        const q = sku ? `sku=${encodeURIComponent(sku)}` : `name=${encodeURIComponent(name)}`;
        const r = await fetch(`${BASE}/products?${q}`, { headers: { key, Accept: 'application/json' } });
        const text = await r.text();
        res.setHeader('Content-Type', 'application/json');
        return res.status(r.status).send(text);
      }

      return res.status(400).json({ error: 'Acción no reconocida' });
    }

    // GET: solo lectura
    const endpoint = (req.query.endpoint || '').toString();
    const params = (req.query.params || '').toString();
    if (!ALLOWED_GET.has(endpoint)) {
      return res.status(400).json({ error: `Endpoint no permitido: ${endpoint}` });
    }
    const url = `${BASE}/${endpoint}${params ? '?' + params : ''}`;
    const r = await fetch(url, { headers: { key } });
    const text = await r.text();
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
    res.setHeader('Content-Type', 'application/json');
    return res.status(r.status).send(text);

  } catch (e) {
    return res.status(500).json({ error: 'Proxy error', message: String(e) });
  }
}
