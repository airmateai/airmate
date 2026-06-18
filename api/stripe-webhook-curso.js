// Webhook de Stripe para el curso
// Cuando alguien paga → se añade su email a curso_alumnos automáticamente

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const SB_URL = 'https://vjofxmfwdybktpwiuanc.supabase.co';
  const SB_KEY = process.env.SUPABASE_SERVICE_KEY;
  const STRIPE_SECRET = process.env.STRIPE_WEBHOOK_SECRET_CURSO;

  // Verificar firma de Stripe
  const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, STRIPE_SECRET);
  } catch (err) {
    console.error('Webhook signature error:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const email = session.customer_details?.email || session.customer_email;
    const name = session.customer_details?.name || '';

    if (!email) {
      console.error('No email in session:', session.id);
      return res.status(200).json({ received: true });
    }

    // Insertar en curso_alumnos si no existe ya
    const insertRes = await fetch(`${SB_URL}/rest/v1/curso_alumnos`, {
      method: 'POST',
      headers: {
        'apikey': SB_KEY,
        'Authorization': `Bearer ${SB_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=ignore-duplicates'
      },
      body: JSON.stringify({ email, name })
    });

    // Marcar como pagado en curso_leads si estaba como lead
    await fetch(`${SB_URL}/rest/v1/curso_leads?email=eq.${encodeURIComponent(email)}`, {
      method: 'PATCH',
      headers: {
        'apikey': SB_KEY,
        'Authorization': `Bearer ${SB_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ status: 'pagado' })
    });

    console.log(`✓ Alumno añadido: ${email}`);
  }

  res.status(200).json({ received: true });
}

// ─────────────────────────────────────────────
// CONFIGURACIÓN EN VERCEL (Environment Variables):
// STRIPE_SECRET_KEY = sk_live_...
// STRIPE_WEBHOOK_SECRET_CURSO = whsec_... (se genera al crear el webhook en Stripe)
// SUPABASE_SERVICE_KEY = eyJ... (service role key)
//
// CONFIGURAR EN STRIPE:
// Dashboard → Developers → Webhooks → Add endpoint
// URL: https://bot-airmate-1.vercel.app/api/stripe-webhook-curso
// Events: checkout.session.completed
// ─────────────────────────────────────────────
