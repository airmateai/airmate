/* Salvajes Barbershop · DEMO multisede de Airmate (Barcelona ×2 + Dubái).
   Datos compartidos entre las webs y el panel, guardados solo en este navegador.
   Precios de Barcelona: los de su Booksy (nov 2026). Barberos, clientes y precios de Dubái: DE EJEMPLO. */
const SV_SEDES = {
  bcn: { k:'bcn', n:'Barcelona · Horta', corto:'Horta', ciudad:'Barcelona', pais:'ES', mon:'€', tz:'Europe/Madrid',
    dir:'Carrer dels Cortada, 34 · 08035 Barcelona', tel:'', wa:'', mapa:'Carrer dels Cortada 34, Barcelona',
    horTxt:'Lunes a sábado · 10:00–20:30', abre:'10:00', cierra:'20:30', dias:[1,2,3,4,5,6], prefijo:'+34',
    equipo:[{k:'b1',n:'Kevin',rol:'Barbero',c:'#7a1f2b'},{k:'b2',n:'Brayan',rol:'Barbero',c:'#3f5a4a'},{k:'b3',n:'Nico',rol:'Barbero',c:'#8a6a2f'},{k:'b4',n:'Luis',rol:'Barbero',c:'#4a4f6b'},{k:'n1',n:'Camila',rol:'Uñas y estética',c:'#9b4d6a'}] },
  bcn2:{ k:'bcn2', n:'Barcelona · 2ª barbería', corto:'BCN 2', ciudad:'Barcelona', pais:'ES', mon:'€', tz:'Europe/Madrid',
    dir:'Dirección por confirmar', tel:'', wa:'', mapa:'Barcelona',
    horTxt:'Lunes a sábado · 10:00–20:30', abre:'10:00', cierra:'20:30', dias:[1,2,3,4,5,6], prefijo:'+34',
    equipo:[{k:'b1',n:'Jhon',rol:'Barbero',c:'#7a1f2b'},{k:'b2',n:'Matías',rol:'Barbero',c:'#3f5a4a'},{k:'b3',n:'Sergio',rol:'Barbero',c:'#8a6a2f'},{k:'n1',n:'Daniela',rol:'Uñas y estética',c:'#9b4d6a'}] },
  dxb: { k:'dxb', n:'Dubái · JVC', corto:'Dubái', ciudad:'Dubai', pais:'AE', mon:'AED', tz:'Asia/Dubai',
    dir:'DAMAC Ghalia Tower, local 14 · JVC, Dubái', tel:'+971 56 888 0834', wa:'971568880834', mapa:'DAMAC Ghalia Tower JVC Dubai',
    horTxt:'Todos los días · 10:00–22:00', abre:'10:00', cierra:'22:00', dias:[0,1,2,3,4,5,6], prefijo:'+971',
    equipo:[{k:'b1',n:'Andrés',rol:'Barbero',c:'#7a1f2b'},{k:'b2',n:'Mateo',rol:'Barbero',c:'#3f5a4a'},{k:'b3',n:'Santi',rol:'Barbero',c:'#8a6a2f'},{k:'b4',n:'Diego',rol:'Barbero',c:'#4a4f6b'},{k:'n1',n:'Valeria',rol:'Grooming & nails',c:'#9b4d6a'}] }
};
// Servicios. t: 'b' barbero · 'n' uñas/estética. vuelve = días hasta que le toca volver
const SV_SERV_BCN = [
  { k:'corte',   t:'b', n:'Basic haircut',          es:'Corte básico',                 min:40, p:12, vuelve:21 },
  { k:'cb',      t:'b', n:'Haircut + beard',        es:'Corte + barba',                min:55, p:19, vuelve:21 },
  { k:'barba',   t:'b', n:'Beard shave with steam', es:'Afeitado de barba con vapor',  min:15, p:7,  vuelve:14 },
  { k:'diseno',  t:'b', n:'Haircut design',         es:'Diseño en el corte',           min:15, p:5 },
  { k:'kids',    t:'b', n:'Kids (1–6)',             es:'Corte niño/a (1 a 6 años)',    min:30, p:9,  vuelve:28 },
  { k:'jubi',    t:'b', n:'Seniors',                es:'Corte jubilado',               min:30, p:9,  vuelve:28 },
  { k:'mechas',  t:'b', n:'Highlights',             es:'Mechas',                       min:90, p:30, vuelve:56 },
  { k:'deco',    t:'b', n:'Bleach',                 es:'Decoloración',                 min:90, p:35, vuelve:56 },
  { k:'fantasia',t:'b', n:'Fantasy colour',         es:'Color fantasía',               min:45, p:50, vuelve:42 },
  { k:'cbarba',  t:'b', n:'Beard colour',           es:'Color de barba',               min:20, p:7 },
  { k:'trenzas', t:'b', n:'Braids (short hair)',    es:'Trenzas pelo corto',           min:120,p:20 },
  { k:'facial',  t:'n', n:'Facial cleansing',       es:'Limpieza facial',              min:40, p:15, vuelve:30 },
  { k:'cejas',   t:'n', n:'Eyebrows (thread)',      es:'Cejas con hilo',               min:30, p:7,  vuelve:21 },
  { k:'mani',    t:'n', n:'Express manicure',       es:'Manicura express masculina',   min:30, p:10, vuelve:28 },
  { k:'manid',   t:'n', n:'Deluxe Salvaje manicure',es:'Manicura deluxe Salvaje',      min:60, p:15, vuelve:28 },
  { k:'pedi',    t:'n', n:'Deluxe Salvaje pedicure',es:'Pedicura deluxe Salvaje',      min:90, p:20, vuelve:35 }
];
const SV_SERV_DXB = [
  { k:'corte',   t:'b', n:'Haircut',                 es:'Corte',                    min:45, p:80,  vuelve:21 },
  { k:'cb',      t:'b', n:'Haircut + beard',         es:'Corte + barba',            min:60, p:120, vuelve:21 },
  { k:'barba',   t:'b', n:'Beard trim with steam',   es:'Barba con vaporizador',    min:20, p:50,  vuelve:14 },
  { k:'fade',    t:'b', n:'Skin fade + design',      es:'Degradado + diseño',       min:50, p:100, vuelve:18 },
  { k:'kids',    t:'b', n:'Kids haircut',            es:'Corte niño',               min:30, p:60,  vuelve:28 },
  { k:'mechas',  t:'b', n:'Highlights',              es:'Mechas',                   min:90, p:180, vuelve:56 },
  { k:'deco',    t:'b', n:'Bleach',                  es:'Decoloración',             min:90, p:220, vuelve:56 },
  { k:'fantasia',t:'b', n:'Fantasy colour',          es:'Color fantasía',           min:60, p:200, vuelve:42 },
  { k:'cbarba',  t:'b', n:'Beard colour',            es:'Color de barba',           min:20, p:50 },
  { k:'trenzas', t:'b', n:'Braids',                  es:'Trenzas',                  min:120,p:180 },
  { k:'facial',  t:'n', n:'Facial cleansing',        es:'Limpieza facial',          min:40, p:90,  vuelve:30 },
  { k:'cejas',   t:'n', n:'Eyebrows (thread)',       es:'Cejas con hilo',           min:20, p:35,  vuelve:21 },
  { k:'mani',    t:'n', n:'Men’s manicure',          es:'Manicura masculina',       min:30, p:70,  vuelve:28 },
  { k:'pedi',    t:'n', n:'Salvaje deluxe pedicure', es:'Pedicura deluxe Salvaje',  min:60, p:120, vuelve:35 }
];
const SV_PROD_BCN = [
  { k:'cera',   n:'Cera mate Salvajes',  p:14, st:14, min:5 }, { k:'aceite', n:'Aceite de barba', p:15, st:4, min:5 },
  { k:'polvo',  n:'Polvo de volumen',    p:12, st:9,  min:4 }, { k:'champu', n:'Champú anticaspa', p:11, st:11, min:4 }, { k:'balsamo', n:'Bálsamo after-shave', p:10, st:3, min:4 }
];
const SV_PROD_DXB = [
  { k:'cera',   n:'Cera mate Salvajes',  p:65, st:14, min:5 }, { k:'aceite', n:'Aceite de barba', p:75, st:4, min:5 },
  { k:'polvo',  n:'Polvo de volumen',    p:55, st:9,  min:4 }, { k:'champu', n:'Champú anticaspa', p:60, st:11, min:4 }, { k:'balsamo', n:'Bálsamo after-shave', p:50, st:3, min:4 }
];
// Reseñas reales públicas (Booksy, nov 2026). Solo nota media y frases cortas con nombre de pila.
const SV_RESENAS = {
  booksy:{ nota:4.9, n:603, url:'https://booksy.com/es-es/44909_salvajes-barber-shop_barberia_48863_barcelona', sede:'Barcelona · Horta' },
  frases:[ { t:'El trato y el corte 10/10, recomendado.', a:'Jean', src:'Booksy', sede:'Horta' }, { t:'Unos cracks.', a:'Raúl', src:'Booksy', sede:'Horta' } ]
};

