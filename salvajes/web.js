/* Salvajes · webs · una sola plantilla para la marca, Barcelona y Dubái.
   Usa datos.js (sede, carta, horarios) y escribe las reservas donde las lee el panel. */
(() => {
const $ = id => document.getElementById(id), esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const Q = new URLSearchParams(location.search), MARCA = window.SV_MODO === 'marca', EMBED = Q.has('embed');
const DXB = SEDE.pais === 'AE';
let L = Q.get('lang') === 'en' || Q.get('lang') === 'es' ? Q.get('lang') : (DXB && !MARCA ? 'en' : 'es');
const RAIZ = MARCA ? '' : '../';
const T = {
 es:{ reservar:'Reservar', carta:'Carta', trabajos:'Trabajos', resenas:'Reseñas', visita:'Visítanos', barberias:'Barberías',
  heroP: MARCA ? 'Barbería de calle con oficio. Dos sillas en Barcelona, una en Dubái y el mismo corte en las tres.' : DXB ? 'Una barbería de Barcelona en JVC. Degradados, barbas y color con barberos que hablan tu idioma.' : 'Barbería de barrio con oficio. Degradados, barbas, color y trenzas desde 2022.',
  dir:'Dirección', hor:'Horario', maniK:'Desde 2022', mani1:'No hacemos', mani2:'cortes de rebaño.', mani3:'Hacemos', mani4:'salvajes.',
  d1:'abrimos en Horta', d2:'barberías, 2 países', d3:'en Booksy · 603 reseñas', sedesT:'Barberías', sedesP:'Mismo nombre, mismo corte, misma forma de tratar a la gente. Elige la tuya.',
  aqui:'Estás aquí', cartaT:'La carta', cartaP: DXB ? 'Precios en dírhams. Precios de ejemplo para esta propuesta.' : 'Precios en euros, IVA incluido. Precios de vuestro Booksy (noviembre 2026).', destac:'El más pedido',
  galT:'Desde la silla', galP:'Trabajos reales del equipo. Más en Instagram.', resT:'Lo que dicen', resNota:'Nota media en Booksy de 603 clientes de Horta.', ver:'Ver',
  ctaT1:'Tu silla', ctaT2:'te espera.', ctaP:'Elige servicio, barbero y hora. Solo verás horas libres de verdad. Pagas en la barbería.', ctaB:'Reservar ahora', ctaM:'Elegir barbería',
  visT:'Visítanos', tel:'Teléfono', porConf:'Por confirmar', como:'Cómo llegar', regT:'Tarjeta regalo', regP:'Regala un buen corte. Se paga online y se canjea en la barbería.', regB:'Comprar',
  cats:{b:'Barbería',c:'Color',tr:'Trenzas',n:'Uñas y estética'}, min:'min',
  p1:'Servicio', p2:'Barbero', p3:'Día y hora', p4:'Tus datos', cualq:'El primero libre', cualqS:'Cualquier barbero del equipo', nombre:'Nombre', movil:'Móvil (WhatsApp)', conf:'Confirmar reserva', atras:'Atrás', sinH:'No quedan horas libres este día.', hoy:'Hoy', man:'Mañana',
  okT:'Reservado', okP:'Te llega un recordatorio por WhatsApp el día antes. Si no puedes venir, avísanos y te buscamos otro hueco.', otra:'Hacer otra reserva', con:'con', cerrar:'Cerrar', tuReserva:'Tu reserva',
  pSenal:'Clientes nuevos: una señal de '+(DXB?'20 AED':'5 €')+' con tarjeta (Stripe) te guarda la silla. Se descuenta del servicio.', pTotal:'Pagas online con tarjeta (Stripe) al reservar.',
  regOk:'Tarjeta regalo comprada', regTxt:'En la web real se paga con tarjeta (Stripe) y el código llega por email. La compra ya aparece en el panel.', importe:'Importe',
  prop:'Propuesta de Airmate para Salvajes · demo con datos de ejemplo', panel:'Ver el panel', elige:'¿En qué barbería?', foot:'Propuesta de Airmate · demo' },
 en:{ reservar:'Book', carta:'Menu', trabajos:'Work', resenas:'Reviews', visita:'Visit', barberias:'Shops',
  heroP: DXB ? 'A Barcelona barbershop in JVC. Fades, beards and colour by barbers who speak your language.' : 'A neighbourhood barbershop with craft. Fades, beards, colour and braids since 2022.',
  dir:'Address', hor:'Hours', maniK:'Since 2022', mani1:'We don’t do', mani2:'herd haircuts.', mani3:'We do', mani4:'salvajes.',
  d1:'opened in Horta', d2:'shops, 2 countries', d3:'on Booksy · 603 reviews', sedesT:'Shops', sedesP:'Same name, same cut, same way of treating people. Pick yours.',
  aqui:'You are here', cartaT:'The menu', cartaP: DXB ? 'Prices in AED. Example prices for this proposal.' : 'Prices in euros, VAT included.', destac:'Most booked',
  galT:'From the chair', galP:'Real work by the team. More on Instagram.', resT:'What they say', resNota:'Average Booksy rating from 603 clients of our Horta shop.', ver:'See',
  ctaT1:'Your chair', ctaT2:'is waiting.', ctaP:'Pick a service, a barber and a time. You only see real free slots. Pay at the shop.', ctaB:'Book now', ctaM:'Choose a shop',
  visT:'Visit us', tel:'Phone', porConf:'To be confirmed', como:'Directions', regT:'Gift card', regP:'Give a proper haircut. Paid online, redeemed at the shop.', regB:'Buy',
  cats:{b:'Barbering',c:'Colour',tr:'Braids',n:'Grooming'}, min:'min',
  p1:'Service', p2:'Barber', p3:'Date & time', p4:'Your details', cualq:'First available', cualqS:'Any barber on the team', nombre:'Name', movil:'Mobile (WhatsApp)', conf:'Confirm booking', atras:'Back', sinH:'No free times this day.', hoy:'Today', man:'Tomorrow',
  okT:'Booked', okP:'You’ll get a WhatsApp reminder the day before. If you can’t make it, tell us and we’ll find another slot.', otra:'Make another booking', con:'with', cerrar:'Close', tuReserva:'Your booking',
  pSenal:'New clients: a '+(DXB?'20 AED':'€5')+' card deposit (Stripe) secures your chair. It comes off your bill.', pTotal:'You pay online by card (Stripe) when you book.',
  regOk:'Gift card purchased', regTxt:'On the live site this is paid by card (Stripe) and the code is emailed. The purchase is already in the panel.', importe:'Amount',
  prop:'Airmate proposal for Salvajes · demo with example data', panel:'See the panel', elige:'Which shop?', foot:'Proposal by Airmate · demo' }
};
const t = k => T[L][k] ?? k, nS = s => L === 'es' ? s.es : s.n, din = n => SV.din(n);
const CAT = k => ({ corte:'b', cb:'b', barba:'b', diseno:'b', kids:'b', jubi:'b', fade:'b', mechas:'c', deco:'c', fantasia:'c', cbarba:'c', trenzas:'tr' })[k] || 'n';
const SEDES_L = [
  { k:'bcn',  n:'Horta',  c:'Barcelona', d:'Carrer dels Cortada, 34', h:'Lun–Sáb · 10:00–20:30', u:RAIZ+'barcelona/?sede=bcn', f:'g1' },
  { k:'bcn2', n:'Barcelona II', c:'Barcelona', d:'Dirección por confirmar', h:'Lun–Sáb · 10:00–20:30', u:RAIZ+'barcelona/?sede=bcn2', f:'g5' },
  { k:'dxb',  n:'JVC', c:'Dubái', d:'DAMAC Ghalia Tower, local 14', h:'Todos los días · 10:00–22:00', u:RAIZ+'dubai/', f:'g7' } ];
const IG = DXB ? 'https://www.instagram.com/salvajes_barbershopdubai/' : 'https://www.instagram.com/salvajes_barbershop/';
const HERO = MARCA ? 'ovejas' : DXB ? 'ovejas' : 'g8';
const nombreSede = MARCA ? 'Salvajes' : DXB ? 'Dubai' : SV_SEDE === 'bcn2' ? 'Barcelona' : 'Horta';
const flecha = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';

function pintar(){
  document.documentElement.lang = L;
  const app = $('app');
  const cab = `<header class="cab sobre" id="cab"><div class="w">
    <a class="marca" href="${RAIZ || './'}">SALVAJES</a>
    <nav>${MARCA ? `<a href="#sedes">${t('barberias')}</a><a href="#trabajos">${t('trabajos')}</a><a href="#resenas">${t('resenas')}</a>` : `<a href="#carta">${t('carta')}</a><a href="#trabajos">${t('trabajos')}</a><a href="#resenas">${t('resenas')}</a><a href="#visita">${t('visita')}</a>`}</nav>
    <div class="sedes-mini">${SEDES_L.map(x => `<a href="${x.u}" class="${!MARCA && x.k === SV_SEDE ? 'on' : ''}">${x.k === 'dxb' ? 'DXB' : x.k === 'bcn' ? 'BCN' : 'BCN II'}</a>`).join('')}</div>
    <div class="lang"><button class="${L==='es'?'on':''}" onclick="SVW.lang('es')">ES</button><button class="${L==='en'?'on':''}" onclick="SVW.lang('en')">EN</button></div>
    <button class="bt" onclick="${MARCA ? "location.hash='sedes'" : 'SVW.abrir()'}">${t('reservar')}</button></div></header>`;

  const hero = `<section class="hero" id="hero"><img src="${RAIZ}img/${HERO}.jpg" alt="Salvajes Barbershop" fetchpriority="high">
    <div class="in w"><h1 class="d"><span class="lin"><span>Salvajes</span></span>${MARCA ? '' : `<span class="lin"><span class="s" style="font-size:.62em;line-height:1">${esc(nombreSede)}</span></span>`}</h1>
     <div class="pie"><p>${t('heroP')}</p>
      ${MARCA ? `<div><small>Barcelona</small>Horta · Barcelona II</div><div><small>Dubái</small>JVC</div>` : `<div><small>${t('dir')}</small>${esc(SEDE.dir.split(' · ')[0])}</div><div><small>${t('hor')}</small>${esc(DXB && L==='en' ? 'Every day · 10:00–22:00' : SEDE.horTxt)}</div>`}
      <button class="bt bt-o" onclick="${MARCA ? "location.hash='sedes'" : 'SVW.abrir()'}">${MARCA ? t('ctaM') : t('reservar')} ${flecha}</button></div></div></section>`;

  const mani = `<section class="mani"><div class="w"><div class="grid"><div class="k rv">${t('maniK')}</div>
    <h2 class="d rv">${t('mani1')} <span class="s">${t('mani2')}</span><br>${t('mani3')} <span class="s">${t('mani4')}</span></h2>
    <div class="datos rv"><div><b>2022</b><span>${t('d1')}</span></div><div><b>3</b><span>${t('d2')}</span></div><div><b>4,9</b><span>${t('d3')}</span></div></div></div></div></section>`;

  const sedes = `<section class="sedes" id="sedes"><div class="w"><div class="tit"><h2 class="d rv">${t('sedesT')}</h2><p class="rv">${t('sedesP')}</p></div>
    <div class="lista-sedes">${SEDES_L.map((x,i) => `<a class="sede rv ${!MARCA && x.k===SV_SEDE ? 'aqui' : ''}" href="${x.u}${MARCA ? (x.u.includes('?') ? '&' : '?') + 'reservar' : ''}"><span class="n">0${i+1}</span><h3 class="d">${esc(x.n)}</h3><span>${esc(x.c)}<br>${esc(x.d)}</span><span>${esc(x.h)}</span><span class="fl">${flecha}</span><img class="ft" src="${RAIZ}img/${x.f}.jpg" alt=""></a>`).join('')}</div></div></section>`;

  const grupos = ['b','c','tr','n'].map(g => [g, SV_SERV.filter(s => CAT(s.k) === g)]).filter(([,l]) => l.length);
  const carta = MARCA ? '' : `<section class="carta" id="carta"><div class="w"><div class="tit"><h2 class="d rv">${t('cartaT')}</h2><p class="rv">${t('cartaP')}</p></div>
    <div class="cols"><div class="destacado rv"><figure><img src="${RAIZ}img/g8.jpg" alt="${esc(nS(SV.S('cb')))}" loading="lazy"></figure><figcaption><span>${t('destac')}</span><span>${esc(nS(SV.S('cb')))} · ${din(SV.S('cb').p)}</span></figcaption></div>
     <div class="menu-c">${grupos.map(([g,l]) => `<h3>${t('cats')[g]}</h3>` + l.map(s => `<div class="it"><b>${esc(nS(s))}</b><small>${s.min} ${t('min')}</small><i></i><em>${din(s.p)}</em><button onclick="SVW.abrir('${s.k}')">${t('reservar')}</button></div>`).join('')).join('')}
      <p class="nota-c">${t('cartaP')}</p></div></div></div></section>`;

  const fotos = ['g1','g8','g3','g6','g5','g2','g4','g7'];
  const gal = `<section class="gal" id="trabajos"><div class="w"><div class="tit"><h2 class="d rv">${t('galT')}</h2><p class="rv">${t('galP')} <a href="${IG}" target="_blank" rel="noopener">Instagram</a></p></div></div>
    <div class="tira" id="tira">${fotos.map((f,i) => `<figure><div class="fx"><img src="${RAIZ}img/${f}.jpg" alt="Trabajo de Salvajes ${i+1}" loading="lazy"></div><figcaption><span>${String(i+1).padStart(2,'0')}</span><span>Salvajes</span></figcaption></figure>`).join('')}</div>
    <div class="ctr"><button aria-label="Anterior" onclick="SVW.tira(-1)" style="transform:scaleX(-1)">${flecha}</button><button aria-label="Siguiente" onclick="SVW.tira(1)">${flecha}</button></div></section>`;

  const res = `<section class="res" id="resenas"><div class="w"><div class="grid"><div><div class="k rv" style="color:var(--sangre)">${t('resT')}</div><div class="nota rv">4,9<sup>★</sup></div><p class="rv" style="color:var(--mu);margin:10px 0 0">${t('resNota')}</p>
     <div class="fuentes rv"><a href="${SV_RESENAS.booksy.url}" target="_blank" rel="noopener"><b>Booksy · Horta</b><span>4,9 · 603 →</span></a><a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent('Salvajes Barber Shop '+(DXB?'JVC Dubai':'Barcelona'))}" target="_blank" rel="noopener"><b>Google</b><span>${t('ver')} →</span></a>${DXB ? `<a href="${IG}" target="_blank" rel="noopener"><b>Fresha · JVC</b><span>${t('ver')} →</span></a>` : ''}</div></div>
    <div>${SV_RESENAS.frases.map(f => `<div class="cita rv"><p>«${esc(f.t)}»</p><small>${esc(f.a)} · ${f.src} · ${esc(f.sede)}</small></div>`).join('')}</div></div></div></section>`;

  const cta = `<section class="cta" id="reservar"><img src="${RAIZ}img/g6.jpg" alt="" loading="lazy"><div class="w"><h2 class="d rv">${t('ctaT1')}<br><span class="s">${t('ctaT2')}</span></h2><p class="rv">${t('ctaP')}</p>
    <button class="bt bt-o rv" onclick="${MARCA ? "location.hash='sedes'" : 'SVW.abrir()'}">${MARCA ? t('ctaM') : t('ctaB')} ${flecha}</button></div></section>`;

  const vis = MARCA ? '' : `<section class="vis" id="visita"><div class="w"><div class="grid"><div><h2 class="d rv">${t('visT')}</h2>
    <div class="dl rv"><div><span>${t('dir')}</span><b>${esc(SEDE.dir)}</b></div><div><span>${t('hor')}</span><b>${esc(DXB && L==='en' ? 'Every day · 10:00–22:00' : SEDE.horTxt)}</b></div><div><span>${t('tel')}</span><b>${esc(SEDE.tel || t('porConf'))}</b></div></div>
    <div style="display:flex;gap:10px;margin-top:26px;flex-wrap:wrap" class="rv">${SEDE.wa ? `<a class="bt bt-n" href="https://wa.me/${SEDE.wa}" target="_blank" rel="noopener">WhatsApp</a>` : `<button class="bt bt-n" onclick="SVW.abrir()">${t('reservar')}</button>`}<a class="bt bt-l" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(SEDE.mapa)}" target="_blank" rel="noopener">${t('como')}</a></div>
    <div class="regalo rv"><div><h3 class="d">${t('regT')}</h3><p>${t('regP')}</p></div><button class="bt bt-l" onclick="SVW.regalo()">${t('regB')}</button></div></div>
    <div class="mapa rm"><iframe loading="lazy" title="Mapa" src="https://www.google.com/maps?q=${encodeURIComponent(SEDE.mapa)}&output=embed"></iframe></div></div></div></section>`;

  const pie = `<footer class="pie-w"><div class="w"><div class="fila"><span>Salvajes Barbershop · Barcelona · Dubái</span><span><a href="${IG}" target="_blank" rel="noopener">Instagram</a></span><span>${t('foot')}</span></div></div><div class="gig">SALVAJES</div></footer>`;

  app.innerHTML = (EMBED ? '' : `<div class="prop">${t('prop')} · <a href="${RAIZ}panel/?sede=${MARCA?'bcn':SV_SEDE}" target="_blank" rel="noopener">${t('panel')} →</a></div>`) + cab + hero + mani + (MARCA ? sedes + gal + res + cta : carta + gal + res + cta + sedes + vis) + pie +
    (SEDE.wa && !MARCA ? `<a class="wa" href="https://wa.me/${SEDE.wa}" target="_blank" rel="noopener" aria-label="WhatsApp"><svg viewBox="0 0 24 24"><path d="M17.5 14.4c-.3-.1-1.7-.8-2-.9s-.5-.1-.7.1-.8.9-.9 1.1-.3.2-.6.1a8 8 0 0 1-4-3.5c-.3-.5.3-.5.9-1.6.1-.2 0-.4 0-.5l-.9-2.2c-.2-.6-.5-.5-.7-.5h-.6a1.2 1.2 0 0 0-.8.4 3.6 3.6 0 0 0-1.1 2.6 6.2 6.2 0 0 0 1.3 3.3 14 14 0 0 0 5.5 4.8c2 .9 2.8.9 3.8.8a3.3 3.3 0 0 0 2.1-1.5 2.7 2.7 0 0 0 .2-1.5c-.1-.2-.3-.3-.6-.4zM12 21.5a9.4 9.4 0 0 1-4.8-1.3l-.3-.2-3.6.9 1-3.5-.2-.4A9.5 9.5 0 1 1 12 21.5zm0-20.9A11.4 11.4 0 0 0 2.2 17.7L.6 23.4l5.9-1.5A11.4 11.4 0 1 0 12 .6z"/></svg></a>` : '') +
    `<div class="velo" id="velo" onclick="SVW.cerrar()"></div><aside class="cajon" id="cajon" role="dialog" aria-modal="true" aria-label="${t('reservar')}"><div class="cj-h"><span class="d">${t('reservar')}</span><button class="cj-x" onclick="SVW.cerrar()" aria-label="${t('cerrar')}">×</button></div><div class="cj-b" id="pasos"></div></aside>`;

  // portada, cabecera y apariciones
  const h = $('hero'), img = h.querySelector('img'); const listo = () => h.classList.add('listo'); img.complete ? requestAnimationFrame(listo) : img.addEventListener('load', listo); setTimeout(listo, 1500);
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting){ e.target.classList.add('vis'); io.unobserve(e.target); } }), { rootMargin:'0px 0px -8% 0px' });
  document.querySelectorAll('.rv,.rm').forEach(el => io.observe(el));
  arrastreTira();
}
let ultY = 0;
addEventListener('scroll', () => { const c = $('cab'); if (!c) return; const y = scrollY, alto = innerHeight * .82;
  c.classList.toggle('sobre', y < alto); c.classList.toggle('solida', y >= alto); c.classList.toggle('oculta', y > alto && y > ultY + 4); if (y < ultY - 4) c.classList.remove('oculta'); ultY = y; }, { passive:true });
