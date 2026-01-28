# Guía rápida para navegar y cambiar estilos

Este archivo explica **dónde tocar** cuando quieras modificar el UI/estilos o navegar el proyecto.

---

## 🧭 Estructura general

```
repo/
├── backend/            # API + Prisma
├── ui/                 # Dashboard web
└── infra/              # Docker Compose (Postgres)
```

### Backend (API)
- Rutas: `backend/src/routes/`
- Prisma schema: `backend/prisma/schema.prisma`
- Seed: `backend/prisma/seed.ts`

### UI (Dashboard)
- Entrada: `ui/src/App.tsx`
- Páginas: `ui/src/pages/`
  - `inbox/` → Inbox “No identificado”
  - `budgets/` → Presupuesto
  - `transactions/` → Transacciones
  - `settings/` → Settings
  - `about/` → About
- Componentes reutilizables: `ui/src/components/`
- Utils (formatos, helpers): `ui/src/utils/`
- Estilos base: `ui/src/index.css`

---

## 🎨 Cambios de estilo

### 1) Estilos globales
- Archivo: `ui/src/index.css`
- Aquí puedes agregar estilos base o variables.

### 2) Estilos por componente
- La mayoría del UI usa **Tailwind** directamente en los JSX.
- Busca el componente/página y ajusta clases.

Ejemplo:
- Header y navegación → `ui/src/App.tsx`
- Cards y layout → `ui/src/components/Card.tsx`

### 3) Colores / look general
- Ajusta clases Tailwind en:
  - `ui/src/App.tsx`
  - `ui/src/pages/*`

---

## 🧭 Navegación (actual)

La navegación usa **React Router** con rutas reales:
- `/inbox`
- `/summary`
- `/budgets`
- `/transactions`
- `/settings`
- `/about`

Se controla en: `ui/src/App.tsx` y el router se monta en `ui/src/main.tsx`

### ¿Es la mejor forma?
Sí, es más flexible y soporta deep links. Para producción, asegurate de servir
`index.html` en cualquier ruta (SPA fallback).

---

## ✅ Tips rápidos

- Cambiar textos: busca en `ui/src/pages/`.
- Cambiar botones: revisa `ui/src/components/` o el JSX directo.
- Cambiar formatos (moneda, fechas): `ui/src/utils/format.ts`
- Agregar páginas nuevas: crea en `ui/src/pages/` y enlaza en `ui/src/App.tsx`.
- Agregar/eliminar grupos: `Settings` en `ui/src/pages/settings/Settings.tsx`.

---

## ✅ Versiones

- v0.1.0-beta (2026-01-28)
  - React Router con rutas reales
  - Gestión de grupos de categorías (crear/eliminar)
  - Settings mejorado + About en pages/
