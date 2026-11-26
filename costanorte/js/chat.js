/* Costa Norte · asistente de dudas flotante (IA). Responde con los datos de la web y consulta
   disponibilidad y precios reales; para reservar siempre manda a la web o a WhatsApp. */
(function () {
  if (window.__cnChat) return; window.__cnChat = true;
  var PROXY = 'https://bot-airmate-1-sooty.vercel.app/api/chat';
  var SB = 'https://vjofxmfwdybktpwiuanc.supabase.co';
  var KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZqb2Z4bWZ3ZHlia3Rwd2l1YW5jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ0NzU5NDYsImV4cCI6MjA5MDA1MTk0Nn0.ixU-33c0FEkO7F5xjWb3YHkvj_pQuR0gsJETrGA8ZTE';
  var WA = 'https://wa.me/34609282963';
  var BASE = (function () { var s = document.currentScript && document.currentScript.src; return s ? s.replace(/js\/chat\.js.*$/, '') : '/costanorte/'; })();
  var MAX = 30, RESERVAS_CLASES = new URL('../costa-norte-reservas.html', BASE).href;
  var hoy = new Date(), hoyIso = hoy.getFullYear() + '-' + String(hoy.getMonth() + 1).padStart(2, '0') + '-' + String(hoy.getDate()).padStart(2, '0');

  var TIPOS = '36 Bajo con terraza (hasta 3, 6 iguales) · 39 Bajo (hasta 4, 2) · 44 Apartamento de 1 dormitorio (hasta 4, 3) · 47 Apartamento estándar (hasta 3, 1) · 31 Apartamento con terraza (hasta 4, 2) · 34 Bajo de dos habitaciones (hasta 5, 1, 60 m²) · 28 Piso (hasta 2, 1) · 46 Loft (hasta 4, literas, 2) · 48 Estudio (hasta 4, literas, 2)';
  var SYS = [
    'Eres el asistente de la web de Costa Norte Surf Center, escuela de surf y apartamentos en San Vicente de la Barquera (Cantabria). Hoy es ' + hoyIso + '.',
    'Hablas en el idioma del cliente (normalmente español), cercano y breve: 1 a 4 frases, sin listas largas, sin emojis salvo uno ocasional. Tuteas.',
    'REGLA PRINCIPAL: SOLO das datos que estén escritos aquí o que te devuelvan las herramientas. Si algo no está (edades mínimas de surf, horarios de un día concreto, comidas, temas médicos, cualquier detalle que no aparezca), di claramente que no lo sabes y ofrece WhatsApp 609 282 963. Nunca supongas ni inventes cifras, edades, fechas, precios ni promociones.',
    'No menciones ids internos. Da los precios exactos que devuelvan las herramientas (sin «aprox.» ni «≈»). Pon los enlaces tal cual, sin punto pegado detrás.',
    'No puedes reservar ni cobrar: para reservar das el enlace que te devuelva la herramienta o la página correspondiente.',
    '',
    'LA ESCUELA: desde 2005, fundada por Iván Aja «Norrys». Escuela oficial de San Vicente, homologada por las federaciones cántabra, española y europea. Rip Curl patrocina desde 2006. Monitores titulados ISA, TD1, TD2 e INEF.',
    'Clases de surf de 2 horas, de mañana o de tarde, grupos reducidos, tabla, traje Rip Curl y seguro incluidos. Niveles: iniciación (la web dice «tengas la edad que tengas»; la edad mínima concreta para niños no la sabes: que pregunten por WhatsApp), perfeccionamiento, competición (con vídeo-corrección). También clases particulares, surfskate y SUP (en la ría, en las olas de Merón, SUP Race o particular; desde 7 años).',
    'Reservar clases: ' + BASE + '../costa-norte-reservas.html (eliges días y te sale el precio). Los precios de clases sueltas no los des de memoria: usa la herramienta precio_clases y di que es orientativo.',
    'Playas: Merón (olas, surf y SUP), la ría (agua plana para empezar SUP), Oyambre (parque natural, a 50 m de los apartamentos).',
    'Tienda embajadora Rip Curl en Cantabria; tablas Norrys (marca propia desde 2015), Channel Islands, Lost, DHD, Hayden Shapes, FCS, Dakine. Alquiler: softboards, shortboards, longboards, evolutivas, tablas de SUP, bodyboards, aletas, surfskate Miller y trajes.',
    '',
    'APARTAMENTOS: 20 apartamentos en el paseo marítimo, a 50 m de la playa y junto a la escuela, reformados en 2019. Tipos (id, nombre, capacidad, cuántos hay): ' + TIPOS + '.',
    'Todos incluyen wifi, TV, lavadora, calefacción, toallas y ropa de cama; guarda tablas en la escuela; aparcamiento público gratuito al lado. Llegada desde las 16:00, salida hasta las 11:00. Check-in online antes de llegar.',
    'Cancelación: gratis hasta 5 días antes de la llegada; después, o si no vienes, se cobra la primera noche. Pago por transferencia al reservar; se sube el justificante y se confirma en menos de 24 horas. Precio directo en la web, más barato que en plataformas.',
    'Para disponibilidad y precio de unas fechas usa la herramienta disponibilidad. Si falta algún dato (fechas o personas), pregúntalo.',
    '',
    'SURF CAMPS: San Vicente (el más pedido, surf o SUP cada día), Extreme (más horas de agua), Rip Curl (una vez al año, con surfistas de Rip Curl), Solo chicas. Incluyen alojamiento, clases cada día de 2 o 4 horas, tabla, traje y seguro, charlas, longskate, cine surfero, vídeo-corrección, fiesta de despedida y diploma; desayuno, media pensión o pensión completa según el camp (las comidas las detalla el equipo).',
    'SURF CAMP A MEDIDA en la web: eliges apartamento, noches y clases (surf en grupo, particular o SUP) y se aplica solo el descuento de surf camp. Para calcularlo usa la herramienta presupuesto_surfcamp. Enlace: ' + BASE + 'apartamentos/?surfcamp=1#buscar',
    '',
    'CAMPAMENTO DE VERANO PARA CHAVALES con Costa Verde Surf Experience: una semana en una casa rural frente a la playa de Merón, el surf lo da Costa Norte. Pensión completa con menús para cualquier dieta, 15 horas de surf, material, sudadera y camisetas, monitores 24 h, actividades, fiestas, visita a Comillas, seguro, fotos y vídeos. Semanas: 28 de junio al 5 de julio y 5 al 11 de julio, 780 € reservando con Costa Norte (normal 880 €); la plaza se reserva con 200 €. Inscripción: ' + BASE + 'surf-camps/#inscripcion',
    '',
    'CONTACTO: Av. Francisco Giner de los Ríos 46, San Vicente de la Barquera. WhatsApp 609 282 963, teléfono 942 712 504, comunicacion@escueladesurfcostanorte.com.',
    'Si alguien quiere hablar con una persona, quiere un grupo grande, tiene una queja o algo que no sepas: WhatsApp 609 282 963.'
  ].join('\n');

  var TOOLS = [
    { type: 'function', function: { name: 'disponibilidad', description: 'Apartamentos libres y precio total para unas fechas y personas.', parameters: { type: 'object', properties: {
      entrada: { type: 'string', description: 'Fecha de llegada AAAA-MM-DD' }, salida: { type: 'string', description: 'Fecha de salida AAAA-MM-DD' }, personas: { type: 'integer' } }, required: ['entrada', 'salida', 'personas'] } } },
    { type: 'function', function: { name: 'presupuesto_surfcamp', description: 'Precio de un surf camp a medida: apartamento + clases, con el descuento aplicado.', parameters: { type: 'object', properties: {
      tipo_id: { type: 'integer', description: 'id del tipo de apartamento' }, entrada: { type: 'string' }, salida: { type: 'string' },
      clases_tipo: { type: 'string', enum: ['surf', 'particular', 'sup'] }, nivel: { type: 'string', enum: ['Iniciacion', 'Avanzado'] },
      personas_clase: { type: 'integer' }, num_clases: { type: 'integer' } }, required: ['tipo_id', 'entrada', 'salida', 'clases_tipo', 'personas_clase', 'num_clases'] } } },
    { type: 'function', function: { name: 'precio_clases', description: 'Precio orientativo de clases sin alojamiento.', parameters: { type: 'object', properties: {
      clases_tipo: { type: 'string', enum: ['surf', 'particular', 'sup'] }, nivel: { type: 'string', enum: ['Iniciacion', 'Avanzado'] },
      personas: { type: 'integer' }, num_clases: { type: 'integer' } }, required: ['clases_tipo', 'personas', 'num_clases'] } } }
  ];

  function rpc(fn, body) {
    return fetch(SB + '/rest/v1/rpc/' + fn, { method: 'POST', headers: { apikey: KEY, Authorization: 'Bearer ' + KEY, 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      .then(function (r) { return r.json().then(function (j) { if (!r.ok) throw new Error(j.message || 'error'); return j; }); });
  }
  function fechaOk(s) { return /^\d{4}-\d{2}-\d{2}$/.test(s || ''); }
  function herramienta(nombre, a) {
    try {
      if (nombre === 'disponibilidad') {
        if (!fechaOk(a.entrada) || !fechaOk(a.salida)) return Promise.resolve({ error: 'Faltan fechas válidas' });
        return rpc('cn_apt_disponibilidad', { p_entrada: a.entrada, p_salida: a.salida, p_personas: Math.max(1, +a.personas || 1) }).then(function (l) {
          var libres = (l || []).filter(function (x) { return x.libres > 0; });
          return { fechas: a.entrada + ' a ' + a.salida, libres: libres.map(function (x) { return { tipo_id: x.tipo_id, nombre: x.nombre, capacidad: x.capacidad, quedan: x.libres, total_euros: +x.total, noches: x.noches, estancia_minima: x.estancia_min }; }),
            enlace_reserva: BASE + 'apartamentos/?reservar=1&entrada=' + a.entrada + '&salida=' + a.salida + '&personas=' + (+a.personas || 1) + '#buscar',
            nota: libres.length ? 'Si la estancia es menor que la estancia mínima, no se puede reservar así.' : 'No queda nada libre para esas fechas y personas.' };
        });
      }
      if (nombre === 'presupuesto_surfcamp') {
        if (!fechaOk(a.entrada) || !fechaOk(a.salida)) return Promise.resolve({ error: 'Faltan fechas válidas' });
        return rpc('cn_surfcamp_presupuesto', { p_tipo: +a.tipo_id, p_entrada: a.entrada, p_salida: a.salida, p_cantidad: 1, p_clases_tipo: a.clases_tipo,
          p_clases_nivel: a.clases_tipo === 'surf' ? (a.nivel || 'Iniciacion') : null, p_clases_personas: +a.personas_clase, p_clases_num: +a.num_clases }).then(function (p) {
          p.enlace_reserva = BASE + 'apartamentos/?surfcamp=1&clases=' + (+a.num_clases) + '&reservar=1&tipo=' + (+a.tipo_id) + '&entrada=' + a.entrada + '&salida=' + a.salida + '&personas=' + (+a.personas_clase) + '#buscar';
          p.nota = 'Precio con el descuento de surf camp ya aplicado, sujeto a disponibilidad al reservar.';
          return p;
        });
      }
      if (nombre === 'precio_clases') {
        return rpc('cn_clases_precio', { p_tipo: a.clases_tipo, p_nivel: a.nivel || 'Iniciacion', p_personas: +a.personas, p_num: +a.num_clases })
          .then(function (n) { return { precio_orientativo_euros: +n, nota: 'Orientativo. Si te alojas con nosotros, las clases llevan descuento.', enlace_reserva: RESERVAS_CLASES }; });
      }
    } catch (e) {}
    return Promise.resolve({ error: 'Herramienta no disponible' });
  }

  /* interfaz */
  var css = '.cnc{position:fixed;right:18px;bottom:18px;z-index:900;font-family:inherit}' +
    '.cnc__btn{display:flex;align-items:center;gap:10px;background:var(--color-ink,#0b1f2a);color:var(--color-paper,#fff);border:0;border-radius:999px;padding:12px 18px 12px 14px;font:inherit;font-weight:600;cursor:pointer;box-shadow:0 10px 30px -10px rgba(0,0,0,.5)}' +
    '.cnc__btn svg{width:22px;height:22px;flex:none}' +
    '.cnc__btn:focus-visible,.cnc button:focus-visible,.cnc input:focus-visible,.cnc a:focus-visible{outline:2px solid var(--color-focus,#3b9fd1);outline-offset:2px}' +
    '.cnc__panel{position:absolute;right:0;bottom:64px;width:min(380px,calc(100vw - 24px));height:min(560px,calc(100dvh - 110px));background:var(--color-paper,#fff);color:var(--color-ink,#0b1f2a);border-radius:16px;box-shadow:0 24px 60px -20px rgba(0,0,0,.45);display:flex;flex-direction:column;overflow:hidden;border:1px solid var(--color-rule,#d8dee2)}' +
    '.cnc__panel[hidden]{display:none}' +
    '.cnc__hd{display:flex;align-items:center;gap:10px;padding:14px 16px;background:var(--color-ink,#0b1f2a);color:var(--color-paper,#fff)}' +
    '.cnc__hd b{display:block;font-size:15px}.cnc__hd small{opacity:.75;font-size:12px}' +
    '.cnc__x{margin-left:auto;background:transparent;border:0;color:inherit;font-size:22px;line-height:1;cursor:pointer;padding:4px 8px;border-radius:8px}' +
    '.cnc__log{flex:1;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:10px;font-size:14.5px;line-height:1.45}' +
    '.cnc__m{max-width:85%;padding:10px 13px;border-radius:14px;white-space:pre-wrap;overflow-wrap:anywhere}' +
    '.cnc__m--b{background:var(--color-paper-2,#eef2f4);align-self:flex-start;border-bottom-left-radius:4px}' +
    '.cnc__m--u{background:var(--color-ink,#0b1f2a);color:var(--color-paper,#fff);align-self:flex-end;border-bottom-right-radius:4px}' +
    '.cnc__m a{color:inherit;font-weight:600}' +
    '.cnc__sug{display:flex;flex-wrap:wrap;gap:6px;padding:0 14px 10px}' +
    '.cnc__sug button{background:transparent;border:1px solid var(--color-rule,#cfd7dc);color:inherit;border-radius:999px;padding:6px 11px;font:inherit;font-size:13px;cursor:pointer}' +
    '.cnc__sug button:hover{border-color:var(--color-ink,#0b1f2a)}' +
    '.cnc__f{display:flex;gap:8px;padding:10px;border-top:1px solid var(--color-rule,#d8dee2)}' +
    '.cnc__f input{flex:1;min-width:0;border:1px solid var(--color-rule,#cfd7dc);border-radius:10px;padding:11px 12px;font:inherit;font-size:16px;background:var(--color-paper,#fff);color:inherit}' +
    '.cnc__f button{background:var(--color-ink,#0b1f2a);color:var(--color-paper,#fff);border:0;border-radius:10px;padding:0 14px;font:inherit;font-weight:600;cursor:pointer}' +
    '.cnc__f button[disabled]{opacity:.5;cursor:default}' +
    '.cnc__pie{font-size:11px;opacity:.6;text-align:center;padding:0 10px 8px}' +
    '.cnc__dots{display:inline-flex;gap:4px}.cnc__dots i{width:6px;height:6px;border-radius:50%;background:currentColor;opacity:.4;animation:cncb 1s infinite}.cnc__dots i:nth-child(2){animation-delay:.15s}.cnc__dots i:nth-child(3){animation-delay:.3s}' +
    '@keyframes cncb{50%{opacity:1}}' +
    '@media (prefers-reduced-motion:reduce){.cnc__dots i{animation:none;opacity:.7}}' +
    '@media (max-width:560px){.cnc{right:12px;bottom:12px}.cnc__btn span{display:none}.cnc__btn{padding:14px}}' +
    'body.cajon-abierto .cnc{display:none}';
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  var raiz = document.createElement('div'); raiz.className = 'cnc';
  raiz.innerHTML = '<div class="cnc__panel" id="cnc-panel" role="dialog" aria-label="Asistente de Costa Norte" hidden>' +
    '<div class="cnc__hd"><div><b>Costa Norte</b><small>Asistente · te responde al momento</small></div><button class="cnc__x" type="button" aria-label="Cerrar">×</button></div>' +
    '<div class="cnc__log" id="cnc-log" aria-live="polite"></div>' +
    '<div class="cnc__sug" id="cnc-sug"></div>' +
    '<form class="cnc__f" id="cnc-f"><input id="cnc-in" autocomplete="off" maxlength="500" placeholder="Escribe tu pregunta" aria-label="Tu pregunta"><button type="submit">Enviar</button></form>' +
    '<div class="cnc__pie">Asistente con IA. Para reservar o casos especiales, <a href="' + WA + '" target="_blank" rel="noopener">WhatsApp</a>.</div></div>' +
    '<button class="cnc__btn" type="button" aria-expanded="false" aria-controls="cnc-panel"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/></svg><span>¿Dudas? Pregúntanos</span></button>';
  document.body.appendChild(raiz);

  var panel = raiz.querySelector('.cnc__panel'), btn = raiz.querySelector('.cnc__btn'), log = raiz.querySelector('#cnc-log'), form = raiz.querySelector('#cnc-f'), inp = raiz.querySelector('#cnc-in'), sug = raiz.querySelector('#cnc-sug');
  var hist = []; try { hist = JSON.parse(sessionStorage.getItem('cnc') || '[]'); } catch (e) {}
  var enviados = 0, ocupado = false;

  function enlaces(t) {
    var esc = String(t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; });
    esc = esc.replace(/\*\*(.+?)\*\*/g, '$1').replace(/\[([^\]]+)\]\((https?:[^)\s]+)\)/g, '<a href="$2">$1</a>');
    return esc.replace(/(^|[\s(])(https?:\/\/[^\s<)]+?)([.,;:!?]*)(?=\s|$|<|\))/g, function (m, a, u, cola) { var txt = /costa-norte-reservas/.test(u) ? 'Reservar clase' : /surfcamp=1/.test(u) ? 'Montar mi surf camp' : /apartamentos/.test(u) ? 'Ver y reservar' : /inscripcion/.test(u) ? 'Inscripción' : /wa\.me/.test(u) ? 'WhatsApp' : u; return a + '<a href="' + u + '"' + (/wa\.me/.test(u) ? ' target="_blank" rel="noopener"' : '') + '>' + txt + '</a>' + cola; });
  }
  function burbuja(txt, quien) { var d = document.createElement('div'); d.className = 'cnc__m cnc__m--' + quien; d.innerHTML = quien === 'b' ? enlaces(txt) : String(txt).replace(/[&<>]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]; }); log.appendChild(d); log.scrollTop = log.scrollHeight; return d; }
  function guarda() { try { sessionStorage.setItem('cnc', JSON.stringify(hist.slice(-20))); } catch (e) {} }
  function pinta() {
    log.innerHTML = '';
    burbuja('¡Hola! Soy el asistente de Costa Norte. Pregúntame por clases, surf camps, apartamentos o el campamento de verano.', 'b');
    hist.forEach(function (m) { if ((m.role === 'user' || m.role === 'assistant') && m.content) burbuja(m.content, m.role === 'user' ? 'u' : 'b'); });
    sug.innerHTML = '';
    if (!hist.length) ['¿Hay apartamentos libres en agosto?', '¿Cuánto cuesta un surf camp?', 'Clases para niños', '¿Dónde estáis?'].forEach(function (s) {
      var b = document.createElement('button'); b.type = 'button'; b.textContent = s; b.addEventListener('click', function () { envia(s); }); sug.appendChild(b);
    });
  }
  function abre(on) { panel.hidden = !on; btn.setAttribute('aria-expanded', on); if (on) { pinta(); setTimeout(function () { inp.focus(); }, 30); } else btn.focus(); }
  btn.addEventListener('click', function () { abre(panel.hidden); });
  raiz.querySelector('.cnc__x').addEventListener('click', function () { abre(false); });
  addEventListener('keydown', function (e) { if (e.key === 'Escape' && !panel.hidden) abre(false); });
  form.addEventListener('submit', function (e) { e.preventDefault(); var t = inp.value.trim(); if (t) envia(t); });

  function llama(mensajes, vuelta, reintento) {
    return fetch(PROXY, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ system_prompt: SYS, messages: mensajes, tools: TOOLS }) })
      .then(function (r) { return r.json().then(function (j) { if (!r.ok) throw new Error(j.error || 'error'); return j; }); })
      .then(function (j) {
        if (j.tool_calls && vuelta < 3) {
          var am = j.assistant_message || { role: 'assistant', content: j.reply || '', tool_calls: j.tool_calls };
          am = { role: 'assistant', content: am.content || '', tool_calls: am.tool_calls || j.tool_calls };
          return Promise.all(j.tool_calls.map(function (tc) {
            var args = {}; try { args = JSON.parse(tc.function.arguments || '{}'); } catch (e) {}
            return herramienta(tc.function.name, args).catch(function (e) { return { error: String(e.message || e) }; })
              .then(function (res) { return { role: 'tool', tool_call_id: tc.id, content: JSON.stringify(res) }; });
          })).then(function (resp) { return llama(mensajes.concat([am]).concat(resp), vuelta + 1); });
        }
        return j.reply || '';
      }).catch(function (e) {
        if (reintento) throw e;
        var m = /again in ([\d.]+)s/.exec(String(e.message || '')), espera = m ? Math.min(+m[1] * 1000 + 500, 12000) : 2500;
        return new Promise(function (ok) { setTimeout(ok, espera); }).then(function () { return llama(mensajes, vuelta, true); });
      });
  }
  function envia(t) {
    if (ocupado) return;
    sug.innerHTML = ''; inp.value = '';
    if (++enviados > MAX) { burbuja(t, 'u'); burbuja('Para seguir, mejor escríbenos por WhatsApp al 609 282 963 y te atiende el equipo: ' + WA, 'b'); return; }
    hist.push({ role: 'user', content: t.slice(0, 500) }); guarda(); burbuja(t, 'u');
    ocupado = true; form.querySelector('button').disabled = true;
    var esp = burbuja('', 'b'); esp.innerHTML = '<span class="cnc__dots" aria-label="Escribiendo"><i></i><i></i><i></i></span>';
    llama(hist.slice(-12), 0).then(function (r) {
      r = (r || '').trim() || 'Perdona, no te he entendido bien. ¿Me lo preguntas de otra forma? O escríbenos por WhatsApp: ' + WA;
      esp.innerHTML = enlaces(r); hist.push({ role: 'assistant', content: r }); guarda();
    }).catch(function () {
      esp.innerHTML = enlaces('Ahora mismo no puedo responder. Escríbenos por WhatsApp al 609 282 963 y te contestamos: ' + WA);
    }).then(function () { ocupado = false; form.querySelector('button').disabled = false; log.scrollTop = log.scrollHeight; inp.focus(); });
  }
})();
