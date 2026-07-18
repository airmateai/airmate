import { createClient } from '@supabase/supabase-js';

const SB_URL = process.env.SUPABASE_URL;
const admin = createClient(SB_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Método no permitido' });

  const { id, slug } = req.query;
  if (!id || !slug) return res.status(400).json({ error: 'Faltan parámetros' });

  const { data: client } = await admin
    .from('crm_clients').select('id,name,email,phone').eq('id', id).eq('business_slug', slug).maybeSingle();
  if (!client) return res.status(404).json({ error: 'Cliente no encontrado' });

  const [{ data: orders }, { data: invoices }, { data: apptsAll }] = await Promise.all([
    admin.from('crm_orders').select('id,title,status,price,fecha_entrega').eq('business_slug', slug).eq('client_id', id).order('created_at', { ascending: false }),
    admin.from('crm_invoices').select('id,invoice_number,type,status,total,issue_date,tipo_pago,payment_token').eq('business_slug', slug).eq('client_id', id).order('issue_date', { ascending: false }),
    // appointments no tiene client_id — se enlaza por nombre de cliente.
    admin.from('appointments').select('id,service,starts_at,status,notes,client_name').eq('business_slug', slug).order('starts_at', { ascending: false }).limit(200),
  ]);
  const appts = (apptsAll || []).filter(a => (a.client_name || '').toLowerCase() === (client.name || '').toLowerCase()).slice(0, 20);

  return res.status(200).json({ client, orders: orders || [], invoices: invoices || [], appointments: appts });
}