function arrastreTira(){ const el = $('tira'); if (!el) return; let x0 = 0, s0 = 0, abajo = false;
  el.addEventListener('pointerdown', e => { if (e.pointerType !== 'mouse') return; abajo = true; x0 = e.clientX; s0 = el.scrollLeft; el.style.scrollSnapType = 'none'; el.style.cursor = 'grabbing'; });
  addEventListener('pointermove', e => { if (abajo) el.scrollLeft = s0 - (e.clientX - x0); });
  addEventListener('pointerup', () => { if (!abajo) return; abajo = false; el.style.scrollSnapType = ''; el.style.cursor = ''; }); }

/* ── reserva ── */
let R = { paso:1, s:null, e:null, f:null, h:null };
function primerDiaAbierto(){ const db = svCargar(); for (let i = 0; i < 14; i++){ const f = SV.masD(i); if (SV_EQUIPO.some(e => SV.turno(db, e.k, f))) return f; } return SV.masD(0); }
function notaPago(){ const m = svCargar().pagoWeb || 'centro'; return m === 'centro' ? '' : `<div class="pago-n">${m === 'senal' ? t('pSenal') : t('pTotal')}</div>`; }
function pasoHTML(){
  const db = svCargar(), barra = `<div class="pasos">${[1,2,3,4].map(i => `<i class="${i <= R.paso ? 'on' : ''}"></i>`).join('')}</div>`, et = (n,x) => `<div class="k p-et">${n} / 4 · ${x}</div>`;
  const loc = L === 'es' ? 'es-ES' : 'en-GB';
  const seg = SEDE.pais === 'ES' ? `<div class="seg"><button class="${SV_SEDE==='bcn'?'on':''}" onclick="SVW.sede('bcn')">Horta</button><button class="${SV_SEDE==='bcn2'?'on':''}" onclick="SVW.sede('bcn2')">Barcelona II</button></div>` : '';
  if (R.paso === 1) return barra + seg + et(1, t('p1')) + ['b','c','tr','n'].map(g => { const l = SV_SERV.filter(s => CAT(s.k) === g); return l.length ? `<div class="k" style="margin:18px 0 0;color:var(--sangre)">${t('cats')[g]}</div>` + l.map(s => `<button class="op" onclick="SVW.ir({s:'${s.k}',paso:2})"><span><b>${esc(nS(s))}</b><small>${s.min} ${t('min')}</small></span><em>${din(s.p)}</em></button>`).join('') : ''; }).join('');
  if (R.paso === 2){ const ok = SV_EQUIPO.filter(e => SV.puede(e.k, R.s));
    return barra + et(2, t('p2')) + `<div class="resumen"><b>${esc(nS(SV.S(R.s)))}</b>${SV.S(R.s).min} ${t('min')} · ${din(SV.S(R.s).p)}</div>
      <button class="op" onclick="SVW.ir({e:'any',paso:3})"><span><b>${t('cualq')}</b><small>${t('cualqS')}</small></span>→</button>${ok.map(e => `<button class="op" onclick="SVW.ir({e:'${e.k}',paso:3})"><span><b>${esc(e.n)}</b><small>${esc(e.rol)}</small></span>→</button>`).join('')}<button class="atras" onclick="SVW.ir({paso:1})">${t('atras')}</button>`; }
  if (R.paso === 3){ if (!R.f) R.f = primerDiaAbierto(); const ahora = new Date(), dias = [...Array(7)].map((_,i) => SV.masD(i));
    const abierto = f => (R.e === 'any' ? SV_EQUIPO : [SV.E(R.e)]).some(e => SV.turno(db, e.k, f));
    const libres = SV_HORAS.filter(h => { if (R.f === SV.masD(0) && SV.min(h) <= ahora.getHours()*60 + ahora.getMinutes() + 30) return false; return R.e === 'any' ? !!SV.quienLibre(db, R.f, h, R.s) : SV.libreCon(db, R.f, h, R.s, R.e); });
    return barra + et(3, t('p3')) + `<div class="resumen"><b>${esc(nS(SV.S(R.s)))}</b>${R.e === 'any' ? t('cualq') : esc(SV.E(R.e).n)}</div>
      <div class="dias">${dias.map((d,i) => { const x = new Date(d + 'T12:00'); return `<button class="${d === R.f ? 'on' : ''}" ${abierto(d) ? '' : 'disabled'} onclick="SVW.ir({f:'${d}'})">${i === 0 ? t('hoy') : i === 1 ? t('man') : x.toLocaleDateString(loc, { weekday:'short' })}<b>${x.getDate()}</b></button>`; }).join('')}</div>
      <div class="horas">${libres.map(h => `<button onclick="SVW.ir({h:'${h}',paso:4})">${h}</button>`).join('') || `<p class="vacio" style="grid-column:1/-1">${t('sinH')}</p>`}</div><button class="atras" onclick="SVW.ir({paso:2})">${t('atras')}</button>`; }
  if (R.paso === 4){ const x = new Date(R.f + 'T12:00');
    return barra + et(4, t('p4')) + `<div class="resumen"><b>${esc(nS(SV.S(R.s)))}</b>${x.toLocaleDateString(loc, { weekday:'long', day:'numeric', month:'long' })} · ${R.h} · ${R.e === 'any' ? t('cualq') : esc(SV.E(R.e).n)}</div>
      <label class="campo"><span>${t('nombre')}</span><input id="rN" autocomplete="name"></label><label class="campo"><span>${t('movil')}</span><input id="rT" inputmode="tel" autocomplete="tel" placeholder="${SEDE.prefijo}"></label>
      ${notaPago()}<button class="bt bt-n" style="width:100%" onclick="SVW.confirmar()">${t('conf')}</button><button class="atras" onclick="SVW.ir({paso:3})">${t('atras')}</button>`; }
  const x = new Date(R.f + 'T12:00');
  return `<div class="ok"><div class="k" style="color:var(--sangre)">Salvajes · ${esc(SEDE.corto)}</div><div class="d">${t('okT')}</div><div class="resumen"><b>${esc(nS(SV.S(R.s)))}</b>${x.toLocaleDateString(loc, { weekday:'long', day:'numeric', month:'long' })} · ${R.h} · ${t('con')} ${esc(SV.E(R.e2).n)}<br>${esc(SEDE.dir)}</div><p style="color:var(--mu)">${t('okP')}</p><button class="bt bt-l" onclick="SVW.ir({paso:1,s:null,e:null,h:null})">${t('otra')}</button></div>`;
}
function pintarPaso(){ const P = $('pasos'); P.innerHTML = pasoHTML(); P.scrollTop = 0; P.animate?.([{ opacity:0, transform:'translateX(14px)' }, { opacity:1, transform:'none' }], { duration:380, easing:'cubic-bezier(.2,.75,.15,1)' }); }
function abrir(s){ R = { paso: s ? 2 : 1, s: s || null, e:null, f:null, h:null }; pintarPaso(); $('velo').classList.add('on'); $('cajon').classList.add('on'); document.body.style.overflow = 'hidden'; }
function cerrar(){ $('velo').classList.remove('on'); $('cajon').classList.remove('on'); document.body.style.overflow = ''; }
function confirmar(){ const n = $('rN').value.trim(), tel = $('rT').value.trim(); if (n.length < 2){ $('rN').focus(); return; }
  const db = svCargar(), e = R.e === 'any' ? SV.quienLibre(db, R.f, R.h, R.s) : R.e;
  if (!e || !SV.libreCon(db, R.f, R.h, R.s, e)){ R.paso = 3; pintarPaso(); return; }   // alguien ha cogido el hueco: vuelve a las horas
  let c = db.clientes.find(x => x.n.toLowerCase() === n.toLowerCase()); if (!c){ c = { id:'c'+Date.now(), n, tel: tel || '—', orig:'Web', lang:L.toUpperCase(), alta:SV.masD(0), fav:e, notas:'' }; db.clientes.unshift(c); }
  db.citas.push({ id:'w'+Date.now(), f:R.f, h:R.h, cl:c.id, s:R.s, e, est:'conf', web:true, nueva:true }); svGuardar(db); R.e2 = e; R.paso = 5; pintarPaso(); }
