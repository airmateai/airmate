# CLAUDE.md — Airmate · Contexto completo del proyecto

> Lee esto al inicio de cada sesión. Contiene todo lo necesario para trabajar sin preguntar.

---

## 1. QUÉ ES AIRMATE

Airmate es una agencia/producto SaaS de Fabio Bueno que ofrece a negocios locales:
- **Agente IA** (chatbot con reservas automáticas 24/7)
- **Panel CRM** (gestión de citas, leads, clientes, encargos, stock, facturas)
- **Landing pages** personalizadas

**Email de Fabio:** airmateai@gmail.com  
**Web pública:** https://airmate.es (= https://airmateai.github.io/airmate)  
**Repo GitHub:** https://github.com/airmateai/airmate  
**Directorio local:** `/Users/fabiobuenogalarza/Desktop/airmate`

---

## 2. INFRAESTRUCTURA Y APIs

### Supabase (base de datos + realtime)
- **URL:** `https://vjofxmfwdybktpwiuanc.supabase.co`
- **Anon key:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZqb2Z4bWZ3ZHlia3Rwd2l1YW5jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ0NzU5NDYsImV4cCI6MjA5MDA1MTk0Nn0.ixU-33c0FEkO7F5xjWb3YHkvj_pQuR0gsJETrGA8ZTE`
- **Service role key** (solo en index.html admin): `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZqb2Z4bWZ3ZHlia3Rwd2l1YW5jIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDQ3NTk0NiwiZXhwIjoyMDkwMDUxOTQ2fQ.08g-CtdJ0BvgE3U4v9JppA_114EN24KBs7iBpUaw9cs`

### Tablas Supabase principales
| Tabla | Uso |
|-------|-----|
| `bot_configs` | Config por cliente (slug, bot_name, password_hash, schedule, owner_email) |
| `clients` | Clientes de Airmate (email, password en texto plano — login panel.html) |
| `appointments` | Citas. Filtrar siempre por `business_slug` |
| `leads` | Leads. Filtrar siempre por `business_slug` |
| `crm_clients` | Clientes del CRM (barbería, etc.) |
| `crm_orders` | Encargos/pedidos CRM |
| `crm_inventory` | Stock/inventario CRM |
| `crm_invoices` | Facturas CRM |
| `web_requests` | Solicitudes de presupuesto desde index.html |

### Chat / IA proxy
- **Vercel:** `https://bot-airmate-1.vercel.app/api/chat`
- Modelo: `gpt-4o-mini` via OpenAI API
- `OPENAI_API_KEY` en variables de entorno de Vercel (no en código)

### EmailJS (confirmaciones de cita)
- **Public Key:** `i4iBVVP-BkUOOwBE9`
- **Service ID:** `service_npmjvvf`
- **Template ID:** `template_qnip0mc`

### GitHub Pages (deploy)
- Push a `main` en `github.com/airmateai/airmate` → publicado en `airmate.es`
- El deploy es automático, no hay CI/CD extra
- Token GitHub guardado en memoria: ver `airmateapis.md`

---

## 3. ARCHIVOS DEL REPO AIRMATE (`/Desktop/airmate`)

| Archivo | Qué es |
|---------|--------|
| `index.html` | Landing page principal de Airmate (con demo agente + admin panel para Fabio) |
| `panel.html` | Panel CRM genérico multi-cliente (login via Supabase `clients` table) |
| `airmate-widget.js` | Widget embebible para clientes — se carga con `<script src="...airmate-widget.js?slug=X">` |
| `configurador.html` | Herramienta interna para configurar nuevos clientes |
| `admin.html` | Panel admin de Fabio |
| `crm.html` | CRM standalone |
| `cancel.html` | Página de cancelación de cita (recibe `?id=UUID`) |
| `custom-work.html` | Landing page de Ricardo Plasencia — Barbería Custom Work |
| `demo-maestro.html` | Landing page de El Maestro Eduardo Enrique (tarotista, Tenerife) |
| `jose-acosta-panel.html` | Panel VIEJO de Jose Acosta — NO usar, está en el repo por error |
| `jose-acosta.html` | Landing page pública de Jose Acosta |
| `panel-maestro.html` | Panel del Maestro Eduardo Enrique |
| `api/chat.js` | Serverless function (Vercel) — proxy OpenAI |
| `api/appointments.js` | Serverless function — slots y booking |
| `api/stripe-webhook.js` | Webhook Stripe (pagos) |
| `scripts/send-reminders.js` | Script cron recordatorios |
| `PRODUCT.md` | Brief de marca del Maestro Eduardo Enrique |

---

## 4. ARCHIVOS FUERA DEL REPO

### Jose Acosta (panel real)
- **Ruta:** `/Users/fabiobuenogalarza/Desktop/Jose Acosta/panel-pro.html`
- **NO está en el repo de GitHub** — se entrega como archivo directamente
- **Slug:** `jose-acosta`
- **Login:** entra con el slug `jose-acosta` + contraseña guardada en `bot_configs.password_hash`
- **Auth:** lee `bot_configs` de Supabase con SHA-256 del password
- **Tablas que usa:** `appointments`, `leads`, `crm_clients`, `crm_orders`, `crm_inventory`, `crm_invoices` (todas filtradas por `business_slug='jose-acosta'`)
- **También tiene:** `ja_clientes`, `ja_productos`, `ja_encargos`, `ja_facturas` (tablas propias del SQL setup)

