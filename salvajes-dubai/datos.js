/* Salvajes Barbershop Dubai · datos de la DEMO (compartidos entre la web y el panel, guardados solo en este navegador).
   Precios, barberos y clientes son DE EJEMPLO: los pone la barbería. */
const SV_CLAVE = 'salvajes_dxb_demo_v1';
// Columnas de la agenda (sillas). Nombres de ejemplo.
const SV_EQUIPO = [
  { k:'b1', n:'Andrés', rol:'Barbero', c:'#7a1f2b' },
  { k:'b2', n:'Mateo', rol:'Barbero', c:'#3f5a4a' },
  { k:'b3', n:'Santi', rol:'Barbero', c:'#8a6a2f' },
  { k:'b4', n:'Diego', rol:'Barbero', c:'#4a4f6b' },
  { k:'n1', n:'Valeria', rol:'Grooming & nails', c:'#9b4d6a' }
];
// t: 'b' = lo hace cualquier barbero · 'n' = grooming/uñas. vuelve = días hasta que le toca volver (para «Que vuelvan»)
const SV_SERV = [
  { k:'corte',   t:'b', n:'Haircut',                 es:'Corte',                         min:45, p:80,  vuelve:21 },
  { k:'cb',      t:'b', n:'Haircut + beard',         es:'Corte + barba',                 min:60, p:120, vuelve:21 },
  { k:'barba',   t:'b', n:'Beard trim with steam',   es:'Barba con vaporizador',         min:20, p:50,  vuelve:14 },
  { k:'fade',    t:'b', n:'Skin fade + design',      es:'Degradado + diseño',            min:50, p:100, vuelve:18 },
  { k:'kids',    t:'b', n:'Kids haircut',            es:'Corte niño',                    min:30, p:60,  vuelve:28 },
  { k:'mechas',  t:'b', n:'Highlights',              es:'Mechas',                        min:90, p:180, vuelve:56 },
  { k:'deco',    t:'b', n:'Bleach',                  es:'Decoloración',                  min:90, p:220, vuelve:56 },
  { k:'fantasia',t:'b', n:'Fantasy colour',          es:'Color fantasía',                min:60, p:200, vuelve:42 },
  { k:'cbarba',  t:'b', n:'Beard colour',            es:'Color de barba',                min:20, p:50 },
  { k:'trenzas', t:'b', n:'Braids',                  es:'Trenzas',                       min:120,p:180 },
  { k:'facial',  t:'n', n:'Facial cleansing',        es:'Limpieza facial',               min:40, p:90,  vuelve:30 },
  { k:'cejas',   t:'n', n:'Eyebrows (thread)',       es:'Cejas con hilo',                min:20, p:35,  vuelve:21 },
  { k:'mani',    t:'n', n:'Men’s manicure',     es:'Manicura masculina',            min:30, p:70,  vuelve:28 },
  { k:'pedi',    t:'n', n:'Salvaje deluxe pedicure', es:'Pedicura deluxe Salvaje',       min:60, p:120, vuelve:35 }
];
// Productos de mostrador (stock de ejemplo)
const SV_PROD = [
  { k:'cera',   n:'Cera mate Salvajes',      p:65, st:14, min:5 },
  { k:'aceite', n:'Aceite de barba',         p:75, st:4,  min:5 },
  { k:'polvo',  n:'Polvo de volumen',        p:55, st:9,  min:4 },
  { k:'champu', n:'Champú anticaspa',        p:60, st:11, min:4 },
  { k:'balsamo',n:'Bálsamo after-shave',     p:50, st:3,  min:4 }
];
const SV_HORAS = (() => { const h = []; for (let m = 10*60; m <= 21*60 + 30; m += 30) h.push(String(Math.floor(m/60)).padStart(2,'0') + ':' + String(m%60).padStart(2,'0')); return h; })();
const SV = {
  S: k => SV_SERV.find(s => s.k === k) || SV_SERV[0],
  E: k => SV_EQUIPO.find(e => e.k === k) || SV_EQUIPO[0],
  P: k => SV_PROD.find(p => p.k === k),
  min: h => { const [a,b] = h.split(':').map(Number); return a*60 + b; },
  hhmm: m => String(Math.floor(m/60)).padStart(2,'0') + ':' + String(m%60).padStart(2,'0'),
  iso: d => { const x = new Date(d); return x.getFullYear() + '-' + String(x.getMonth()+1).padStart(2,'0') + '-' + String(x.getDate()).padStart(2,'0'); },
  hoy0: (() => { const d = new Date(); d.setHours(0,0,0,0); return d; })(),
  masD(n){ return this.iso(+this.hoy0 + n*864e5); },
  // quién puede hacer el servicio
  puede(e, s){ const t = this.S(s).t; return t === 'n' ? this.E(e).k.startsWith('n') : this.E(e).k.startsWith('b'); },
  libreCon(db, f, h, s, e){
    const sv = this.S(s), ini = this.min(h), fin = ini + sv.min;
    if (fin > 22*60) return false;
    if (!this.puede(e, s)) return false;
    return !db.citas.some(c => c.f === f && c.e === e && c.est !== 'cancelada' && this.min(c.h) < fin && this.min(c.h) + this.S(c.s).min > ini);
  },
  // primer profesional libre (para «me da igual quién»)
  quienLibre(db, f, h, s){ return SV_EQUIPO.find(e => this.libreCon(db, f, h, s, e.k))?.k || null; }
};

