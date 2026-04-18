import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const EJ_SVC      = 'service_npmjvvf'
const EJ_TPL      = 'template_recordatorio'
const EJ_PUB_KEY  = 'i4iBVVP-BkUOOwBE9'
const EJ_PRIV_KEY = 'oTwXnc-Gds72eOKBc_O9J'

serve(async () => {
  const sb = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  /* Citas de mañana */
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const day = tomorrow.toISOString().split('T')[0]

  const { data: apts, error } = await sb
    .from('appointments')
    .select('*')
    .gte('starts_at', `${day}T00:00:00`)
    .lte('starts_at', `${day}T23:59:59`)
    .in('status', ['pending', 'confirmed'])
    .not('client_email', 'is', null)

  if (error) return new Response(JSON.stringify({ error }), { status: 500 })
  if (!apts?.length) return new Response(JSON.stringify({ sent: 0, total: 0 }))

  /* Cargar datos del negocio por slug */
  const slugs = [...new Set(apts.map(a => a.business_slug))]
  const { data: configs } = await sb
    .from('bot_configs')
    .select('slug, bot_name, owner_email')
    .in('slug', slugs)

  const configMap: Record<string, { bot_name: string; owner_email: string }> = {}
  for (const c of configs ?? []) configMap[c.slug] = c

  let sent = 0
  for (const apt of apts) {
    const cfg    = configMap[apt.business_slug] || {}
    const negocio = cfg.bot_name || apt.business_slug
    const fecha  = new Date(apt.starts_at).toLocaleDateString('es-ES', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    })
    const hora   = new Date(apt.starts_at).toLocaleTimeString('es-ES', {
      hour: '2-digit', minute: '2-digit'
    })

    const res = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        service_id:  EJ_SVC,
        template_id: EJ_TPL,
        user_id:     EJ_PUB_KEY,
        accessToken: EJ_PRIV_KEY,
        template_params: {
          cliente_nombre:   apt.client_name,
          cliente_email:    apt.client_email,
          cliente_telefono: apt.client_phone || '—',
          negocio_nombre:   negocio,
          servicio:         apt.service,
          duracion:         (apt.duration_minutes || 60) + ' min',
          fecha,
          hora,
          reply_to:         cfg.owner_email || apt.client_email,
          owner_email:      cfg.owner_email || apt.client_email,
        }
      })
    })

    if (res.ok) sent++
  }

  return new Response(JSON.stringify({ sent, total: apts.length }), {
    headers: { 'Content-Type': 'application/json' }
  })
})
