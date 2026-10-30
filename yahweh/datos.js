/* Yahweh Family · datos de la demo (compartidos entre la web y el panel, guardados en este navegador) */
const YH_CLAVE = 'yh_demo_v1';
const YH_AREAS = [
  { k:'cab', n:'Cabello', c:'#b8913f' },
  { k:'una', n:'Uñas', c:'#9c5b6b' },
  { k:'mir', n:'Cejas & Pestañas', c:'#5f6f62' }
];
// Precios y duraciones de EJEMPLO (los pone el salón)
const YH_SERV = [
  { k:'corte', a:'cab', n:'Corte y peinado', min:45, p:25, vuelve:42 },
  { k:'raiz', a:'cab', n:'Tinte de raíz', min:90, p:38, vuelve:35 },
  { k:'color', a:'cab', n:'Color completo o mechas', min:150, p:70, vuelve:56 },
  { k:'trenzas', a:'cab', n:'Trenzas', min:180, p:60 },
  { k:'hidra', a:'cab', n:'Tratamiento de hidratación', min:45, p:30 },
  { k:'semi', a:'una', n:'Manicura semipermanente', min:45, p:22, vuelve:21 },
  { k:'gel', a:'una', n:'Uñas de gel o acrílico (nuevas)', min:90, p:40, vuelve:21 },
  { k:'relleno', a:'una', n:'Relleno de uñas', min:60, p:30, vuelve:21 },
  { k:'pedi', a:'una', n:'Pedicura semipermanente', min:60, p:28, vuelve:30 },
  { k:'cejas', a:'mir', n:'Diseño de cejas', min:30, p:12, vuelve:28 },
  { k:'lami', a:'mir', n:'Laminado de cejas', min:45, p:35, vuelve:42 },
  { k:'lifting', a:'mir', n:'Lifting de pestañas', min:60, p:40, vuelve:42 },
  { k:'ext', a:'mir', n:'Extensiones de pestañas', min:120, p:60, vuelve:21 }
];
const YH_HORAS = (() => { const h = []; for (let m = 9*60 + 30; m <= 19*60; m += 30) h.push(String(Math.floor(m/60)).padStart(2,'0') + ':' + String(m%60).padStart(2,'0')); return h; })();
const YH = {
  SV: k => YH_SERV.find(s => s.k === k) || YH_SERV[0],
  AREA: k => YH_AREAS.find(a => a.k === k) || YH_AREAS[0],
  min: h => { const [a,b] = h.split(':').map(Number); return a*60 + b; },
  hhmm: m => String(Math.floor(m/60)).padStart(2,'0') + ':' + String(m%60).padStart(2,'0'),
  iso: d => { const x = new Date(d); return x.getFullYear() + '-' + String(x.getMonth()+1).padStart(2,'0') + '-' + String(x.getDate()).padStart(2,'0'); },
  hoy0: (() => { const d = new Date(); d.setHours(0,0,0,0); return d; })(),
  masD(n){ return this.iso(+this.hoy0 + n*864e5); },
  abierto(f){ return new Date(f + 'T12:00').getDay() !== 0; },              // domingo cerrado (ejemplo)
  libre(db, f, h, s){                                                         // ¿cabe ese servicio a esa hora en su área?
    const sv = this.SV(s), ini = this.min(h), fin = ini + sv.min;
    if (fin > 20*60) return false;
    return !db.citas.some(c => c.f === f && c.est !== 'cancelada' && this.SV(c.s).a === sv.a && this.min(c.h) < fin && this.min(c.h) + this.SV(c.s).min > ini);
  }
};

