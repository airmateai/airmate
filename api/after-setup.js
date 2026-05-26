// Redirige al cliente tras el pago de setup y abre el link de mensualidad
export default function handler(req, res) {
  const { plan } = req.query;

  const MAINTENANCE_LINKS = {
    start:  'https://buy.stripe.com/6oU28r31535O3MO3vH2Ry05',
    growth: 'https://buy.stripe.com/dRmbJ1315ayg4QSd6h2Ry04',
    pro:    'https://buy.stripe.com/fZubJ17hl21K5UW4zL2Ry06',
  };

  const maintenanceLink = MAINTENANCE_LINKS[plan];
  if (!maintenanceLink) {
    return res.redirect('https://airmate.es/?setup_ok=1');
  }

  // Redirige a airmate.es con parámetros que el JS del frontend detecta
  // El frontend abre el link de mensualidad automáticamente
  res.redirect(`https://airmate.es/?setup_ok=${plan}&pay=${encodeURIComponent(maintenanceLink)}`);
}
