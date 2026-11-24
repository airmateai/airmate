/* Costa Norte · menú móvil y aparición suave (compartido por todas las páginas) */
(function () {
  var nav = document.querySelector('.nav'), b = document.querySelector('.nav__menu');
  if (nav && b) {
    b.addEventListener('click', function () { var a = nav.classList.toggle('abierto'); b.setAttribute('aria-expanded', a); });
    nav.querySelectorAll('ul a').forEach(function (l) { l.addEventListener('click', function () { nav.classList.remove('abierto'); b.setAttribute('aria-expanded', 'false'); }); });
  }
  var els = [].slice.call(document.querySelectorAll('[data-reveal]'));
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) { els.forEach(function (e) { e.classList.add('in'); }); return; }
  function ver() {
    var h = window.innerHeight || 800;
    els = els.filter(function (e) { if (e.getBoundingClientRect().top < h * 0.92) { e.classList.add('in'); return false; } return true; });
    if (!els.length) { removeEventListener('scroll', ver); removeEventListener('resize', ver); }
  }
  addEventListener('scroll', ver, { passive: true }); addEventListener('resize', ver); addEventListener('load', ver); ver();
})();
(function () {
  var ahorro = navigator.connection && navigator.connection.saveData;
  if (!ahorro && !matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  document.querySelectorAll('.sub__img video, .ahero__v').forEach(function (v) { v.removeAttribute('autoplay'); v.pause(); });
})();

/* asistente de dudas flotante */
(function () {
  var ACTIVO = false; // se activa cuando el servidor de IA tenga clave de pago (el gratuito se satura); para probarlo: ?chat=1
  if (!ACTIVO && !/[?&]chat=1/.test(location.search)) return;
  if (/\/checkin\//.test(location.pathname)) return;
  var yo = document.querySelector('script[src*="comun.js"]'); if (!yo) return;
  var s = document.createElement('script'); s.src = yo.src.replace(/comun\.js.*$/, 'chat.js?v=1'); s.defer = true; document.body.appendChild(s);
})();