/* ── sede activa ── la página puede fijarla con window.SV_SEDE_FIJA antes de cargar este archivo */
const SV_SEDE = (() => { if (window.SV_SEDE_FIJA && SV_SEDES[window.SV_SEDE_FIJA]) return window.SV_SEDE_FIJA;
  const q = new URLSearchParams(location.search).get('sede'); if (q && SV_SEDES[q]) return q;
  try { const s = localStorage.getItem('sv_sede'); if (s && SV_SEDES[s]) return s; } catch(e) {} return 'bcn'; })();
const SEDE = SV_SEDES[SV_SEDE];
const SV_CLAVE = 'salvajes_multi_v2_' + SV_SEDE;
const SV_EQUIPO = SEDE.equipo;
const SV_SERV = SEDE.pais === 'AE' ? SV_SERV_DXB : SV_SERV_BCN;
const SV_PROD = SEDE.pais === 'AE' ? SV_PROD_DXB : SV_PROD_BCN;
const svMinA = h => { const [a,b] = h.split(':').map(Number); return a*60 + b; };
const SV_HORAS = (() => { const h = []; for (let m = svMinA(SEDE.abre); m <= svMinA(SEDE.cierra) - 30; m += 30) h.push(String(Math.floor(m/60)).padStart(2,'0') + ':' + String(m%60).padStart(2,'0')); return h; })();
const SV = {
  S: k => SV_SERV.find(s => s.k === k) || SV_SERV[0],
  E: k => SV_EQUIPO.find(e => e.k === k) || SV_EQUIPO[0],
  P: k => SV_PROD.find(p => p.k === k),
  min: svMinA,
  hhmm: m => String(Math.floor(m/60)).padStart(2,'0') + ':' + String(m%60).padStart(2,'0'),
  iso: d => { const x = new Date(d); return x.getFullYear() + '-' + String(x.getMonth()+1).padStart(2,'0') + '-' + String(x.getDate()).padStart(2,'0'); },
  hoy0: (() => { const d = new Date(); d.setHours(0,0,0,0); return d; })(),
  masD(n){ return this.iso(+this.hoy0 + n*864e5); },
  din: (n, mon) => Math.round(n).toLocaleString('es-ES',{useGrouping:'always'}) + ' ' + (mon || SEDE.mon),
  puede(e, s){ const t = this.S(s).t; return t === 'n' ? this.E(e).k.startsWith('n') : this.E(e).k.startsWith('b'); },
  // horario del barbero ese día: [ini, fin] o null si libra
  turno(db, e, f){ const d = new Date(f + 'T12:00').getDay(), h = (db.horarios || {})[e]; return h ? h[d] || null : (SEDE.dias.includes(d) ? [SEDE.abre, SEDE.cierra] : null); },
  bloqueado(db, f, e, ini, fin){ return (db.bloqueos || []).find(b => b.f === f && (b.e === e || b.e === 'todos') && this.min(b.ini) < fin && this.min(b.fin) > ini) || null; },
  libreCon(db, f, h, s, e){
    const sv = this.S(s), ini = this.min(h), fin = ini + sv.min, tu = this.turno(db, e, f);
    if (!tu || ini < this.min(tu[0]) || fin > this.min(tu[1])) return false;
    if (!this.puede(e, s)) return false;
    if (this.bloqueado(db, f, e, ini, fin)) return false;
    return !db.citas.some(c => c.f === f && c.e === e && c.est !== 'cancelada' && this.min(c.h) < fin && this.min(c.h) + this.S(c.s).min > ini);
  },
  quienLibre(db, f, h, s){ return SV_EQUIPO.find(e => this.libreCon(db, f, h, s, e.k))?.k || null; }
};

