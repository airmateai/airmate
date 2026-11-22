/* Salvajes · movimiento (GSAP + ScrollTrigger + Lenis). Sin JS o con «reducir movimiento», la web funciona igual sin efectos. */
(() => {
const reducir = matchMedia('(prefers-reduced-motion: reduce)').matches, EMBED = new URLSearchParams(location.search).has('embed');
function arrancar(){
  if (reducir || !window.gsap || !window.ScrollTrigger){ document.documentElement.classList.add('sin-motion'); document.querySelectorAll('.rv,.rm').forEach(e => e.classList.add('dentro')); return; }
  gsap.registerPlugin(ScrollTrigger);
  document.documentElement.classList.add('con-motion');
  const fino = matchMedia('(pointer:fine)').matches, ancho = innerWidth > 1000;
  // scroll suave
  let lenis = null;
  if (window.Lenis && !EMBED){ lenis = new Lenis({ duration:1.15, easing:t => 1 - Math.pow(1 - t, 4), smoothWheel:true });
    lenis.on('scroll', ScrollTrigger.update); gsap.ticker.add(t => lenis.raf(t * 1000)); gsap.ticker.lagSmoothing(0);
    document.querySelectorAll('a[href^="#"]').forEach(a => a.addEventListener('click', e => { const el = document.querySelector(a.getAttribute('href')); if (el){ e.preventDefault(); lenis.scrollTo(el, { offset:-60 }); } })); }
  window.SV_LENIS = lenis;
  // cortina de entrada
  const intro = document.getElementById('intro'), hero = document.getElementById('hero');
  const tl = gsap.timeline({ defaults:{ ease:'expo.out' } });
  if (intro && !EMBED && !sessionStorage.getItem('sv_intro')){ try{ sessionStorage.setItem('sv_intro','1'); }catch(e){}
    tl.from('#intro i', { yPercent:110, duration:.9, stagger:.05 })
      .to('#intro i', { yPercent:-110, duration:.6, stagger:.03, ease:'expo.in' }, '+=.25')
      .to(intro, { clipPath:'inset(0 0 100% 0)', duration:.9, ease:'expo.inOut' }, '-=.25')
      .set(intro, { display:'none' });
  } else if (intro) intro.style.display = 'none';
  // portada
  hero.classList.add('listo');
  const img = hero.querySelector('img');
  tl.fromTo(img, { scale:1.3, opacity:0 }, { scale:1.04, opacity:.8, duration:2.4 }, intro && intro.style.display !== 'none' ? '-=.5' : 0)
    .from('.hero .hl i', { yPercent:105, duration:1.3, stagger:.045 }, '<.2')
    .from('.hero .lin .s', { yPercent:105, duration:1.2 }, '<.35')
    .from('.hero .pie > *', { y:24, opacity:0, duration:1, stagger:.08 }, '<.3');
  gsap.set('.hero h1 .lin span', { transform:'none' }); gsap.set('.hero .pie', { opacity:1 });
  gsap.to(img, { yPercent:18, ease:'none', scrollTrigger:{ trigger:hero, start:'top top', end:'bottom top', scrub:true } });
  gsap.to('.hero h1', { yPercent:-35, ease:'none', scrollTrigger:{ trigger:hero, start:'top top', end:'bottom top', scrub:true } });
  // marquesina: avanza sola y acelera con la velocidad del scroll
  const mq = document.getElementById('marq');
  if (mq){ let x = 0, dir = -1, v = 0; const mitad = () => mq.scrollWidth / 2;
    gsap.ticker.add(() => { const vel = lenis ? lenis.velocity : 0; if (Math.abs(vel) > .3) dir = vel > 0 ? -1 : 1; v += ((1 + Math.min(Math.abs(vel) * .35, 9)) - v) * .08; x += dir * v; const m = mitad(); if (x <= -m) x += m; if (x > 0) x -= m; mq.style.transform = `translate3d(${x}px,0,0)`; }); }
  // manifiesto: palabra a palabra
  const mh = document.querySelector('.mani h2');
  if (mh){ const partir = n => { if (n.nodeType === 3){ const f = document.createDocumentFragment(); n.textContent.split(/(\s+)/).forEach(w => { if (!w.trim()){ f.appendChild(document.createTextNode(w)); return; } const s = document.createElement('span'); s.className = 'pal'; s.textContent = w; f.appendChild(s); }); n.replaceWith(f); } else [...n.childNodes].forEach(partir); };
    partir(mh); gsap.to('.mani .pal', { opacity:1, stagger:.12, ease:'none', scrollTrigger:{ trigger:mh, start:'top 78%', end:'bottom 42%', scrub:true } });
    gsap.to('.mani-bg', { yPercent:-12, ease:'none', scrollTrigger:{ trigger:'#mani', start:'top bottom', end:'bottom top', scrub:true } }); }
  // el ritual: fijado y paso a paso
  const rit = document.getElementById('ritual');
  if (rit){ const li = rit.querySelectorAll('.rit-l li'), fo = rit.querySelectorAll('.rit-fotos img'), num = document.getElementById('ritNum'); let act = 0;
    const poner = i => { if (i === act) return; act = i; li.forEach((x,k) => x.classList.toggle('on', k === i)); fo.forEach((x,k) => x.classList.toggle('on', k <= i)); num.textContent = '0' + (i + 1); };
    if (ancho) ScrollTrigger.create({ trigger:rit, start:'top top', end:'+=' + innerHeight * 2.2, pin:'.rit-pin', scrub:true, onUpdate:s => poner(Math.min(3, Math.floor(s.progress * 4))) });
    else li.forEach((x,i) => ScrollTrigger.create({ trigger:x, start:'top 70%', onEnter:() => poner(i), onEnterBack:() => poner(i) }));
    gsap.from('.rit-h', { yPercent:30, opacity:0, duration:1.2, ease:'expo.out', scrollTrigger:{ trigger:rit, start:'top 70%' } }); }
  // titulares grandes: suben al entrar
  gsap.utils.toArray('.tit h2, .vis h2, .cta h2, .regalo h3').forEach(h => gsap.from(h, { yPercent:40, opacity:0, duration:1.3, ease:'expo.out', scrollTrigger:{ trigger:h, start:'top 88%' } }));
  // resto de apariciones
  gsap.utils.toArray('.rv').forEach(el => { if (el.closest('.tit, .hero')) { el.classList.add('dentro'); return; } ScrollTrigger.create({ trigger:el, start:'top 90%', onEnter:() => el.classList.add('dentro') }); });
  gsap.utils.toArray('.rm').forEach(el => ScrollTrigger.create({ trigger:el, start:'top 85%', onEnter:() => el.classList.add('dentro') }));
  // carta: la foto destacada se mueve un poco más lento
  gsap.utils.toArray('.destacado img, .vis .mapa').forEach(el => gsap.fromTo(el, { yPercent:-6 }, { yPercent:6, ease:'none', scrollTrigger:{ trigger:el, start:'top bottom', end:'bottom top', scrub:true } }));
  // carta: foto que acompaña al ratón
  const flot = document.getElementById('flot');
  if (flot && fino && ancho){ const qx = gsap.quickTo(flot, 'x', { duration:.6, ease:'power3' }), qy = gsap.quickTo(flot, 'y', { duration:.6, ease:'power3' });
    const raiz = (document.querySelector('link[rel=stylesheet][href*="web.css"]').getAttribute('href').match(/^(\.\.\/)?/) || [''])[0];
    document.querySelectorAll('.it').forEach(it => { it.addEventListener('mouseenter', () => { const f = raiz + 'img/' + it.dataset.f + '.jpg'; if (!flot.src.endsWith(f.replace('../',''))) flot.src = f; flot.classList.add('on'); }); it.addEventListener('mouseleave', () => flot.classList.remove('on')); });
    addEventListener('mousemove', e => { qx(e.clientX + 150); qy(e.clientY); }); }
  // galería: en escritorio se desplaza en horizontal con el scroll
  const gal = document.querySelector('.gal'), tira = document.getElementById('tira');
  if (gal && tira && ancho){ gal.classList.add('pinned');
    const dist = () => Math.max(0, tira.scrollWidth - innerWidth + 40);
    gsap.to(tira, { x:() => -dist(), ease:'none', scrollTrigger:{ trigger:gal, start:'top top', end:() => '+=' + dist(), pin:true, scrub:1, invalidateOnRefresh:true } });
    gsap.utils.toArray('.tira figure').forEach((f,i) => gsap.from(f.querySelector('img'), { scale:1.25, ease:'none', scrollTrigger:{ trigger:gal, start:'top top', end:() => '+=' + dist(), scrub:true } })); }
  // reserva: la foto se acerca
  gsap.fromTo('.cta img', { scale:1.35 }, { scale:1, ease:'none', scrollTrigger:{ trigger:'.cta', start:'top bottom', end:'bottom top', scrub:true } });
  // pie: SALVAJES letra a letra
  gsap.from('.pie-w .gig span', { yPercent:100, duration:1.2, stagger:.05, ease:'expo.out', scrollTrigger:{ trigger:'.pie-w', start:'top 85%' } });
  // al abrir la reserva se para el scroll de fondo
  const caj = document.getElementById('cajon'); if (caj && lenis) new MutationObserver(() => caj.classList.contains('on') ? lenis.stop() : lenis.start()).observe(caj, { attributes:true, attributeFilter:['class'] });
  addEventListener('load', () => ScrollTrigger.refresh());
}
if (document.getElementById('hero')) arrancar(); else addEventListener('sv:pintado', arrancar, { once:true });
})();
