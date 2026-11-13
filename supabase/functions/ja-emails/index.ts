// José Acosta · emails automáticos a sus clientes (Brevo). 13-nov-2026.
// Tres formas de llamarla:
//  1. Desde el panel de Jose (sesión con app_metadata.business_slug = 'jose-acosta'):
//       { tipo: 'cita_confirmada' | 'cita_cancelada' | 'recordatorio', id }      → cita de appointments
//       { tipo: 'encargo_estado', id, estado }                                   → encargo de crm_orders
//       { tipo: 'documento', id, email }                                         → factura/presupuesto de crm_invoices
//       { tipo: 'recibo', email, total, fecha }                                  → recibo del TPV
//  2. Desde el formulario de reservas web (sin sesión): { tipo: 'reserva_web', confirm_code, email }
//     Solo funciona para una reserva recién creada (15 min) y una sola vez.
//  3. Cron cada hora (cabecera x-cron-secret): recordatorio de las citas de mañana, una vez por cita.
// Secrets: BREVO_API_KEY y CRON_SECRET (ya existen en el proyecto). Opcionales:
//   JA_REMITENTE (por defecto citas@joseacosta.com; hasta que el dominio esté autenticado en Brevo se usa hola@airmate.es)
//   JA_RESPONDER (email de Jose donde llegan las respuestas de los clientes)
import { createClient } from "jsr:@supabase/supabase-js@2";

