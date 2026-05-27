export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Airmate-Token');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { messages, system_prompt } = req.body;

  if (!messages || !system_prompt) {
    return res.status(400).json({ error: 'Faltan campos obligatorios' });
  }

  const hasImages = messages.some(m => Array.isArray(m.content) && m.content.some(c => c.type === 'image_url'));

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: hasImages ? 'gpt-4o' : 'gpt-4o-mini',
        max_tokens: hasImages ? 400 : 350,
        temperature: 0.7,
        messages: [
          { role: 'system', content: system_prompt },
          ...messages.slice(-10),
        ],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('OpenAI error:', data);
      return res.status(500).json({ error: data.error?.message || 'Error de OpenAI' });
    }

    const reply = data.choices?.[0]?.message?.content || '';
    return res.status(200).json({ reply });

  } catch (err) {
    console.error('Proxy error:', err);
    return res.status(500).json({ error: 'Error interno del proxy' });
  }
}
