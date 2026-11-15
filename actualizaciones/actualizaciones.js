/* Airmate · Apartado ACTUALIZACIONES (tienda de módulos dentro del panel del cliente)
   Lee el catálogo central (airmate.es/actualizaciones/catalogo.json), marca lo que el cliente ya tiene
   y permite pedir un módulo: abre WhatsApp con Airmate y deja la solicitud en la bandeja de leads
   (tabla web_requests del proyecto Airmate, inserción pública permitida; lectura solo para Airmate).
   Uso: AirmateActualizaciones.mount(el, { cliente:'Divas Skin Care', instalados:['app'], catalogoUrl, contacto:'Louie' }) */
(function (w) {
  const AM = w.AirmateMod;
  const CATALOGO = 'https://airmate.es/actualizaciones/catalogo.json';
  const AIRMATE_SB = 'https://vjofxmfwdybktpwiuanc.supabase.co';
  const AIRMATE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZqb2Z4bWZ3ZHlia3Rwd2l1YW5jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ0NzU5NDYsImV4cCI6MjA5MDA1MTk0Nn0.ixU-33c0FEkO7F5xjWb3YHkvj_pQuR0gsJETrGA8ZTE';
  const WA = '34646427613';
  AM.css('am-upd', `
    .upd-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:14px}
    .upd{position:relative;background:var(--surface,#fff);border:1px solid var(--border,#e6e1d8);border-radius:18px;padding:20px;display:flex;flex-direction:column}
    .upd .e{font-size:32px}.upd .n{font-weight:900;font-size:18px;margin:8px 0 4px}.upd .r{font-size:13px;color:var(--txt2,#555);margin-bottom:10px}
    .upd ul{margin:0 0 14px;padding-left:18px;font-size:13px;color:var(--txt2,#555);line-height:1.5;flex:1}
    .upd .p{font-weight:900;font-size:22px}.upd .p small{font-size:13px;font-weight:700;color:var(--txt3,#888)}
    .upd .nuevo{position:absolute;top:14px;right:14px;background:#3BE29A;color:#08281a;font-size:11px;font-weight:900;padding:3px 9px;border-radius:999px}
    .upd.on{border-color:var(--accent,#0F7B4C);box-shadow:0 0 0 2px color-mix(in srgb,var(--accent,#0F7B4C) 25%,transparent)}
    .upd-pack{background:linear-gradient(135deg,#141416,#2a2a30);color:#fff;border-radius:18px;padding:22px;display:flex;gap:16px;align-items:center;flex-wrap:wrap;margin-bottom:16px}`);

  async function pedir(cfg, m) {
    const quien = cfg.contacto ? `${cfg.contacto} de ${cfg.cliente}` : cfg.cliente;
    const precio = '';
    const msg = `Hola Airmate, soy ${quien}. Me interesa añadir «${m.nombre}» a mi panel. ¿Me contáis cómo funciona y cuándo lo podemos activar?`;
    const wa = w.open(`https://wa.me/${WA}?text=${encodeURIComponent(msg)}`, '_blank');   // dentro del clic, para que no lo bloquee el navegador
    try {
      const r = await fetch(AIRMATE_SB + '/rest/v1/web_requests', { method: 'POST', headers: { apikey: AIRMATE_ANON, Authorization: 'Bearer ' + AIRMATE_ANON, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
        body: JSON.stringify({ business_name: cfg.cliente, business_type: 'Cliente · actualización', phone: cfg.telefono || null, description: `[Actualización] ${m.nombre}${precio} · pedido desde el panel${cfg.contacto ? ' por ' + cfg.contacto : ''}`, status: 'pending' }) });
      if (!r.ok && !wa) throw new Error('no guardado');
      AM.toast('✓ Solicitud enviada a Airmate. Te escribimos para activarlo.');
    } catch (e) { AM.toast(wa ? 'Te hemos abierto WhatsApp con la solicitud' : 'No se pudo enviar: escríbenos por WhatsApp'); }
  }

  async function mount(el, cfg) {
    el.classList.add('am'); el.innerHTML = '<div class="am-card">Cargando novedades…</div>';
    let cat; try { const r = await fetch((cfg.catalogoUrl || CATALOGO) + '?v=' + Date.now()); cat = await r.json(); } catch (e) { el.innerHTML = '<div class="am-card">No se pudieron cargar las actualizaciones ahora mismo.</div>'; return; }
    const inst = new Set(cfg.instalados || []);
    const disp = cat.modulos.filter(m => !inst.has(m.id)), tengo = cat.modulos.filter(m => inst.has(m.id));
    const pack = (cat.packs || []).find(p => p.incluye.some(i => !inst.has(i)));
    const tarjeta = (m, on) => `<div class="upd ${on ? 'on' : ''}">${m.nuevo && !on ? '<span class="nuevo">NUEVO</span>' : ''}<div class="e">${m.icono}</div><div class="n">${AM.esc(m.nombre)}</div><div class="r">${AM.esc(m.resuelve)}</div>
      <ul>${m.incluye.map(i => `<li>${AM.esc(i)}</li>`).join('')}</ul>
      ${on ? '<span class="am-tag am-ok" style="align-self:flex-start">✓ Activo en tu panel</span>'
      : `<div class="am-row" style="justify-content:space-between"><div style="font-size:12px;color:var(--txt3,#888)">${AM.esc(m.para || '')}</div><button class="am-btn pri" data-pedir="${m.id}">Me interesa</button></div>`}</div>`;
    el.innerHTML = `<div class="am-card" style="background:transparent;border:0;padding:0">
      <div style="font-size:26px;font-weight:900;letter-spacing:-.02em">✨ Actualizaciones</div>
      <div style="font-size:14px;color:var(--txt3,#888);margin:4px 0 18px">Nuevas funciones que puedes añadir a tu panel. Las instalamos nosotros, sin parar tu negocio.</div>
      ${aviActivo(cat.aviso) ? `<div class="upd-pack" style="background:#141416"><div style="font-size:30px">🤝</div><div style="flex:1;min-width:200px"><div style="font-weight:900;font-size:19px">${AM.esc(cat.aviso.titulo)}</div><div style="font-size:13px;opacity:.8">${AM.esc(cat.aviso.texto)}</div></div>
        <button class="am-btn pri" data-reco="1">Recomendar por WhatsApp</button></div>` : ''}
      ${pack ? `<div class="upd-pack"><div style="font-size:34px">🎁</div><div style="flex:1;min-width:200px"><div style="font-weight:900;font-size:19px">${AM.esc(pack.nombre)}</div><div style="font-size:13px;opacity:.8">${AM.esc(pack.descripcion)}</div></div>
        <button class="am-btn pri" data-pack="${pack.id}">Me interesa</button></div>` : ''}
      <div class="upd-grid">${disp.map(m => tarjeta(m, false)).join('')}</div>
      ${tengo.length ? `<div class="am-h" style="margin-top:22px">Ya tienes</div><div class="upd-grid">${tengo.map(m => tarjeta(m, true)).join('')}</div>` : ''}
      <div style="font-size:12px;color:var(--txt3,#888);margin-top:16px">Pulsa «Me interesa» y te escribimos por WhatsApp con los detalles. Las instalamos nosotros.</div></div>`;
    el.querySelectorAll('[data-pedir]').forEach(b => b.onclick = () => pedir(cfg, cat.modulos.find(m => m.id === b.dataset.pedir)));
    el.querySelectorAll('[data-reco]').forEach(b => b.onclick = () => compartir(cat.aviso, cfg));
    el.querySelectorAll('[data-pack]').forEach(b => b.onclick = () => pedir(cfg, (cat.packs || []).find(p => p.id === b.dataset.pack)));
    return { nuevos: disp.filter(m => m.nuevo).length };
  }
  /* AVISO OBLIGATORIO (catalogo.aviso): sale una vez por aviso al entrar en el panel, cuando ya se ha iniciado sesión.
     Solo se cierra con un botón. Se recuerda en este navegador con la clave am_aviso_<id>. */
  const aviVisto = id => { try { return localStorage.getItem('am_aviso_' + id); } catch (e) { return '1'; } };
  const aviMarcar = id => { try { localStorage.setItem('am_aviso_' + id, new Date().toISOString()); } catch (e) {} };
  const aviActivo = a => a && a.id && (!a.hasta || Date.now() < Date.parse(a.hasta + 'T00:00:00'));
  const aviTexto = (t, cfg) => String(t || '').split('{cliente}').join(cfg.cliente || 'mi negocio');
  function compartir(a, cfg) { w.open('https://wa.me/?text=' + encodeURIComponent(aviTexto(a.compartir, cfg)), '_blank'); }
  function enLogin() { // hay un campo de contraseña a la vista = todavía no ha entrado
    return [...document.querySelectorAll('input[type=password]')].some(i => i.offsetParent !== null && i.getBoundingClientRect().width > 0);
  }
  function mostrarAviso(a, cfg) {
    if (!aviActivo(a) || aviVisto(a.id) || document.getElementById('am-aviso')) return;
    if (enLogin() || document.visibilityState !== 'visible') { setTimeout(() => mostrarAviso(a, cfg), 1500); return; }
    const d = document.createElement('div'); d.id = 'am-aviso';
    d.setAttribute('role', 'dialog'); d.setAttribute('aria-modal', 'true'); d.setAttribute('aria-labelledby', 'am-aviso-t');
    d.style.cssText = 'position:fixed;inset:0;z-index:99999;background:rgba(10,10,12,.55);display:flex;align-items:center;justify-content:center;padding:16px';
    d.innerHTML = `<div style="background:#fff;color:#141416;max-width:460px;width:100%;border-radius:18px;padding:26px 24px 22px;font:15px/1.5 system-ui,-apple-system,Segoe UI,sans-serif;box-shadow:0 20px 60px rgba(0,0,0,.3)">
      <div style="font-size:12px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:#8a7346">Novedad de Airmate</div>
      <div id="am-aviso-t" style="font-size:22px;font-weight:900;line-height:1.2;margin:8px 0 10px">${AM.esc(a.titulo)}</div>
      <p style="margin:0 0 8px">${AM.esc(a.texto)}</p>
      ${a.extra ? `<p style="margin:0 0 18px;color:#5b5b60">${AM.esc(a.extra)}</p>` : ''}
      <div style="display:flex;gap:10px;flex-wrap:wrap">
        <button type="button" data-a="wa" style="flex:1 1 200px;border:0;border-radius:12px;padding:13px 16px;background:#141416;color:#fff;font:700 15px system-ui;cursor:pointer">Recomendar por WhatsApp</button>
        <button type="button" data-a="ok" style="flex:1 1 120px;border:1px solid #d6d3cc;border-radius:12px;padding:13px 16px;background:#fff;color:#141416;font:700 15px system-ui;cursor:pointer">Entendido</button>
      </div></div>`;
    document.body.appendChild(d);
    const cerrar = () => { aviMarcar(a.id); d.remove(); };
    d.querySelector('[data-a=wa]').onclick = () => { compartir(a, cfg); cerrar(); };
    d.querySelector('[data-a=ok]').onclick = cerrar;
    setTimeout(() => d.querySelector('[data-a=ok]').focus(), 50);
  }

  /* para poner un puntito «nuevo» en el menú del panel (y de paso enseñar el aviso obligatorio) */
  async function hayNuevos(cfg) { try { const c = await (await fetch((cfg.catalogoUrl || CATALOGO) + '?v=' + Date.now())).json(); if (c.aviso) mostrarAviso(c.aviso, cfg); const inst = new Set(cfg.instalados || []); return c.modulos.filter(m => m.nuevo && !inst.has(m.id)).length; } catch (e) { return 0; } }
  w.AirmateActualizaciones = { mount, hayNuevos };
})(window);
