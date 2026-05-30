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

  // Cuando hay tools, usamos gpt-4o (function calling más fiable)
  const model = (hasImages || hasTools) ? 'gpt-4o' : 'gpt-4o-mini';

  try {
    const body = {
      model,
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
      body.parallel_tool_calls = false; // ejecutamos una a una para confirmaciones
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('OpenAI error:', data);
      return res.status(500).json({ error: data.error?.message || 'Error de OpenAI' });
    }

    const msg = data.choices?.[0]?.message;
    const reply = msg?.content || '';
    const tool_calls = msg?.tool_calls || null;

    // Devolvemos también el mensaje completo del assistant para que el cliente lo pueda re-enviar con role:tool
    return res.status(200).json({
      reply,
      tool_calls,
      assistant_message: msg,
      finish_reason: data.choices?.[0]?.finish_reason || null,
    });

  } catch (err) {
    console.error('Proxy error:', err);
    return res.status(500).json({ error: 'Error interno del proxy' });
  }
}
