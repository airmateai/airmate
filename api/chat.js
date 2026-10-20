export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Airmate-Token');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { messages, system_prompt, tools, tool_choice } = req.body;

  if (!messages || !system_prompt) {
    return res.status(400).json({ error: 'Faltan campos obligatorios' });
  }

  const hasImages = messages.some(m => Array.isArray(m.content) && m.content.some(c => c.type === 'image_url'));
  const hasTools = Array.isArray(tools) && tools.length > 0;

  // Proveedores en orden: primero los gratuitos (Gemini, Groq) y OpenAI como respaldo.
  // Solo se usan los que tengan su clave en las variables de entorno de Vercel.
  // Si uno falla por límite o saldo (429, 402, 403...), se prueba el siguiente.
  const PROVIDERS = [
    { name: 'gemini', key: process.env.GEMINI_API_KEY, url: 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
      model: () => process.env.GEMINI_MODEL || 'gemini-2.5-flash', openai: false },
    { name: 'groq', key: process.env.GROQ_API_KEY, url: 'https://api.groq.com/openai/v1/chat/completions',
      model: () => hasImages ? (process.env.GROQ_VISION_MODEL || 'meta-llama/llama-4-scout-17b-16e-instruct') : (process.env.GROQ_MODEL || 'llama-3.3-70b-versatile'), openai: false },
    { name: 'openai', key: process.env.OPENAI_API_KEY, url: 'https://api.openai.com/v1/chat/completions',
      model: () => (hasImages || hasTools) ? 'gpt-4o' : 'gpt-4o-mini', openai: true },
  ].filter(p => p.key);

  if (!PROVIDERS.length) return res.status(500).json({ error: 'No hay ninguna clave de IA configurada' });

  let lastError = 'Error de IA';
  try {
    for (const prov of PROVIDERS) {
      const body = {
        model: prov.model(),
        max_tokens: hasImages ? 400 : 600,
        temperature: 0.4,
        messages: [
          { role: 'system', content: system_prompt },
          ...messages.slice(-20), // más contexto para herramientas
        ],
      };
      if (hasTools) {
        body.tools = tools;
        body.tool_choice = tool_choice || 'auto';
        if (prov.openai) body.parallel_tool_calls = false; // ejecutamos una a una para confirmaciones
      }

      let response, data;
      try {
        response = await fetch(prov.url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${prov.key}` },
          body: JSON.stringify(body),
        });
        data = await response.json().catch(() => ({}));
      } catch (e) {
        lastError = `${prov.name}: sin conexión`; continue;
      }

      if (!response.ok) {
        const msgErr = (Array.isArray(data) ? data[0]?.error?.message : data?.error?.message) || `HTTP ${response.status}`;
        console.error(`${prov.name} error:`, response.status, msgErr);
        lastError = msgErr;
        continue; // límite, saldo o caída: probamos el siguiente proveedor
      }

      const msg = data.choices?.[0]?.message;
      const reply = msg?.content || '';
      const tool_calls = msg?.tool_calls?.length ? msg.tool_calls : null;

      // Devolvemos también el mensaje completo del assistant para que el cliente lo pueda re-enviar con role:tool
      return res.status(200).json({
        reply,
        tool_calls,
        assistant_message: msg,
        finish_reason: data.choices?.[0]?.finish_reason || null,
        provider: prov.name,
      });
    }
    return res.status(500).json({ error: lastError });

  } catch (err) {
    console.error('Proxy error:', err);
    return res.status(500).json({ error: 'Error interno del proxy' });
  }
}
