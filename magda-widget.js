(() => {
  const SUPABASE_URL = 'https://vjofxmfwdybktpwiuanc.supabase.co';
  const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZqb2Z4bWZ3ZHlia3Rwd2l1YW5jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ0NzU5NDYsImV4cCI6MjA5MDA1MTk0Nn0.ixU-33c0FEkO7F5xjWb3YHkvj_pQuR0gsJETrGA8ZTE';
  const PROXY_URL   = 'https://bot-airmate-1.vercel.app/api/chat';
  const SLUG        = 'magda-punta-hidalgo';

  const SYSTEM_PROMPT = `Eres el asistente virtual del Bungalow Punta del Hidalgo, un alojamiento único en una finca de plátanos con jardín de palmeras en Punta del Hidalgo, norte de Tenerife.

Tu misión: ayudar a los viajeros a consultar disponibilidad, resolver dudas y hacer consultas de reserva. Eres cálido, cercano y natural — como Magda.

== EL BUNGALOW ==
- Ubicación: Punta del Hidalgo, noreste de Tenerife (pueblo pesquero y de surf, lejos del turismo masivo)
- Capacidad: 5 viajeros · 1 dormitorio · 4 camas (1 matrimonio grande, 2 individuales, 1 sofá cama) · 1 baño
- Precio orientativo: ~103€/noche (varía según fechas y temporada)
- Rating: 4.97/5 con 90 reseñas · Top 10% Airbnb · Superanfitriona

== LO QUE INCLUYE ==
- Jardín privado con palmeras reales y finca de plátanos
- Terraza de piedra con zona exterior para comer
- Acceso privado al mar a 5 minutos a pie (charcos y piscinas naturales de roca volcánica)
- Cocina completa equipada
- WiFi alta velocidad (también para teletrabajar)
- Aparcamiento gratuito en la propiedad
- Secadora
- Zona de trabajo con escritorio
- Cuna y trona disponibles (ideal familias con bebés)
- Check-in personal con Magda

== MAGDA (ANFITRIONA) ==
- Superanfitriona con 10 años en Airbnb
- Profesora de Arte
- Habla: español, inglés, francés e italiano
- Vive enfrente y recibe a todos los huéspedes personalmente
- Top 10% de anfitriones Airbnb

== LA ZONA ==
- Punta del Hidalgo es el pueblo más al norte de Tenerife
- Surf, charcos y piscinas naturales de roca volcánica
- A 5 min del Parque Natural de Anaga (laurisilva, senderismo, miradores)
- A 15 min de La Laguna (Patrimonio UNESCO, gastronomía local)
- Chiringuitos de pescado fresco y cocina canaria auténtica

== RESERVAS ==
Para reservar o consultar disponibilidad, recoge el nombre del viajero, fechas de llegada y salida, y número de personas. Luego indica que Magda les contactará personalmente o pueden reservar directamente en Airbnb: https://www.airbnb.es/rooms/9981845

== INSTRUCCIONES ==
- Responde siempre en el idioma del usuario (español, inglés, francés o italiano)
- Sé natural y cálido, no robótico
- Si el usuario quiere reservar, recoge sus datos (nombre, fechas, nº personas, contacto)
- No inventes precios exactos para fechas concretas — siempre di que varían según disponibilidad
- Si no sabes algo, di honestamente que Magda le puede resolver la duda
- Respuestas cortas y directas, sin listas innecesarias`;

  let messages = [];
  let open = false;
  let bookedDates = [];
  let leadSaved = false;

  // Cargar fechas ocupadas
  async function loadBooked() {
    try {
      const r = await fetch(`${SUPABASE_URL}/rest/v1/appointments?business_slug=eq.${SLUG}&status=neq.cancelled&select=start_time,end_time`, {
        headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }
      });
      const data = await r.json();
      bookedDates = Array.isArray(data) ? data : [];
    } catch (e) {}
  }

  // Guardar lead en Supabase
  async function saveLead(text) {
    if (leadSaved) return;
    const emailM = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    const phoneM = text.match(/(\+34|0034)?[\s-]?[6789]\d{8}/);
    if (!emailM && !phoneM) return;
    leadSaved = true;
    await fetch(`${SUPABASE_URL}/rest/v1/leads`, {
      method: 'POST',
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
      body: JSON.stringify({ business_slug: SLUG, email: emailM?.[0] || null, phone: phoneM?.[0] || null, source: 'widget', notes: text.slice(0, 300), status: 'nuevo' })
    });
  }

  // Guardar reserva/consulta
  async function saveAppointment(name, text) {
    const dateM = text.match(/(\d{1,2})[\/\-](\d{1,2})(?:[\/\-](\d{2,4}))?/);
    const start = dateM ? `2026-${dateM[2].padStart(2,'0')}-${dateM[1].padStart(2,'0')}T16:00:00` : null;
    if (!start || !name) return;
    await fetch(`${SUPABASE_URL}/rest/v1/appointments`, {
      method: 'POST',
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
      body: JSON.stringify({ business_slug: SLUG, client_name: name, start_time: start, end_time: start, status: 'pendiente', notes: text.slice(0, 500), service: 'Consulta bungalow' })
    });
  }

  // Enviar mensaje al proxy
  async function sendMessage(userText) {
    messages.push({ role: 'user', content: userText });
    saveLead(userText);

    const typingEl = addBubble('...', 'bot', true);

    try {
      const res = await fetch(PROXY_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages, system: SYSTEM_PROMPT })
      });
      const data = await res.json();
      const reply = data.content?.[0]?.text || data.reply || 'Un momento, vuelvo enseguida 🌿';
      typingEl.remove();
      addBubble(reply, 'bot');
      messages.push({ role: 'assistant', content: reply });

      // Detectar intención de reserva
      const fullConv = messages.map(m => m.content).join(' ');
      const nameM = fullConv.match(/(?:me llamo|soy|nombre[:\s]+)([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(?:\s[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+)?)/i);
      if (nameM && /reser|llegad|salid|noche|días/.test(fullConv)) {
        saveAppointment(nameM[1], fullConv);
      }
    } catch (e) {
      typingEl.remove();
      addBubble('Parece que hay un problema de conexión. Puedes contactar directamente con Magda por WhatsApp 🌿', 'bot');
    }
  }

  // Crear burbuja
  function addBubble(text, from, typing = false) {
    const msgs = document.getElementById('magda-msgs');
    const wrap = document.createElement('div');
    wrap.style.cssText = `display:flex;justify-content:${from==='bot'?'flex-start':'flex-end'};margin-bottom:10px`;
    const bubble = document.createElement('div');
    bubble.style.cssText = `max-width:80%;padding:11px 15px;border-radius:${from==='bot'?'4px 16px 16px 16px':'16px 4px 16px 16px'};font-size:0.88rem;line-height:1.55;background:${from==='bot'?'#f0f5f0':'#2d4a2d'};color:${from==='bot'?'#2c2c2c':'#ffffff'};box-shadow:0 1px 4px rgba(0,0,0,0.07)`;
    bubble.textContent = typing ? '●●●' : text;
    if (typing) {
      bubble.style.animation = 'pulse 1.2s ease infinite';
      bubble.style.color = '#4a7c59';
      bubble.style.background = '#f0f5f0';
    }
    wrap.appendChild(bubble);
    msgs.appendChild(wrap);
    msgs.scrollTop = msgs.scrollHeight;
    return wrap;
  }

  // BUILD UI
  function buildWidget() {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes fadeSlideUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
      @keyframes pulse { 0%,100%{opacity:0.4} 50%{opacity:1} }
      #magda-widget { position:fixed;bottom:24px;right:24px;z-index:9999;font-family:'Inter',sans-serif; }
      #magda-toggle { width:58px;height:58px;border-radius:50%;background:#2d4a2d;border:none;cursor:pointer;box-shadow:0 4px 20px rgba(45,74,45,0.4);display:flex;align-items:center;justify-content:center;font-size:1.5rem;transition:transform 0.2s,box-shadow 0.2s;color:white; }
      #magda-toggle:hover { transform:scale(1.08);box-shadow:0 6px 28px rgba(45,74,45,0.5); }
      #magda-box { position:absolute;bottom:70px;right:0;width:340px;border-radius:16px;background:#fff;box-shadow:0 8px 40px rgba(0,0,0,0.14);overflow:hidden;display:none;flex-direction:column;animation:fadeSlideUp 0.3s ease; }
      #magda-box.open { display:flex; }
      #magda-header { background:#2d4a2d;padding:16px 18px;display:flex;align-items:center;gap:12px; }
      #magda-avatar { width:40px;height:40px;border-radius:50%;background:rgba(255,255,255,0.15);display:flex;align-items:center;justify-content:center;font-size:1.3rem;flex-shrink:0; }
      #magda-header-info strong { display:block;color:#fff;font-size:0.92rem; }
      #magda-header-info span { color:rgba(255,255,255,0.65);font-size:0.75rem; }
      #magda-msgs { flex:1;height:300px;overflow-y:auto;padding:16px;background:#fafaf8; }
      #magda-suggestions { padding:8px 12px;display:flex;flex-wrap:wrap;gap:6px;border-top:1px solid #eee; }
      .magda-chip { background:#f0f5f0;border:1px solid #c8dfc8;color:#2d4a2d;border-radius:50px;padding:5px 13px;font-size:0.75rem;cursor:pointer;transition:background 0.2s;white-space:nowrap; }
      .magda-chip:hover { background:#d8ecd8; }
      #magda-input-row { display:flex;gap:8px;padding:12px 14px;border-top:1px solid #eee; }
      #magda-input { flex:1;border:1px solid #ddd;border-radius:50px;padding:9px 15px;font-size:0.85rem;outline:none;font-family:inherit; }
      #magda-input:focus { border-color:#4a7c59; }
      #magda-send { background:#2d4a2d;color:#fff;border:none;border-radius:50px;padding:9px 18px;font-size:0.82rem;cursor:pointer;transition:background 0.2s; }
      #magda-send:hover { background:#4a7c59; }
      #magda-powered { text-align:center;padding:6px;font-size:0.68rem;color:#bbb; }
    `;
    document.head.appendChild(style);

    const container = document.createElement('div');
    container.id = 'magda-widget';
    container.innerHTML = `
      <div id="magda-box">
        <div id="magda-header">
          <div id="magda-avatar">🌺</div>
          <div id="magda-header-info">
            <strong>Asistente del Bungalow</strong>
            <span>🟢 En línea · Responde al instante</span>
          </div>
        </div>
        <div id="magda-msgs"></div>
        <div id="magda-suggestions">
          <div class="magda-chip" data-msg="¿Cuánto cuesta el alquiler por noche?">💰 Precios</div>
          <div class="magda-chip" data-msg="¿Está disponible en agosto?">📅 Disponibilidad</div>
          <div class="magda-chip" data-msg="¿Cómo se llega desde el aeropuerto?">📍 Cómo llegar</div>
          <div class="magda-chip" data-msg="¿Qué actividades hay cerca?">🏄 La zona</div>
        </div>
        <div id="magda-input-row">
          <input id="magda-input" type="text" placeholder="Escribe tu pregunta...">
          <button id="magda-send">Enviar</button>
        </div>
        <div id="magda-powered">Asistente IA · <a href="https://airmate.es" target="_blank" style="color:#aaa;text-decoration:none">Airmate</a></div>
      </div>
      <button id="magda-toggle">🌿</button>
    `;
    document.body.appendChild(container);

    // Toggle
    document.getElementById('magda-toggle').addEventListener('click', () => {
      open = !open;
      const box = document.getElementById('magda-box');
      box.classList.toggle('open', open);
      document.getElementById('magda-toggle').textContent = open ? '✕' : '🌿';
      if (open && messages.length === 0) {
        setTimeout(() => addBubble('¡Hola! 👋 Soy el asistente del Bungalow Punta del Hidalgo. ¿En qué puedo ayudarte? Puedo contarte sobre el bungalow, la zona, o ayudarte con una consulta de reserva 🌴', 'bot'), 400);
      }
    });

    // Send
    const input = document.getElementById('magda-input');
    const sendBtn = document.getElementById('magda-send');
    function doSend() {
      const text = input.value.trim();
      if (!text) return;
      addBubble(text, 'user');
      input.value = '';
      sendMessage(text);
    }
    sendBtn.addEventListener('click', doSend);
    input.addEventListener('keydown', e => { if (e.key === 'Enter') doSend(); });

    // Chips
    document.querySelectorAll('.magda-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        if (!open) { open = true; document.getElementById('magda-box').classList.add('open'); document.getElementById('magda-toggle').textContent = '✕'; }
        const msg = chip.dataset.msg;
        addBubble(msg, 'user');
        sendMessage(msg);
      });
    });

    // Auto-open after 8s
    setTimeout(() => {
      if (!open) {
        open = true;
        document.getElementById('magda-box').classList.add('open');
        document.getElementById('magda-toggle').textContent = '✕';
        addBubble('¡Hola! 🌴 Soy el asistente del Bungalow Punta del Hidalgo. ¿Tienes alguna pregunta sobre el alojamiento o quieres consultar disponibilidad?', 'bot');
      }
    }, 8000);
  }

  // INIT
  loadBooked();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', buildWidget);
  } else {
    buildWidget();
  }

  // Insert bot_config in Supabase if not exists
  async function ensureConfig() {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/bot_configs?slug=eq.${SLUG}&select=slug`, {
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }
    });
    const data = await r.json();
    if (data.length === 0) {
      const SRK = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZqb2Z4bWZ3ZHlia3Rwd2l1YW5jIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDQ3NTk0NiwiZXhwIjoyMDkwMDUxOTQ2fQ.08g-CtdJ0BvgE3U4v9JppA_114EN24KBs7iBpUaw9cs';
      await fetch(`${SUPABASE_URL}/rest/v1/bot_configs`, {
        method: 'POST',
        headers: { apikey: SRK, Authorization: `Bearer ${SRK}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
        body: JSON.stringify({ slug: SLUG, bot_name: 'Asistente Bungalow Punta del Hidalgo', owner_email: 'airmateai@gmail.com', system_prompt: SYSTEM_PROMPT })
      });
    }
  }
  ensureConfig();
})();
