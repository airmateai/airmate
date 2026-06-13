(function () {
  'use strict';

  const SB_URL = 'https://vjofxmfwdybktpwiuanc.supabase.co';
  const SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZqb2Z4bWZ3ZHlia3Rwd2l1YW5jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ0NzU5NDYsImV4cCI6MjA5MDA1MTk0Nn0.ixU-33c0FEkO7F5xjWb3YHkvj_pQuR0gsJETrGA8ZTE';
  const PROXY  = 'https://bot-airmate-1.vercel.app/api/chat';
  const SLUG   = 'costa-norte';

  const CFG = {
    name:     'Costa Norte',
    emoji:    '🌊',
    color:    '#0a2540',
    coral:    '#e8402a',
    greeting: '¡Hola! Soy el asistente de Costa Norte 🌊\nPuedo ayudarte a reservar clases de surf, alquilar material o consultar disponibilidad de apartamentos. ¿En qué puedo ayudarte?',
    suggestions: [
      '🏄 Reservar clase de surf',
      '🏠 Ver apartamentos',
      '🚣 Alquilar material',
      '💰 Ver precios',
      '📍 ¿Dónde estáis?',
    ]
  };

  const SYSTEM_PROMPT = `Eres el asistente virtual de Costa Norte, la escuela de surf de San Vicente de la Barquera, Cantabria. Llevas desde 2005 en la playa.

NEGOCIO:
- Escuela de Surf Costa Norte + Surfing San Vicente (apartamentos) + SanVicente Surfcamps
- Dirección: Playa de San Vicente de la Barquera, Cantabria
- Teléfono: 942 71 25 04 / 618 964 263 / 609 282 963
- Email: comunicacion@escueladesurfcostanorte.com
- Web: escueladesurfcostanorte.com
- Horario: todos los días 9:00 a 20:00

CLASES DE SURF (grupales):
- Iniciación: 1 día 35€ · 2 días 70€ · 5 días 150€ · 7 días 195€ · 15 días 315€ · 20 días 390€
- Perfeccionamiento: 1 día 50€ · 2 días 100€ · 5 días 175€ · 7 días 280€ · 15 días 390€ · 20 días 500€
- Todas incluyen tabla y neopreno. Grupos máx. 8 personas. Instructores ISA certificados.

CLASES PARTICULARES:
- 1 persona: 75€/clase · 145€ 2 clases
- 2 personas: 60€/pax/clase · 115€/pax 2 clases
- 3 personas: 50€/pax/clase · 90€/pax 2 clases

CLASES DE SUP:
- Flatwater/Race: 35€/día · 140€ 5 días
- SUP Olas: 40€/día · 150€ 5 días

ALQUILER DE MATERIAL (precio/día):
- Surfboard/Bodyboard: 2h 18€ · 5h 25€ · 1d 30€ · 2d 40€ · 5d 75€ · 7d 100€
- Surfboard Premium: 2h 20€ · 5h 30€ · 1d 40€ · 2d 70€ · 5d 100€ · 7d 120€
- Wetsuit/Neopreno: 2h 10€ · 5h 13€ · 1d 18€ · 2d 35€ · 5d 55€ · 7d 70€
- Surf + Wetsuit: 2h 20€ · 5h 30€ · 1d 40€ · 2d 60€ · 5d 120€ · 7d 150€
- Surf Premium + Wetsuit: 2h 28€ · 5h 40€ · 1d 50€ · 2d 90€ · 5d 130€ · 7d 160€
- Paddle Surf/SUP: 2h 20€ · 5h 30€ · 1d 40€ · 2d 70€ · 5d 100€ · 7d 140€

APARTAMENTOS (Surfing San Vicente):
- 22 apartamentos a pie de playa en San Vicente de la Barquera
- Tipos: estudio (1 hab), apartamento (2 hab), premium (pie de playa)
- Disponibles también en Airbnb y Booking.com
- Para precios y disponibilidad: apartamentosurfingsanvicente@hotmail.com

SURF CAMPS (SanVicente Surfcamps):
- Camp Semana: alojamiento + 5 clases grupales
- Camp Familiar: clases adaptadas por edades + apartamento familiar
- Camp Intensivo: mañana y tarde + análisis de vídeo (nivel intermedio/avanzado)

TIENDA:
- Rip Curl, Land Rover, NSP, FCS, Sex Wax
- Tablas, neoprenos, ropa, accesorios, calzado, SUP

INSTRUCCIONES:
- Responde siempre en el mismo idioma que el usuario (español, inglés, francés, alemán...)
- Sé amable, directo y conciso. Máximo 3-4 líneas por respuesta.
- Si quieren reservar una clase: pide nombre, fecha deseada, nivel y número de personas. Confirma que lo registras y que el equipo les contactará para confirmar.
- Si preguntan por apartamentos: dales el email apartamentosurfingsanvicente@hotmail.com o el teléfono 618 964 263
- Si preguntan dónde están: Playa de San Vicente de la Barquera, Cantabria. A 60km de Santander, 100km de Bilbao.
- Usa emojis con moderación. Tono profesional pero cercano, como hablaría alguien que vive el surf.
- NO inventes precios ni disponibilidad que no tengas. Si no sabes algo, di que llamen al 942 71 25 04.`;

  /* ─── CSS ─── */
  const style = document.createElement('style');
  style.textContent = `
    #cn-widget-btn {
      position:fixed;bottom:24px;right:24px;z-index:9998;
      width:62px;height:62px;border-radius:50%;border:none;cursor:pointer;
      background:#0a2540;box-shadow:0 8px 32px rgba(10,37,64,.45);
      display:flex;align-items:center;justify-content:center;
      transition:all .25s cubic-bezier(.2,.9,.3,1.2);
      font-size:26px;
    }
    #cn-widget-btn:hover{transform:scale(1.08);box-shadow:0 12px 40px rgba(10,37,64,.55);}
    #cn-widget-btn.open{background:#e8402a;}
    #cn-widget-btn .cn-notif{
      position:absolute;top:-3px;right:-3px;
      width:18px;height:18px;border-radius:50%;
      background:#e8402a;border:2px solid #fff;
      font-size:10px;font-weight:700;color:#fff;
      display:flex;align-items:center;justify-content:center;
    }
    #cn-chat {
      position:fixed;bottom:100px;right:24px;z-index:9997;
      width:380px;max-height:600px;
      background:#fff;border-radius:20px;
      box-shadow:0 24px 80px rgba(10,37,64,.22),0 4px 16px rgba(10,37,64,.1);
      display:flex;flex-direction:column;overflow:hidden;
      transform:scale(.92) translateY(16px);opacity:0;pointer-events:none;
      transition:all .28s cubic-bezier(.2,.9,.3,1.1);
      font-family:'Inter',-apple-system,sans-serif;
    }
    #cn-chat.visible{transform:scale(1) translateY(0);opacity:1;pointer-events:all;}
    .cn-head{
      background:linear-gradient(135deg,#0a2540,#1a3a5c);
      padding:18px 20px;display:flex;align-items:center;gap:12px;
    }
    .cn-head-av{
      width:42px;height:42px;border-radius:50%;
      background:#e8402a;display:flex;align-items:center;justify-content:center;
      font-size:20px;flex-shrink:0;box-shadow:0 4px 12px rgba(232,64,42,.4);
    }
    .cn-head-info{flex:1;}
    .cn-head-name{font-size:15px;font-weight:700;color:#fff;line-height:1.2;}
    .cn-head-status{font-size:11px;color:rgba(255,255,255,.55);display:flex;align-items:center;gap:5px;margin-top:2px;}
    .cn-head-dot{width:7px;height:7px;border-radius:50%;background:#22c55e;box-shadow:0 0 6px #22c55e;}
    .cn-head-close{width:32px;height:32px;border-radius:50%;background:rgba(255,255,255,.1);border:none;cursor:pointer;color:rgba(255,255,255,.7);font-size:18px;display:flex;align-items:center;justify-content:center;transition:all .15s;flex-shrink:0;}
    .cn-head-close:hover{background:rgba(255,255,255,.2);color:#fff;}
    .cn-msgs{flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:10px;min-height:200px;max-height:360px;background:#f8f9fb;}
    .cn-msgs::-webkit-scrollbar{width:4px;}
    .cn-msgs::-webkit-scrollbar-thumb{background:rgba(10,37,64,.15);border-radius:4px;}
    .cn-msg{max-width:82%;display:flex;flex-direction:column;gap:3px;}
    .cn-msg.bot{align-self:flex-start;}
    .cn-msg.user{align-self:flex-end;}
    .cn-bubble{
      padding:10px 14px;border-radius:16px;font-size:13.5px;line-height:1.55;
      word-break:break-word;white-space:pre-wrap;
    }
    .cn-msg.bot .cn-bubble{background:#fff;color:#0a2540;border-radius:4px 16px 16px 16px;box-shadow:0 2px 8px rgba(10,37,64,.08);}
    .cn-msg.user .cn-bubble{background:#0a2540;color:#fff;border-radius:16px 4px 16px 16px;}
    .cn-msg-time{font-size:10px;color:#a0aec0;padding:0 4px;}
    .cn-msg.user .cn-msg-time{text-align:right;}
    .cn-suggestions{display:flex;flex-wrap:wrap;gap:6px;padding:10px 16px 0;}
    .cn-sug{
      padding:7px 13px;border-radius:20px;border:1.5px solid rgba(10,37,64,.15);
      background:#fff;font-size:12px;font-weight:500;color:#0a2540;cursor:pointer;
      transition:all .15s;white-space:nowrap;
    }
    .cn-sug:hover{background:#0a2540;color:#fff;border-color:#0a2540;}
    .cn-typing{display:flex;gap:4px;align-items:center;padding:10px 14px;background:#fff;border-radius:4px 16px 16px 16px;width:fit-content;box-shadow:0 2px 8px rgba(10,37,64,.08);}
    .cn-typing span{width:7px;height:7px;border-radius:50%;background:#0a2540;opacity:.3;animation:cnBounce 1.2s infinite;}
    .cn-typing span:nth-child(2){animation-delay:.2s;}
    .cn-typing span:nth-child(3){animation-delay:.4s;}
    @keyframes cnBounce{0%,80%,100%{transform:translateY(0);opacity:.3;}40%{transform:translateY(-5px);opacity:1;}}
    .cn-input-wrap{
      padding:14px 16px;background:#fff;
      border-top:1px solid rgba(10,37,64,.07);
      display:flex;gap:8px;align-items:center;
    }
    .cn-input{
      flex:1;padding:10px 14px;border:1.5px solid rgba(10,37,64,.12);border-radius:24px;
      font-size:13px;font-family:inherit;color:#0a2540;outline:none;background:#f8f9fb;
      transition:border-color .15s;
    }
    .cn-input:focus{border-color:#0a2540;background:#fff;}
    .cn-send{
      width:38px;height:38px;border-radius:50%;background:#0a2540;border:none;
      cursor:pointer;display:flex;align-items:center;justify-content:center;
      color:#fff;font-size:16px;transition:all .15s;flex-shrink:0;
    }
    .cn-send:hover{background:#e8402a;transform:scale(1.05);}
    .cn-send:disabled{background:#c5cdd8;cursor:not-allowed;transform:none;}
    .cn-footer{padding:8px 16px;text-align:center;font-size:10px;color:#a0aec0;background:#fff;border-top:1px solid rgba(10,37,64,.04);}
    .cn-footer a{color:#0a2540;font-weight:600;}
    @media(max-width:440px){
      #cn-chat{width:calc(100vw - 20px);right:10px;bottom:90px;}
    }
  `;
  document.head.appendChild(style);

  /* ─── HTML ─── */
  const btn = document.createElement('button');
  btn.id = 'cn-widget-btn';
  btn.innerHTML = '<span id="cn-btn-icon">🌊</span><span class="cn-notif">1</span>';
  document.body.appendChild(btn);

  const chat = document.createElement('div');
  chat.id = 'cn-chat';
  chat.innerHTML = `
    <div class="cn-head">
      <div class="cn-head-av">🌊</div>
      <div class="cn-head-info">
        <div class="cn-head-name">Costa Norte · Asistente</div>
        <div class="cn-head-status"><div class="cn-head-dot"></div>En línea · responde al instante</div>
      </div>
      <button class="cn-head-close" id="cn-close">✕</button>
    </div>
    <div class="cn-msgs" id="cn-msgs"></div>
    <div class="cn-suggestions" id="cn-sugs"></div>
    <div class="cn-input-wrap">
      <input class="cn-input" id="cn-input" placeholder="Escribe tu pregunta..." autocomplete="off" maxlength="500">
      <button class="cn-send" id="cn-send">➤</button>
    </div>
    <div class="cn-footer">Powered by <a href="https://airmate.es" target="_blank">Airmate</a></div>
  `;
  document.body.appendChild(chat);

  /* ─── STATE ─── */
  let isOpen = false;
  let isLoading = false;
  let history = [];
  let sugsShown = true;

  /* ─── INIT ─── */
  function init() {
    addMsg('bot', CFG.greeting);
    renderSugs();
    loadSlots();
  }

  /* ─── TOGGLE ─── */
  btn.addEventListener('click', () => {
    isOpen = !isOpen;
    chat.classList.toggle('visible', isOpen);
    btn.classList.toggle('open', isOpen);
    document.getElementById('cn-btn-icon').textContent = isOpen ? '✕' : '🌊';
    const notif = btn.querySelector('.cn-notif');
    if (notif) notif.remove();
    if (isOpen) setTimeout(() => document.getElementById('cn-input').focus(), 300);
  });
  document.getElementById('cn-close').addEventListener('click', () => {
    isOpen = false;
    chat.classList.remove('visible');
    btn.classList.remove('open');
    document.getElementById('cn-btn-icon').textContent = '🌊';
  });

  /* ─── SUGERENCIAS ─── */
  function renderSugs() {
    const el = document.getElementById('cn-sugs');
    el.innerHTML = CFG.suggestions.map(s =>
      `<button class="cn-sug">${s}</button>`
    ).join('');
    el.querySelectorAll('.cn-sug').forEach(b => {
      b.addEventListener('click', () => {
        el.innerHTML = '';
        sugsShown = false;
        send(b.textContent);
      });
    });
  }

  /* ─── MENSAJES ─── */
  function addMsg(role, text) {
    const msgs = document.getElementById('cn-msgs');
    const now = new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    const div = document.createElement('div');
    div.className = `cn-msg ${role}`;
    div.innerHTML = `<div class="cn-bubble">${esc(text)}</div><div class="cn-msg-time">${now}</div>`;
    msgs.appendChild(div);
    msgs.scrollTop = msgs.scrollHeight;
    return div;
  }

  function showTyping() {
    const msgs = document.getElementById('cn-msgs');
    const div = document.createElement('div');
    div.className = 'cn-msg bot';
    div.id = 'cn-typing';
    div.innerHTML = '<div class="cn-typing"><span></span><span></span><span></span></div>';
    msgs.appendChild(div);
    msgs.scrollTop = msgs.scrollHeight;
  }

  function hideTyping() {
    const t = document.getElementById('cn-typing');
    if (t) t.remove();
  }

  function esc(s) {
    return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
            .replace(/\n/g,'<br>');
  }

  /* ─── SLOTS SUPABASE ─── */
  let bookedSlots = [];
  function loadSlots() {
    const today = new Date().toISOString().slice(0,10);
    fetch(`${SB_URL}/rest/v1/appointments?business_slug=eq.costa-norte&date=gte.${today}&select=date,time,service&limit=200`, {
      headers: { 'apikey': SB_KEY, 'Authorization': 'Bearer ' + SB_KEY }
    })
    .then(r => r.json())
    .then(rows => { if (Array.isArray(rows)) bookedSlots = rows; })
    .catch(() => {});
  }

  /* ─── GUARDAR RESERVA EN SUPABASE ─── */
  function saveAppointment(data) {
    return fetch(`${SB_URL}/rest/v1/appointments`, {
      method: 'POST',
      headers: {
        'apikey': SB_KEY,
        'Authorization': 'Bearer ' + SB_KEY,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({
        business_slug: 'costa-norte',
        name: data.name || 'Cliente web',
        email: data.email || '',
        phone: data.phone || '',
        service: data.service || 'Consulta',
        date: data.date || new Date().toISOString().slice(0,10),
        time: data.time || '10:00',
        notes: data.notes || '',
        status: 'pending'
      })
    });
  }

  /* ─── GUARDAR LEAD EN SUPABASE ─── */
  function saveLead(name, email, phone, msg) {
    return fetch(`${SB_URL}/rest/v1/leads`, {
      method: 'POST',
      headers: {
        'apikey': SB_KEY,
        'Authorization': 'Bearer ' + SB_KEY,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({
        business_slug: 'costa-norte',
        name: name || 'Visitante web',
        email: email || '',
        phone: phone || '',
        message: msg || '',
        source: 'widget',
        status: 'new'
      })
    });
  }

  /* ─── SEND ─── */
  function send(text) {
    if (!text?.trim() || isLoading) return;
    document.getElementById('cn-input').value = '';
    addMsg('user', text);
    history.push({ role: 'user', content: text });

    // Detectar datos de contacto en el mensaje para guardar lead
    const emailMatch = text.match(/[\w.-]+@[\w.-]+\.\w+/);
    const phoneMatch = text.match(/[\+\d][\d\s-]{8,}/);
    if (emailMatch || phoneMatch) {
      saveLead('Visitante web', emailMatch?.[0] || '', phoneMatch?.[0] || '', text);
    }

    isLoading = true;
    document.getElementById('cn-send').disabled = true;
    showTyping();

    const messages = [
      { role: 'system', content: SYSTEM_PROMPT + '\n\nCITAS OCUPADAS HOY: ' + JSON.stringify(bookedSlots.slice(0,20)) },
      ...history.slice(-10)
    ];

    fetch(PROXY, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages, slug: SLUG })
    })
    .then(r => r.json())
    .then(data => {
      hideTyping();
      const reply = data.choices?.[0]?.message?.content || data.reply || 'Un momento, ahora te atiendo 🌊';
      history.push({ role: 'assistant', content: reply });
      addMsg('bot', reply);

      // Detectar intención de reserva en la respuesta para guardar en Supabase
      const lower = text.toLowerCase();
      if ((lower.includes('reservar') || lower.includes('apuntar') || lower.includes('clase')) &&
          history.length > 4) {
        const nameMatch = text.match(/(?:me llamo|soy|nombre[:\s]+)([A-ZÁÉÍÓÚ][a-záéíóú]+(?:\s[A-ZÁÉÍÓÚ][a-záéíóú]+)?)/i);
        if (nameMatch) {
          saveAppointment({ name: nameMatch[1], service: 'Consulta web', notes: text });
        }
      }
    })
    .catch(() => {
      hideTyping();
      addMsg('bot', 'Lo siento, ha habido un problema. Llámanos al 942 71 25 04 y te atendemos enseguida 🌊');
    })
    .finally(() => {
      isLoading = false;
      document.getElementById('cn-send').disabled = false;
    });
  }

  /* ─── EVENTS ─── */
  document.getElementById('cn-send').addEventListener('click', () => {
    send(document.getElementById('cn-input').value);
  });
  document.getElementById('cn-input').addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(e.target.value); }
  });

  /* ─── START ─── */
  init();

  // Auto-open después de 8 segundos si no han interactuado
  setTimeout(() => {
    if (!isOpen) {
      chat.classList.add('visible');
      isOpen = true;
      btn.classList.add('open');
      document.getElementById('cn-btn-icon').textContent = '✕';
    }
  }, 8000);

})();
