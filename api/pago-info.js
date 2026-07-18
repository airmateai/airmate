import { createClient } from '@supabase/supabase-js';

const SB_URL = process.env.SUPABASE_URL;
const admin = createClient(SB_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Método no permitido' });

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
