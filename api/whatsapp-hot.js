/**
 * WhatsApp Business API webhook — House of Tailors
 * Handles GET (verification) and POST (incoming messages)
 * Env vars needed in Vercel:
 *   OPENAI_API_KEY       — already set
 *   META_WA_TOKEN        — WhatsApp Business API access token from Meta
 *   META_WA_PHONE_ID     — Phone number ID from Meta Developer portal
 *   META_VERIFY_TOKEN    — any random string you choose, must match Meta dashboard
 */

const SYSTEM_PROMPT = `You are the AI receptionist for House of Tailors, a luxury bespoke tailoring atelier with locations in Business Bay, DSO, and Sharjah (Dubai, UAE).

You represent the brand: refined, professional, warm. You speak like a knowledgeable tailor's assistant — not a chatbot.

SERVICES & PRICING (approximate):
- Bespoke Suit: from AED 4,500
- Made-to-Measure Suit: from AED 2,800
- Kandura / Dishdasha: from AED 1,200
- Abaya (embroidered): from AED 1,800
- Tuxedo: from AED 5,200
- Bespoke Shirt: from AED 450
- Alterations: from AED 150

LOCATIONS & HOURS:
- Business Bay: Sun–Thu 10:00–20:00, Fri–Sat 11:00–21:00
- DSO (Dubai Silicon Oasis): Sun–Thu 10:00–19:00
- Sharjah: Sat–Thu 10:00–20:00

HOW YOU BEHAVE:
- Warm and professional. Short replies — 2-3 sentences max on WhatsApp.
- Use the client's name once you know it.
- Answer questions about services, pricing, fabrics, and locations.
- If they want to book an appointment, ask which branch they prefer and suggest calling or visiting — do NOT invent booking links.
- If they want to speak to someone: "I'll make sure a member of our team contacts you shortly. You can also reach us at +971 50 937 2696."
- Never invent prices, delivery times, or availability. Say the team will confirm.
- If the message is in Arabic, reply in Arabic. Otherwise reply in English.`;

// In-memory conversation store (per phone number, resets on cold start)
// For production, replace with Supabase or KV store
const conversations = {};

export default async function handler(req, res) {

  // ── WEBHOOK VERIFICATION (GET) ──────────────────────────────────
  if (req.method === 'GET') {
    const mode      = req.query['hub.mode'];
    const token     = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode === 'subscribe' && token === process.env.META_VERIFY_TOKEN) {
      console.log('[HOT] Webhook verified');
      return res.status(200).send(challenge);
    }
    return res.status(403).send('Forbidden');
  }

  // ── INCOMING MESSAGE (POST) ─────────────────────────────────────
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const body = req.body;

    // Ignore non-message events (status updates etc.)
    const entry   = body?.entry?.[0];
    const change  = entry?.changes?.[0];
    const value   = change?.value;
    const message = value?.messages?.[0];

    if (!message) return res.status(200).end(); // ACK non-message events

    const from    = message.from;          // sender's phone number
    const msgType = message.type;
    const phoneId = value.metadata?.phone_number_id;

    // Only handle text messages for now
    if (msgType !== 'text') {
      await sendWA(phoneId, from, "Thanks for your message! For images or documents, please contact us directly at +971 50 937 2696.");
      return res.status(200).end();
    }

    const userText = message.text.body.trim();
    console.log(`[HOT] From ${from}: ${userText}`);

    // Build conversation history (last 10 messages)
    if (!conversations[from]) conversations[from] = [];
    conversations[from].push({ role: 'user', content: userText });
    if (conversations[from].length > 20) conversations[from] = conversations[from].slice(-20);

    // Call OpenAI
    const aiReply = await callOpenAI(conversations[from]);

    // Store assistant reply
    conversations[from].push({ role: 'assistant', content: aiReply });

    // Send reply via WhatsApp
    await sendWA(phoneId, from, aiReply);

    return res.status(200).end();

  } catch (err) {
    console.error('[HOT] Error:', err);
    return res.status(200).end(); // Always 200 to Meta or they retry endlessly
  }
}

async function callOpenAI(history) {
  const resp = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      max_tokens: 200,
      temperature: 0.65,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...history.slice(-10),
      ],
    }),
  });
  const data = await resp.json();
  return data.choices?.[0]?.message?.content?.trim() || "Thank you for your message. A member of our team will be in touch shortly.";
}

async function sendWA(phoneId, to, text) {
  await fetch(`https://graph.facebook.com/v19.0/${phoneId}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.META_WA_TOKEN}`,
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to,
      type: 'text',
      text: { body: text },
    }),
  });
}