function svHorariosBase(){ const h = {}; SV_EQUIPO.forEach((e, i) => { h[e.k] = {}; for (let d = 0; d < 7; d++) h[e.k][d] = SEDE.dias.includes(d) ? [SEDE.abre, SEDE.cierra] : null;
    // cada uno libra un día distinto (ejemplo)
    const libra = SEDE.pais === 'AE' ? [2,3,4,5,1][i % 5] : [1,2,3,4,5][i % 5]; h[e.k][libra] = null;
    if (i === 1) for (let d = 0; d < 7; d++) if (h[e.k][d]) h[e.k][d] = [SEDE.abre, SV.hhmm(svMinA(SEDE.cierra) - 150)]; });
  return h; }
function svSemilla(){
  const ES = SEDE.pais === 'ES';
  const nombres = ES ? ['Marc Puig','Carlos Méndez','Jordi Serra','Youssef Amrani','Luis Fernández','Pol Ferrer','Daniel Ruiz','Ahmed Karim','Pablo Ortega','Oriol Vidal','Sergio Navarro','Àlex Roca','Javier Castro','Hamza Qureshi','Andrés Molina','Bryan Torres','Iván Herrera','Kevin Rojas','Marco Rossi','Alejandro Vidal','Nil Soler','David López','Ali Hassan','Arnau Mas','Raúl Gómez','Samir Benali','Diego Torres','Adrià Font','Hugo Serrano','Joel Martín']
    : ['Omar Haddad','Carlos Méndez','James Walker','Youssef Amrani','Luis Fernández','Rashid Al Mansoori','Daniel Ruiz','Ahmed Karim','Pablo Ortega','Mohammed Saeed','Sergio Navarro','Tom Bennett','Javier Castro','Hamza Qureshi','Andrés Molina','Nikolai Petrov','Iván Herrera','Faisal Khan','Marco Rossi','Alejandro Vidal','Karim Nasser','David López','Ali Hassan','Lucas Moreau','Raúl Gómez','Samir Benali','Diego Torres','Adam Novak','Hugo Serrano','Zayed Rahman'];
  const origen = ES ? ['Booksy','Instagram','Recomendación','Vive en Horta','Google Maps','Web','Booksy','Instagram'] : ['Instagram','Fresha','Recomendación','Instagram','Google Maps','Web','Instagram','Vive en JVC'];
  const idioma = ES ? ['ES','ES','ES','ES','ES','EN','ES','ES'] : ['ES','EN','ES','EN','ES','AR','ES','EN'];
  const barb = SV_EQUIPO.filter(e => e.k.startsWith('b')).map(e => e.k), nk = SV_EQUIPO.find(e => e.k.startsWith('n'))?.k || barb[0];
  const B = i => barb[i % barb.length];
  const clientes = nombres.map((n,i) => ({ id:'c'+i, n, tel: SEDE.prefijo + (ES ? ' 6' : ' 5') + String(10 + (i*37)%89) + ' ' + String(100 + (i*7919)%899) + ' ' + String(100 + (i*3571)%899), orig:origen[i%8], lang:idioma[i%8], alta:SV.masD(-(8 + i*5)), fav:B(i),
    notas: i===0 ? 'Fade 0.5 a los lados, tijera arriba. Raya a la izquierda.' : i===4 ? 'Piel sensible: nada de alcohol en la barba.' : i===7 ? 'Siempre con el mismo barbero. Viene los jueves después del gym.' : '' }));
  const db0 = { horarios: svHorariosBase(), bloqueos: [], citas: [] };
  const citas = [], servB = ES ? ['corte','cb','barba','corte','cb','kids','mechas','corte','cb','fantasia'] : ['fade','cb','barba','corte','cb','kids','mechas','corte','fade','fantasia'];
  // genera citas que respeten horarios
  let id = 0;
  for (let d = 0; d <= 5; d++) { const f = SV.masD(d), n = d === 0 ? 15 : d === 1 ? 8 : 4;
    for (let i = 0, t = 0; i < n && t < 80; t++) { const s = (t % 6 === 5) ? (ES ? 'mani' : 'mani') : servB[(t + d) % servB.length], e = SV.S(s).t === 'n' ? nk : B(t + d), h = SV_HORAS[(t*3 + d*5) % SV_HORAS.length];
      db0.citas = citas; if (!SV.libreCon(db0, f, h, s, e)) continue;
      citas.push({ id:'a'+(id++), f, h, cl:'c'+((t*7 + d*3) % 26), s, e, est: d === 0 && svMinA(h) < new Date().getHours()*60 ? 'hecha' : 'conf', web: (t % 3) === 1 }); i++; } }
  const hist = [[26,'corte',23],[27,'cb',25],[28,'corte',27],[29,'barba',19],[0,'corte',20],[0,'corte',41],[1,'cb',22],[2,'barba',15],[3,'corte',24],[3,'corte',46],[4,'cb',21],[5,'facial',31],[6,'kids',29],[7,'corte',20],[7,'corte',41],[8,'mechas',58],[9,'mani',27],[10,'corte',19],[11,'cb',22],[12,'corte',23],[13,'barba',13],[14,'cb',21],[15,'corte',22],[16,'pedi',36],[17,'cb',20],[18,'fantasia',44],[19,'corte',18],[20,'cb',23],[21,'corte',26],[22,'facial',29],[23,'corte',17],[24,'corte',25],[25,'cb',22]];
  hist.forEach(([c,s,hace],i) => citas.push({ id:'h'+i, f:SV.masD(-hace), h:SV_HORAS[(i*5)%SV_HORAS.length], cl:'c'+c, s, e: SV.S(s).t==='n' ? nk : B(i), est:'hecha', web: i % 3 === 0 }));
  citas.push({ id:'ns1', f:SV.masD(-6), h:SV_HORAS[8], cl:'c11', s:'corte', e:B(1), est:'noshow' }, { id:'ns2', f:SV.masD(-12), h:SV_HORAS[12], cl:'c19', s:'cb', e:B(3), est:'noshow' });
  const ventas = []; let v = 0; const pagos = ES ? ['Tarjeta','Efectivo','Bizum','Tarjeta','Efectivo'] : ['Tarjeta','Tarjeta','Efectivo','Tarjeta','Apple Pay'];
  const volumen = SV_SEDE === 'bcn2' ? 19 : ES ? 26 : 13;
  for (let dd = 27; dd >= 0; dd--) { const f = SV.masD(-dd), wd = new Date(f+'T12:00').getDay(); if (!SEDE.dias.includes(wd)) continue;
    const n = dd === 0 ? 6 : volumen + ((dd*7) % 9);
    for (let i = 0; i < n; i++) { const s = SV_SERV[(dd*3 + i*5) % SV_SERV.length], e = s.t==='n' ? nk : B(i+dd);
      ventas.push({ id:'v'+(v++), f, cl:'c'+((dd+i)%30), c:s.es, e, imp:s.p, pago:pagos[(dd+i)%5], tipo:'serv' }); }
    if (dd % 2 === 0) { const p = SV_PROD[dd % SV_PROD.length]; ventas.push({ id:'v'+(v++), f, cl:'c'+(dd%30), c:p.n, e:B(0), imp:p.p, pago:'Tarjeta', tipo:'prod' }); } }
  const bonos = [
    { id:'bo1', cl:'c0', n:'Bono 5 cortes', total:5, usadas:3, alta:SV.masD(-40) },
    { id:'bo2', cl:'c7', n:'Bono 5 cortes', total:5, usadas:1, alta:SV.masD(-15) },
    { id:'bo3', cl:'c3', n:'Bono 10 barbas', total:10, usadas:6, alta:SV.masD(-50) } ];
  const R = ES ? [30,20,50] : [200,120,300];
  const regalos = [
    { id:'TR-2041', imp:R[0], para:'Omar', de:'Layla', f:SV.masD(-3), canjeada:false, online:true },
    { id:'TR-2040', imp:R[1], para:'James', de:'Emma', f:SV.masD(-9), canjeada:true, online:true },
    { id:'TR-2039', imp:R[2], para:'Carlos', de:'María', f:SV.masD(-16), canjeada:false, online:true } ];
  const stock = {}; SV_PROD.forEach(p => stock[p.k] = p.st);
  const comision = {}; SV_EQUIPO.forEach(e => comision[e.k] = e.k.startsWith('n') ? 40 : 45);
  const bloqueos = [ { id:'bl1', f:SV.masD(1), e:B(0), ini:SV_HORAS[6], fin:SV_HORAS[9], motivo:'Médico' }, { id:'bl2', f:SV.masD(3), e:'todos', ini:SV_HORAS[0], fin:SV_HORAS[3], motivo:'Formación del equipo' } ];
  return { v:2, sede:SV_SEDE, clientes, citas, ventas, bonos, regalos, stock, avisados:{}, horarios:db0.horarios, bloqueos, comision, pagoWeb:'centro' };
}
function svCargar(){ try { const d = JSON.parse(localStorage.getItem(SV_CLAVE)); if (d && d.v === 2) return d; } catch(e) {} const d = svSemilla(); svGuardar(d); return d; }
function svGuardar(d){ try { localStorage.setItem(SV_CLAVE, JSON.stringify(d)); } catch(e) {} }
// Para la vista «Las 3 sedes»: ventas de otra sede (se generan si aún no se abrió)
function svVentasDe(k){ try { const d = JSON.parse(localStorage.getItem('salvajes_multi_v2_' + k)); if (d && d.v === 2) return d; } catch(e) {} return null; }
