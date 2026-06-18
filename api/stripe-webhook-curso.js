// Webhook Stripe — curso agencia IA
// Sin dependencias externas, usa crypto nativo de Node.js

import crypto from 'crypto';

export const config = { api: { bodyParser: false } };

async function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', c => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

function verifyStripeSignature(payload, sig, secret) {
  const parts = sig.split(',').reduce((acc, part) => {
    const [k, v] = part.split('=');
    acc[k] = v;
    return acc;
  }, {});
  const timestamp = parts.t;
  const signed = crypto
    .createHmac('sha256', secret)
    .update(`${timestamp}.${payload}`)
    .digest('hex');
  return crypto.timingSafeEqual(Buffer.from(signed), Buffer.from(parts.v1 || ''));
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const rawBody = await getRawBody(req);
  const sig = req.headers['stripe-signature'];
  const secret = process.env.STRIPE_WEBHOOK_SECRET_CURSO;

  try {
    if (!verifyStripeSignature(rawBody.toString(), sig, secret)) {
      return res.status(400).json({ error: 'Invalid signature' });
    }
  } catch {
    return res.status(400).json({ error: 'Signature verification failed' });
  }

  const event = JSON.parse(rawBody.toString());

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const email = session.customer_details?.email || session.customer_email;
    const name = session.customer_details?.name || '';

    if (email) {
      const SB_URL = 'https://vjofxmfwdybktpwiuanc.supabase.co';
      const SB_KEY = process.env.SUPABASE_SERVICE_KEY;

      // Añadir a curso_alumnos
      await fetch(`${SB_URL}/rest/v1/curso_alumnos`, {
        method: 'POST',
        headers: {
          'apikey': SB_KEY,
          'Authorization': `Bearer ${SB_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'resolution=ignore-duplicates'
        },
        body: JSON.stringify({ email, name })
      });

      // Marcar lead como pagado si existe
      await fetch(`${SB_URL}/rest/v1/curso_leads?email=eq.${encodeURIComponent(email)}`, {
        method: 'PATCH',
        headers: {
          'apikey': SB_KEY,
          'Authorization': `Bearer ${SB_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: 'pagado' })
      });

      console.log(`✓ Alumno registrado: ${email}`);
    }
  }

  res.status(200).json({ received: true });
}
