import { createClient } from '@supabase/supabase-js';

const SB_URL = process.env.SUPABASE_URL;
const admin = createClient(SB_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

export const config = { api: { bodyParser: { sizeLimit: '8mb' } } };

async function pagoInfo(req, res) {
  const { token } = req.query;
  if (!token) return res.status(400).json({ error: 'token requerido' });

  const { data: inv, error } = await admin
    .from('crm_invoices')
    .select('id,invoice_number,type,client_name,total,tipo_pago,status,payment_status,business_slug')
    .eq('payment_token', token)
    .maybeSingle();
  if (error || !inv) return res.status(404).json({ error: 'Factura no encontrada' });

  const { data: biz } = await admin
    .from('bot_configs')
    .select('bot_name,biz_info')
    .eq('slug', inv.business_slug)
    .maybeSingle();

  return res.status(200).json({
    invoice_number: inv.invoice_number,
    type: inv.type,
    client_name: inv.client_name,
    total: inv.total,
    tipo_pago: inv.tipo_pago,
    status: inv.status,
    payment_status: inv.payment_status,
    biz_name: biz?.bot_name || '',
    iban: biz?.biz_info?.iban || null,
  });
}

async function pagoComprobante(req, res) {
  const { token, fileBase64, fileType, fileExt } = req.body || {};
  if (!token || !fileBase64) return res.status(400).json({ error: 'Faltan datos' });

  const { data: inv, error: findErr } = await admin
    .from('crm_invoices')
    .select('id,business_slug')
    .eq('payment_token', token)
    .maybeSingle();
  if (findErr || !inv) return res.status(404).json({ error: 'Factura no encontrada' });

  try {
    const buffer = Buffer.from(fileBase64, 'base64');
    const filename = `${inv.business_slug}/${inv.id}-${Date.now()}.${fileExt || 'jpg'}`;
    const { error: upErr } = await admin.storage
      .from('JUSTIFICANTES')
      .upload(filename, buffer, { contentType: fileType || 'image/jpeg', upsert: true });
    if (upErr) throw upErr;

    const publicUrl = `${SB_URL}/storage/v1/object/public/JUSTIFICANTES/${filename}`;
    const { error: updErr } = await admin
      .from('crm_invoices')
      .update({ receipt_url: publicUrl, payment_status: 'uploaded' })
      .eq('id', inv.id);
    if (updErr) throw updErr;

    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: 'Error al subir: ' + (e.message || e) });
  }
}

async function clientePortal(req, res) {
  const { id, slug } = req.query;
  if (!id || !slug) return res.status(400).json({ error: 'Faltan parámetros' });

  const { data: client } = await admin
    .from('crm_clients').select('id,name,email,phone').eq('id', id).eq('business_slug', slug).maybeSingle();
  if (!client) return res.status(404).json({ error: 'Cliente no encontrado' });

  const [{ data: orders }, { data: invoices }, { data: apptsAll }] = await Promise.all([
    admin.from('crm_orders').select('id,title,status,price,fecha_entrega').eq('business_slug', slug).eq('client_id', id).order('created_at', { ascending: false }),
    admin.from('crm_invoices').select('id,invoice_number,type,status,total,issue_date,tipo_pago,payment_token').eq('business_slug', slug).eq('client_id', id).order('issue_date', { ascending: false }),
    admin.from('appointments').select('id,service,starts_at,status,notes,client_name').eq('business_slug', slug).order('starts_at', { ascending: false }).limit(200),
  ]);
  const appts = (apptsAll || []).filter(a => (a.client_name || '').toLowerCase() === (client.name || '').toLowerCase()).slice(0, 20);

  return res.status(200).json({ client, orders: orders || [], invoices: invoices || [], appointments: appts });
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { action } = req.query;
  if (action === 'pago-info' && req.method === 'GET') return pagoInfo(req, res);
  if (action === 'pago-comprobante' && req.method === 'POST') return pagoComprobante(req, res);
  if (action === 'cliente-portal' && req.method === 'GET') return clientePortal(req, res);
  return res.status(400).json({ error: 'Acción no válida' });
}
