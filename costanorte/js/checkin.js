/* Costa Norte · check-in online de huéspedes (datos para SES.Hospedajes) */
(function () {
  var LOC = { en: 'en-GB', fr: 'fr-FR', de: 'de-DE', it: 'it-IT', nl: 'nl-NL', ar: 'ar-u-nu-latn' }[document.documentElement.lang] || 'es-ES';
  var T = function (k) { return (window.CN_I18N && CN_I18N[k]) || k; };
  var F = function (k, v) { return T(k).replace(/\{(\w+)\}/g, function (_, x) { return v[x]; }); };
  var SB = 'https://vjofxmfwdybktpwiuanc.supabase.co';
  var KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZqb2Z4bWZ3ZHlia3Rwd2l1YW5jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ0NzU5NDYsImV4cCI6MjA5MDA1MTk0Nn0.ixU-33c0FEkO7F5xjWb3YHkvj_pQuR0gsJETrGA8ZTE';
  var $ = function (s) { return document.querySelector(s); };
  var q = new URLSearchParams(location.search), res = null;
  if (q.get('c')) $('#ci-cod').value = q.get('c');
  function rpc(fn, body) {
    return fetch(SB + '/rest/v1/rpc/' + fn, { method: 'POST', headers: { apikey: KEY, Authorization: 'Bearer ' + KEY, 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      .then(function (r) { return r.json().then(function (j) { if (!r.ok) throw new Error(j.message || 'Error'); return j; }); });
  }
  var CAMPOS = [
    ['nombre', 'Nombre', 'text', 'given-name'], ['apellido1', 'Primer apellido', 'text', 'family-name'], ['apellido2', 'Segundo apellido', 'text', ''],
    ['tipo_doc', 'Documento', 'select', ''], ['num_doc', 'Número de documento', 'text', ''], ['soporte', 'Nº de soporte (DNI o NIE)', 'text', ''],
    ['nacimiento', 'Fecha de nacimiento', 'date', 'bday'], ['nacionalidad', 'Nacionalidad', 'text', 'country-name'], ['sexo', 'Sexo', 'select', ''],
    ['direccion', 'Dirección', 'text', 'street-address'], ['localidad', 'Localidad y código postal', 'text', ''], ['pais', 'País de residencia', 'text', 'country-name'],
    ['telefono', 'Teléfono', 'tel', 'tel'], ['email', 'Email', 'email', 'email']
  ];
  var OPC = { tipo_doc: ['DNI', 'NIE', 'Pasaporte', 'Otro'], sexo: ['Mujer', 'Hombre', 'Otro'] };
  $('#f-buscar').addEventListener('submit', function (e) {
    e.preventDefault();
    var av = $('#ci-aviso'); av.classList.remove('aviso--err'); av.textContent = T('Buscando…');
    rpc('cn_apt_checkin_ver', { p_codigo: $('#ci-cod').value, p_email: $('#ci-mail').value }).then(function (r) {
      if (!r) { av.textContent = T('No encontramos esa reserva. Revisa el código y el email.'); av.classList.add('aviso--err'); return; }
      res = r; av.textContent = r.hecho ? T('Ya tenemos tu check-in. Si algo ha cambiado, puedes enviarlo de nuevo.') : '';
      var f = function (s) { var p = s.split('-'); return p[2] + '/' + p[1] + '/' + p[0]; };
      $('#ci-resumen').innerHTML = '';
      [[T(r.alojamiento), r.codigo], [T('Llegada'), f(r.entrada)], [T('Salida'), f(r.salida)]].forEach(function (x) { var li = document.createElement('li'); li.innerHTML = '<span></span><span></span>'; li.children[0].textContent = x[0]; li.children[1].textContent = x[1]; $('#ci-resumen').appendChild(li); });
      var lista = $('#ci-lista'); lista.innerHTML = '';
      for (var i = 0; i < r.adultos; i++) {
        var fs = document.createElement('fieldset'); fs.className = 'huesped'; fs.style.border = '0'; fs.style.margin = '0';
        fs.innerHTML = '<h3>' + (i === 0 ? T('Titular de la reserva') : F('Huésped {n}', { n: i + 1 })) + '</h3>';
        CAMPOS.forEach(function (c) {
          if (i > 0 && (c[0] === 'telefono' || c[0] === 'email')) return;
          var id = 'h' + i + '-' + c[0], div = document.createElement('div'); div.className = 'campo';
          var el = c[2] === 'select' ? '<select id="' + id + '" name="' + c[0] + '">' + OPC[c[0]].map(function (o) { return '<option value="' + o + '">' + T(o) + '</option>'; }).join('') + '</select>'
            : '<input id="' + id + '" name="' + c[0] + '" type="' + c[2] + '" placeholder=" "' + (c[3] ? ' autocomplete="' + c[3] + '"' : '') + (c[0] === 'apellido2' || c[0] === 'soporte' ? '' : ' required') + '>';
          div.innerHTML = '<label for="' + id + '">' + T(c[1]) + '</label>' + el; fs.appendChild(div);
        });
        lista.appendChild(fs);
      }
      $('#f-huespedes').hidden = false;
    }).catch(function (err) { av.textContent = T('No hemos podido buscar la reserva:') + ' ' + err.message; av.classList.add('aviso--err'); });
  });
  $('#f-huespedes').addEventListener('submit', function (e) {
    e.preventDefault();
    var av = $('#ci-aviso2'), falta = false, datos = [];
    document.querySelectorAll('#ci-lista fieldset').forEach(function (fs) {
      var h = {}; fs.querySelectorAll('input,select').forEach(function (el) { h[el.name] = el.value.trim(); if (el.required && !h[el.name]) { falta = true; el.setAttribute('aria-invalid', 'true'); } else el.removeAttribute('aria-invalid'); });
      datos.push(h);
    });
    if (falta) { av.textContent = T('Faltan datos obligatorios.'); av.classList.add('aviso--err'); return; }
    var b = $('#ci-btn'); b.disabled = true; b.textContent = T('Enviando…');
    rpc('cn_apt_checkin_guardar', { p_codigo: res.codigo, p_email: $('#ci-mail').value, p_huespedes: datos }).then(function (ok) {
      av.classList.remove('aviso--err');
      av.textContent = ok ? T('¡Hecho! Ya tenemos tu check-in. A la llegada solo recoges las llaves.') : T('No hemos podido guardarlo. Escríbenos por WhatsApp al 609 282 963.');
    }).catch(function (err) { av.textContent = err.message; av.classList.add('aviso--err'); })
      .then(function () { b.disabled = false; b.textContent = T('Enviar check-in'); });
  });
})();
