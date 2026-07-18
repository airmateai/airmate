import { createClient } from '@supabase/supabase-js';

const SB_URL = process.env.SUPABASE_URL;
const admin = createClient(SB_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

export const config = { api: { bodyParser: { sizeLimit: '8mb' } } };

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });

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
