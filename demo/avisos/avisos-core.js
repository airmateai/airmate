/* Airmate · Avisos del día (coste cero).
   Calcula a quién escribir hoy a partir de datos que el panel ya tiene cargados.
   No llama a ninguna API: genera enlaces wa.me con el mensaje escrito y el dueño lo envía desde su WhatsApp.

   Uso en un panel real:
     const listas = AirmateAvisos.calcular({ citas, clientes, hoy: new Date(), ajustes });
     // listas.manana, listas.resenas, listas.dormidos, listas.bonos, listas.cumples
     AirmateAvisos.enlace(tel, texto)  → https://wa.me/34...?text=...

   Formato esperado:
     clientes: [{ id, nombre, tel, cumple: 'MM-DD' | 'YYYY-MM-DD', bono: { nombre, total, quedan } | null }]
     citas:    [{ id, clienteId, servicio, inicio: Date|ISO, estado: 'confirmada'|'completada'|'cancelada' }]
     ajustes:  { negocio, enlaceResena, diasDormido, plantillas: { manana, resena, dormido, bono, cumple } }
*/
(function (g) {
  const DIA = 864e5;
  const PLANTILLAS = {
    manana: 'Hola {nombre}, te recuerdo tu cita de {servicio} mañana a las {hora} en {negocio}. Si no puedes venir, avísame por aquí. ¡Hasta mañana!',
    resena: 'Hola {nombre}, gracias por venir hoy a {negocio}. Si te gustó, nos ayudas muchísimo dejando tu opinión aquí: {enlace} ¡Gracias!',
    dormido: 'Hola {nombre}, hace tiempo que no te vemos por {negocio}. ¿Te reservo hueco esta semana? Dime qué día te viene bien.',
    bono: 'Hola {nombre}, te queda {quedan} de tu {bono}. ¿Te lo renuevo para que no pierdas el ritmo?',
    cumple: '¡Feliz cumpleaños, {nombre}! De parte de todo el equipo de {negocio}. Esta semana tienes un detalle esperándote en tu próxima visita.',
  };
  const inicioDia = d => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
  const hhmm = d => new Date(d).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  const rellenar = (t, v) => t.replace(/\{(\w+)\}/g, (_, k) => (v[k] ?? ''));
  const primerNombre = n => String(n || '').trim().split(/\s+/)[0];

  function calcular({ citas = [], clientes = [], hoy = new Date(), ajustes = {} }) {
    const a = { negocio: 'nuestro centro', enlaceResena: '', diasDormido: 45, ...ajustes };
    const P = { ...PLANTILLAS, ...(a.plantillas || {}) };
    const h0 = inicioDia(hoy), m0 = new Date(+h0 + DIA), m1 = new Date(+h0 + 2 * DIA);
    const porId = Object.fromEntries(clientes.map(c => [c.id, c]));
    const base = c => ({ nombre: primerNombre(c.nombre), negocio: a.negocio });
    const item = (c, tipo, texto, extra = {}) => ({ clave: tipo + ':' + c.id + ':' + (extra.ref || ''), tipo, cliente: c, texto, ...extra });

    const manana = citas.filter(x => x.estado !== 'cancelada' && new Date(x.inicio) >= m0 && new Date(x.inicio) < m1)
      .sort((x, y) => new Date(x.inicio) - new Date(y.inicio))
      .map(x => { const c = porId[x.clienteId]; return c && item(c, 'manana', rellenar(P.manana, { ...base(c), servicio: x.servicio.charAt(0).toLowerCase() + x.servicio.slice(1), hora: hhmm(x.inicio) }), { ref: x.id, detalle: hhmm(x.inicio) + ' · ' + x.servicio }); })
      .filter(Boolean);

    const resenas = citas.filter(x => x.estado === 'completada' && new Date(x.inicio) >= new Date(+h0 - DIA) && new Date(x.inicio) < m0)
      .map(x => { const c = porId[x.clienteId]; return c && !c.resenaPedida && item(c, 'resena', rellenar(P.resena, { ...base(c), enlace: a.enlaceResena }), { ref: x.id, detalle: x.servicio + ' · ' + (inicioDia(x.inicio) < h0 ? 'ayer' : 'hoy') }); })
      .filter(Boolean);

    const ultima = {}, futura = {};
    citas.forEach(x => {
      const t = new Date(x.inicio);
      if (x.estado === 'completada' && (!ultima[x.clienteId] || t > ultima[x.clienteId])) ultima[x.clienteId] = t;
      if (x.estado !== 'cancelada' && t >= h0) futura[x.clienteId] = true;
    });
    const dormidos = clientes.filter(c => ultima[c.id] && !futura[c.id] && (h0 - ultima[c.id]) / DIA >= a.diasDormido)
      .map(c => { const d = Math.round((h0 - ultima[c.id]) / DIA); return item(c, 'dormido', rellenar(P.dormido, base(c)), { detalle: 'Última visita hace ' + d + ' días', dias: d }); })
      .sort((x, y) => x.dias - y.dias);

    const bonos = clientes.filter(c => c.bono && c.bono.quedan <= 1)
      .map(c => item(c, 'bono', rellenar(P.bono, { ...base(c), bono: c.bono.nombre, quedan: c.bono.quedan === 1 ? '1 sesión' : '0 sesiones' }), { detalle: c.bono.nombre + ' · quedan ' + c.bono.quedan }));

    const md = d => String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    const hoyMD = md(h0);
    const cumples = clientes.filter(c => c.cumple && String(c.cumple).slice(-5) === hoyMD)
      .map(c => item(c, 'cumple', rellenar(P.cumple, base(c)), { detalle: 'Cumple hoy' }));

    return { manana, resenas, dormidos, bonos, cumples };
  }

  function enlace(tel, texto) {
    let d = String(tel || '').replace(/\D/g, '');
    if (d.length === 9) d = '34' + d;
    return 'https://wa.me/' + d + '?text=' + encodeURIComponent(texto);
  }

  g.AirmateAvisos = { calcular, enlace, PLANTILLAS };
})(typeof window !== 'undefined' ? window : globalThis);