const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
const BREVO = Deno.env.get("BREVO_API_KEY") ?? "";
const SECRETO = Deno.env.get("CRON_SECRET") ?? "";
const SLUG = "jose-acosta";
const NOMBRE = "José Acosta";
const REMITENTE = Deno.env.get("JA_REMITENTE") ?? "citas@joseacosta.com";
const REMITENTE_RESPALDO = "hola@airmate.es"; // dominio ya autenticado en Brevo
const RESPONDER = Deno.env.get("JA_RESPONDER") ?? "";
const DIRECCION = "Pasaje Peligros, 2 · 38002 Santa Cruz de Tenerife";
const WHATSAPP = "34629515728";
const TEL = "629 515 728";
const WEB = "https://joseacosta.com";
const RESERVAS = "https://joseacosta.com/cita-previa/";
const TZ = "Atlantic/Canary";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (c: unknown, s = 200) => new Response(JSON.stringify(c), { status: s, headers: { ...CORS, "Content-Type": "application/json" } });
const esc = (t: unknown) => String(t ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
const emailOk = (e: unknown) => typeof e === "string" && /^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(e);
const pila = (n: unknown) => String(n ?? "").trim().split(/\s+/)[0] || "";
const eur = (n: unknown) => (Number(n) || 0).toLocaleString("es-ES", { style: "currency", currency: "EUR" });
const fechaLarga = (iso: string) => new Date(iso).toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long", timeZone: TZ });
const hora = (iso: string) => new Date(iso).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit", timeZone: TZ });
const diaCanarias = (d: Date) => d.toLocaleDateString("sv-SE", { timeZone: TZ }); // AAAA-MM-DD

// ── Plantilla: sobria, con la marca de la sastrería ──
function html(titulo: string, cuerpo: string, boton?: { texto: string; url: string }) {
  return `<!doctype html><html lang="es"><body style="margin:0;background:#f4f1ec;font-family:Georgia,'Times New Roman',serif;color:#1a1410">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f1ec;padding:28px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid #e5dfd5">
<tr><td style="padding:26px 32px 18px;border-bottom:1px solid #efe9df;text-align:center;letter-spacing:.32em;font-size:15px;color:#1f5c63">JOSE ACOSTA</td></tr>
<tr><td style="padding:30px 32px 8px">
<h1 style="margin:0 0 18px;font-weight:normal;font-size:24px;line-height:1.3">${titulo}</h1>
<div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.65;color:#3d342b">${cuerpo}</div>
${boton ? `<p style="margin:26px 0 6px"><a href="${boton.url}" style="display:inline-block;background:#1a1410;color:#ffffff;text-decoration:none;font-family:Arial,Helvetica,sans-serif;font-size:14px;padding:12px 22px">${esc(boton.texto)}</a></p>` : ""}
</td></tr>
<tr><td style="padding:26px 32px 28px;font-family:Arial,Helvetica,sans-serif;font-size:12.5px;line-height:1.6;color:#8a7d70;border-top:1px solid #efe9df">
José Acosta · Sastrería a medida<br>${DIRECCION}<br>WhatsApp ${TEL} · <a href="${WEB}" style="color:#8a7d70">joseacosta.com</a>
</td></tr></table></td></tr></table></body></html>`;
}
const filaDato = (k: string, v: string) => `<tr><td style="padding:6px 14px 6px 0;color:#8a7d70;white-space:nowrap">${k}</td><td style="padding:6px 0;font-weight:bold;color:#1a1410">${v}</td></tr>`;
const datos = (filas: string) => `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:18px 0;border-top:1px solid #efe9df;border-bottom:1px solid #efe9df;width:100%">${filas}</table>`;
const waLink = (txt: string) => `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(txt)}`;

type Cita = { id: string; business_slug: string; client_name: string | null; client_email: string | null; service: string | null; starts_at: string; status: string };

function emailCita(c: Cita, tipo: string) {
  const n = pila(c.client_name);
  const cuando = `${fechaLarga(c.starts_at)} a las ${hora(c.starts_at)}`;
  const tabla = datos(filaDato("Cita", esc(c.service || "Cita en la sastrería")) + filaDato("Día", esc(cuando)) + filaDato("Dónde", esc(DIRECCION)));
  if (tipo === "cita_cancelada") return {
    asunto: "Tu cita en José Acosta se ha cancelado",
    html: html(`Hola${n ? " " + esc(n) : ""}, tu cita se ha cancelado`, `<p>Te confirmamos que la cita del <b>${esc(cuando)}</b> ha quedado cancelada.</p><p>Cuando quieras, puedes pedir una nueva en nuestra web o escribirnos por WhatsApp.</p>`, { texto: "Pedir una nueva cita", url: RESERVAS }),
  };
  if (tipo === "recordatorio") return {
    asunto: `Recordatorio: mañana tienes cita en José Acosta (${hora(c.starts_at)})`,
    html: html(`Te esperamos mañana${n ? ", " + esc(n) : ""}`, `<p>Te recordamos tu cita:</p>${tabla}<p>Si no puedes venir o quieres cambiar la hora, avísanos por WhatsApp y te buscamos otro hueco.</p>`, { texto: "Avisar por WhatsApp", url: waLink(`Hola, soy ${c.client_name || ""}. Sobre mi cita del ${cuando}:`) }),
  };
  return {
    asunto: `Cita confirmada en José Acosta · ${fechaLarga(c.starts_at)}, ${hora(c.starts_at)}`,
    html: html(`${n ? esc(n) + ", tu" : "Tu"} cita está confirmada`, `<p>Gracias por confiar en nosotros. Estos son los datos:</p>${tabla}<p>El día antes te enviaremos un recordatorio. Si necesitas cambiarla, escríbenos por WhatsApp.</p>`, { texto: "Escribir por WhatsApp", url: waLink(`Hola, soy ${c.client_name || ""}. Sobre mi cita del ${cuando}:`) }),
  };
}

const ESTADOS_ENC: Record<string, { asunto: string; titulo: string; texto: string; boton?: boolean }> = {
  listo_prueba: { asunto: "Tu traje está listo para la prueba", titulo: "Tu traje está listo para la prueba", texto: "Ya lo tenemos preparado. Pide tu cita para la prueba cuando te venga bien y lo dejamos perfecto.", boton: true },
  ajustes: { asunto: "Estamos con los últimos ajustes", titulo: "Últimos ajustes en marcha", texto: "Después de la prueba estamos aplicando los retoques para que te quede perfecto. Te avisamos en cuanto esté listo." },
  listo: { asunto: "Tu traje está listo para recoger", titulo: "Tu traje está listo", texto: "Ya está terminado y listo para que lo recojas. Escríbenos por WhatsApp para acordar el día y la hora.", boton: true },
  entregado: { asunto: "Gracias por confiar en José Acosta", titulo: "Ha sido un placer", texto: "Gracias por confiar en nosotros para tu traje. Si en el futuro necesitas cualquier ajuste, aquí estamos." },
};

async function enviar(para: string, nombre: string, asunto: string, cuerpo: string) {
  if (!BREVO) throw new Error("Falta BREVO_API_KEY");
  const mandar = (de: string) => fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: { "api-key": BREVO, "Content-Type": "application/json", accept: "application/json" },
    body: JSON.stringify({
      sender: { email: de, name: NOMBRE },
      to: [{ email: para, name: nombre || para }],
      ...(emailOk(RESPONDER) ? { replyTo: { email: RESPONDER, name: NOMBRE } } : {}),
      subject: asunto, htmlContent: cuerpo, tags: ["jose-acosta"],
    }),
  });
  let r = await mandar(REMITENTE);
  if (!r.ok && REMITENTE !== REMITENTE_RESPALDO) {
    const t = await r.text();
    // Dominio aún sin autenticar en Brevo: sale desde airmate.es con el nombre de Jose
    if (/sender|valid|domain/i.test(t)) r = await mandar(REMITENTE_RESPALDO);
    else throw new Error(`Brevo ${r.status}: ${t.slice(0, 200)}`);
  }
  if (!r.ok) throw new Error(`Brevo ${r.status}: ${(await r.text()).slice(0, 200)}`);
}