function svSemilla(){
  const nombres = ['Omar Haddad','Carlos Méndez','James Walker','Youssef Amrani','Luis Fernández','Rashid Al Mansoori','Daniel Ruiz','Ahmed Karim','Pablo Ortega','Mohammed Saeed','Sergio Navarro','Tom Bennett','Javier Castro','Hamza Qureshi','Andrés Molina','Nikolai Petrov','Iván Herrera','Faisal Khan','Marco Rossi','Alejandro Vidal','Karim Nasser','David López','Ali Hassan','Lucas Moreau','Raúl Gómez','Samir Benali','Diego Torres','Adam Novak','Hugo Serrano','Zayed Rahman'];
  const origen = ['Instagram','Fresha','Recomendación','Instagram','Google Maps','Web','Instagram','Vive en JVC'];
  const idioma = ['ES','EN','ES','EN','ES','AR','ES','EN'];
  const clientes = nombres.map((n,i) => ({ id:'c'+i, n, tel:'+971 5' + (i%3) + ' ' + String(1000000 + (i*7919137) % 8999999).slice(0,3) + ' ' + String(1000 + (i*3571) % 8999), orig:origen[i%8], lang:idioma[i%8], alta:SV.masD(-(8 + i*5)), fav:['b1','b2','b3','b4'][i%4],
    notas: i===0 ? 'Fade 0.5 a los lados, tijera arriba. Raya a la izquierda.' : i===2 ? 'Prefers English. Beard: keep length, clean neckline.' : i===4 ? 'Piel sensible: nada de alcohol en la barba.' : i===7 ? 'Siempre con Mateo. Viene los jueves después del gym.' : '' }));
  const citas = [];
  const plan = [
    // [día, hora, cliente, servicio, profesional, estado]
    [0,'10:00',0,'fade','b1','hecha'],[0,'10:30',1,'cb','b2','hecha'],[0,'11:00',2,'barba','b3','hecha'],[0,'11:00',5,'facial','n1','hecha'],[0,'12:00',3,'corte','b1','conf'],
    [0,'12:30',4,'cb','b4','conf'],[0,'13:00',6,'kids','b2','conf'],[0,'15:00',7,'corte','b2','conf'],[0,'16:00',8,'mechas','b3','conf'],[0,'16:30',9,'mani','n1','conf'],
    [0,'17:30',10,'fade','b1','conf'],[0,'18:00',11,'cb','b4','conf'],[0,'19:00',12,'corte','b3','conf'],[0,'19:30',13,'barba','b2','conf'],[0,'20:30',14,'cb','b1','conf'],
    [1,'10:30',15,'corte','b1','conf'],[1,'11:00',16,'pedi','n1','conf'],[1,'12:00',17,'cb','b2','conf'],[1,'17:00',18,'fantasia','b3','conf'],[1,'18:30',19,'fade','b4','conf'],[1,'20:00',1,'barba','b2','conf'],
    [2,'11:00',20,'cb','b1','conf'],[2,'13:00',21,'corte','b4','conf'],[2,'18:00',22,'facial','n1','conf'],[2,'19:00',23,'fade','b2','conf'],
    [3,'12:00',24,'corte','b3','conf'],[3,'17:30',25,'cb','b1','conf'],[4,'19:00',2,'cb','b3','conf'],[5,'11:00',6,'kids','b2','conf']
  ];
  plan.forEach(([d,h,c,s,e,est],i) => citas.push({ id:'a'+i, f:SV.masD(d), h, cl:'c'+c, s, e, est, web: i%3===1 }));
  // historial de visitas (para fichas, «que vuelvan» y cifras); clientes 26-29 sin cita futura → les toca volver
  const hist = [[26,'corte',23,'b1'],[27,'cb',25,'b2'],[28,'fade',27,'b3'],[29,'barba',19,'b4'],[0,'fade',20,'b1'],[0,'fade',41,'b1'],[1,'cb',22,'b2'],[2,'barba',15,'b3'],[3,'corte',24,'b1'],[3,'corte',46,'b1'],[4,'cb',21,'b4'],[5,'facial',31,'n1'],[6,'kids',29,'b2'],[7,'corte',20,'b2'],[7,'corte',41,'b2'],[8,'mechas',58,'b3'],[9,'mani',27,'n1'],[10,'fade',19,'b1'],[11,'cb',22,'b4'],[12,'corte',23,'b3'],[13,'barba',13,'b2'],[14,'cb',21,'b1'],[15,'corte',22,'b1'],[16,'pedi',36,'n1'],[17,'cb',20,'b2'],[18,'fantasia',44,'b3'],[19,'fade',18,'b4'],[20,'cb',23,'b1'],[21,'corte',26,'b4'],[22,'facial',29,'n1'],[23,'fade',17,'b2'],[24,'corte',25,'b3'],[25,'cb',22,'b1']];
  hist.forEach(([c,s,hace,e],i) => citas.push({ id:'h'+i, f:SV.masD(-hace), h:SV_HORAS[(i*5)%SV_HORAS.length], cl:'c'+c, s, e, est:'hecha' }));
  // un par de «no vino»
  citas.push({ id:'ns1', f:SV.masD(-6), h:'18:00', cl:'c11', s:'corte', e:'b2', est:'noshow' }, { id:'ns2', f:SV.masD(-12), h:'20:00', cl:'c19', s:'fade', e:'b4', est:'noshow' });
  // ventas de las últimas 4 semanas (servicios + productos)
  const ventas = []; let v = 0; const pagos = ['Tarjeta','Tarjeta','Efectivo','Tarjeta','Apple Pay'];
  for (let d = 27; d >= 0; d--) {
    const f = SV.masD(-d), n = d === 0 ? 4 : 11 + ((d*7) % 9);
    for (let i = 0; i < n; i++) { const s = SV_SERV[(d*3 + i*5) % SV_SERV.length], e = s.t==='n' ? 'n1' : ['b1','b2','b3','b4'][(i+d)%4];
      ventas.push({ id:'v'+(v++), f, cl:'c'+((d+i)%30), c:s.es, e, imp:s.p, pago:pagos[(d+i)%5], tipo:'serv' }); }
    if (d % 2 === 0) { const p = SV_PROD[d % SV_PROD.length]; ventas.push({ id:'v'+(v++), f, cl:'c'+(d%30), c:p.n, e:'b1', imp:p.p, pago:'Tarjeta', tipo:'prod' }); }
  }
  // bonos (packs de cortes) y tarjetas regalo compradas online
  const bonos = [
    { id:'bo1', cl:'c0', n:'Bono 5 cortes', total:5, usadas:3, alta:SV.masD(-40) },
    { id:'bo2', cl:'c7', n:'Bono 5 cortes', total:5, usadas:1, alta:SV.masD(-15) },
    { id:'bo3', cl:'c3', n:'Bono 10 barbas', total:10, usadas:6, alta:SV.masD(-50) }
  ];
  const regalos = [
    { id:'TR-2041', imp:200, para:'Omar', de:'Layla', f:SV.masD(-3), canjeada:false, online:true },
    { id:'TR-2040', imp:120, para:'James', de:'Emma', f:SV.masD(-9), canjeada:true, online:true },
    { id:'TR-2039', imp:300, para:'Carlos', de:'María', f:SV.masD(-16), canjeada:false, online:true }
  ];
  const stock = {}; SV_PROD.forEach(p => stock[p.k] = p.st);
  return { v:1, clientes, citas, ventas, bonos, regalos, stock, avisados:{} };
}
function svCargar(){ try { const d = JSON.parse(localStorage.getItem(SV_CLAVE)); if (d && d.v === 1) return d; } catch(e) {} const d = svSemilla(); svGuardar(d); return d; }
function svGuardar(d){ try { localStorage.setItem(SV_CLAVE, JSON.stringify(d)); } catch(e) {} }