### Otros archivos Jose Acosta
| Archivo | Qué es |
|---------|--------|
| `configurador.html` | Herramienta configuración |
| `demo-jose-acosta.html` | Demo pública |
| `migrar_holded.js` | Script migración datos desde Holded |
| `setup_tablas.sql` | SQL para crear tablas `ja_*` en Supabase |
| `ornament.webp` | Asset decorativo |

### Airmate Clientes (`/Desktop/Airmate Clientes`)
Carpeta con plantillas y guías operativas:
- `PLANTILLA-agente.html` — plantilla base para nuevos agentes IA
- `PLANTILLA-panel.html` — plantilla base para nuevos paneles
- `GUIA_NUEVO_CLIENTE.md` — checklist onboarding paso a paso
- `PRECIOS-CRM.md` — plantilla de presupuesto
- `1_TARIFAS/` — contrato cliente + pricing completo
- `2_PLANES/` — prompts por plan (START, GROWTH, PRO)
- `3_SISTEMA_CITAS/` — prompt panel citas + SQL seguridad
- `4_SISTEMA_LEADS/` — prompt leads + SQL
- `5_DEMOS/` — demos (peluqueria-ana.html)

---

## 5. CLIENTES ACTIVOS

### Jose Acosta — Sastrería / Trajes a medida
- **Slug:** `jose-acosta`
- **Panel:** `/Desktop/Jose Acosta/panel-pro.html` (archivo local, NO en repo)
- **Negocio:** trajes a medida en Tenerife
- **Funcionalidades panel:** Citas (semana/mes), Leads (pipeline kanban), Clientes (medidas), Encargos (Kanban), Stock/Inventario, Facturación, Contabilidad, Finanzas, TPV
- **IMPORTANTE:** Los números en Facturación, Compras, Contabilidad y Finanzas están ocultados con `—` (Jose no debe ver datos financieros reales). TPV y Encargos sí muestran precios.
- **Realtime activo:** Supabase Realtime + notificaciones Web Audio API
- **Pendiente:** Integración Verifactu/Hacienda — Jose está configurando su cuenta en verifactuapi.es para obtener las credenciales API de su negocio

### Ricardo Plasencia — Custom Work (Barbería)
- **Slug:** `custom-work`
- **Landing:** `airmate.es/custom-work.html`
- **Email:** Ricardoquesadaplasencia@gmail.com
- **Social:** @ricardocustomwork (19k seguidores)
- **Booksy:** https://booksy.com/es-es/138264_custom-work_barberia_70903_los-andenes
- **TODOs pendientes:** 3 (ver memoria `cliente_customwork.md`)

### El Maestro Eduardo Enrique — Tarotista / Tenerife
- **Landing:** `airmate.es/demo-maestro.html`
- **Panel:** `airmate.es/panel-maestro.html`
- **WhatsApp:** +34687554784 | **Tel:** 922983652
- **Email:** puertosol16@gmail.com
- **Dirección:** Av. Ángel Guimerá 24, Santa Cruz de Tenerife
- **Identidad visual:** negro (#03020a), dorado (#c9a050), Cinzel Decorativa + Cormorant Garamond
- **Audiencia:** personas 25–60 desde TikTok y Facebook, llegan en móvil
- **La landing está adaptada a móvil** (media queries en el `<style>`)

---

## 6. PLANES Y PRECIOS AIRMATE

| Plan | Setup | Mensual |
|------|-------|---------|
| START | ~397€ | ~49€ |
| GROWTH | ~597€ | ~79€ |
| PRO / Custom | ~997€+ | ~99€+ |

Coste real OpenAI: ~5–15€/mes por cliente. Margen mínimo setup: 300€.

---

## 7. FLUJO TÉCNICO — CÓMO FUNCIONA UN CLIENTE

1. **Widget en su web:** `<script src="https://airmate.es/airmate-widget.js?slug=SLUG">`
2. El widget lee `bot_configs` de Supabase → carga config (servicios, horario, prompt IA)
3. Usuario chatea → proxy Vercel → OpenAI gpt-4o-mini → responde
4. Si reserva: crea fila en `appointments` + email via EmailJS
5. El cliente ve su cita en panel.html (o panel-pro.html si es custom)
6. Leads se guardan en tabla `leads`

---

## 8. CÓMO HACER DEPLOY

```bash
cd /Users/fabiobuenogalarza/Desktop/airmate
git add <archivos>
git commit -m "descripción"
git push
# Publicado en airmate.es en ~30 segundos
```

---

## 9. PENDIENTES GLOBALES

- [ ] **Jose Acosta — Verifactu:** Esperar credenciales API de verifactuapi.es para integrar facturación electrónica a Hacienda en panel-pro.html
- [ ] **Custom Work — Ricardo:** 3 TODOs pendientes (ver memoria)
- [ ] **WhatsApp Business API** — en roadmap (ver memoria `project_roadmap.md`)
- [ ] **Llamadas de voz IA** — en roadmap

---

## 10. CONVENCIONES DE CÓDIGO

- Todo en un solo HTML (CSS + JS inline) — sin frameworks, sin bundlers
- Supabase JS via CDN: `@supabase/supabase-js@2`
- EmailJS via CDN: `@emailjs/browser@4`
- Siempre filtrar queries por `business_slug` para aislar datos por cliente
- `crmFmt(n)` = formatear número como moneda EUR española
- `esc(str)` = escapar HTML
- Realtime con `_sb.channel().on('postgres_changes', ...)` + `.subscribe()`
- Notificaciones: `notificar(msg)` = toast + Web Audio API + Notification API

---

*Actualizado: 2026-05-10*