let IMP = DXB ? 200 : 30;
function regalo(){ const imps = DXB ? [100,200,300,500] : [20,30,50,100];
  $('pasos').innerHTML = `<div class="k p-et">${t('regT')}</div><div class="resumen"><b>${t('regT')} · ${din(IMP)}</b>${t('regP')}</div><div class="k p-et">${t('importe')}</div>
    <div class="horas" style="margin-bottom:22px">${imps.map(v => `<button style="${v===IMP?'background:var(--ink);color:var(--paper)':''}" onclick="SVW.imp(${v})">${din(v)}</button>`).join('')}</div>
    <button class="bt bt-n" style="width:100%" onclick="SVW.pagarRegalo()">${t('regB')} · ${din(IMP)}</button>`;
  $('velo').classList.add('on'); $('cajon').classList.add('on'); }
function pagarRegalo(){ const db = svCargar(), id = 'TR-' + (2042 + db.regalos.length); db.regalos.unshift({ id, imp:IMP, para:'—', de:'Web', f:SV.masD(0), canjeada:false, online:true, nueva:true }); svGuardar(db);
  $('pasos').innerHTML = `<div class="ok"><div class="k" style="color:var(--sangre)">${id}</div><div class="d">${t('regOk')}</div><p style="color:var(--mu)">${t('regTxt')}</p><button class="bt bt-l" onclick="SVW.cerrar()">${t('cerrar')}</button></div>`; }
addEventListener('keydown', e => { if (e.key === 'Escape') cerrar(); });

window.SVW = {
  abrir, cerrar, confirmar, regalo, pagarRegalo,
  ir(o){ Object.assign(R, o); pintarPaso(); },
  imp(v){ IMP = v; regalo(); },
  sede(k){ if (k === SV_SEDE) return; location.href = '?sede=' + k + (L==='en'?'&lang=en':'') + '&reservar'; },
  lang(l){ const u = new URL(location.href); u.searchParams.set('lang', l); location.href = u.toString(); },
  tira(d){ const el = $('tira'); el.scrollBy({ left: d * el.clientWidth * .7, behavior:'smooth' }); }
};
pintar();
if (EMBED){ document.querySelectorAll('.prop').forEach(x => x.remove()); abrir(); }
else if (Q.has('reservar')) setTimeout(() => abrir(), 400);
else if (MARCA && location.hash === '#sedes') setTimeout(() => $('sedes').scrollIntoView(), 50);
})();
