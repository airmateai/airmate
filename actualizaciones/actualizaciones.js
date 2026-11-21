/* Airmate · Apartado NOVEDADES v2 (tienda dentro del panel del cliente, estilo oscuro con acento lima)
   Sustituye a actualizaciones.js con la MISMA interfaz: AirmateActualizaciones.mount(el, cfg) y .hayNuevos(cfg).
   Todo se puede pedir: módulos, mejoras pequeñas, contenido y horas sueltas. Cada pedido abre WhatsApp con Airmate,
   queda en la bandeja de leads (web_requests) y se apunta en «Tus pedidos» de este navegador.
   cfg: { cliente, contacto, telefono, instalados:[ids], catalogoUrl, precios:true|false } */
(function (w) {
  const AM = w.AirmateMod;
  const CATALOGO = 'https://airmate.es/actualizaciones/catalogo.json';
  const AIRMATE_SB = 'https://vjofxmfwdybktpwiuanc.supabase.co';
  const AIRMATE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZqb2Z4bWZ3ZHlia3Rwd2l1YW5jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ0NzU5NDYsImV4cCI6MjA5MDA1MTk0Nn0.ixU-33c0FEkO7F5xjWb3YHkvj_pQuR0gsJETrGA8ZTE';
  const WA = '34646427613';

  /* Iconos de trazo (sin emojis) */
  const P = {
    estrella: 'M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z',
    mas: 'M12 5v14M5 12h14', lapiz: 'M4 20h4L19 9l-4-4L4 16zM13.5 6.5l4 4',
    capas: 'M12 3l9 5-9 5-9-5zM3 13l9 5 9-5', ficha: 'M5 3h14v18H5zM9 8h6M9 12h6M9 16h4',
    bajar: 'M12 4v11M7 10l5 5 5-5M5 20h14', barras: 'M5 20V11M10 20V5M15 20v-7M20 20V8',
    persona: 'M12 12a4 4 0 100-8 4 4 0 000 8zM4 21c1-4 4-6 8-6s7 2 8 6', video: 'M3 6h12v12H3zM15 10l6-3v10l-6-3',
    clip: 'M4 7h16v10H4zM10 10v4l3.5-2z', reloj: 'M12 21a9 9 0 100-18 9 9 0 000 18zM12 7v5l3 2',
    ciclo: 'M20 11a8 8 0 00-14.6-4.5M4 4v3h3M4 13a8 8 0 0014.6 4.5M20 20v-3h-3', doc: 'M6 3h9l4 4v14H6zM14 3v5h5M9 13h6M9 17h6',
    ticket: 'M6 3h12v18l-3-2-3 2-3-2-3 2zM9 8h6M9 12h6', caja: 'M3 7l9-4 9 4v10l-9 4-9-4zM3 7l9 4 9-4M12 11v10',
    banco: 'M3 9l9-5 9 5M5 9v9M10 9v9M14 9v9M19 9v9M3 20h18', movil: 'M7 2h10v20H7zM11 18h2',
    regalo: 'M4 11h16v10H4zM3 7h18v4H3zM12 7v14M12 7c-2-4-6-3-5 0M12 7c2-4 6-3 5 0', cerrar: 'M6 6l12 12M18 6L6 18',
    check: 'M5 12l5 5 9-10', flecha: 'M5 12h14M13 6l6 6-6 6'
  };
  const ico = (n, s = 20) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${P[n] || P.mas}"/></svg>`;

  AM.css('am-nov', `
  .amn{--n-bg:#141518;--n-card:#1c1d21;--n-card2:#232428;--n-line:#2c2d32;--n-txt:#ecece8;--n-txt2:#a9aaa6;--n-txt3:#75766f;
    --n-lima:#d4af6a;--n-lima-ink:#17120a;--n-oliva:#0f3322;--n-oliva2:#16492f;--n-vino:#3a1418;--n-vino2:#4c1b20;--n-azul:#8fb6ec;--n-rad:16px;
    background:var(--n-bg);color:var(--n-txt);border-radius:22px;padding:22px;font-family:Inter,"Manrope",system-ui,-apple-system,"Segoe UI",sans-serif;font-size:14px;line-height:1.5;overflow-x:clip}
  .amn *{box-sizing:border-box}
  .amn button{font:inherit;color:inherit;cursor:pointer}
  .amn :focus-visible{outline:2px solid var(--n-lima);outline-offset:2px}
  .amn-top{display:flex;gap:14px;align-items:flex-end;justify-content:space-between;flex-wrap:wrap;margin-bottom:18px}
  .amn-top h2{margin:0;font-size:26px;font-weight:650;letter-spacing:-.02em;line-height:1.1}
  .amn-top p{margin:4px 0 0;color:var(--n-txt2)}
  .amn-btn{display:inline-flex;align-items:center;gap:8px;border:0;border-radius:999px;padding:10px 16px;font-weight:650;font-size:13.5px;min-height:40px;transition:transform .15s ease,background-color .15s ease}
  .amn-btn:active{transform:scale(.97)}
  .amn .amn-lima{background:var(--n-lima);color:var(--n-lima-ink)}.amn .amn-lima:hover{background:#e4c486}
  .amn .amn-ghost{background:var(--n-card2);color:var(--n-txt);border:1px solid var(--n-line)}.amn-ghost:hover{background:#2b2c31}
  .amn-hero{display:grid;grid-template-columns:minmax(0,1.35fr) minmax(0,1fr) minmax(0,1fr);gap:12px;margin-bottom:12px}
  .amn-c{background:var(--n-card);border:1px solid var(--n-line);border-radius:var(--n-rad);padding:18px;min-width:0}
  .amn-lbl{font-size:12.5px;color:var(--n-txt2);display:flex;align-items:center;gap:7px}
  .amn-feat{background:linear-gradient(160deg,var(--n-oliva2),var(--n-oliva));border-color:#1f5a3b;display:flex;flex-direction:column;gap:10px}
  .amn-feat .amn-lbl{color:#b9dcc7}
  .amn-feat h3{margin:0;font-size:20px;font-weight:650;letter-spacing:-.01em;line-height:1.2}
  .amn-feat p{margin:0;color:#cfe3d6;font-size:13.5px}
  .amn-big{font-size:30px;font-weight:650;letter-spacing:-.02em;line-height:1}.amn-big small{font-size:13px;font-weight:500;color:var(--n-txt2);margin-left:6px;letter-spacing:0}
  .amn-feat .amn-big small{color:#b9dcc7}
  .amn-feat .amn-btn{align-self:stretch;justify-content:center;margin-top:auto}
  .amn-vino{background:linear-gradient(160deg,var(--n-vino2),var(--n-vino));border-color:#5e2329;display:flex;flex-direction:column;gap:10px}
  .amn-vino .amn-lbl{color:#e0bcbf}.amn-vino h3{margin:0;font-size:17px;font-weight:650;line-height:1.25}.amn-vino p{margin:0;color:#dcc3c5;font-size:13px}
  .amn-vino .amn-btn{margin-top:auto;align-self:flex-start}
  .amn-prog{height:8px;border-radius:99px;background:var(--n-card2);overflow:hidden;margin:12px 0 10px}
  .amn-prog i{display:block;height:100%;background:var(--n-lima);border-radius:99px}
  .amn-tags{display:flex;flex-wrap:wrap;gap:6px}
  .amn-tag{font-size:12px;padding:4px 10px;border-radius:99px;background:var(--n-card2);border:1px solid var(--n-line);color:var(--n-txt2);display:inline-flex;gap:5px;align-items:center}
  .amn-tag.on{color:var(--n-lima);border-color:#5a4a28}
  .amn-pills{display:flex;gap:6px;flex-wrap:wrap;margin:18px 0 12px}
  .amn-pill{border:1px solid var(--n-line);background:transparent;color:var(--n-txt2);border-radius:99px;padding:7px 14px;font-size:13px;transition:background-color .15s ease,color .15s ease}
  .amn-pill:hover{color:var(--n-txt)}
  .amn-pill[aria-pressed=true]{background:var(--n-txt);color:var(--n-bg);border-color:var(--n-txt)}
  .amn-pill b{font-weight:500;opacity:.6;margin-left:4px}
  .amn-list{padding:6px 0}
  .amn-row{display:grid;grid-template-columns:42px minmax(0,1fr) 130px 100px auto;gap:14px;align-items:center;padding:12px 18px;border-top:1px solid var(--n-line);cursor:pointer;transition:background-color .15s ease}
  .amn-row:first-child{border-top:0}.amn-row:hover{background:var(--n-card2)}
  .amn-ic{width:42px;height:42px;border-radius:12px;background:var(--n-card2);border:1px solid var(--n-line);display:grid;place-items:center;color:var(--n-azul)}
  .amn-row[data-tipo=contenido] .amn-ic{color:#f0b38f}.amn-row[data-tipo=modulo] .amn-ic{color:var(--n-lima)}
  .amn-n{font-weight:600;display:flex;gap:8px;align-items:center;flex-wrap:wrap}
  .amn-new{font-size:11px;font-weight:650;background:var(--n-lima);color:var(--n-lima-ink);padding:1px 8px;border-radius:99px}
  .amn-r{color:var(--n-txt2);font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .amn-para{font-size:12.5px;color:var(--n-txt3)}
  .amn-pr{text-align:right;font-weight:650;font-size:16px;white-space:nowrap}.amn-pr small{display:block;font-size:11.5px;font-weight:400;color:var(--n-txt3)}
  .amn-row .amn-btn{padding:8px 14px;min-height:36px}
  .amn-ya{color:var(--n-lima);font-size:12.5px;display:inline-flex;gap:5px;align-items:center;white-space:nowrap}
  .amn-pend{color:var(--n-azul);font-size:12.5px;white-space:nowrap}
  .amn-grid2{display:grid;grid-template-columns:minmax(0,1.6fr) minmax(0,1fr);gap:12px;margin-top:12px}
  .amn-ped{display:flex;justify-content:space-between;gap:10px;padding:10px 0;border-top:1px solid var(--n-line);font-size:13px}
  .amn-ped:first-of-type{border-top:0}.amn-ped span:last-child{color:var(--n-txt3);white-space:nowrap}
  .amn-foot{font-size:12px;color:var(--n-txt3);margin-top:14px}
  .amn-ov{position:fixed;inset:0;z-index:99998;background:rgba(6,7,9,.6);display:flex;justify-content:flex-end;opacity:0;transition:opacity .2s ease}
  .amn-ov.in{opacity:1}
  .amn-dr{width:min(440px,100%);height:100%;background:#17181b;color:var(--n-txt);border-left:1px solid var(--n-line);padding:24px;overflow-y:auto;display:flex;flex-direction:column;gap:16px;transform:translateX(24px);transition:transform .25s cubic-bezier(.2,.8,.2,1)}
  .amn-ov.in .amn-dr{transform:none}
  .amn-dr h3{margin:0;font-size:22px;font-weight:650;letter-spacing:-.01em;line-height:1.2}
  .amn-dr ul{margin:0;padding:0;list-style:none;border-top:1px solid var(--n-line)}
  .amn-dr li{padding:10px 0;border-bottom:1px solid var(--n-line);display:flex;gap:10px;color:var(--n-txt2)}
  .amn-dr li svg{color:var(--n-lima);flex:none;margin-top:2px}
  .amn-facts{display:grid;grid-template-columns:1fr 1fr;gap:10px}
  .amn-facts div{background:var(--n-card);border:1px solid var(--n-line);border-radius:12px;padding:12px}
  .amn-facts b{display:block;font-weight:600;font-size:15px;margin-top:2px}
  .amn-x{margin-left:auto;background:var(--n-card2);border:1px solid var(--n-line);border-radius:99px;width:36px;height:36px;display:grid;place-items:center}
  @keyframes amnIn{from{opacity:0;transform:translateY(12px);filter:blur(5px)}to{opacity:1;transform:none;filter:none}}
  @keyframes amnBar{from{transform:scaleX(0)}to{transform:scaleX(1)}}
  .amn.anim .amn-top,.amn.anim .amn-c,.amn.anim .amn-pill{animation:amnIn .6s cubic-bezier(.2,.8,.2,1) both;animation-delay:var(--d,0ms)}
  .amn .amn-row{animation:amnIn .5s cubic-bezier(.2,.8,.2,1) both;animation-delay:calc(var(--i,0) * 40ms + 120ms)}
  .amn-prog i{transform-origin:left center;animation:amnBar 1.1s cubic-bezier(.2,.8,.2,1) .35s both}
  .amn-c{transition:transform .25s cubic-bezier(.2,.8,.2,1),border-color .25s ease}
  .amn-feat:hover,.amn-vino:hover{transform:translateY(-3px)}
  .amn-row .amn-ic{transition:transform .2s ease,color .2s ease}.amn-row:hover .amn-ic{transform:scale(1.08)}
  @media (max-width:900px){.amn-hero{grid-template-columns:minmax(0,1fr) minmax(0,1fr)}.amn-hero .amn-feat{grid-column:1/-1}.amn-grid2{grid-template-columns:minmax(0,1fr)}.amn-row{grid-template-columns:42px minmax(0,1fr) auto auto}.amn-para{display:none}}
  @media (max-width:560px){.amn{padding:16px;border-radius:18px}.amn-hero{grid-template-columns:minmax(0,1fr)}.amn-row{grid-template-columns:40px minmax(0,1fr) auto;padding:12px 14px}.amn-row .amn-act{grid-column:2/-1}.amn-r{white-space:normal}.amn-dr{height:auto;max-height:88vh;margin-top:auto;border-radius:20px 20px 0 0;border-left:0;transform:translateY(24px)}.amn-ov{align-items:flex-end}}
  @media (prefers-reduced-motion:reduce){.amn *,.amn-ov,.amn-dr{transition:none!important;animation:none!important}}
  `);

  const euros = n => typeof n === 'number' ? n.toLocaleString('es-ES') + ' €' : AM.esc(n || 'Consultar');
  const verPrecio = (cat, cfg) => cfg.precios !== false && cat.mostrarPrecios !== false;
  const LS = cfg => 'am_pedidos_' + String(cfg.cliente || 'demo').toLowerCase().replace(/\W+/g, '-');
  const pedidos = cfg => { try { return JSON.parse(localStorage.getItem(LS(cfg)) || '[]'); } catch (e) { return []; } };
  const apuntar = (cfg, m) => { try { const l = pedidos(cfg).filter(p => p.id !== m.id); l.unshift({ id: m.id, nombre: m.nombre, fecha: new Date().toISOString() }); localStorage.setItem(LS(cfg), JSON.stringify(l.slice(0, 20))); } catch (e) {} };

  async function pedir(cfg, m, conPrecio) {
    if (cfg.vistaPrevia) { apuntar(cfg, m); AM.toast('Vista previa: aquí el cliente pediría «' + m.nombre + '»'); return; }
    const quien = cfg.contacto ? `${cfg.contacto} de ${cfg.cliente}` : cfg.cliente;
    const pr = conPrecio && m.precio != null ? ` (${typeof m.precio === 'number' ? m.precio + ' € ' + (m.unidad || '') : m.precio})` : '';
    const msg = `Hola Airmate, soy ${quien}. Quiero «${m.nombre}»${pr.trim() ? pr : ''} en mi panel. ¿Cuándo lo podemos hacer?`;
    const wa = w.open(`https://wa.me/${WA}?text=${encodeURIComponent(msg)}`, '_blank');   // dentro del clic, para que no lo bloquee el navegador
    apuntar(cfg, m);
    try {
      const r = await fetch(AIRMATE_SB + '/rest/v1/web_requests', { method: 'POST', headers: { apikey: AIRMATE_ANON, Authorization: 'Bearer ' + AIRMATE_ANON, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
        body: JSON.stringify({ business_name: cfg.cliente, business_type: 'Cliente · novedad', phone: cfg.telefono || null, description: `[Novedad] ${m.nombre}${pr} · pedido desde el panel${cfg.contacto ? ' por ' + cfg.contacto : ''}`, status: 'pending' }) });
      if (!r.ok && !wa) throw new Error('no guardado');
      AM.toast('Pedido enviado. Te escribimos para ponerlo en marcha.');
    } catch (e) { AM.toast(wa ? 'Te hemos abierto WhatsApp con el pedido' : 'No se pudo enviar: escríbenos por WhatsApp'); }
  }

  function detalle(cfg, m, conPrecio, alPedir) {
    const ov = document.createElement('div'); ov.className = 'amn amn-ov'; ov.style.cssText = 'padding:0;border-radius:0;background:rgba(6,7,9,.6)';
    ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-modal', 'true'); ov.setAttribute('aria-labelledby', 'amn-dt');
    const ya = (cfg.instalados || []).includes(m.id);
    ov.innerHTML = `<div class="amn-dr">
      <div style="display:flex;align-items:center;gap:12px"><span class="amn-ic">${ico(m.icono, 22)}</span><span class="amn-lbl">${AM.esc({ modulo: 'Módulo', mejora: 'Mejora', contenido: 'Contenido' }[m.tipo] || 'Novedad')}</span>
        <button type="button" class="amn-x" data-x aria-label="Cerrar">${ico('cerrar', 16)}</button></div>
      <div><h3 id="amn-dt">${AM.esc(m.nombre)}</h3><p style="margin:8px 0 0;color:var(--n-txt2)">${AM.esc(m.resuelve)}</p></div>
      <ul>${(m.incluye || []).map(i => `<li>${ico('check', 16)}<span>${AM.esc(i)}</span></li>`).join('')}</ul>
      <div class="amn-facts">${conPrecio ? `<div><span class="amn-lbl">Precio</span><b>${euros(m.precio)}</b><span class="amn-para">${AM.esc(m.unidad || '')}</span></div>` : ''}
        <div><span class="amn-lbl">Listo en</span><b>${AM.esc(m.plazo || 'Te lo decimos')}</b><span class="amn-para">Lo instalamos nosotros</span></div></div>
      ${ya ? `<span class="amn-ya">${ico('check', 16)} Ya lo tienes en tu panel</span>`
        : `<button type="button" class="amn-btn amn-lima" data-pedir style="justify-content:center;min-height:48px;font-size:15px">Lo quiero ${ico('flecha', 16)}</button>
           <p class="amn-foot" style="margin:0">Te escribimos por WhatsApp para confirmarlo. No se cobra nada hasta que lo confirmes.</p>`}
    </div>`;
    document.body.appendChild(ov); requestAnimationFrame(() => ov.classList.add('in'));
    const prev = document.activeElement;
    const cerrar = () => { ov.remove(); document.removeEventListener('keydown', esc); prev && prev.focus && prev.focus(); };
    const esc = e => { if (e.key === 'Escape') cerrar(); };
    document.addEventListener('keydown', esc);
    ov.addEventListener('click', e => { if (e.target === ov) cerrar(); });
    ov.querySelector('[data-x]').onclick = cerrar;
    const b = ov.querySelector('[data-pedir]'); if (b) b.onclick = () => { pedir(cfg, m, conPrecio); cerrar(); alPedir && alPedir(); };
    setTimeout(() => (b || ov.querySelector('[data-x]')).focus(), 60);
  }

  function contar(b) {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const n = [...b.childNodes].find(x => x.nodeType === 3 && /\d/.test(x.nodeValue)); if (!n) return;
    const t = n.nodeValue, m = t.match(/\d[\d.]*/); if (!m) return;
    const fin = parseFloat(m[0].replace(/\./g, '')), pre = t.slice(0, m.index), post = t.slice(m.index + m[0].length), t0 = performance.now();
    (function paso(a) { const k = Math.min(1, (a - t0) / 900), e = 1 - Math.pow(1 - k, 3); n.nodeValue = pre + Math.round(fin * e).toLocaleString('es-ES') + post; if (k < 1) requestAnimationFrame(paso); else n.nodeValue = t; })(t0);
  }
  async function mount(el, cfg) {
    el.innerHTML = '<div class="amn" style="color:#a9aaa6">Cargando novedades…</div>';
    let cat; try { const r = await fetch((cfg.catalogoUrl || CATALOGO) + '?v=' + Date.now()); cat = await r.json(); } catch (e) { el.innerHTML = '<div class="amn">No se pudieron cargar las novedades ahora mismo.</div>'; return; }
    const conPrecio = verPrecio(cat, cfg);
    const inst = new Set(cfg.instalados || []);
    const todos = cat.modulos || [];
    const disp = todos.filter(m => !inst.has(m.id));
    const feat = disp.find(m => m.id === cat.destacado) || disp.find(m => m.nuevo) || disp[0];
    const pack = (cat.packs || []).find(p => p.incluye.some(i => !inst.has(i)));
    const modTot = todos.filter(m => m.tipo === 'modulo'), modYa = modTot.filter(m => inst.has(m.id));
    const aviso = aviActivo(cat.aviso) ? cat.aviso : null;
    const tipos = [['todo', 'Todo'], ['mejora', 'Mejoras pequeñas'], ['contenido', 'Vídeo y contenido'], ['modulo', 'Módulos'], ['ya', 'Ya tienes']];
    let filtro = 'todo';
    const nombre = cfg.contacto ? cfg.contacto.split(' ')[0] : '';

    const fila = (m, lista = []) => { const ya = inst.has(m.id), ped = pedidos(cfg).some(p => p.id === m.id);
      return `<div class="amn-row" style="--i:${lista.indexOf(m)}" data-id="${m.id}" data-tipo="${m.tipo}" tabindex="0" role="button" aria-label="${AM.esc(m.nombre)}">
        <span class="amn-ic">${ico(m.icono)}</span>
        <div style="min-width:0"><div class="amn-n">${AM.esc(m.nombre)}${m.nuevo && !ya ? '<span class="amn-new">Nuevo</span>' : ''}</div><div class="amn-r">${AM.esc(m.resuelve)}</div></div>
        <span class="amn-para">${AM.esc(m.para || '')}</span>
        ${conPrecio ? `<span class="amn-pr">${euros(m.precio)}<small>${AM.esc(m.unidad || '')}</small></span>` : '<span></span>'}
        <span class="amn-act">${ya ? `<span class="amn-ya">${ico('check', 15)} Activo</span>` : ped ? '<span class="amn-pend">Pedido, te escribimos</span>' : `<button type="button" class="amn-btn amn-ghost" data-quiero="${m.id}">Lo quiero</button>`}</span></div>`; };

    let primera = true;
    function pintar() {
      const lista = filtro === 'todo' ? disp : filtro === 'ya' ? todos.filter(m => inst.has(m.id)) : disp.filter(m => m.tipo === filtro);
      const peds = pedidos(cfg);
      el.innerHTML = `<section class="amn${primera ? ' anim' : ''}" aria-label="Novedades">
        <div class="amn-top"><div><h2>Novedades</h2><p>${nombre ? `Buenas, ${AM.esc(nombre)}. ` : ''}Todo lo que puedes añadir a tu panel y a tu web. Lo hacemos nosotros.</p></div>
          <button type="button" class="amn-btn amn-lima" data-medida>Pedir algo a medida</button></div>
        <div class="amn-hero">
          ${feat ? `<div class="amn-c amn-feat"><span class="amn-lbl">${ico('estrella', 15)} Lo más pedido este mes</span><h3>${AM.esc(feat.nombre)}</h3><p>${AM.esc(feat.resuelve)}</p>
            ${conPrecio ? `<div class="amn-big">${euros(feat.precio)}<small>${AM.esc(feat.unidad || '')}</small></div>` : ''}
            <button type="button" class="amn-btn amn-lima" data-ver="${feat.id}">Lo quiero ${ico('flecha', 16)}</button></div>` : ''}
          ${aviso ? `<div class="amn-c amn-vino"><span class="amn-lbl">${ico('regalo', 15)} Hasta el ${new Date(aviso.hasta + 'T00:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}</span><h3>${AM.esc(aviso.titulo)}</h3><p>${AM.esc(aviso.texto)}</p>
            <button type="button" class="amn-btn amn-ghost" data-reco>Recomendar por WhatsApp</button></div>`
          : pack ? `<div class="amn-c amn-vino"><span class="amn-lbl">${ico('caja', 15)} Pack</span><h3>${AM.esc(pack.nombre)}</h3><p>${AM.esc(pack.descripcion)}</p>
            <button type="button" class="amn-btn amn-ghost" data-pack>Me interesa</button></div>` : ''}
          <div class="amn-c"><span class="amn-lbl">Tu panel</span>
            <div class="amn-big" style="margin-top:8px">${modYa.length}<small>de ${modTot.length} módulos activos</small></div>
            <div class="amn-prog" role="img" aria-label="${modYa.length} de ${modTot.length} módulos"><i style="width:${modTot.length ? Math.max(4, modYa.length / modTot.length * 100) : 0}%"></i></div>
            <div class="amn-tags">${modTot.map(m => `<span class="amn-tag ${inst.has(m.id) ? 'on' : ''}">${inst.has(m.id) ? ico('check', 12) : ''}${AM.esc(m.corto || m.nombre.split(' ')[0])}</span>`).join('')}</div></div>
        </div>
        <div class="amn-pills" role="group" aria-label="Filtrar">${tipos.map(([k, t]) => { const n = k === 'todo' ? disp.length : k === 'ya' ? todos.length - disp.length : disp.filter(m => m.tipo === k).length;
          return `<button type="button" class="amn-pill" data-f="${k}" aria-pressed="${filtro === k}">${t}<b>${n}</b></button>`; }).join('')}</div>
        <div class="amn-grid2">
          <div class="amn-c amn-list" style="padding:6px 0">${lista.length ? lista.map(m => fila(m, lista)).join('') : '<div style="padding:18px;color:var(--n-txt2)">Nada por aquí todavía.</div>'}</div>
          <div style="display:flex;flex-direction:column;gap:12px">
            <div class="amn-c"><span class="amn-lbl">Tus pedidos</span>
              ${peds.length ? `<div style="margin-top:8px">${peds.slice(0, 6).map(p => `<div class="amn-ped"><span>${AM.esc(p.nombre)}</span><span>${new Date(p.fecha).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}</span></div>`).join('')}</div>`
                : '<p style="margin:8px 0 0;color:var(--n-txt2)">Cuando pidas algo, lo verás aquí.</p>'}</div>
            <div class="amn-c"><span class="amn-lbl">Cómo funciona</span>
              <div class="amn-ped"><span>1. Pulsas «Lo quiero»</span><span></span></div>
              <div class="amn-ped"><span>2. Te escribimos por WhatsApp y lo confirmas</span><span></span></div>
              <div class="amn-ped"><span>3. Lo instalamos sin parar tu negocio</span><span></span></div></div>
          </div>
        </div>
        <div class="amn-foot">${conPrecio ? 'Precios sin IGIC. ' : ''}No se cobra nada hasta que lo confirmas por WhatsApp.</div>
      </section>`;
      if (primera) { el.querySelectorAll('.amn-top,.amn-c,.amn-pill').forEach((x, i) => x.style.setProperty('--d', Math.min(i, 12) * 50 + 'ms')); el.querySelectorAll('.amn-big').forEach(contar); }
      primera = false;
      const porId = id => todos.find(m => m.id === id);
      el.querySelectorAll('[data-f]').forEach(b => b.onclick = () => { filtro = b.dataset.f; pintar(); el.querySelector(`[data-f="${filtro}"]`).focus(); });
      el.querySelectorAll('.amn-row').forEach(r => { const abrir = () => detalle(cfg, porId(r.dataset.id), conPrecio, pintar);
        r.onclick = e => { if (!e.target.closest('[data-quiero]')) abrir(); }; r.onkeydown = e => { if ((e.key === 'Enter' || e.key === ' ') && e.target === r) { e.preventDefault(); abrir(); } }; });
      el.querySelectorAll('[data-quiero]').forEach(b => b.onclick = () => { pedir(cfg, porId(b.dataset.quiero), conPrecio); pintar(); });
      el.querySelectorAll('[data-ver]').forEach(b => b.onclick = () => detalle(cfg, porId(b.dataset.ver), conPrecio, pintar));
      const pk = el.querySelector('[data-pack]'); if (pk) pk.onclick = () => { pedir(cfg, pack, conPrecio); pintar(); };
      const rc = el.querySelector('[data-reco]'); if (rc) rc.onclick = () => compartir(aviso, cfg);
      el.querySelector('[data-medida]').onclick = () => detalle(cfg, { id: 'a-medida', tipo: 'mejora', icono: 'lapiz', nombre: 'Algo a medida', resuelve: 'Cuéntanos lo que necesitas y te decimos cuánto lleva antes de empezar.', incluye: ['Lo hablamos por WhatsApp', 'Presupuesto cerrado antes de empezar', 'Lo instalamos nosotros'], precio: 45, unidad: 'la hora', plazo: 'Según el encargo' }, conPrecio, pintar);
    }
    pintar();
    return { nuevos: disp.filter(m => m.nuevo).length };
  }

  /* AVISO OBLIGATORIO (catalogo.aviso): sale una vez por aviso al entrar en el panel, ya con sesión iniciada. */
  const aviVisto = id => { try { return localStorage.getItem('am_aviso_' + id); } catch (e) { return '1'; } };
  const aviMarcar = id => { try { localStorage.setItem('am_aviso_' + id, new Date().toISOString()); } catch (e) {} };
  const aviActivo = a => a && a.id && (!a.hasta || Date.now() < Date.parse(a.hasta + 'T00:00:00'));
  const aviTexto = (t, cfg) => String(t || '').split('{cliente}').join(cfg.cliente || 'mi negocio');
  function compartir(a, cfg) { w.open('https://wa.me/?text=' + encodeURIComponent(aviTexto(a.compartir, cfg)), '_blank'); }
  function enLogin() { return [...document.querySelectorAll('input[type=password]')].some(i => i.offsetParent !== null && i.getBoundingClientRect().width > 0); }
  function mostrarAviso(a, cfg) {
    if (!aviActivo(a) || aviVisto(a.id) || document.getElementById('am-aviso')) return;
    if (enLogin() || document.visibilityState !== 'visible') { setTimeout(() => mostrarAviso(a, cfg), 1500); return; }
    const d = document.createElement('div'); d.id = 'am-aviso'; d.className = 'amn';
    d.setAttribute('role', 'dialog'); d.setAttribute('aria-modal', 'true'); d.setAttribute('aria-labelledby', 'am-aviso-t');
    d.style.cssText = 'position:fixed;inset:0;z-index:99999;background:rgba(6,7,9,.6);display:flex;align-items:center;justify-content:center;padding:16px;border-radius:0';
    d.innerHTML = `<div class="amn-c amn-vino" style="max-width:460px;width:100%;padding:26px 24px 22px">
      <span class="amn-lbl">${ico('regalo', 15)} Novedad de Airmate</span>
      <h3 id="am-aviso-t" style="font-size:22px">${AM.esc(a.titulo)}</h3><p style="font-size:14.5px">${AM.esc(a.texto)}</p>
      ${a.extra ? `<p>${AM.esc(a.extra)}</p>` : ''}
      <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:6px">
        <button type="button" data-a="wa" class="amn-btn amn-lima" style="flex:1 1 200px;justify-content:center">Recomendar por WhatsApp</button>
        <button type="button" data-a="ok" class="amn-btn amn-ghost" style="flex:1 1 120px;justify-content:center">Entendido</button></div></div>`;
    document.body.appendChild(d);
    const cerrar = () => { aviMarcar(a.id); d.remove(); };
    d.querySelector('[data-a=wa]').onclick = () => { compartir(a, cfg); cerrar(); };
    d.querySelector('[data-a=ok]').onclick = cerrar;
    setTimeout(() => d.querySelector('[data-a=ok]').focus(), 50);
  }

  /* puntito «nuevo» en el menú del panel (y de paso el aviso obligatorio) */
  async function hayNuevos(cfg) { try { const c = await (await fetch((cfg.catalogoUrl || CATALOGO) + '?v=' + Date.now())).json(); if (c.aviso) mostrarAviso(c.aviso, cfg); const inst = new Set(cfg.instalados || []); return c.modulos.filter(m => m.nuevo && !inst.has(m.id)).length; } catch (e) { return 0; } }
  w.AirmateActualizaciones = { mount, hayNuevos };
})(window);
