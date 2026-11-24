/* Costa Norte · reservas directas de apartamentos (sin Avirato ni plataformas) */
(function () {
  var SB = 'https://vjofxmfwdybktpwiuanc.supabase.co';
  var KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZqb2Z4bWZ3ZHlia3Rwd2l1YW5jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ0NzU5NDYsImV4cCI6MjA5MDA1MTk0Nn0.ixU-33c0FEkO7F5xjWb3YHkvj_pQuR0gsJETrGA8ZTE';
  var WA = 'https://wa.me/34609282963?text=';
  var q = new URLSearchParams(location.search);
  var DEMO = q.get('demo') === '1';
  var $ = function (s) { return document.querySelector(s); };
  var eur = function (n) { return Number(n).toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 2 }) + ' €'; };
  var fecha = function (s) { var p = s.split('-'); return new Date(p[0], p[1] - 1, p[2]).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' }); };
  var iso = function (d) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };

  var fichas = [].slice.call(document.querySelectorAll('.ficha'));
  var TIPOS = {}; fichas.forEach(function (f) { TIPOS[f.dataset.tipo] = { nombre: f.dataset.nombre, foto: f.dataset.foto, cap: +f.dataset.cap, uds: +f.dataset.uds }; });
  var PACKS = [
    { id: 1, nombre: 'Surf Camp 2 días', precio_persona: 190 },
    { id: 2, nombre: 'Extreme 2 días', precio_persona: 240 },
    { id: 3, nombre: 'Rip Curl 2 días', precio_persona: 260 }
  ];
  var autoReserva = q.get('reservar') === '1', preferido = q.get('tipo') || null, busqueda = null, elegido = null, totalActual = 0, reservaHecha = null, promo = null;

  function rpc(fn, body) {
    if (DEMO) return Promise.resolve(demo(fn, body));
    return fetch(SB + '/rest/v1/rpc/' + fn, { method: 'POST', headers: { apikey: KEY, Authorization: 'Bearer ' + KEY, 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      .then(function (r) { return r.json().then(function (j) { if (!r.ok) { var e = new Error(j.message || 'Error'); e.sinSistema = r.status === 404 || j.code === 'PGRST202'; throw e; } return j; }); });
  }
  function demo(fn, b) {
    if (fn === 'cn_apt_packs_publicos') return PACKS;
    if (fn === 'cn_apt_reservar') return { codigo: 'CN-DEMO01', total: null };
    if (fn === 'cn_apt_promo') return /^COSTANORTE5$/i.test(b.p_codigo) ? 5 : null;
    if (fn === 'cn_apt_calendario') { var out = [], d0 = new Date(b.p_desde); for (var k = 0; k < b.p_dias; k++) { var d = new Date(d0); d.setDate(d.getDate() + k); var v = /-0[78]-/.test(iso(d)); out.push({ dia: iso(d), libres: (d.getDate() % 9 === 0) ? 0 : 2, precio: v ? 200 : 85, estancia_min: v ? 3 : 1 }); } return out; }
    var n = Math.round((new Date(b.p_salida) - new Date(b.p_entrada)) / 864e5), ver = /-0[78]-/.test(b.p_entrada);
    return Object.keys(TIPOS).filter(function (k) { return TIPOS[k].cap >= b.p_personas; }).map(function (k, i) {
      var base = ver ? 200 : (k === '46' || k === '48' ? 55 : 85);
      return { tipo_id: +k, nombre: TIPOS[k].nombre, capacidad: TIPOS[k].cap, libres: i % 4 === 3 ? 0 : TIPOS[k].uds, noches: n, total: base * n, estancia_min: ver ? 3 : 1 };
    });
  }

  /* carrusel de fotos de cada ficha */
  document.querySelectorAll('.carr').forEach(function (c) {
    var pista = c.querySelector('.carr__pista'), n = pista.children.length, a = c.querySelector('.carr__btn--a'), sgt = c.querySelector('.carr__btn--s');
    var num = c.querySelector('.carr__n'), barra = c.querySelector('.carr__barra i');
    function idx() { return Math.round(pista.scrollLeft / pista.clientWidth); }
    function pinta() { var i = idx(); num.textContent = (i + 1) + ' / ' + n; barra.style.transform = 'scaleX(' + ((i + 1) / n).toFixed(3) + ')'; a.disabled = i === 0; sgt.disabled = i === n - 1; }
    a.addEventListener('click', function () { pista.scrollBy({ left: -pista.clientWidth }); });
    sgt.addEventListener('click', function () { pista.scrollBy({ left: pista.clientWidth }); });
    pista.addEventListener('keydown', function (e) { if (e.key === 'ArrowRight') { pista.scrollBy({ left: pista.clientWidth }); e.preventDefault(); } if (e.key === 'ArrowLeft') { pista.scrollBy({ left: -pista.clientWidth }); e.preventDefault(); } });
    var t; pista.addEventListener('scroll', function () { clearTimeout(t); t = setTimeout(pinta, 60); }, { passive: true });
    pinta();
  });
  document.querySelectorAll('[data-elegir]').forEach(function (a) {
    a.addEventListener('click', function () { preferido = a.dataset.elegir; setTimeout(function () { $('#b-in').focus(); }, 400); });
  });

  /* buscador */
  var fin = $('#b-in'), fout = $('#b-out'), fper = $('#b-per'), aviso = $('#b-aviso');
  var hoy = new Date(); fin.min = iso(hoy);
  fin.addEventListener('change', function () {
    if (!fin.value) return;
    var d = new Date(fin.value); d.setDate(d.getDate() + 1); fout.min = iso(d);
    if (!fout.value || fout.value <= fin.value) { d.setDate(d.getDate() + 1); fout.value = iso(d); }
  });
  if (q.get('entrada')) fin.value = q.get('entrada');
  if (q.get('salida')) fout.value = q.get('salida');
  if (q.get('personas')) fper.value = q.get('personas');

  function avisa(txt, err) { aviso.innerHTML = txt; aviso.classList.toggle('aviso--err', !!err); }
  function waTxt() { return WA + encodeURIComponent('Hola, quiero reservar un apartamento del ' + (fin.value || '?') + ' al ' + (fout.value || '?') + ' para ' + fper.value + ' personas'); }

  $('#f-busca').addEventListener('submit', function (e) {
    e.preventDefault();
    if (!fin.value || !fout.value) return avisa('Elige la fecha de llegada y la de salida.', true);
    if (fout.value <= fin.value) return avisa('La salida tiene que ser después de la llegada.', true);
    avisa('Buscando…');
    busqueda = { entrada: fin.value, salida: fout.value, personas: +fper.value };
    rpc('cn_apt_disponibilidad', { p_entrada: fin.value, p_salida: fout.value, p_personas: +fper.value }).then(pinta).catch(function (err) {
      if (err.sinSistema) avisa('Las reservas online se están activando. Mientras tanto, <a class="txt" href="' + waTxt() + '">pídenos tus fechas por WhatsApp</a>.', true);
      else avisa(err.message + '. <a class="txt" href="' + waTxt() + '">Pregúntanos por WhatsApp</a>.', true);
    });
  });

  function pinta(lista) {
    var sec = $('#resultados'), ul = $('#resul-lista'); ul.innerHTML = '';
    if (preferido) lista.sort(function (a, b) { return (b.tipo_id == preferido) - (a.tipo_id == preferido); });
    var libres = lista.filter(function (t) { return t.libres > 0 && t.noches >= t.estancia_min; });
    $('#resul-txt').textContent = fecha(busqueda.entrada) + ' a ' + fecha(busqueda.salida) + ', ' + busqueda.personas + (busqueda.personas > 1 ? ' personas' : ' persona') + '. ' + (libres.length ? libres.length + ' opciones libres.' : 'No queda nada libre con esas fechas.');
    lista.forEach(function (t) {
      var info = TIPOS[t.tipo_id] || { nombre: t.nombre, foto: '../img/a31-terraza.jpg' };
      var corto = t.noches < t.estancia_min, ok = t.libres > 0 && !corto;
      var li = document.createElement('li'); li.className = 'resul__fila' + (ok ? '' : ' resul__fila--no');
      li.innerHTML = '<img src="' + info.foto + '" alt="" width="160" height="120"><div><h3></h3><p></p></div>' +
        '<div class="resul__precio">' + (ok ? '<b>' + eur(t.total) + '</b><span>' + t.noches + (t.noches > 1 ? ' noches' : ' noche') + '</span>' : '') + '</div>' +
        (ok ? '<button class="btn btn--pri" type="button">Reservar</button>' : '<button class="btn btn--sec" type="button" data-cal="' + t.tipo_id + '">Otras fechas</button>');
      li.querySelector('h3').textContent = info.nombre;
      li.querySelector('p').textContent = !t.libres ? 'Completo en esas fechas' : corto ? 'Mínimo ' + t.estancia_min + ' noches en esas fechas' : 'Hasta ' + t.capacidad + ' personas. ' + (t.libres === 1 ? 'Queda 1' : 'Quedan ' + t.libres);
      if (ok) li.querySelector('button').addEventListener('click', function () { abre(t); });
      ul.appendChild(li);
    });
    if (!libres.length) avisa('No queda nada libre. Prueba otras fechas o <a class="txt" href="' + waTxt() + '">escríbenos</a> y te buscamos hueco.');
    else avisa('Precio directo, sin comisiones de plataformas.');
    if (autoReserva) {
      autoReserva = false;
      var t0 = lista.filter(function (x) { return String(x.tipo_id) === String(preferido) && x.libres > 0 && x.noches >= x.estancia_min; })[0];
      if (t0) {
        sec.hidden = false; abre(t0);
        var c = Math.min(+q.get('cant') || 1, t0.libres); $('#r-cant').value = c; $('#r-cant').dispatchEvent(new Event('change'));
        if (q.get('hues')) { $('#r-ad').value = Math.min(+q.get('hues'), t0.capacidad * c); $('#r-ad').dispatchEvent(new Event('change')); }
        if (q.get('promo')) { $('#r-promo').value = q.get('promo'); $('#r-promo-btn').click(); }
        return;
      }
    }
    sec.hidden = false; sec.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  }

  /* panel de reserva */
  var cajon = $('#cajon'), ultimoFoco = null;
  rpc('cn_apt_packs_publicos', {}).then(function (p) { if (p && p.length) PACKS = p; }).catch(function () {}).then(function () {
    PACKS.forEach(function (p) { var o = document.createElement('option'); o.value = p.id; o.textContent = p.nombre + ' (' + eur(p.precio_persona) + ' por persona)'; $('#r-pack').appendChild(o); });
    if (q.get('pack')) $('#r-pack').value = q.get('pack');
  });
  function opciones(sel, desde, hasta, val) { sel.innerHTML = ''; for (var i = desde; i <= hasta; i++) { var o = document.createElement('option'); o.textContent = i; sel.appendChild(o); } sel.value = Math.min(Math.max(val, desde), hasta); }
  function resumen() {
    var ad = +$('#r-ad').value, ni = +$('#r-ni').value, pack = PACKS.filter(function (p) { return p.id == $('#r-pack').value; })[0];
    $('#r-packper-c').hidden = !pack;
    if (pack) opciones($('#r-packper'), 1, ad + ni, +$('#r-packper').value || ad + ni);
    var pp = pack ? pack.precio_persona * +$('#r-packper').value : 0;
    var t = elegido, info = TIPOS[t.tipo_id], cant = +$('#r-cant').value || 1;
    var alo = t.total * cant, desc = promo ? Math.round(alo * promo.pct) / 100 : 0;
    totalActual = alo - desc + pp;
    $('#c-resumen').innerHTML = '';
    [[info.nombre + (cant > 1 ? ' × ' + cant : ''), ''], [fecha(busqueda.entrada) + ' a ' + fecha(busqueda.salida), t.noches + (t.noches > 1 ? ' noches' : ' noche')], ['Alojamiento', eur(alo)]]
      .concat(desc ? [['Código ' + promo.codigo + ' (−' + promo.pct + ' %)', '−' + eur(desc)]] : [])
      .concat(pack ? [[pack.nombre + ' × ' + $('#r-packper').value, eur(pp)]] : []).concat([['Total', eur(totalActual)]])
      .forEach(function (r, i, a) { var li = document.createElement('li'); if (i === a.length - 1) li.className = 'total'; li.innerHTML = '<span></span><span></span>'; li.children[0].textContent = r[0]; li.children[1].textContent = r[1]; $('#c-resumen').appendChild(li); });
  }
  function abre(t) {
    elegido = t; ultimoFoco = document.activeElement;
    opciones($('#r-cant'), 1, Math.max(1, Math.min(t.libres, 6)), 1);
    $('#r-cant').parentNode.hidden = t.libres < 2;
    opciones($('#r-ad'), 1, t.capacidad, busqueda.personas);
    opciones($('#r-ni'), 0, Math.max(0, t.capacidad - 1), 0);
    $('#c-paso1').hidden = false; $('#c-paso2').hidden = true; $('#r-aviso').classList.remove('aviso--err');
    resumen();
    cajon.classList.add('abierto'); cajon.setAttribute('aria-hidden', 'false'); document.body.style.overflow = 'hidden';
    setTimeout(function () { $('#r-ad').focus(); }, 50);
  }
  function cierra() { cajon.classList.remove('abierto'); cajon.setAttribute('aria-hidden', 'true'); document.body.style.overflow = ''; if (ultimoFoco) ultimoFoco.focus(); }
  cajon.addEventListener('click', function (e) { if (e.target === cajon || e.target.closest('[data-cerrar]')) cierra(); });
  addEventListener('keydown', function (e) { if (e.key === 'Escape' && cajon.classList.contains('abierto')) cierra(); });
  ['#r-pack', '#r-packper'].forEach(function (s) { $(s).addEventListener('change', resumen); });
  function capTotal() { return elegido.capacidad * (+$('#r-cant').value || 1); }
  $('#r-cant').addEventListener('change', function () { opciones($('#r-ad'), 1, capTotal(), +$('#r-ad').value); var max = capTotal() - +$('#r-ad').value; opciones($('#r-ni'), 0, max, Math.min(+$('#r-ni').value, max)); resumen(); });
  $('#r-ad').addEventListener('change', function () { var max = capTotal() - +$('#r-ad').value; opciones($('#r-ni'), 0, max, Math.min(+$('#r-ni').value, max)); resumen(); });
  $('#r-promo-btn').addEventListener('click', function () {
    var c = $('#r-promo').value.trim().toUpperCase(), av = $('#r-promo-av'); av.classList.remove('aviso--err');
    if (!c) { promo = null; av.textContent = ''; resumen(); return; }
    av.textContent = 'Comprobando…';
    rpc('cn_apt_promo', { p_codigo: c }).then(function (pct) {
      if (pct) { promo = { codigo: c, pct: +pct }; av.textContent = 'Código aplicado: ' + pct + ' % de descuento en el alojamiento.'; }
      else { promo = null; av.textContent = 'Ese código no es válido.'; av.classList.add('aviso--err'); }
      resumen();
    }).catch(function () { promo = null; av.textContent = 'No se ha podido comprobar el código.'; av.classList.add('aviso--err'); resumen(); });
  });
  $('#r-ni').addEventListener('change', resumen);

  $('#f-reserva').addEventListener('submit', function (e) {
    e.preventDefault();
    var av = $('#r-aviso'), btn = $('#r-btn');
    var nom = $('#r-nom').value.trim(), mail = $('#r-mail').value.trim(), tel = $('#r-tel').value.trim();
    if (!nom || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(mail) || tel.replace(/\D/g, '').length < 6) { av.textContent = 'Revisa tu nombre, email y teléfono.'; av.classList.add('aviso--err'); return; }
    btn.disabled = true; btn.textContent = 'Reservando…';
    var pack = $('#r-pack').value;
    rpc('cn_apt_reservar', { p_tipo: elegido.tipo_id, p_entrada: busqueda.entrada, p_salida: busqueda.salida, p_adultos: +$('#r-ad').value, p_ninos: +$('#r-ni').value,
      p_nombre: nom, p_email: mail, p_telefono: tel, p_pack: pack ? +pack : null, p_pack_personas: pack ? +$('#r-packper').value : 0, p_notas: $('#r-not').value.trim() || null, p_cantidad: +$('#r-cant').value || 1, p_promo: promo ? promo.codigo : null })
      .then(function (r) {
        var tot = r.total != null ? r.total : totalActual;
        reservaHecha = { codigo: r.codigo, email: mail };
        $('#ok-cod').textContent = r.codigo;
        $('#ok-txt').textContent = (DEMO ? 'Esto es una demostración: no se ha guardado nada. ' : '') + 'Guarda este código.';
        $('#pg-concepto').textContent = 'Apartamento ' + r.codigo + ' ' + nom.split(' ')[0];
        $('#pg-importe').textContent = eur(tot);
        $('#ok-checkin').href = '../checkin/?c=' + encodeURIComponent(r.codigo);
        $('#c-paso1').hidden = true; $('#c-paso2').hidden = false;
        if (!DEMO && window.emailjs) {
          try {
            emailjs.init('i4iBVVP-BkUOOwBE9');
            var cant = +$('#r-cant').value || 1;
            emailjs.send('service_npmjvvf', 'template_qnip0mc', {
              to_email: mail, client_name: nom, reply_to: mail,
              service: TIPOS[elegido.tipo_id].nombre + (cant > 1 ? ' × ' + cant : '') + ', ' + elegido.noches + (elegido.noches > 1 ? ' noches' : ' noche') + '. Total ' + eur(tot) + ' por transferencia (EMBARCACION NORTE, S.L, IBAN ES36 0182 5728 4002 0154 0239)',
              fecha: fecha(busqueda.entrada) + ' a ' + fecha(busqueda.salida) + ' (llegada desde las 16:00, salida hasta las 11:00)',
              location: 'Apartamentos Costa Norte, Av. Francisco Giner de los Ríos 46, San Vicente de la Barquera',
              confirm_code: r.codigo
            }).catch(function () {});
          } catch (e) {}
        }
      })
      .catch(function (err) { av.innerHTML = ''; av.textContent = err.sinSistema ? 'Las reservas online se están activando. Escríbenos por WhatsApp al 609 282 963.' : err.message; av.classList.add('aviso--err'); })
      .then(function () { btn.disabled = false; btn.textContent = 'Reservar'; });
  });

  /* pago por transferencia y justificante (mismo sistema que las clases) */
  $('#pg-copiar').addEventListener('click', function () {
    var b = this; navigator.clipboard.writeText('ES3601825728400201540239').then(function () { b.textContent = 'IBAN copiado'; setTimeout(function () { b.textContent = 'Copiar IBAN'; }, 2000); });
  });
  $('#pg-file').addEventListener('change', function () {
    var f = this.files[0], av = $('#pg-aviso'), lab = document.querySelector('.subir'); if (!f || !reservaHecha) return;
    if (f.size > 10 * 1024 * 1024) { av.textContent = 'El archivo pesa demasiado (máximo 10 MB).'; av.classList.add('aviso--err'); return; }
    av.classList.remove('aviso--err'); av.textContent = 'Subiendo…';
    if (DEMO) { lab.classList.add('ok'); $('#pg-file-txt').textContent = 'Justificante recibido'; av.textContent = 'Demostración: no se ha subido nada.'; return; }
    var ext = (f.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '');
    var ruta = 'costa-norte/apt-' + reservaHecha.codigo + '-' + Date.now() + '.' + ext;
    fetch(SB + '/storage/v1/object/JUSTIFICANTES/' + ruta, { method: 'POST', headers: { apikey: KEY, Authorization: 'Bearer ' + KEY, 'Content-Type': f.type || 'application/octet-stream', 'x-upsert': 'true' }, body: f })
      .then(function (r) { if (!r.ok) throw new Error('upload ' + r.status); return rpc('cn_apt_vincular_justificante', { p_codigo: reservaHecha.codigo, p_email: reservaHecha.email, p_url: SB + '/storage/v1/object/public/JUSTIFICANTES/' + ruta }); })
      .then(function (ok) {
        if (!ok) throw new Error('No se ha podido vincular a tu reserva');
        lab.classList.add('ok'); $('#pg-file-txt').textContent = 'Justificante recibido';
        av.textContent = '¡Gracias! Lo comprobamos y te confirmamos la reserva en menos de 24 horas.';
      })
      .catch(function () { av.textContent = 'No se ha podido subir. Mándanos el justificante por WhatsApp al 609 282 963 con tu código.'; av.classList.add('aviso--err'); });
  });

  /* calendario de precios y días libres por tipo (como «otras fechas disponibles» de Avirato) */
  var cal = $('#cal'), calTipo = null, calMes = null, calDatos = {}, calIn = null, calOut = null;
  var MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  function abreCal(tipo) {
    calTipo = String(tipo); calIn = calOut = null; calDatos = {}; ultimoFoco = document.activeElement;
    var h = new Date(); calMes = new Date(h.getFullYear(), h.getMonth(), 1);
    $('#cal-tit').textContent = TIPOS[calTipo] ? TIPOS[calTipo].nombre : 'Calendario';
    cal.classList.add('abierto'); cal.setAttribute('aria-hidden', 'false'); document.body.style.overflow = 'hidden';
    pintaCal(); setTimeout(function () { $('#cal-next').focus(); }, 50);
  }
  function cierraCal() { cal.classList.remove('abierto'); cal.setAttribute('aria-hidden', 'true'); document.body.style.overflow = ''; if (ultimoFoco) ultimoFoco.focus(); }
  cal.addEventListener('click', function (e) { if (e.target === cal || e.target.closest('[data-cerrar]')) cierraCal(); });
  addEventListener('keydown', function (e) { if (e.key === 'Escape' && cal.classList.contains('abierto')) cierraCal(); });
  document.addEventListener('click', function (e) { var b = e.target.closest('[data-cal]'); if (b && !b.closest('#cal')) abreCal(b.dataset.cal); });
  $('#cal-prev').addEventListener('click', function () { calMes.setMonth(calMes.getMonth() - 1); pintaCal(); });
  $('#cal-next').addEventListener('click', function () { calMes.setMonth(calMes.getMonth() + 1); pintaCal(); });
  function carga(desde) {
    var clave = calTipo + iso(desde);
    if (calDatos[clave]) return Promise.resolve(calDatos[clave]);
    return rpc('cn_apt_calendario', { p_tipo: +calTipo, p_desde: iso(desde), p_dias: 42 }).then(function (l) { var m = {}; (l || []).forEach(function (x) { m[x.dia] = x; }); calDatos[clave] = m; return m; });
  }
  function pintaCal() {
    var hoyD = new Date(); hoyD.setHours(0, 0, 0, 0);
    $('#cal-prev').disabled = calMes <= new Date(hoyD.getFullYear(), hoyD.getMonth(), 1);
    $('#cal-mes').textContent = MESES[calMes.getMonth()] + ' ' + calMes.getFullYear();
    var g = $('#cal-grid'); g.innerHTML = '<p class="cal__ayuda">Cargando…</p>';
    carga(calMes).then(function (m) {
      g.innerHTML = '';
      var hueco = (calMes.getDay() + 6) % 7; for (var k = 0; k < hueco; k++) g.appendChild(document.createElement('span'));
      var dias = new Date(calMes.getFullYear(), calMes.getMonth() + 1, 0).getDate();
      for (var d = 1; d <= dias; d++) {
        var f = new Date(calMes.getFullYear(), calMes.getMonth(), d), k2 = iso(f), x = m[k2], b = document.createElement('button');
        b.type = 'button'; b.dataset.dia = k2;
        var libre = x && x.libres > 0, pasado = f < hoyD;
        b.innerHTML = '<b>' + d + '</b><small>' + (x && !pasado ? (libre ? Math.round(x.precio) + ' €' : 'completo') : '') + '</small>';
        if (pasado || !x) b.disabled = true;
        else if (!libre) { b.classList.add('lleno'); if (!(calIn && !calOut && k2 > calIn)) b.disabled = true; }
        if (k2 === calIn || k2 === calOut) b.classList.add('sel');
        if (calIn && calOut && k2 > calIn && k2 < calOut) b.classList.add('rango');
        b.setAttribute('aria-label', d + ' de ' + MESES[calMes.getMonth()] + (x && !pasado ? (libre ? ', ' + Math.round(x.precio) + ' euros la noche' : ', completo') : ''));
        g.appendChild(b);
      }
      resumenCal(m);
    }).catch(function () { g.innerHTML = '<p class="aviso aviso--err">No se ha podido cargar el calendario.</p>'; });
  }
  $('#cal-grid').addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b || b.disabled) return; var k = b.dataset.dia;
    if (!calIn || calOut || k <= calIn) { if (b.classList.contains('lleno')) return; calIn = k; calOut = null; }
    else {
      var ok = true, f = new Date(calIn); var todo = {}; Object.keys(calDatos).forEach(function (c) { Object.assign(todo, calDatos[c]); });
      while (iso(f) < k) { var x = todo[iso(f)]; if (!x || x.libres < 1) { ok = false; break; } f.setDate(f.getDate() + 1); }
      if (ok) calOut = k; else { $('#cal-sel').textContent = 'Hay noches completas entre esas fechas. Elige otra salida.'; return; }
    }
    pintaCal();
  });
  function resumenCal() {
    var p = $('#cal-sel'), okb = $('#cal-ok');
    if (!calIn) { p.textContent = ''; okb.disabled = true; $('#cal-ayuda').textContent = 'Elige el día de llegada. Debajo de cada día, el precio por noche.'; return; }
    if (!calOut) { p.textContent = 'Llegada el ' + fecha(calIn) + '. Ahora elige el día de salida.'; okb.disabled = true; return; }
    var n = Math.round((new Date(calOut) - new Date(calIn)) / 864e5);
    p.textContent = fecha(calIn) + ' a ' + fecha(calOut) + ', ' + n + (n > 1 ? ' noches.' : ' noche.'); okb.disabled = false;
  }
  $('#cal-ok').addEventListener('click', function () {
    fin.value = calIn; fout.value = calOut; preferido = calTipo; cierraCal();
    $('#f-busca').dispatchEvent(new Event('submit', { cancelable: true }));
  });

  if (q.get('cal')) abreCal(q.get('cal'));
  else if (autoReserva && fin.value && fout.value) $('#f-busca').dispatchEvent(new Event('submit', { cancelable: true }));
})();
