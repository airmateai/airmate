/* Costa Norte · inscripción al campamento Costa Verde → panel de Costa Norte */
(function () {
  var SB = 'https://vjofxmfwdybktpwiuanc.supabase.co';
  var KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZqb2Z4bWZ3ZHlia3Rwd2l1YW5jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ0NzU5NDYsImV4cCI6MjA5MDA1MTk0Nn0.ixU-33c0FEkO7F5xjWb3YHkvj_pQuR0gsJETrGA8ZTE';
  var DEMO = new URLSearchParams(location.search).get('demo') === '1';
  var f = document.getElementById('f-camp'); if (!f) return;
  var $ = function (id) { return document.getElementById(id); };
  var av = $('i-aviso'), btn = $('i-btn');

  function marca(el, mal) { if (mal) el.setAttribute('aria-invalid', 'true'); else el.removeAttribute('aria-invalid'); return mal; }

  f.addEventListener('submit', function (e) {
    e.preventDefault();
    av.classList.remove('aviso--err'); av.textContent = '';
    var sem = f.querySelector('input[name=semana]:checked');
    var edad = +$('i-edad').value;
    var errores = [
      !sem && 'Elige la semana.',
      marca($('i-nom'), $('i-nom').value.trim().length < 2) && 'Escribe el nombre del chaval o la chavala.',
      marca($('i-edad'), !(edad >= 6 && edad <= 17)) && 'La edad tiene que estar entre 6 y 17 años.',
      marca($('i-tut'), $('i-tut').value.trim().length < 2) && 'Escribe el nombre de la madre, el padre o el tutor.',
      marca($('i-tel'), $('i-tel').value.replace(/[^0-9]/g, '').length < 9) && 'Revisa el teléfono.',
      marca($('i-mail'), !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test($('i-mail').value.trim())) && 'Revisa el email.',
      !$('i-ok').checked && 'Marca la casilla de permiso para poder inscribirle.'
    ].filter(Boolean);
    if (errores.length) { av.textContent = errores[0]; av.classList.add('aviso--err'); return; }

    btn.disabled = true; btn.textContent = 'Enviando…';
    var datos = {
      p_semana: sem.value, p_nombre: $('i-nom').value.trim(), p_edad: edad, p_nivel: $('i-niv').value,
      p_alergias: $('i-ale').value.trim(), p_tutor: $('i-tut').value.trim(), p_telefono: $('i-tel').value.trim(),
      p_email: $('i-mail').value.trim(), p_notas: $('i-not').value.trim(), p_consentimiento: true
    };
    var envio = DEMO ? Promise.resolve({ codigo: 'CV-DEMO01' }) :
      fetch(SB + '/rest/v1/rpc/cn_camp_inscribir', { method: 'POST', headers: { apikey: KEY, Authorization: 'Bearer ' + KEY, 'Content-Type': 'application/json' }, body: JSON.stringify(datos) })
        .then(function (r) { return r.json().then(function (j) { if (!r.ok) { var er = new Error(j.message || 'No se ha podido enviar.'); er.sinSistema = r.status === 404 || j.code === 'PGRST202'; throw er; } return j; }); });
    envio.then(function (r) {
      $('i-cod').textContent = r.codigo;
      f.hidden = true; $('i-hecho').hidden = false; $('i-hecho').focus();
      if (!DEMO && window.emailjs) {
        try {
          emailjs.init('i4iBVVP-BkUOOwBE9');
          emailjs.send('service_npmjvvf', 'template_qnip0mc', {
            to_email: datos.p_email, client_name: datos.p_tutor, reply_to: datos.p_email,
            service: 'Campamento de surf Costa Verde para ' + datos.p_nombre + '. Te llamamos en menos de 24 horas para confirmar la plaza y la señal de 200 €.',
            fecha: 'Semana del ' + datos.p_semana,
            location: 'Costa Verde Surf Experience · surf con Costa Norte, San Vicente de la Barquera',
            confirm_code: r.codigo
          }).catch(function () {});
        } catch (x) {}
      }
    }).catch(function (err) {
      av.textContent = err.sinSistema ? 'Las inscripciones online se están activando. Escríbenos por WhatsApp al 609 282 963.' : err.message;
      av.classList.add('aviso--err');
    }).then(function () { btn.disabled = false; btn.textContent = 'Enviar inscripción'; });
  });
})();
