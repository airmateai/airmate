// Costa Norte · calendarios iCal con Booking, Airbnb y Expedia
// GET  /api/cn-ical?u=<unidad>&t=<token>[&p=booking]  → calendario de ese apartamento para pegar en la plataforma
//      (solo fechas ocupadas, sin datos de huéspedes; p= quita lo que vino de esa misma plataforma)
// POST /api/cn-ical {accion:'sync'}                   → lee los calendarios de las plataformas y actualiza el panel
import { createClient } from '@supabase/supabase-js';

const admin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const NOMBRE = { booking: 'Booking', airbnb: 'Airbnb', expedia: 'Expedia' };
const hoy = () => new Date().toISOString().slice(0, 10);
const masDias = (iso, n) => { const d = new Date(iso + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };

function fechaIcs(v) {
  const m = String(v || '').match(/(\d{4})(\d{2})(\d{2})/);
  return m ? `${m[1]}-${m[2]}-${m[3]}` : null;
}
export function leerIcs(txt) {
  const lineas = String(txt).replace(/\r\n[ \t]/g, '').replace(/\n[ \t]/g, '').split(/\r?\n/);
  const ev = []; let cur = null;
  for (const l of lineas) {
    if (l === 'BEGIN:VEVENT') cur = {};
    else if (l === 'END:VEVENT') { if (cur) ev.push(cur); cur = null; }
    else if (cur) {
      const i = l.indexOf(':'); if (i < 0) continue;
      const k = l.slice(0, i).split(';')[0].toUpperCase(), v = l.slice(i + 1);
      if (k === 'DTSTART') cur.entrada = fechaIcs(v);
      else if (k === 'DTEND') cur.salida = fechaIcs(v);
      else if (k === 'UID') cur.uid = v.trim().slice(0, 300);
      else if (k === 'SUMMARY') cur.resumen = v.replace(/\\,/g, ',').trim().slice(0, 200);
      else if (k === 'DESCRIPTION') cur.desc = v.replace(/\\n/g, '\n').replace(/\\,/g, ',').slice(0, 2000);
    }
  }
  return ev.filter(e => e.entrada && e.uid).map(e => {
    if (!e.salida || e.salida <= e.entrada) e.salida = masDias(e.entrada, 1);
    const url = (e.desc || '').match(/https:\/\/[^\s]*airbnb\.[a-z.]+\/hosting\/reservations\/details\/[A-Z0-9]+/i);
    return { ...e, url: url ? url[0] : null };
  });
}

async function sincronizar(forzar) {
  const { data: fuentes, error } = await admin.from('cn_apt_ical').select('*, cn_apt_unidades(id,tipo_id)').eq('activo', true);
  if (error) throw error;
  if (!fuentes.length) return { fuentes: 0 };
  const ultima = Math.max(...fuentes.map(f => f.ultima_sync ? Date.parse(f.ultima_sync) : 0));
  if (Date.now() - ultima < (forzar ? 45e3 : 4 * 60e3)) return { omitido: 'sincronizado hace poco' };
  const desde = masDias(hoy(), -1), res = [];
  for (const f of fuentes) {
    const estado = { ultima_sync: new Date().toISOString(), ultimo_error: null, eventos: null };
    try {
      const ctl = new AbortController(); const to = setTimeout(() => ctl.abort(), 12000);
      const r = await fetch(f.url, { signal: ctl.signal, headers: { 'User-Agent': 'CostaNorte-Calendario/1.0' } }).finally(() => clearTimeout(to));
      if (!r.ok) throw new Error('La plataforma respondió ' + r.status);
      const txt = await r.text();
      if (!/BEGIN:VCALENDAR/.test(txt) || txt.length > 3e6) throw new Error('El enlace no es un calendario válido');
      // Lo que nosotros mismos mandamos a la plataforma vuelve como «cerrado»: si esas noches ya están
      // cubiertas por reservas nuestras (o de otra plataforma) en este apartamento, no se duplica.
      const { data: otras, error: e0 } = await admin.from('cn_apt_reservas').select('entrada,salida')
        .eq('unidad_id', f.unidad_id).neq('origen', f.plataforma).neq('estado', 'cancelada').gte('salida', desde);
      if (e0) throw e0;
      const cubierta = (a, b) => { for (let d = a; d < b; d = masDias(d, 1)) if (!(otras || []).some(o => o.entrada <= d && o.salida > d)) return false; return true; };
      const esCierre = e => /not available|closed|bloque|no disponible|blocked/i.test(e.resumen || '');
      const ev = leerIcs(txt).filter(e => e.salida >= desde).filter(e => !(esCierre(e) && cubierta(e.entrada, e.salida)));
      const filas = ev.map(e => ({
        unidad_id: f.unidad_id, tipo_id: f.cn_apt_unidades.tipo_id, origen: f.plataforma, ext_uid: e.uid, ext_url: e.url,
        entrada: e.entrada, salida: e.salida, estado: 'confirmada', adultos: 0, ninos: 0,
        nombre: esCierre(e) ? `Cerrado en ${NOMBRE[f.plataforma]}` : `Reserva de ${NOMBRE[f.plataforma]}`,
        notas: 'Ocupado en ' + NOMBRE[f.plataforma] + '. Los datos del huésped están en ' + NOMBRE[f.plataforma] + '.'
      }));
      if (filas.length) {
        const { error: e1 } = await admin.from('cn_apt_reservas').upsert(filas, { onConflict: 'unidad_id,origen,ext_uid' });
        if (e1) throw e1;
      }
      // Lo que ya no está en el calendario de la plataforma (cancelado allí) se cancela aquí
      const { data: viejas, error: e2 } = await admin.from('cn_apt_reservas').select('id,ext_uid')
        .eq('unidad_id', f.unidad_id).eq('origen', f.plataforma).not('ext_uid', 'is', null).neq('estado', 'cancelada').gte('salida', desde);
      if (e2) throw e2;
      const vivos = new Set(ev.map(e => e.uid)), fuera = (viejas || []).filter(v => !vivos.has(v.ext_uid)).map(v => v.id);
      if (fuera.length) {
        const { error: e3 } = await admin.from('cn_apt_reservas').update({ estado: 'cancelada' }).in('id', fuera);
        if (e3) throw e3;
      }
      estado.eventos = ev.length;
      res.push({ unidad: f.unidad_id, plataforma: f.plataforma, eventos: ev.length, canceladas: fuera.length });
    } catch (e) {
      estado.ultimo_error = String(e.name === 'AbortError' ? 'La plataforma tardó demasiado' : (e.message || e)).slice(0, 300);
      res.push({ unidad: f.unidad_id, plataforma: f.plataforma, error: estado.ultimo_error });
    }
    await admin.from('cn_apt_ical').update(estado).eq('id', f.id);
  }
  return { fuentes: fuentes.length, res };
}

async function exportar(req, res) {
  const u = parseInt(req.query.u, 10), t = String(req.query.t || ''), p = String(req.query.p || '');
  if (!u || !/^[a-f0-9]{24,64}$/.test(t)) return res.status(404).send('No encontrado');
  const { data: ud } = await admin.from('cn_apt_unidades').select('id,nombre,ical_token').eq('id', u).maybeSingle();
  if (!ud || ud.ical_token !== t) return res.status(404).send('No encontrado');
  let q = admin.from('cn_apt_reservas').select('id,entrada,salida,origen,created_at').eq('unidad_id', u).neq('estado', 'cancelada').gte('salida', masDias(hoy(), -30));
  if (NOMBRE[p]) q = q.neq('origen', p);
  const { data: rs, error } = await q;
  if (error) return res.status(500).send('Error');
  const ahora = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '');
  const d = s => s.replace(/-/g, '');
  const out = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Costa Norte//Apartamentos//ES', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
    ...(rs || []).flatMap(r => ['BEGIN:VEVENT', `UID:${r.id}@costanorte`, `DTSTAMP:${ahora}`, `DTSTART;VALUE=DATE:${d(r.entrada)}`, `DTEND;VALUE=DATE:${d(r.salida)}`, 'SUMMARY:Reservado', 'END:VEVENT']),
    'END:VCALENDAR'];
  res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  return res.status(200).send(out.join('\r\n') + '\r\n');
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  try {
    if (req.method === 'GET') return await exportar(req, res);
    if (req.method === 'POST' && (req.body || {}).accion === 'sync') return res.status(200).json(await sincronizar(!!req.body.forzar));
    return res.status(405).json({ error: 'Método no permitido' });
  } catch (e) {
    return res.status(500).json({ error: String(e.message || e).slice(0, 200) });
  }
}
