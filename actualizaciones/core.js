/* Airmate · núcleo común de los módulos CRM.
   Cada módulo recibe { sb, slug } : con `sb` (cliente de Supabase) escribe en la base del panel;
   sin `sb` usa localStorage (modo demo). Todas las filas llevan business_slug, como el resto de paneles. */
(function (w) {
  const AM = w.AirmateMod = w.AirmateMod || {};

  AM.esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  AM.eur = n => (Number(n) || 0).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' });
  AM.uid = () => (crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2));
  AM.hoy = () => new Date().toLocaleDateString('sv-SE'); // fecha local AAAA-MM-DD
  AM.diaLocal = d => new Date(d).toLocaleDateString('sv-SE');
  AM.toast = (msg) => {
    if (typeof w.toast === 'function') return w.toast(msg);
    let t = document.getElementById('am-toast');
    if (!t) { t = document.createElement('div'); t.id = 'am-toast'; t.style.cssText = 'position:fixed;left:50%;bottom:24px;transform:translateX(-50%);background:#141416;color:#fff;padding:12px 18px;border-radius:12px;font:600 14px system-ui;z-index:9999;box-shadow:0 10px 30px rgba(0,0,0,.25);transition:opacity .3s'; document.body.appendChild(t); }
    t.textContent = msg; t.style.opacity = '1'; clearTimeout(t._h); t._h = setTimeout(() => t.style.opacity = '0', 2600);
  };

  /* Almacén: misma interfaz para Supabase y localStorage. Siempre filtra por business_slug. */
  AM.store = function ({ sb, slug }) {
    const key = t => `am_${slug}_${t}`;
    const lsGet = t => { try { return JSON.parse(localStorage.getItem(key(t)) || '[]'); } catch (e) { return []; } };
    const lsSet = (t, rows) => { try { localStorage.setItem(key(t), JSON.stringify(rows)); } catch (e) { } };
    return {
      async list(t, { order = 'created_at', asc = false, filtro = {} } = {}) {
        if (sb) {
          let q = sb.from(t).select('*').eq('business_slug', slug);
          Object.entries(filtro).forEach(([k, v]) => q = q.eq(k, v));
          const { data, error } = await q.order(order, { ascending: asc });
          if (error) throw new Error(error.message);
          return data || [];
        }
        let rows = lsGet(t).filter(r => Object.entries(filtro).every(([k, v]) => r[k] === v));
        rows.sort((a, b) => (a[order] > b[order] ? 1 : -1) * (asc ? 1 : -1));
        return rows;
      },
      async insert(t, fila) {
        const row = { id: AM.uid(), created_at: new Date().toISOString(), ...fila, business_slug: slug };
        if (sb) {
          const { data, error } = await sb.from(t).insert(row).select('*');
          if (error || !data?.length) throw new Error(error?.message || 'sin permiso');
          return data[0];
        }
        const rows = lsGet(t); rows.push(row); lsSet(t, rows); return row;
      },
      async update(t, id, cambios) {
        if (sb) {
          const { data, error } = await sb.from(t).update(cambios).eq('id', id).eq('business_slug', slug).select('*');
          if (error || !data?.length) throw new Error(error?.message || 'sin permiso');
          return data[0];
        }
        const rows = lsGet(t); const r = rows.find(x => x.id === id); if (!r) throw new Error('no encontrado');
        Object.assign(r, cambios); lsSet(t, rows); return r;
      },
      async remove(t, id) {
        if (sb) {
          const { data, error } = await sb.from(t).delete().eq('id', id).eq('business_slug', slug).select('id');
          if (error || !data?.length) throw new Error(error?.message || 'sin permiso');
          return true;
        }
        lsSet(t, lsGet(t).filter(x => x.id !== id)); return true;
      },
    };
  };

  /* Descarga un CSV (separador ; para Excel en español) */
  AM.csv = (nombre, cabecera, filas) => {
    const q = v => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const txt = '﻿' + [cabecera, ...filas].map(r => r.map(q).join(';')).join('\n');
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([txt], { type: 'text/csv;charset=utf-8' })); a.download = nombre; a.click();
  };

  /* Imprime un bloque HTML en una ventana limpia (para PDF con «Guardar como PDF») */
  AM.imprimir = (titulo, html) => {
    const v = w.open('', '_blank'); if (!v) { AM.toast('Permite las ventanas emergentes para imprimir'); return; }
    v.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${AM.esc(titulo)}</title><style>
      body{font:13px/1.45 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:#111;margin:32px}
      h1{font-size:20px;margin:0 0 4px}h2{font-size:15px;margin:22px 0 6px}
      table{width:100%;border-collapse:collapse;margin-top:8px}th,td{border:1px solid #ccc;padding:6px 8px;text-align:left}th{background:#f2f2f2}
      .muted{color:#666}.firma{margin-top:40px;display:flex;gap:60px}.firma div{flex:1;border-top:1px solid #333;padding-top:6px}
      @media print{button{display:none}}</style></head><body>${html}<script>setTimeout(()=>print(),300)<\/script></body></html>`);
    v.document.close();
  };

  /* Estilos base de los módulos (heredan las variables del panel si existen) */
  AM.css = (id, css) => { if (document.getElementById(id)) return; const s = document.createElement('style'); s.id = id; s.textContent = css; document.head.appendChild(s); };
  AM.css('am-base', `
    .am{font-family:var(--font-sans,system-ui,-apple-system,Segoe UI,Roboto,sans-serif);color:var(--txt,#141416)}
    .am-card{background:var(--surface,#fff);border:1px solid var(--border,#e6e1d8);border-radius:14px;padding:18px;margin-bottom:14px}
    .am-row{display:flex;gap:10px;align-items:center;flex-wrap:wrap}
    .am-btn{border:1px solid var(--border,#e6e1d8);background:var(--surface,#fff);color:var(--txt,#141416);border-radius:10px;padding:9px 14px;font-weight:700;font-size:13px;cursor:pointer}
    .am-btn.pri{background:var(--accent,#0F7B4C);border-color:var(--accent,#0F7B4C);color:#fff}
    .am-btn.dan{color:#b3441e;border-color:#e8c4b8}
    .am-in{border:1px solid var(--border,#e6e1d8);background:var(--surface,#fff);color:var(--txt,#141416);border-radius:9px;padding:9px 11px;font-size:13px}
    .am-t{width:100%;border-collapse:collapse;font-size:13px}.am-t th,.am-t td{padding:8px 10px;border-bottom:1px solid var(--border2,#f0ece4);text-align:left}
    .am-t th{font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:var(--txt3,#8a857c)}
    .am-tag{display:inline-block;padding:3px 9px;border-radius:999px;font-size:11px;font-weight:800}
    .am-ok{background:#E3F1E8;color:#0F7B4C}.am-pen{background:#FDF0DC;color:#9A6A00}.am-ko{background:#FBEAE4;color:#b3441e}
    .am-h{font-size:12px;letter-spacing:.1em;text-transform:uppercase;color:var(--txt3,#8a857c);font-weight:800;margin:0 0 10px}
    .am-big{font-size:42px;font-weight:900;letter-spacing:-.03em}
  `);
})(window);