async function citaPorId(id: string) {
  const { data } = await sb.from("appointments").select("id,business_slug,client_name,client_email,service,starts_at,status").eq("id", id).eq("business_slug", SLUG).maybeSingle();
  return data as Cita | null;
}

// ── Recordatorios: citas de mañana (hora de Canarias), una vez por cita ──
async function recordatorios() {
  const manana = new Date(Date.now() + 24 * 3600 * 1000);
  const dia = diaCanarias(manana);
  const desde = new Date(Date.now() + 6 * 3600 * 1000).toISOString(), hasta = new Date(Date.now() + 54 * 3600 * 1000).toISOString();
  const { data, error } = await sb.from("appointments").select("id,business_slug,client_name,client_email,service,starts_at,status,recordatorio_enviado_at")
    .eq("business_slug", SLUG).in("status", ["pending", "confirmed"]).is("recordatorio_enviado_at", null).gte("starts_at", desde).lte("starts_at", hasta);
  if (error) throw new Error(error.message);
  let enviados = 0; const fallos: string[] = [];
  for (const c of (data ?? []) as (Cita & { recordatorio_enviado_at: string | null })[]) {
    if (diaCanarias(new Date(c.starts_at)) !== dia || !emailOk(c.client_email)) continue;
    try {
      const e = emailCita(c, "recordatorio");
      await enviar(c.client_email!, c.client_name ?? "", e.asunto, e.html);
      await sb.from("appointments").update({ recordatorio_enviado_at: new Date().toISOString() }).eq("id", c.id);
      enviados++;
    } catch (err) { fallos.push(`${c.id}: ${(err as Error).message}`); }
  }
  return { enviados, fallos };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "Método no permitido" }, 405);
  try {
    // 3) Cron
    if (SECRETO && req.headers.get("x-cron-secret") === SECRETO) return json({ ok: true, ...(await recordatorios()) });

    const b = await req.json().catch(() => ({}));

    // 2) Formulario de reservas web (sin sesión)
    if (b.tipo === "reserva_web") {
      if (!b.confirm_code || !emailOk(b.email)) return json({ error: "Datos incompletos" }, 400);
      const hace15 = new Date(Date.now() - 15 * 60 * 1000).toISOString();
      const { data } = await sb.from("appointments").select("id,business_slug,client_name,client_email,service,starts_at,status,confirmacion_enviada_at")
        .eq("business_slug", SLUG).eq("confirm_code", String(b.confirm_code)).eq("client_email", b.email).gte("created_at", hace15).is("confirmacion_enviada_at", null).limit(1);
      const c = (data ?? [])[0] as Cita | undefined;
      if (!c) return json({ ok: false, error: "Reserva no encontrada" }, 404);
      const e = emailCita(c, "cita_confirmada");
      await enviar(c.client_email!, c.client_name ?? "", e.asunto, e.html);
      await sb.from("appointments").update({ confirmacion_enviada_at: new Date().toISOString() }).eq("id", c.id);
      return json({ ok: true });
    }

    // 1) Panel de Jose: sesión obligatoria
    const token = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
    const { data: u } = await sb.auth.getUser(token);
    if (u?.user?.app_metadata?.business_slug !== SLUG) return json({ error: "No autorizado" }, 401);

    if (["cita_confirmada", "cita_cancelada", "recordatorio"].includes(b.tipo)) {
      const c = await citaPorId(String(b.id));
      if (!c) return json({ error: "Cita no encontrada" }, 404);
      if (!emailOk(c.client_email)) return json({ ok: false, error: "La cita no tiene email" });
      const e = emailCita(c, b.tipo);
      await enviar(c.client_email!, c.client_name ?? "", e.asunto, e.html);
      if (b.tipo === "recordatorio") await sb.from("appointments").update({ recordatorio_enviado_at: new Date().toISOString() }).eq("id", c.id);
      return json({ ok: true, enviado_a: c.client_email });
    }

    if (b.tipo === "encargo_estado") {
      const est = ESTADOS_ENC[String(b.estado)];
      if (!est) return json({ ok: false, error: "Estado sin email" });
      const { data: o } = await sb.from("crm_orders").select("id,title,client_name,client_id").eq("id", String(b.id)).eq("business_slug", SLUG).maybeSingle();
      if (!o) return json({ error: "Encargo no encontrado" }, 404);
      const { data: cli } = o.client_id ? await sb.from("crm_clients").select("name,email").eq("id", o.client_id).eq("business_slug", SLUG).maybeSingle() : { data: null };
      const para = cli?.email;
      if (!emailOk(para)) return json({ ok: false, error: "El cliente no tiene email" });
      const n = pila(cli?.name || o.client_name);
      const cuerpo = html(`${n ? esc(n) + ", " : ""}${est.titulo.charAt(0).toLowerCase() + est.titulo.slice(1)}`,
        `<p>${est.texto}</p>${o.title ? datos(filaDato("Encargo", esc(o.title))) : ""}`,
        est.boton ? (b.estado === "listo_prueba" ? { texto: "Pedir cita para la prueba", url: RESERVAS } : { texto: "Escribir por WhatsApp", url: waLink(`Hola, soy ${cli?.name || o.client_name || ""}. Sobre mi encargo: ${o.title || ""}`) }) : undefined);
      await enviar(para!, cli?.name ?? "", est.asunto, cuerpo);
      return json({ ok: true, enviado_a: para });
    }

    if (b.tipo === "documento") {
      if (!emailOk(b.email)) return json({ error: "Email no válido" }, 400);
      const { data: f } = await sb.from("crm_invoices").select("id,type,invoice_number,total,issue_date,client_name,lines").eq("id", String(b.id)).eq("business_slug", SLUG).maybeSingle();
      if (!f) return json({ error: "Documento no encontrado" }, 404);
      const tipoDoc = f.type === "factura" ? "Factura" : "Presupuesto";
      const lineas = Array.isArray(f.lines) ? f.lines.map((l: { desc?: string; qty?: number; price?: number }) => filaDato(esc(`${l.desc ?? ""} × ${l.qty ?? 1}`), esc(eur((l.price ?? 0) * (l.qty ?? 1))))).join("") : "";
      const cuerpo = html(`${tipoDoc} ${esc(f.invoice_number ?? "")}`,
        `<p>Hola${pila(f.client_name) ? " " + esc(pila(f.client_name)) : ""}, te enviamos el ${tipoDoc.toLowerCase()} de tu encargo.</p>${datos(lineas + filaDato("Total", esc(eur(f.total))) + (f.issue_date ? filaDato("Fecha", esc(new Date(f.issue_date).toLocaleDateString("es-ES"))) : ""))}<p>Si tienes cualquier duda, respóndenos a este email o escríbenos por WhatsApp.</p>`);
      await enviar(b.email, f.client_name ?? "", `${tipoDoc} ${f.invoice_number ?? ""} · José Acosta`, cuerpo);
      return json({ ok: true, enviado_a: b.email });
    }

    if (b.tipo === "recibo") {
      if (!emailOk(b.email)) return json({ error: "Email no válido" }, 400);
      const cuerpo = html("Gracias por tu compra", `<p>Este es el recibo de tu compra en José Acosta.</p>${datos(filaDato("Total", esc(String(b.total ?? ""))) + filaDato("Fecha", esc(String(b.fecha ?? ""))))}`);
      await enviar(b.email, "", "Recibo de tu compra · José Acosta", cuerpo);
      return json({ ok: true, enviado_a: b.email });
    }

    return json({ error: "Tipo desconocido" }, 400);
  } catch (e) {
    console.error("ja-emails", e);
    return json({ ok: false, error: (e as Error).message }, 500);
  }
});
