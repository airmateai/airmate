const SB_URL    = process.env.SB_URL;
const SB_KEY    = process.env.SB_KEY;
const EJ_SVC    = process.env.EJ_SVC;
const EJ_TPL    = process.env.EJ_TPL || 'template_qnip0mc';
const EJ_PUB    = process.env.EJ_PUB_KEY;
const EJ_PRIV   = process.env.EJ_PRIV_KEY;

async function sbGet(path) {
  const r = await fetch(`${SB_URL}/rest/v1/${path}`, {
    headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` }
  });
  return r.json();
}

async function sendEmail(params) {
  const r = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      service_id: EJ_SVC, template_id: EJ_TPL,
      user_id: EJ_PUB, accessToken: EJ_PRIV,
      template_params: params
    })
  });
  return r.ok;
}

async function main() {
  /* Cargar configs de todos los negocios (slug → reminder_hours + owner_email + bot_name) */
  const configs = await sbGet('bot_configs?select=slug,bot_name,owner_email,reminder_hours');
  const cfgMap = {};
  for (const c of configs) cfgMap[c.slug] = c;

  const now = new Date();

  /* Para cada negocio, buscar citas que estén a reminder_hours horas */
  let totalSent = 0;

  for (const cfg of configs) {
    const hours = cfg.reminder_hours ?? 24;
    /* Ventana: reminder_hours ± 30 minutos para no mandar doble ni saltarse */
    const windowStart = new Date(now.getTime() + (hours - 0.5) * 3600000).toISOString();
    const windowEnd   = new Date(now.getTime() + (hours + 0.5) * 3600000).toISOString();

    const apts = await sbGet(
      `appointments?business_slug=eq.${encodeURIComponent(cfg.slug)}&starts_at=gte.${windowStart}&starts_at=lte.${windowEnd}&status=eq.confirmed&client_email=not.is.null`
    );

    for (const apt of apts) {
      const fecha = new Date(apt.starts_at).toLocaleDateString('es-ES', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Atlantic/Canary'
      });
      const hora = new Date(apt.starts_at).toLocaleTimeString('es-ES', {
        hour: '2-digit', minute: '2-digit', timeZone: 'Atlantic/Canary'
      });

      const ok = await sendEmail({
        cliente_nombre:   apt.client_name,
        cliente_email:    apt.client_email,
        cliente_telefono: apt.client_phone || '—',
        negocio_nombre:   cfg.bot_name || cfg.slug,
        servicio:         apt.service,
        duracion:         (apt.duration_minutes || 60) + ' min',
        fecha,
        hora,
        horas_antes:      String(hours),
        reply_to:         cfg.owner_email || apt.client_email,
        owner_email:      cfg.owner_email || apt.client_email,
        cancel_url:       `https://airmateai.github.io/airmate/cancel.html?id=${apt.id}`,
      });

      if (ok) {
        totalSent++;
        console.log(`✅ Recordatorio enviado: ${apt.client_name} — ${apt.service} — ${fecha} ${hora}`);
      } else {
        console.error(`❌ Error enviando a ${apt.client_email}`);
      }
    }
  }

  console.log(`\nTotal enviados: ${totalSent}`);
}

main().catch(e => { console.error(e); process.exit(1); });
