# Guantanamera Core

Sistema integral de gestión para **Bar Guantanamera**, diseñado para manejar pedidos en tiempo real, control de inventario (productos/categorías), configuración del establecimiento y análisis de ventas.

## 🚀 Características Principales

- **Dashboard Administrativo**: Gestión de pedidos con vista Kanban y sistema de cocina.
- **Notificaciones en Tiempo Real**: Sistema basado en SSE (Server-Sent Events) que actualiza instantáneamente el Dashboard y la Web Pública ante cambios en pedidos, productos o configuración.
- **Gestión de Menú**: Control total sobre categorías y productos (precios, disponibilidad, nombres).
- **Configuración del Local**: Gestión de horarios semanales, estado de la tienda (abierto/cerrado), tiempos de preparación y datos de contacto.
- **Análisis de Ventas**: Reportes dinámicos de ingresos diarios, semanales y mensuales con identificación de productos top.
- **Seguridad**: Protección de rutas administrativas mediante API Key y validación de esquemas con Zod.

## 🛠️ Stack Tecnológico

- **Backend**: Node.js, Express, Prisma ORM, PostgreSQL.
- **Frontend**: Next.js 14 (App Router), Tailwind CSS, Framer Motion, Lucide Icons.
- **Documentación**: Swagger/OpenAPI.
- **Monitoreo**: Sentry integrado para reporte de errores.

## 📁 Estructura del Proyecto

- `server/`: API RESTful con arquitectura de servicios y controladores.
- `client/`: Aplicación SPA/PWA para el panel de administración.

## ⚙️ Configuración del Entorno

### Backend (Server)
1. Entrar en la carpeta: `cd server`
2. Instalar dependencias: `npm install` (o `pnpm install`)
3. Configurar variables de entorno:
   ```bash
   cp .env.example .env
   ```
   Ajustar `DATABASE_URL`, `ADMIN_API_KEY` y `SENTRY_DSN`.
4. Inicializar base de datos:
   ```bash
   npx prisma migrate dev
   npx prisma db seed
   ```
5. Ejecutar: `npm run dev` (API en `http://localhost:8000`)

### Frontend (Client)
1. Entrar en la carpeta: `cd client`
2. Instalar dependencias: `npm install`
3. Configurar variables de entorno:
   ```bash
   cp .env.example .env.local
   ```
   Ajustar `NEXT_PUBLIC_API_URL` y `NEXT_PUBLIC_API_KEY`.
4. Ejecutar: `npm run dev` (Dashboard en `http://localhost:3000`)

## 🐳 Docker (Recomendado)

El proyecto incluye soporte para Docker Compose para levantar todo el stack (DB + API + Client):

```bash
docker-compose up --build
```

## 📖 Documentación de la API

La documentación interactiva de Swagger está disponible en:
`http://localhost:8000/docs`

Incluye detalles sobre:
- **Pedidos**: Creación, filtrado, paginación y cambio de estado.
- **Productos/Categorías**: CRUD completo con protección de API Key.
- **Notificaciones**: Suscripción SSE para eventos en tiempo real.
- **Ajustes**: Configuración pública y privada del sistema.

## 🔗 Integración con Web Pública

Para integrar la web pública con este núcleo, se recomienda usar el patrón de **Server-Sent Events** proporcionado por el endpoint `/notifications`. Esto permite que la web reaccione instantáneamente a:
- `SETTINGS_UPDATED`: Cambios en el horario o cierre forzado.
- `PRODUCTS_UPDATED`: Cambios en precios o disponibilidad de platos.

---
© 2026 Bar Guantanamera. Todos los derechos reservados.
