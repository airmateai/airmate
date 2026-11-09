// Airmate · emails de captación (Brevo)
// 1. Desde el panel de llamadas (sesión «airmate-interno»): { contacto_id, email } → manda la info al momento.
// 2. Cron cada hora (cabecera x-cron-secret): seguimientos automáticos a los que pidieron info y no han avanzado:
//    seguimiento 1 a los 3 días, seguimiento 2 a los 7 días del primero. Se para si el lead pasa a demo, cliente o descartado.
// Secrets que ya existen en el proyecto (los usa f2o-envios): BREVO_API_KEY, CRON_SECRET.
// Remitente: hola@airmate.es (dominio autenticado en Brevo). Las respuestas van a airmateai@gmail.com.
import { createClient } from "jsr:@supabase/supabase-js@2";

const URL_SB = Deno.env.get("SUPABASE_URL")!;
const sb = createClient(URL_SB, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
const BREVO = Deno.env.get("BREVO_API_KEY") ?? "";
const SECRETO = Deno.env.get("CRON_SECRET") ?? "";
const DE = { email: Deno.env.get("AM_REMITENTE") ?? "hola@airmate.es", name: "Airmate" };
const RESPONDER = { email: "airmateai@gmail.com", name: "Airmate" };
const WEB = "https://airmate.es/";
const TEL = "+34 646 427 613";
const DIAS_SEG = [3, 7]; // días hasta el seguimiento 1 y desde el 1 hasta el 2

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (c: unknown, s = 200) => new Response(JSON.stringify(c), { status: s, headers: { ...CORS, "Content-Type": "application/json" } });
const esc = (t: string) => String(t ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
const emailOk = (e: string) => /^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(e ?? "");

type Contacto = { id: string; empresa: string; sector: string | null; captador: string | null; email: string | null; etapa: string; emails: Envio[] | null; email_seg_n: number | null };
type Envio = { t: string; tipo: string; ok: boolean; error?: string };

function nombrePila(n: string | null) { return (n ?? "Fabio").trim().split(/\s+/)[0] || "Fabio"; }
function esSurf(c: Contacto) { return /surf/i.test(c.sector ?? ""); }

// Cuerpos: párrafos separados por línea en blanco; líneas que empiezan por «• » forman una lista; **negrita**
function plantilla(c: Contacto, tipo: string) {
  const yo = nombrePila(c.captador);
  const gente = esSurf(c) ? "alumnos" : "clientes";
  const asuntoBase = `${c.empresa} · lo que te comenté por teléfono`;
  if (tipo === "info") return {
    asunto: asuntoBase,
    cuerpo: `Hola,

Soy ${yo}, de Airmate. Gracias por atenderme por teléfono. Como te comenté, te dejo la información.

Somos una empresa de inteligencia artificial aquí en Tenerife y ayudamos a negocios como ${c.empresa} a ganar tiempo y vender más:

• **Web con reservas y pagos online:** tus ${gente} eligen hora y dejan la señal solos, a cualquier hora.
• **Sistema de gestión a medida:** agenda, fichas de ${gente}, bonos, cobros, stock y facturas, en un panel en el móvil.
• **Plataformas para eventos:** web del evento, lista de asistentes con emails automáticos y votaciones por QR.
• **Contenido con IA para tus redes:** reels con guion, voz y montaje.

¿Lo vemos 15 minutos esta semana y te enseño cómo quedaría en tu negocio? Contéstame a este email con el día que mejor te venga, o llámame al ${TEL}.`,
  };
  if (tipo === "seg1") return {
    asunto: "Re: " + asuntoBase,
    cuerpo: `Hola de nuevo,

Te escribo por si se te pasó mi email del otro día.

En 15 minutos te enseño cómo quedaría ${c.empresa} con reservas online, cobro de la señal y todo el negocio en un panel en el móvil. ¿Te viene mejor el martes o el jueves?

Si ahora no es buen momento, dímelo sin problema y no te escribo más.`,
  };
  return {
    asunto: "Re: " + asuntoBase,
    cuerpo: `Hola,

Es la última vez que te escribo, no quiero llenarte el correo.

Si en algún momento quieres ganar tiempo con la agenda, los cobros o las redes de ${c.empresa}, aquí me tienes: contesta a este email o llámame al ${TEL}.

Un saludo y mucha suerte con el negocio.`,
  };
}

function aHtml(cuerpo: string) {
  return cuerpo.split(/\n\n+/).map((p) => {
    const neg = (s: string) => esc(s).replace(/\*\*(.+?)\*\*/g, "<b>$1</b>");
    const lineas = p.split("\n");
    if (lineas.every((l) => l.startsWith("• ")))
      return `<ul style="margin:0 0 18px;padding-left:20px">${lineas.map((l) => `<li style="margin:0 0 8px">${neg(l.slice(2))}</li>`).join("")}</ul>`;
    return `<p style="margin:0 0 18px">${lineas.map(neg).join("<br>")}</p>`;
  }).join("");
}

function html(c: Contacto, asunto: string, cuerpo: string, conImagen: boolean) {
  const yo = nombrePila(c.captador);
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${esc(asunto)}</title></head>
<body style="margin:0;background:#f4f4f2;font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;color:#0a0a0a">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f2"><tr><td align="center" style="padding:28px 12px">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff">
<tr><td style="padding:28px 36px 8px"><a href="${WEB}?ia" style="text-decoration:none;color:#0a0a0a;font-weight:600;font-size:19px"><img src="${WEB}assets/web/logo-negro.png" alt="" height="24" style="height:24px;vertical-align:-5px;margin-right:8px;border:0">Airmate</a></td></tr>
${conImagen ? `<tr><td style="padding:16px 0 0"><a href="${WEB}?ia"><img src="${WEB}assets/web/og-airmate-ia.jpg" width="600" alt="Airmate · Impulsa tu negocio con inteligencia artificial" style="display:block;width:100%;height:auto;border:0"></a></td></tr>` : ""}
<tr><td style="padding:28px 36px 8px;font-size:16px;line-height:1.6">${aHtml(cuerpo)}
${conImagen ? `<p style="margin:6px 0 26px"><a href="${WEB}?ia" style="display:inline-block;background:#0a0a0a;color:#ffffff;text-decoration:none;padding:13px 24px;border-radius:999px;font-weight:600;font-size:15px">Ver lo que hacemos →</a></p>` : ""}
<p style="margin:0 0 4px">Un saludo,</p>
<p style="margin:0;font-weight:600">${esc(yo)}</p>
<p style="margin:0;color:#8a8a8a;font-size:14px">Airmate · <a href="${WEB}" style="color:#8a8a8a">airmate.es</a> · ${TEL}</p></td></tr>
<tr><td style="padding:22px 36px 28px;font-size:12px;color:#a0a0a0;border-top:1px solid #ececec">Te escribimos porque nos pediste información por teléfono. Si no quieres más emails, responde «no» y no te escribimos más.</td></tr>
</table></td></tr></table></body></html>`;
}

function texto(c: Contacto, cuerpo: string) {
  return cuerpo.replace(/\*\*(.+?)\*\*/g, "$1") + `\n\nUn saludo,\n${nombrePila(c.captador)}\nAirmate · airmate.es · ${TEL}\n\nTe escribimos porque nos pediste información por teléfono. Si no quieres más emails, responde «no».`;
}

async function enviar(c: Contacto, tipo: string, para: string) {
  const p = plantilla(c, tipo);
  const r = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: { "api-key": BREVO, "Content-Type": "application/json", accept: "application/json" },
    body: JSON.stringify({
      sender: DE, replyTo: RESPONDER, to: [{ email: para, name: c.empresa }], subject: p.asunto,
      htmlContent: html(c, p.asunto, p.cuerpo, tipo === "info"), textContent: texto(c, p.cuerpo),
      tags: ["captacion", tipo],
    }),
  });
  const ok = r.ok;
  const error = ok ? undefined : `${r.status} ${(await r.text()).slice(0, 200)}`;
  const envio: Envio = { t: new Date().toISOString(), tipo, ok, ...(error ? { error } : {}) };
  const n = tipo === "info" ? 0 : tipo === "seg1" ? 1 : 2;
  const proximo = ok && n < DIAS_SEG.length ? new Date(Date.now() + DIAS_SEG[n] * 864e5).toISOString() : null;
  await sb.from("am_crm_contactos").update({
    email: para, emails: [...(c.emails ?? []), envio],
    ...(ok ? { email_seg_n: n, email_seg_at: proximo } : {}),
    updated_at: envio.t,
  }).eq("id", c.id);
  return envio;
}

async function delPanel(req: Request) {
  const auth = req.headers.get("Authorization") ?? "";
  if (!auth.startsWith("Bearer ")) return false;
  const { data } = await sb.auth.getUser(auth.slice(7));
  return data?.user?.app_metadata?.business_slug === "airmate-interno";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (!BREVO) return json({ ok: false, error: "Falta BREVO_API_KEY" }, 503);
  try {
    const cuerpo = await req.json().catch(() => ({}));
    // Cron: seguimientos que tocan
    if (req.headers.get("x-cron-secret")) {
      if (!SECRETO || req.headers.get("x-cron-secret") !== SECRETO) return json({ ok: false, error: "sin permiso" }, 401);
      const { data, error } = await sb.from("am_crm_contactos").select("id,empresa,sector,captador,email,etapa,emails,email_seg_n")
        .not("email", "is", null).not("email_seg_at", "is", null).lte("email_seg_at", new Date().toISOString())
        .in("etapa", ["nuevo", "contactado", "interesado"]).limit(40);
      if (error) throw error;
      let ok = 0;
      for (const c of (data ?? []) as Contacto[]) {
        const tipo = (c.email_seg_n ?? 0) === 0 ? "seg1" : "seg2";
        const e = await enviar(c, tipo, c.email!);
        if (e.ok) ok++;
        else if (/^(402|429)/.test(e.error ?? "")) break; // sin cupo hoy
      }
      return json({ ok: true, enviados: ok });
    }
    // Panel: mandar la info ya
    if (!(await delPanel(req))) return json({ ok: false, error: "sin permiso" }, 401);
    const para = String(cuerpo.email ?? "").trim().toLowerCase();
    if (!cuerpo.contacto_id || !emailOk(para)) return json({ ok: false, error: "Email no válido" }, 400);
    const { data: c } = await sb.from("am_crm_contactos").select("id,empresa,sector,captador,email,etapa,emails,email_seg_n").eq("id", cuerpo.contacto_id).maybeSingle();
    if (!c) return json({ ok: false, error: "Contacto no encontrado" }, 404);
    const e = await enviar(c as Contacto, "info", para);
    return json({ ok: e.ok, error: e.error }, e.ok ? 200 : 502);
  } catch (err) {
    return json({ ok: false, error: String((err as Error)?.message ?? err) }, 500);
  }
});
