/**
 * WhatsApp Business API webhook — House of Tailors
 * Full booking flow: collects info conversationally → saves to Supabase
 *
 * Env vars (Vercel):
 *   OPENAI_API_KEY
 *   META_WA_TOKEN
 *   META_WA_PHONE_ID
 *   META_VERIFY_TOKEN
 *   HOT_SUPABASE_SERVICE_ROLE_KEY  (service_role del proyecto mzcfjyrosamuogzskbrp — NUNCA hardcodear aquí)
 */

const SB_URL  = 'https://mzcfjyrosamuogzskbrp.supabase.co';
const SB_KEY  = process.env.HOT_SUPABASE_SERVICE_ROLE_KEY;
const SLUG    = 'house-of-tailors';
const WA_NUM  = '+971 50 937 2696';

const SYSTEM_PROMPT = `You are the AI receptionist for House of Tailors, a luxury bespoke tailoring atelier in Dubai (Business Bay, DSO, Sharjah).

SERVICES & PRICING:
- Bespoke Suit: from AED 4,500
- Made-to-Measure Suit: from AED 2,800
- Kandura / Dishdasha: from AED 1,200
- Abaya (embroidered): from AED 1,800
- Tuxedo: from AED 5,200
- Bespoke Shirt: from AED 450
- Alterations: from AED 150

LOCATIONS & HOURS:
- Business Bay: Sun–Thu 10:00–20:00, Fri–Sat 11:00–21:00
- DSO: Sun–Thu 10:00–19:00
- Sharjah: Sat–Thu 10:00–20:00

BOOKING FLOW — follow this order naturally in conversation:
1. If client wants to book, collect these fields one or two at a time (don't list them all at once):
   - Full name
   - Service they want
   - Preferred branch (Business Bay, DSO, or Sharjah)
   - Preferred date (e.g. "this Thursday", "May 22nd")
   - Preferred time
2. Once you have ALL five fields, say EXACTLY:
   "Perfect! Let me confirm your appointment:
   👤 [name]
   ✂️ [service]
   📍 [branch]
   📅 [date] at [time]
   Reply YES to confirm or NO to change anything."
3. If client replies YES → say BOOKING_CONFIRMED:[name]|[service]|[branch]|[date]|[time]
4. If client replies NO → ask what they want to change.

TONE: Warm, professional, concise. 2-3 sentences max. Never say "feel free to ask" or "we're here to help".
If they want a human: "I'll let our team know — you can also reach us on ${WA_NUM}."
Reply in the same language as the client.`;

const EXTRACT_PROMPT = `Extract booking fields from this conversation. Return JSON only, no explanation.
Fields: name (string|null), service (string|null), branch ("Business Bay"|"DSO"|"Sharjah"|null), date (string|null), time (string|null), confirmed (boolean).
If a field is not clearly stated, return null.`;

// In-memory state per phone number
const sessions = {};

export default async function handler(req, res) {

  if (req.method === 'GET') {
    const { 'hub.mode': mode, 'hub.verify_token': token, 'hub.challenge': challenge } = req.query;
    if (mode === 'subscribe' && token === process.env.META_VERIFY_TOKEN) {
      return res.status(200).send(challenge);
    }
    return res.status(403).send('Forbidden');
  }

  if (req.method !== 'POST') return res.status(405).end();

  try {
    const message = req.body?.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
    if (!message) return res.status(200).end();

    const from    = message.from;
    const phoneId = req.body.entry[0].changes[0].value.metadata.phone_number_id;

    if (message.type !== 'text') {
      await sendWA(phoneId, from, `Thanks for your message! For media, please contact us on ${WA_NUM}.`);
      return res.status(200).end();
    }

    const userText = message.text.body.trim();

    if (!sessions[from]) sessions[from] = { history: [], booking: {} };
    const session = sessions[from];

    session.history.push({ role: 'user', content: userText });
    if (session.history.length > 24) session.history = session.history.slice(-24);

    const reply = await callOpenAI(session.history);
    session.history.push({ role: 'assistant', content: reply });

    // Check if booking is confirmed
    if (reply.includes('BOOKING_CONFIRMED:')) {
      const data = reply.split('BOOKING_CONFIRMED:')[1].trim();
      const [name, service, branch, date, time] = data.split('|').map(s => s.trim());
      await saveBooking({ from, name, service, branch, date, time });
      const confirm = `✅ Your appointment is confirmed!\n\n👤 ${name}\n✂️ ${service}\n📍 ${branch}\n📅 ${date} at ${time}\n\nOur team will reach out to confirm the exact time slot. See you soon! 🤝`;
      await sendWA(phoneId, from, confirm);
      sessions[from] = { history: [], booking: {} }; // reset after booking
      return res.status(200).end();
    }

    await sendWA(phoneId, from, reply);
    return res.status(200).end();

  } catch (err) {
    console.error('[HOT webhook]', err);
    return res.status(200).end();
  }
}

async function callOpenAI(history) {
  const resp = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}` },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      max_tokens: 300,
      temperature: 0.6,
      messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...history.slice(-12)],
    }),
  });
  const d = await resp.json();
  return d.choices?.[0]?.message?.content?.trim() || `Thank you! You can also reach us on ${WA_NUM}.`;
}

async function saveBooking({ from, name, service, branch, date, time }) {
  // Parse date/time into ISO — best effort
  let startsAt;
  try {
    startsAt = new Date(`${date} ${time}`).toISOString();
  } catch {
    startsAt = new Date().toISOString();
  }
  const endsAt = new Date(new Date(startsAt).getTime() + 60 * 60000).toISOString();

  // Save appointment
  await sbInsert('appointments', {
    business_slug: SLUG,
    client_name: name,
    client_phone: from,
    service,
    starts_at: startsAt,
    ends_at: endsAt,
    duration_minutes: 60,
    status: 'pending',
    notes: JSON.stringify({ branch, source: 'whatsapp' }),
    created_at: new Date().toISOString(),
  });

  // Save lead
  await sbInsert('leads', {
    business_slug: SLUG,
    name,
    phone: from,
    interest: service,
    intent_level: 'hot',
    status: 'new',
    source: 'WhatsApp',
    created_at: new Date().toISOString(),
  });
}

async function sbInsert(table, data) {
  await fetch(`${SB_URL}/rest/v1/${table}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SB_KEY,
      'Authorization': `Bearer ${SB_KEY}`,
      'Prefer': 'return=minimal',
    },
    body: JSON.stringify(data),
  });
}

async function sendWA(phoneId, to, text) {
  await fetch(`https://graph.facebook.com/v19.0/${phoneId}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.META_WA_TOKEN}` },
    body: JSON.stringify({ messaging_product: 'whatsapp', to, type: 'text', text: { body: text } }),
  });
}
