// UNIKO · app de stock (sin tocar la web).
// Nau apunta en el móvil lo que vende y lo que le llega; al llegar a casa ve «Para la web» con lo que tiene que
// cambiar en su WooCommerce y lo va marcando como hecho. No hace falta ninguna clave de la tienda:
// el catálogo (prendas, colores y tallas) se lee de la API pública de la tienda; el stock vive en uniko_stock.
// Solo entran usuarios de Supabase Auth que estén en uniko_usuarios.
import { createClient } from "jsr:@supabase/supabase-js@2";

const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
const TIENDA = (Deno.env.get("WC_URL") ?? "https://unikobynt.com").replace(/\/$/, "");
const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type", "Access-Control-Allow-Methods": "POST, OPTIONS" };
const json = (c: unknown, s = 200) => new Response(JSON.stringify(c), { status: s, headers: { ...CORS, "Content-Type": "application/json" } });

async function quien(req: Request) {
  const a = req.headers.get("Authorization") ?? "";
  if (!a.startsWith("Bearer ")) return null;
  const { data } = await sb.auth.getUser(a.slice(7));
  if (!data?.user) return null;
  const { data: u } = await sb.from("uniko_usuarios").select("nombre").eq("user_id", data.user.id).maybeSingle();
  return u ? { nombre: u.nombre as string } : null;
}

async function catalogo() {
  const prods: any[] = [];
  for (let p = 1; p < 10; p++) {
    const r = await fetch(`${TIENDA}/wp-json/wc/store/v1/products?per_page=100&page=${p}`);
    if (!r.ok) throw new Error(`No se pudo leer la tienda (${r.status})`);
    const d = await r.json(); prods.push(...d);
    if (p >= Number(r.headers.get("x-wp-totalpages") ?? 1)) break;
  }
  const [{ data: st }, { data: cos }] = await Promise.all([sb.from("uniko_stock").select("product_id,vid,cantidad"), sb.from("uniko_costes").select("product_id,coste")]);
  const stock = new Map((st ?? []).map((s) => [`${s.product_id}|${s.vid}`, s.cantidad as number]));
  const coste = new Map((cos ?? []).map((c) => [c.product_id, Number(c.coste)]));
  const cent = (v: string | undefined) => Number(v ?? 0) / 100;
  return prods.map((p) => {
    const vs = (p.variations ?? []) as any[];
    const filas = (vs.length ? vs : [{ id: 0, attributes: [] }]).map((v) => {
      const at = (n: string) => (v.attributes.find((a: any) => a.name.toLowerCase() === n)?.value ?? "") as string;
      return { vid: v.id, color: at("color") || "Único", talla: (at("talla") || "Única").toUpperCase(), stock: stock.has(`${p.id}|${v.id}`) ? stock.get(`${p.id}|${v.id}`) : null };
    });
    return { id: p.id, nombre: p.name, cat: p.categories?.[0]?.name ?? "", img: p.images?.[0]?.thumbnail || p.images?.[0]?.src || "",
      precio: cent(p.prices?.price), pvp: cent(p.prices?.regular_price), coste: coste.get(p.id) ?? null, filas };
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  try {
    const u = await quien(req);
    if (!u) return json({ ok: false, error: "sin permiso" }, 401);
    const b = await req.json().catch(() => ({}));
    if (b.accion === "catalogo") return json({ ok: true, yo: u.nombre, productos: await catalogo() });
    if (b.accion === "mover") {
      // venta/entrada: suma o resta; recuento: fija la cantidad. Se hace en la base de datos de una vez (sin carreras).
      const { data, error } = await sb.rpc("uniko_mover", { p_product: b.id, p_vid: b.vid ?? 0, p_tipo: b.tipo, p_delta: Math.round(Number(b.delta ?? 0)),
        p_cantidad: b.cantidad == null ? null : Math.round(Number(b.cantidad)), p_nombre: b.nombre ?? null, p_color: b.color ?? null, p_talla: b.talla ?? null, p_canal: b.canal ?? null, p_autor: u.nombre });
      if (error) throw new Error(error.message.includes("sin_stock") ? "No quedan tantas" : error.message);
      return json({ ok: true, ...(data as object) });
    }
    if (b.accion === "coste") {
      const c = Number(b.coste); if (!(c >= 0)) return json({ ok: false, error: "coste no válido" }, 400);
      const { error } = await sb.from("uniko_costes").upsert({ product_id: b.id, coste: c, updated_at: new Date().toISOString() });
      if (error) throw error; return json({ ok: true });
    }
    if (b.accion === "movimientos") {
      const { data, error } = await sb.from("uniko_movimientos").select("*").order("created_at", { ascending: false }).limit(300);
      if (error) throw error; return json({ ok: true, movimientos: data ?? [] });
    }
    if (b.accion === "web_hecho") { // marcar como ya cambiado en la web
      const ids = (b.ids ?? []) as string[];
      const { error } = await sb.from("uniko_movimientos").update({ web_hecho_at: new Date().toISOString() }).in("id", ids);
      if (error) throw error; return json({ ok: true });
    }
    return json({ ok: false, error: "acción desconocida" }, 400);
  } catch (e) {
    return json({ ok: false, error: String((e as Error).message ?? e) }, 500);
  }
});
