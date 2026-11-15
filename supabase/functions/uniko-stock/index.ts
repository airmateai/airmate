// UNIKO · app de stock. Habla con la tienda WooCommerce de unikobynt.com: la web es la ÚNICA fuente del stock.
// Vender desde la app = quitar la unidad en WooCommerce (y queda apuntado en uniko_movimientos).
// Solo entran usuarios de Supabase Auth que estén en uniko_usuarios.
// Secrets: WC_URL (https://unikobynt.com), WC_KEY, WC_SECRET (WooCommerce → Ajustes → Avanzado → REST API, permisos Lectura/Escritura).
import { createClient } from "jsr:@supabase/supabase-js@2";

const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
const WC = (Deno.env.get("WC_URL") ?? "https://unikobynt.com").replace(/\/$/, "") + "/wp-json/wc/v3";
const KEY = Deno.env.get("WC_KEY") ?? "", SECRET = Deno.env.get("WC_SECRET") ?? "";
const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type", "Access-Control-Allow-Methods": "POST, OPTIONS" };
const json = (c: unknown, s = 200) => new Response(JSON.stringify(c), { status: s, headers: { ...CORS, "Content-Type": "application/json" } });

async function wc(path: string, init: RequestInit = {}) {
  const r = await fetch(WC + path, { ...init, headers: { Authorization: "Basic " + btoa(KEY + ":" + SECRET), "Content-Type": "application/json", ...(init.headers ?? {}) } });
  const t = await r.text();
  if (!r.ok) throw new Error(`WooCommerce ${r.status}: ${t.slice(0, 200)}`);
  return { data: JSON.parse(t), total: Number(r.headers.get("x-wp-totalpages") ?? 1) };
}
async function todas(path: string) {
  const sep = path.includes("?") ? "&" : "?"; const out: any[] = [];
  for (let p = 1; p < 20; p++) { const { data, total } = await wc(`${path}${sep}per_page=100&page=${p}`); out.push(...data); if (p >= total) break; }
  return out;
}

async function quien(req: Request) {
  const a = req.headers.get("Authorization") ?? "";
  if (!a.startsWith("Bearer ")) return null;
  const { data } = await sb.auth.getUser(a.slice(7));
  if (!data?.user) return null;
  const { data: u } = await sb.from("uniko_usuarios").select("nombre").eq("user_id", data.user.id).maybeSingle();
  return u ? { id: data.user.id, nombre: u.nombre as string } : null;
}

const attr = (as: any[], n: string) => (as.find((a) => a.name.toLowerCase() === n)?.option ?? "") as string;

// Catálogo con el stock real de cada color y talla
async function catalogo() {
  const prods = await todas("/products?status=publish");
  const { data: cos } = await sb.from("uniko_costes").select("product_id,coste");
  const coste = new Map((cos ?? []).map((c) => [c.product_id, Number(c.coste)]));
  const lotes: any[] = [];
  for (let i = 0; i < prods.length; i += 8) {
    lotes.push(...await Promise.all(prods.slice(i, i + 8).map(async (p: any) => {
      let filas: any[];
      if (p.type === "variable") {
        const vs = await todas(`/products/${p.id}/variations`);
        filas = vs.map((v: any) => ({ vid: v.id, color: attr(v.attributes, "color") || "Único", talla: (attr(v.attributes, "talla") || "Única").toUpperCase(), stock: v.manage_stock ? (v.stock_quantity ?? 0) : null, estado: v.stock_status, precio: Number(v.price || p.price || 0) }));
      } else {
        filas = [{ vid: 0, color: "Único", talla: "ÚNICA", stock: p.manage_stock ? (p.stock_quantity ?? 0) : null, estado: p.stock_status, precio: Number(p.price || 0) }];
      }
      return { id: p.id, nombre: p.name, cat: p.categories?.[0]?.name ?? "", img: p.images?.[0]?.src ?? "", precio: Number(p.price || 0), pvp: Number(p.regular_price || p.price || 0), coste: coste.get(p.id) ?? null, filas };
    })));
  }
  return lotes;
}

// Ventas de la web de los últimos 45 días, por producto (para «qué mover»)
async function ventasWeb() {
  const desde = new Date(Date.now() - 45 * 864e5).toISOString();
  const ords = await todas(`/orders?after=${desde}&status=processing,completed,on-hold`);
  const v: Record<string, { n: number; ult: string }> = {};
  for (const o of ords) for (const l of o.line_items ?? []) {
    const k = String(l.product_id); v[k] ??= { n: 0, ult: o.date_created }; v[k].n += l.quantity; if (o.date_created > v[k].ult) v[k].ult = o.date_created;
  }
  return v;
}

// Cambiar el stock de un color/talla en la web: delta (vender −1, recibir +5) o fijar una cantidad (recuento)
async function mover(b: any, autor: string) {
  const ruta = b.vid ? `/products/${b.id}/variations/${b.vid}` : `/products/${b.id}`;
  const { data: act } = await wc(ruta);
  const antes = act.manage_stock ? Number(act.stock_quantity ?? 0) : 0;
  const nuevo = b.tipo === "recuento" ? Math.max(0, Math.round(Number(b.cantidad))) : antes + Math.round(Number(b.delta));
  if (!Number.isFinite(nuevo)) throw new Error("cantidad no válida");
  if (b.tipo === "venta" && nuevo < 0) throw new Error(`Solo quedan ${antes}`);
  const { data: hecho } = await wc(ruta, { method: "PUT", body: JSON.stringify({ manage_stock: true, stock_quantity: Math.max(0, nuevo) }) });
  const despues = Number(hecho.stock_quantity ?? nuevo);
  await sb.from("uniko_movimientos").insert({ product_id: b.id, variation_id: b.vid || null, nombre: b.nombre ?? null, color: b.color ?? null, talla: b.talla ?? null,
    tipo: b.tipo, delta: despues - antes, stock_despues: despues, canal: b.canal ?? null, autor });
  return { antes, despues };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  try {
    const u = await quien(req);
    if (!u) return json({ ok: false, error: "sin permiso" }, 401);
    if (!KEY || !SECRET) return json({ ok: false, error: "Falta conectar la tienda (claves de WooCommerce)" }, 503);
    const b = await req.json().catch(() => ({}));
    if (b.accion === "catalogo") return json({ ok: true, yo: u.nombre, productos: await catalogo() });
    if (b.accion === "ventas") return json({ ok: true, ventas: await ventasWeb() });
    if (b.accion === "mover") return json({ ok: true, ...(await mover(b, u.nombre)) });
    if (b.accion === "coste") {
      const c = Number(b.coste); if (!(c >= 0)) return json({ ok: false, error: "coste no válido" }, 400);
      await sb.from("uniko_costes").upsert({ product_id: b.id, coste: c, updated_at: new Date().toISOString() }); return json({ ok: true });
    }
    if (b.accion === "movimientos") {
      const { data } = await sb.from("uniko_movimientos").select("*").order("created_at", { ascending: false }).limit(60);
      return json({ ok: true, movimientos: data ?? [] });
    }
    return json({ ok: false, error: "acción desconocida" }, 400);
  } catch (e) {
    return json({ ok: false, error: String((e as Error).message ?? e) }, 500);
  }
});
