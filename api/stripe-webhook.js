import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

export const config = { api: { bodyParser: false } };

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Mapeo: importe en céntimos → plan + tipo
const AMOUNT_MAP = {
  2999:  { plan: 'start',  type: 'agent' },        // 29,99€ Solo Agente START
  3999:  { plan: 'growth', type: 'agent' },         // 39,99€ Solo Agente GROWTH
  6999:  { plan: 'pro',    type: 'agent' },         // 69,99€ Solo Agente PRO
  3900:  { plan: 'start',  type: 'maintenance' },   // 39€/mes mantenimiento START
  5900:  { plan: 'growth', type: 'maintenance' },   // 59€/mes mantenimiento GROWTH
  9900:  { plan: 'pro',    type: 'maintenance' },   // 99€/mes mantenimiento PRO
  25000: { plan: 'start',  type: 'setup' },         // 250€ setup START
  40000: { plan: 'growth', type: 'setup' },         // 400€ setup GROWTH
  80000: { plan: 'pro',    type: 'setup' },         // 800€ setup PRO
};

// Link de mensualidad por plan (se abre tras el setup)
const MAINTENANCE_LINKS = {
  start:  'https://buy.stripe.com/6oU28r31535O3MO3vH2Ry05',
  growth: 'https://buy.stripe.com/dRmbJ1315ayg4QSd6h2Ry04',
  pro:    'https://buy.stripe.com/fZubJ17hl21K5UW4zL2Ry06',
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

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const email = session.customer_details?.email;
    const amount = session.amount_total;
    const mode = session.mode; // 'payment' | 'subscription'

    console.log(`Pago recibido: email=${email} amount=${amount} mode=${mode}`);

    const planInfo = AMOUNT_MAP[amount];
    if (!planInfo || !email) {
      console.log('No se pudo mapear el pago a un plan.');
      return res.status(200).json({ received: true });
    }

    const { plan, type } = planInfo;

    // Activar el plan en Supabase
    const { error } = await supabase
      .from('clients')
      .update({ active: true, plan })
      .eq('email', email.toLowerCase());

    if (error) {
      console.error('Error Supabase:', error);
    } else {
      console.log(`✅ Plan ${plan} activado para ${email} (tipo: ${type})`);
    }

    // Si es un setup de web, guardar en la tabla que hay que enviar el link de mensualidad
    if (type === 'setup') {
      await supabase.from('pending_maintenance').upsert({
        email: email.toLowerCase(),
        plan,
        maintenance_link: MAINTENANCE_LINKS[plan],
        created_at: new Date().toISOString(),
        sent: false,
      });
      console.log(`📧 Pendiente enviar link mantenimiento ${plan} a ${email}`);
    }
  }

  if (event.type === 'customer.subscription.deleted') {
    const sub = event.data.object;
    const customerId = sub.customer;

    // Obtener email del cliente de Stripe
    const customer = await stripe.customers.retrieve(customerId);
    const email = customer.email;

    if (email) {
      await supabase
        .from('clients')
        .update({ active: false })
        .eq('email', email.toLowerCase());
      console.log(`❌ Plan cancelado para ${email}`);
    }
  }

  return res.status(200).json({ received: true });
}
