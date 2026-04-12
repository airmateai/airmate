import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

export const config = { api: { bodyParser: false } };

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Mapeo importe (céntimos) → { plan, type }
// type: 'setup' = pago único web | 'maintenance' = mensualidad mensual
// Planes:
//   SPARK  — solo agente, para web existente, sin setup
//   START  — web sin agente
//   GROWTH — web + asistente IA
//   PRO    — web + vendedor IA (closer)
const AMOUNT_MAP = {
  // ── SPARK: solo mensualidad (sin setup) ──────────────────
  3999:  { plan: 'spark',  type: 'maintenance' },  // 39,99€/mes

  // ── Setup único web ──────────────────────────────────────
  25000: { plan: 'start',  type: 'setup' },   // 250€
  40000: { plan: 'growth', type: 'setup' },   // 400€
  80000: { plan: 'pro',    type: 'setup' },   // 800€

  // ── Mensualidad web ──────────────────────────────────────
  3900:  { plan: 'start',  type: 'maintenance' },  // 39€/mes
  5900:  { plan: 'growth', type: 'maintenance' },  // 59€/mes
  9900:  { plan: 'pro',    type: 'maintenance' },  // 99€/mes
};

async function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const rawBody = await getRawBody(req);
  const sig = req.headers['stripe-signature'];

  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature error:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // ── Pago completado ─────────────────────────────────────────────
  if (event.type === 'checkout.session.completed') {
    const session  = event.data.object;
    const email    = session.customer_details?.email?.toLowerCase();
    const name     = session.customer_details?.name || '';
    const phone    = session.customer_details?.phone || null;
    const amount   = session.amount_total;
    const info     = AMOUNT_MAP[amount];

    console.log(`💳 Pago recibido: email=${email} importe=${amount}c plan=${info?.plan} tipo=${info?.type}`);

    if (!email || !info) {
      console.log('⚠️ No se pudo mapear el pago.');
      return res.status(200).json({ received: true });
    }

    const { plan, type } = info;

    // 1. Activar plan en Supabase (siempre)
    const { error: clientError } = await supabase
      .from('clients')
      .update({ active: true, plan })
      .eq('email', email);

    if (clientError) console.error('❌ Error activando cliente:', clientError);
    else console.log(`✅ Plan ${plan} (${type}) activado para ${email}`);

    // 2. Si es setup de web → crear solicitud en web_requests para que aparezca en el panel Owner
    if (type === 'setup') {
      const planLabels = { start: 'START', growth: 'GROWTH', pro: 'PRO' };
      const setupPrices = { start: '250€', growth: '400€', pro: '800€' };

      const { error: wrError } = await supabase
        .from('web_requests')
        .insert([{
          business_name: name || email,
          business_type: null,
          phone,
          email,
          description: `🔔 PAGO RECIBIDO — Plan ${planLabels[plan]} · Setup ${setupPrices[plan]}\nCliente registrado automáticamente desde Stripe.\nActivar agente en el panel tras entregar la web.`,
          status: 'pending',
        }]);

      if (wrError) console.error('❌ Error creando web_request:', wrError);
      else console.log(`📋 Solicitud web creada para ${email} (${plan})`);
    }
  }

  // ── Suscripción cancelada ────────────────────────────────────────
  if (event.type === 'customer.subscription.deleted') {
    const sub      = event.data.object;
    const customer = await stripe.customers.retrieve(sub.customer);
    const email    = customer.email?.toLowerCase();

    if (email) {
      await supabase
        .from('clients')
        .update({ active: false })
        .eq('email', email);
      console.log(`❌ Plan cancelado para ${email}`);
    }
  }

  return res.status(200).json({ received: true });
}
