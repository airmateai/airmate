/* Costa Norte · historia que avanza con el scroll (sin JS o con movimiento reducido queda como lista) */
(function () {
  var sec = document.querySelector('.hist'); if (!sec) return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var scroll = sec.querySelector('.hist__scroll'), caps = [].slice.call(sec.querySelectorAll('.hist__cap'));
  var botones = [].slice.call(sec.querySelectorAll('[data-ir]')), fill = sec.querySelector('.hist__fill');
  var dig = sec.querySelectorAll('.hist__d'), num = sec.querySelector('.hist__n'), n = caps.length, actual = -1;
  sec.classList.add('hist--vivo');
  function pon(i) {
    if (i === actual) return; actual = i;
    caps.forEach(function (c, k) { c.classList.toggle('on', k === i); c.classList.toggle('visto', k <= i); c.style.zIndex = k; c.setAttribute('aria-hidden', k !== i); });
    botones.forEach(function (b, k) { if (k === i) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current'); });
    var a = caps[i].dataset.anio;
    dig[0].style.transform = 'translateY(-' + a[2] + 'em)';
    dig[1].style.transform = 'translateY(-' + a[3] + 'em)';
    fill.style.transform = 'scaleY(' + (n > 1 ? i / (n - 1) : 1).toFixed(3) + ')';
    num.textContent = String(i + 1).padStart(2, '0');
  }
  function mira() {
    var r = scroll.getBoundingClientRect(), largo = r.height - innerHeight;
    var p = Math.min(Math.max(-r.top / largo, 0), 0.9999);
    pon(Math.floor(p * n));
  }
  botones.forEach(function (b, k) {
    b.addEventListener('click', function () {
      var largo = scroll.offsetHeight - innerHeight, y = scroll.getBoundingClientRect().top + scrollY + largo * (k + 0.5) / n;
      scrollTo({ top: y, behavior: 'smooth' });
    });
  });
  addEventListener('scroll', mira, { passive: true }); addEventListener('resize', mira); mira();
})();