function yhSemilla(){
  const nombres = ['Yurena Hernández','Carla Díaz','Nayra González','Patricia Rodríguez','Zuleima Pérez','Laura Martín','Daniela Suárez','Cristina Afonso','Raquel Delgado','Tamara Cabrera','Saray Ramos','Beatriz Morales','Idaira Expósito','Lorena García','Mónica Padrón','Nerea Santana','Aitana Torres','Sonia Febles','Alba Rivero','Elena Castro','Jennifer Báez','Melisa Acosta','Tania Mesa','Noelia Quintero','Gara Reyes','Vanesa Hernández','Paola Méndez','Ainhoa Barrios','Yaiza Plasencia','Rocío Toledo'];
  const origen = ['Instagram','Web','Recomendación','Instagram','De paso','Web','Instagram','Recomendación'];
  const clientas = nombres.map((n,i) => ({ id:'c'+i, n, tel:'6' + String(10000000 + (i*7919137) % 89999999).slice(0,8), orig:origen[i%8], alta:YH.masD(-(10 + i*9)),
    notas: i===0 ? 'Le encanta el nail art discreto. Alérgica al látex.' : i===3 ? 'Fórmula de color: 6.66 + 7.4 (20 vol), 35 min.' : i===6 ? 'Pestañas: curva C, 11 mm.' : '' }));
  const citas = [];
  const plan = [
    // [día, hora, clienta, servicio, estado]
    [0,'09:30',3,'raiz','hecha'],[0,'10:00',0,'relleno','hecha'],[0,'10:30',6,'ext','hecha'],[0,'11:30',1,'semi','conf'],[0,'12:00',10,'corte','conf'],
    [0,'13:00',8,'cejas','conf'],[0,'16:00',12,'color','conf'],[0,'16:30',4,'gel','conf'],[0,'17:00',9,'lifting','conf'],[0,'18:30',14,'semi','conf'],
    [1,'10:00',5,'trenzas','conf'],[1,'10:00',7,'relleno','conf'],[1,'11:00',13,'lami','conf'],[1,'12:30',2,'corte','conf'],[1,'16:00',15,'semi','conf'],[1,'17:30',11,'raiz','conf'],
    [2,'09:30',16,'pedi','conf'],[2,'11:00',17,'color','conf'],[2,'12:00',18,'cejas','conf'],[2,'17:00',19,'gel','conf'],
    [3,'10:30',20,'hidra','conf'],[3,'16:00',21,'relleno','conf'],[3,'18:00',2,'ext','conf'],[4,'10:00',9,'corte','conf'],[4,'12:00',1,'relleno','conf']
  ];
  plan.forEach(([d,h,c,s,e],i) => { let f = YH.masD(d); if (!YH.abierto(f)) f = YH.masD(d+1); citas.push({ id:'a'+i, f, h, cl:'c'+c, s, est:e, web: i%3===1 }); });
  // historial: visitas pasadas (para «que vuelvan» y fichas)
  // clientas 22-29: sin cita futura y les toca volver
  const hist = [[22,'relleno',24],[23,'raiz',41],[24,'ext',23],[25,'semi',26],[26,'relleno',19],[27,'lifting',47],[28,'color',60],[29,'cejas',33],[0,'relleno',19],[0,'relleno',40],[1,'semi',23],[2,'corte',50],[3,'raiz',33],[3,'raiz',70],[4,'gel',25],[5,'color',58],[6,'ext',20],[7,'relleno',24],[8,'cejas',30],[9,'lifting',44],[10,'corte',47],[11,'raiz',38],[12,'color',61],[13,'lami',45],[14,'semi',22],[15,'semi',26],[16,'pedi',33],[17,'color',57],[18,'cejas',29],[19,'gel',27],[20,'hidra',15],[21,'relleno',23]];
  hist.forEach(([c,s,hace],i) => citas.push({ id:'h'+i, f:YH.masD(-hace), h:YH_HORAS[(i*3)%YH_HORAS.length], cl:'c'+c, s, est:'hecha' }));
  const ventas = []; let v = 0;
  for (let d = -27; d <= 0; d++) { const f = YH.masD(d); if (!YH.abierto(f)) continue; const n = d === 0 ? 3 : 4 + ((d*7 + 40) % 4);
    for (let k = 0; k < n; k++) { const s = YH_SERV[(v*5 + k) % YH_SERV.length]; ventas.push({ id:'v'+v++, f, cl:'c'+((v*7)%22), c:s.n, a:s.a, imp:s.p, pago:['Tarjeta','Efectivo','Bizum'][v%3] }); } }
  return { clientas, citas, ventas, avisados:{}, v:2 };
}
function yhCargar(){ let db = null; try { db = JSON.parse(localStorage.getItem(YH_CLAVE)); } catch(e) {} if (!db || db.v !== 2) { db = yhSemilla(); yhGuardar(db); } return db; }
function yhGuardar(db){ try { localStorage.setItem(YH_CLAVE, JSON.stringify(db)); } catch(e) {} }
