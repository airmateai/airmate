/* Salvajes · asistente que responde dudas frecuentes en la web.
   1) Intenta responder con IA (proxy de Airmate) usando solo los datos de la barbería.
   2) Si la IA no está disponible, responde con los datos de datos.js (horario, carta, dirección, reservas).
   Cada pregunta se guarda para que el panel enseñe cuántas se resolvieron sin pasar a WhatsApp. */
(() => {
if (window.SV_MODO === 'marca' || new URLSearchParams(location.search).has('embed')) return;
const PROXY = 'https://bot-airmate-1.vercel.app/api/chat';
const USAR_IA = false; // de momento respuestas programadas; se activa cuando el cliente pague y haya saldo de IA
const $ = id => document.getElementById(id), esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const EN = document.documentElement.lang === 'en';
const DXB = SEDE.pais === 'AE';
const tx = (es, en) => EN ? en : es;
const nS = s => EN ? s.n : s.es, din = n => SV.din(n);
const quita = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
const horario = () => DXB && EN ? 'every day, 10:00–22:00' : SEDE.horTxt.toLowerCase();

/* ── respuestas con los datos de la barbería ── */
function servicioDe(q){ const p = quita(q); let mejor = null, pts = 0;
  SV_SERV.forEach(s => { const ws = (quita(s.es) + ' ' + quita(s.n)).split(/[^a-zñ]+/).filter(w => w.length > 3); const n = ws.filter(w => p.includes(w)).length; if (n > pts){ pts = n; mejor = s; } });
  return mejor; }
function local(q){
  const p = quita(q), s = servicioDe(q), db = svCargar(), pago = db.pagoWeb || 'centro';
  const R = (tema, txt, acc) => ({ tema, txt, acc, ok: tema !== 'humano' });
  if (/^(hola|buenas|hey|hello|hi)\b/.test(p) && p.length < 18) return R('saludo', tx('¡Hola! Pregúntame lo que quieras: precios, horario, dónde estamos o cómo reservar.', 'Hi! Ask me anything: prices, hours, where we are or how to book.'));
  if (/cancel|anul|cambiar|mover|reprogram|reschedul|change my/.test(p)) return R('cambios', tx('Puedes cambiar o anular tu cita respondiendo al recordatorio de WhatsApp que te llega el día antes. Si es para hoy, avísanos cuanto antes y te buscamos otro hueco.', 'You can change or cancel by replying to the WhatsApp reminder we send the day before. If it’s for today, let us know as soon as possible and we’ll find another slot.'), 'reservar');
  if (/reserv|cita|turno|hueco|libre|book|appointment|slot|disponib/.test(p)) return R('reservar', tx('Reservas aquí mismo en un minuto: eliges servicio, barbero (o el primero libre) y hora. Solo verás huecos libres de verdad.', 'You can book right here in a minute: pick a service, a barber (or first available) and a time. You only see real free slots.'), 'reservar');
  if (/pag|tarjeta|efectivo|bizum|card|cash|pay|apple/.test(p)) return R('pago', pago === 'centro' ? tx('Se paga en la barbería al terminar, con tarjeta o en efectivo. Reservar online no cuesta nada.', 'You pay at the shop after your service, by card or cash. Booking online is free.') : pago === 'senal' ? tx(`Si es tu primera vez, se deja una señal de ${DXB ? '20 AED' : '5 €'} con tarjeta al reservar y se descuenta del servicio. El resto, en la barbería.`, `First visit: a ${DXB ? '20 AED' : '€5'} card deposit when booking, taken off your bill. The rest at the shop.`) : tx('Se paga online con tarjeta al reservar.', 'You pay online by card when you book.'));
  if (/donde|direcci|ubicac|llegar|mapa|calle|where|address|locat|direction|parking|aparc/.test(p)) return R('direccion', tx(`Estamos en ${SEDE.dir}. Abrimos ${horario()}.`, `We’re at ${SEDE.dir}. Open ${horario()}.`), 'mapa');
  if (/horari|abr|cerr|hora|domingo|sabado|festivo|open|hours|close|sunday|today|hoy/.test(p) && !s) return R('horario', tx(`Abrimos ${horario()}.`, `We’re open ${horario()}.`) + (SEDE.dias.length < 7 ? tx(' Los domingos, cerrado.', ' Closed on Sundays.') : ''), 'reservar');
  if (/dura|tarda|tiempo|long|minut/.test(p) && s) return R('duracion', tx(`${nS(s)} dura unos ${s.min} minutos.`, `${nS(s)} takes about ${s.min} minutes.`), 'reservar');
  if (s) return R('precio', tx(`${nS(s)}: ${din(s.p)} · ${s.min} min.`, `${nS(s)}: ${din(s.p)} · ${s.min} min.`), 'reservar:' + s.k);
  if (/precio|cuanto|cuesta|vale|tarifa|carta|price|cost|how much|menu/.test(p)) { const top = ['corte','cb','barba', DXB ? 'fade' : 'kids'].map(k => SV.S(k)); return R('precio', tx('Algunos precios: ', 'Some prices: ') + top.map(x => `${nS(x)} ${din(x.p)}`).join(' · ') + tx('. La carta completa está más abajo.', '. Full menu below.'), 'carta'); }
  if (/nin|crio|hijo|kid|child|son/.test(p)) { const k = SV.S('kids'); return R('precio', tx(`Sí, cortamos a niños: ${nS(k)} por ${din(k.p)}.`, `Yes, we cut kids’ hair: ${nS(k)} for ${din(k.p)}.`), 'reservar:kids'); }
  if (/barcelona|dubai|dubái|otra|sede|local|shop|branch/.test(p)) return R('sedes', tx('Tenemos dos barberías en Barcelona (Horta y una segunda) y una en Dubái (JVC).', 'We have two shops in Barcelona and one in Dubai (JVC).'));
  if (/ingles|english|espanol|spanish|idioma|language/.test(p)) return R('idioma', tx('Te atendemos en español e inglés.', 'We speak Spanish and English.'));
  return R('humano', tx('Eso prefiero que te lo confirme el equipo para no decirte nada mal.', 'I’d rather the team confirms that so I don’t get it wrong.'), 'humano');
}
/* ── IA (si está disponible) ── */
function prompt(){ return `Eres el asistente de la web de Salvajes Barbershop, sede ${SEDE.n}. Responde en ${EN ? 'inglés' : 'español'}, en 1 o 2 frases, cercano y directo, sin emojis.
Usa SOLO estos datos; si algo no está aquí, di que lo confirma el equipo y termina con [HUMANO].
Dirección: ${SEDE.dir}. Horario: ${SEDE.horTxt}. Teléfono: ${SEDE.tel || 'no disponible'}.
Pago: ${({ centro:'en la barbería al terminar, tarjeta o efectivo', senal:'señal online con tarjeta para clientes nuevos, el resto en la barbería', total:'online con tarjeta al reservar' })[svCargar().pagoWeb || 'centro']}.
Servicios (nombre, duración, precio): ${SV_SERV.map(s => `${s.es} ${s.min} min ${din(s.p)}`).join('; ')}.
Equipo: ${SV_EQUIPO.map(e => e.n + ' (' + e.rol + ')').join(', ')}.
Si quieren reservar, cambiar o anular una cita, termina con [RESERVAR].`; }
async function ia(hist){
  if (!USAR_IA) return null;
  const ctl = new AbortController(), to = setTimeout(() => ctl.abort(), 8000);
  try { const r = await fetch(PROXY, { method:'POST', headers:{ 'Content-Type':'application/json' }, signal:ctl.signal, body:JSON.stringify({ system_prompt:prompt(), messages:hist.slice(-8) }) });
    const d = await r.json(); if (!r.ok || !d.reply) return null; return d.reply.trim(); } catch(e){ return null; } finally { clearTimeout(to); } }

/* ── interfaz ── */
const CHIPS = EN ? ['How much is a haircut?','What are your hours?','Where are you?','How do I pay?'] : ['¿Cuánto cuesta un corte?','¿Qué horario tenéis?','¿Dónde estáis?','¿Cómo se paga?'];
const st = document.createElement('style'); st.textContent = `
.ch-b{position:fixed;right:18px;bottom:18px;z-index:42;display:flex;align-items:center;gap:10px;height:54px;padding:0 20px 0 16px;border-radius:999px;background:var(--paper);color:var(--ink);box-shadow:0 14px 40px -12px rgba(0,0,0,.55);font-size:13px;font-weight:600;letter-spacing:.04em;border:1px solid var(--line)}
.ch-b i{width:9px;height:9px;border-radius:50%;background:#2f9e5b;box-shadow:0 0 0 4px rgba(47,158,91,.18)}
.wa{bottom:84px!important}
.ch{position:fixed;right:18px;bottom:84px;z-index:85;width:min(390px,calc(100vw - 24px));height:min(600px,calc(100svh - 110px));background:var(--paper);color:var(--ink);display:flex;flex-direction:column;box-shadow:0 30px 80px -20px rgba(0,0,0,.6);border:1px solid var(--line);transform:translateY(16px) scale(.98);opacity:0;pointer-events:none;transition:transform .45s var(--e),opacity .3s}
.ch.on{transform:none;opacity:1;pointer-events:auto}
.ch-h{display:flex;align-items:center;gap:12px;padding:16px 18px;background:var(--ink);color:var(--paper)}
.ch-h b{font-family:'Big Shoulders Display';font-weight:800;font-size:22px;text-transform:uppercase;line-height:1;display:block}.ch-h small{color:var(--mu-d);font-size:12px}
.ch-h button{margin-left:auto;color:var(--paper);font-size:20px;width:32px;height:32px}
.ch-m{flex:1;overflow:auto;padding:18px;display:flex;flex-direction:column;gap:10px}
.ms{max-width:86%;padding:11px 14px;font-size:14.5px;line-height:1.45}
.ms.yo{align-self:flex-end;background:var(--ink);color:var(--paper)}
.ms.bot{align-self:flex-start;background:#fff;border:1px solid var(--line)}
.ms .acc{display:flex;gap:6px;flex-wrap:wrap;margin-top:10px}.ms .acc button,.ms .acc a{font-size:11.5px;letter-spacing:.12em;text-transform:uppercase;font-weight:600;border:1px solid var(--ink);padding:7px 10px;text-decoration:none}
.ms .acc .pri{background:var(--ink);color:var(--paper)}
.ch-c{display:flex;gap:6px;flex-wrap:wrap;padding:0 18px 12px}.ch-c button{font-size:12.5px;border:1px solid var(--line);padding:7px 11px;background:#fff}.ch-c button:hover{border-color:var(--ink)}
.ch-f{display:flex;border-top:1px solid var(--line)}.ch-f input{flex:1;border:0;background:none;padding:16px 18px;outline:0;font-size:15px}.ch-f button{padding:0 18px;font-size:12px;letter-spacing:.14em;text-transform:uppercase;font-weight:700}
.pt{display:inline-flex;gap:4px}.pt i{width:6px;height:6px;border-radius:50%;background:var(--mu);animation:pt 1s infinite}.pt i:nth-child(2){animation-delay:.15s}.pt i:nth-child(3){animation-delay:.3s}@keyframes pt{50%{opacity:.25}}
.ch-n{font-size:11px;color:var(--mu);text-align:center;padding:0 18px 10px}
@media(max-width:560px){.ch{right:12px;left:12px;width:auto;bottom:80px}.ch-b{right:12px;bottom:12px}}`;
document.head.appendChild(st);
const btn = document.createElement('button'); btn.className = 'ch-b'; btn.innerHTML = `<i></i>${tx('¿Dudas? Pregunta', 'Questions? Ask')}`; document.body.appendChild(btn);
const box = document.createElement('div'); box.className = 'ch'; box.setAttribute('role','dialog'); box.setAttribute('aria-label', tx('Asistente','Assistant'));
box.innerHTML = `<div class="ch-h"><div><b>Salvajes · ${esc(SEDE.corto)}</b><small>${tx('Asistente · responde al momento, 24 h','Assistant · instant answers, 24/7')}</small></div><button aria-label="${tx('Cerrar','Close')}">×</button></div>
  <div class="ch-m" id="chM" data-lenis-prevent></div><div class="ch-c" id="chC">${CHIPS.map(c => `<button>${esc(c)}</button>`).join('')}</div>
  <form class="ch-f" id="chF"><input id="chI" autocomplete="off" placeholder="${tx('Escribe tu pregunta…','Type your question…')}"><button>${tx('Enviar','Send')}</button></form>
  <div class="ch-n">${tx('Asistente automático. Para algo concreto, te pasa con el equipo.','Automated assistant. For anything specific, it hands you to the team.')}</div>`;
document.body.appendChild(box);
const M = $('chM'), hist = [];
const abrirCh = () => { box.classList.add('on'); btn.style.display = 'none'; window.SV_LENIS?.stop?.(); if (!M.children.length) poner('bot', tx('Hola, soy el asistente de Salvajes. Te resuelvo precios, horario, dirección y reservas al momento. ¿Qué necesitas?', 'Hi, I’m the Salvajes assistant. I can answer prices, hours, location and bookings instantly. What do you need?')); setTimeout(() => $('chI').focus(), 300); };
const cerrarCh = () => { box.classList.remove('on'); btn.style.display = ''; window.SV_LENIS?.start?.(); };
btn.onclick = abrirCh; box.querySelector('.ch-h button').onclick = cerrarCh;
function acciones(acc){ if (!acc) return ''; const [a, k] = acc.split(':'); const wa = SEDE.wa ? `https://wa.me/${SEDE.wa}` : null;
  if (a === 'reservar') return `<div class="acc"><button class="pri" data-r="${k || ''}">${tx('Reservar ahora','Book now')}</button></div>`;
  if (a === 'mapa') return `<div class="acc"><a target="_blank" rel="noopener" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(SEDE.mapa)}">${tx('Cómo llegar','Directions')}</a><button class="pri" data-r="">${tx('Reservar','Book')}</button></div>`;
  if (a === 'carta') return `<div class="acc"><button data-ir="carta">${tx('Ver la carta','See the menu')}</button><button class="pri" data-r="">${tx('Reservar','Book')}</button></div>`;
  if (a === 'humano') return `<div class="acc">${wa ? `<a class="pri" target="_blank" rel="noopener" href="${wa}">${tx('Hablar con el equipo','Talk to the team')}</a>` : `<span style="font-size:12.5px;color:var(--mu)">${tx('El equipo te contesta en horario de apertura.','The team replies during opening hours.')}</span>`}</div>`;
  return ''; }
function poner(quien, txt, acc){ const d = document.createElement('div'); d.className = 'ms ' + quien; d.innerHTML = esc(txt) + acciones(acc); M.appendChild(d); M.scrollTop = M.scrollHeight;
  d.querySelectorAll('[data-r]').forEach(b => b.onclick = () => { cerrarCh(); SVW.abrir(b.dataset.r || undefined); });
  d.querySelectorAll('[data-ir]').forEach(b => b.onclick = () => { cerrarCh(); const el = $(b.dataset.ir); window.SV_LENIS ? SV_LENIS.scrollTo(el, { offset:-60 }) : el.scrollIntoView({ behavior:'smooth' }); }); return d; }
function registrar(q, tema, ok, via){ try { const db = svCargar(); (db.chat = db.chat || []).push({ t:Date.now(), f:SV.masD(0), q:q.slice(0,140), tema, ok, via }); svGuardar(db); } catch(e){} }
async function preguntar(q){ q = q.trim(); if (!q) return; $('chC').style.display = 'none'; poner('yo', q); hist.push({ role:'user', content:q });
  const pens = poner('bot', ''); pens.innerHTML = '<span class="pt"><i></i><i></i><i></i></span>';
  const base = local(q); let txt = null, via = 'datos';
  const r = await ia(hist); if (r){ via = 'ia'; txt = r.replace(/\[(HUMANO|RESERVAR)\]/g, '').trim(); if (/\[HUMANO\]/.test(r)){ base.acc = 'humano'; base.ok = false; } else if (/\[RESERVAR\]/.test(r)) base.acc = base.acc && base.acc.startsWith('reservar') ? base.acc : 'reservar'; else if (base.tema === 'humano'){ base.ok = true; base.acc = null; } }
  else await new Promise(res => setTimeout(res, 700));
  pens.remove(); poner('bot', txt || base.txt, base.acc); hist.push({ role:'assistant', content:txt || base.txt }); registrar(q, base.tema, base.ok, via); }
$('chF').onsubmit = e => { e.preventDefault(); const i = $('chI'); preguntar(i.value); i.value = ''; };
$('chC').querySelectorAll('button').forEach(b => b.onclick = () => preguntar(b.textContent));
addEventListener('keydown', e => { if (e.key === 'Escape') cerrarCh(); });
})();
