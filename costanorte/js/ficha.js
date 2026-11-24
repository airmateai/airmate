/* Costa Norte · página de cada apartamento: galería, pestañas y «Tu reserva» con precio en vivo */
(function () {
  var SB = 'https://vjofxmfwdybktpwiuanc.supabase.co';
  var KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZqb2Z4bWZ3ZHlia3Rwd2l1YW5jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ0NzU5NDYsImV4cCI6MjA5MDA1MTk0Nn0.ixU-33c0FEkO7F5xjWb3YHkvj_pQuR0gsJETrGA8ZTE';
  var $ = function (s) { return document.querySelector(s); };
  var main = $('.ficha-pag'), TIPO = +main.dataset.tipo, CAP = +main.dataset.cap, UDS = +main.dataset.uds;
  var DEMO = new URLSearchParams(location.search).get('demo') === '1';
  var eur = function (n) { return Number(n).toLocaleString('es-ES', { maximumFractionDigits: 2 }) + ' €'; };
  var iso = function (d) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
  function rpc(fn, body) {
    if (DEMO) {
      if (fn === 'cn_apt_promo') return Promise.resolve(/^COSTANORTE5$/i.test(body.p_codigo) ? 5 : null);
      var n = Math.round((new Date(body.p_salida) - new Date(body.p_entrada)) / 864e5);
      return Promise.resolve([{ tipo_id: TIPO, capacidad: CAP, libres: UDS, noches: n, total: 85 * n, estancia_min: 1 }]);
    }
    return fetch(SB + '/rest/v1/rpc/' + fn, { method: 'POST', headers: { apikey: KEY, Authorization: 'Bearer ' + KEY, 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      .then(function (r) { return r.json().then(function (j) { if (!r.ok) throw new Error(j.message || 'Error'); return j; }); });
  }

  /* pestañas */
  var tabs = [].slice.call(document.querySelectorAll('[role="tab"]')), panes = tabs.map(function (t) { return document.getElementById(t.getAttribute('aria-controls')); });
  function tab(i, foco) { tabs.forEach(function (t, k) { t.setAttribute('aria-selected', k === i); t.tabIndex = k === i ? 0 : -1; panes[k].hidden = k !== i; }); if (foco) tabs[i].focus(); }
  tabs.forEach(function (t, k) {
    t.addEventListener('click', function () { tab(k); });
    t.addEventListener('keydown', function (e) { if (e.key === 'ArrowRight') tab((k + 1) % tabs.length, true); if (e.key === 'ArrowLeft') tab((k - 1 + tabs.length) % tabs.length, true); });
  });
  tab(0);

  /* visor de fotos */
  var visor = $('#visor'), img = $('#visor-img'), fotos = window.FOTOS || [], i0 = 0, foco = null;
  function ver(i) { i0 = (i + fotos.length) % fotos.length; img.src = fotos[i0]; $('#visor-n').textContent = (i0 + 1) + ' / ' + fotos.length; }
  function abre(i) { foco = document.activeElement; ver(i); visor.classList.add('abierto'); visor.setAttribute('aria-hidden', 'false'); document.body.style.overflow = 'hidden'; visor.querySelector('.visor__x').focus(); }
  function cierra() { visor.classList.remove('abierto'); visor.setAttribute('aria-hidden', 'true'); document.body.style.overflow = ''; if (foco) foco.focus(); }
  document.querySelectorAll('[data-foto]').forEach(function (b) { b.addEventListener('click', function () { abre(+b.dataset.foto); }); });
  visor.querySelector('.visor__b--a').addEventListener('click', function () { ver(i0 - 1); });
  visor.querySelector('.visor__b--s').addEventListener('click', function () { ver(i0 + 1); });
  visor.addEventListener('click', function (e) { if (e.target === visor || e.target.closest('[data-cerrar]')) cierra(); });
  addEventListener('keydown', function (e) {
    if (!visor.classList.contains('abierto')) return;
    if (e.key === 'Escape') cierra(); if (e.key === 'ArrowRight') ver(i0 + 1); if (e.key === 'ArrowLeft') ver(i0 - 1);
  });

  /* tu reserva */
  var fin = $('#tr-in'), fout = $('#tr-out'), cant = $('#tr-cant'), per = $('#tr-per'), promoI = $('#tr-promo'), caja = $('#tr-precio'), btn = $('#tr-btn'), ultimo = null;
  function opts(sel, a, b, v) { sel.innerHTML = ''; for (var k = a; k <= b; k++) { var o = document.createElement('option'); o.value = k; o.textContent = k + (sel === cant ? (k > 1 ? ' apartamentos' : ' apartamento') : (k > 1 ? ' huéspedes' : ' huésped')); sel.appendChild(o); } sel.value = Math.min(Math.max(v, a), b); }
  opts(cant, 1, Math.max(1, Math.min(UDS, 6)), 1); opts(per, 1, CAP, Math.min(2, CAP));
  cant.addEventListener('change', function () { opts(per, 1, CAP * +cant.value, +per.value); calcula(); });
  fin.min = iso(new Date());
  fin.addEventListener('change', function () { if (!fin.value) return; var d = new Date(fin.value); d.setDate(d.getDate() + 1); fout.min = iso(d); if (!fout.value || fout.value <= fin.value) { d.setDate(d.getDate() + 1); fout.value = iso(d); } calcula(); });
  [fout, per].forEach(function (el) { el.addEventListener('change', calcula); });
  var tp; promoI.addEventListener('input', function () { clearTimeout(tp); tp = setTimeout(calcula, 500); });
  function pinta(filas, err) {
    caja.innerHTML = '';
    if (err) { var p = document.createElement('p'); p.className = 'err'; p.textContent = err; caja.appendChild(p); return; }
    filas.forEach(function (f, k) { var d = document.createElement('div'); d.className = 'fila' + (k === filas.length - 1 ? ' total' : ''); d.innerHTML = '<span></span><span></span>'; d.children[0].textContent = f[0]; d.children[1].textContent = f[1]; caja.appendChild(d); });
  }
  function calcula() {
    btn.disabled = true; ultimo = null;
    if (!fin.value || !fout.value) { caja.innerHTML = '<p>Elige las fechas para ver el precio.</p>'; return; }
    if (fout.value <= fin.value) return pinta(null, 'La salida tiene que ser después de la llegada.');
    caja.innerHTML = '<p>Calculando…</p>';
    var c = +cant.value, codigo = promoI.value.trim();
    Promise.all([rpc('cn_apt_disponibilidad', { p_entrada: fin.value, p_salida: fout.value, p_personas: 1 }), codigo ? rpc('cn_apt_promo', { p_codigo: codigo }) : Promise.resolve(null)])
      .then(function (r) {
        var t = (r[0] || []).filter(function (x) { return x.tipo_id === TIPO; })[0], pct = r[1];
        if (!t) return pinta(null, 'No disponible en esas fechas.');
        if (t.noches < t.estancia_min) return pinta(null, 'En esas fechas la estancia mínima es de ' + t.estancia_min + ' noches.');
        if (t.libres < c) return pinta(null, t.libres ? 'Solo ' + (t.libres === 1 ? 'queda 1 libre' : 'quedan ' + t.libres + ' libres') + ' en esas fechas.' : 'Completo en esas fechas. Mira el calendario de precios.');
        var alo = t.total * c, desc = pct ? Math.round(alo * pct) / 100 : 0;
        var filas = [[eur(t.total / t.noches) + ' × ' + t.noches + (t.noches > 1 ? ' noches' : ' noche') + (c > 1 ? ' × ' + c : ''), eur(alo)]];
        if (codigo && !pct) filas.push(['El código no es válido', '']);
        if (desc) filas.push(['Código ' + codigo.toUpperCase() + ' (−' + pct + ' %)', '−' + eur(desc)]);
        filas.push(['Total', eur(alo - desc)]);
        pinta(filas); btn.disabled = false; ultimo = { promo: pct ? codigo.toUpperCase() : '' };
      }).catch(function () { pinta(null, 'No hemos podido calcular el precio. Escríbenos por WhatsApp al 609 282 963.'); });
  }
  $('#f-tr').addEventListener('submit', function (e) {
    e.preventDefault(); if (!ultimo) return;
    var q = new URLSearchParams({ entrada: fin.value, salida: fout.value, personas: Math.min(+per.value, CAP), hues: per.value, tipo: TIPO, cant: cant.value, reservar: 1 });
    if (ultimo.promo) q.set('promo', ultimo.promo); if (DEMO) q.set('demo', 1);
    location.href = '../?' + q.toString() + '#buscar';
  });
})();
