# NR STORE · Paquete de actualización (Fases 5, 6 y 7)

Contenido: dashboard, ventas (web + manuales), stock, cálculo de envío por CP,
checkout con Mercado Pago (Checkout Pro) y webhook. Más el arreglo del filtro del catálogo.

## 1. Copiar archivos
Descomprimí este zip DENTRO de la carpeta del proyecto (la que tiene package.json) y aceptá
"reemplazar" cuando pregunte. Son archivos nuevos, más estos que reemplazan a los tuyos:
  - tsconfig.json
  - src/components/shop/CatalogFilters.tsx
  - src/app/(admin)/admin/(panel)/layout.tsx
  - src/app/(admin)/admin/(panel)/page.tsx

## 2. Base de datos
Supabase → SQL Editor → pegar el contenido de supabase/fase5-7.sql → Run.

## 3. Variables de entorno (en .env.local Y en Vercel → Settings → Environment Variables)
NEXT_PUBLIC_SITE_URL=https://nr-store.vercel.app
SUPABASE_SERVICE_ROLE_KEY=...   (Supabase → Project Settings → API → service_role / secret key)
MP_ACCESS_TOKEN=...             (Mercado Pago Developers → tu aplicación → Credenciales de prueba, luego producción)
MP_WEBHOOK_SECRET=...           (se obtiene en el paso 4)
Opcional: SHIPPING_PROVIDER=mock

## 4. Webhook de Mercado Pago
mercadopago.com.ar/developers → tu aplicación → Webhooks → Configurar notificaciones
  URL: https://nr-store.vercel.app/api/webhooks/mercadopago
  Evento: Pagos
Copiá la "clave secreta" que te da y pegala en MP_WEBHOOK_SECRET. Después hacé Redeploy en Vercel.

## 5. Probar y subir
npm run dev  →  probá /admin, /admin/ventas/nueva, /admin/stock y el flujo /carrito → /checkout
git add . && git commit -m "Fases 5-7" && git push
