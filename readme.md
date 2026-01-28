# Budget MVP – Full Stack

App de finanzas personales basada en **presupuesto mensual**, inspirada en YNAB pero con un enfoque **minimalista y educativo**.

Este repo contiene:
- **Backend** (API) en Node.js + Fastify + Prisma + PostgreSQL
- **UI** (dashboard web) en Vite + React + Tailwind

---

## 🎯 Objetivo

Construir un sistema simple para:
- Registrar **ingresos**
- Registrar **transacciones** (gastos y movimientos)
- Asignar **presupuesto por categoría**
- Limpiar transacciones **“No identificado”** desde un inbox
- Ver un **resumen mensual** claro

Sin autenticación (single user local) por ahora.

---

## 🧠 Reglas de negocio

- El **mes** es el contenedor principal.
- Un gasto pertenece al **mes en el que ocurre** (según `date`).
- Todas las transacciones tienen `amount` **positivo**.
- El impacto depende de la categoría:
  - `EXPENSE` → consume presupuesto
  - `TRACKING` → solo se rastrea (pagos, transferencias, retiros)
- **“No identificado”** es una categoría temporal.
- El **pago de TDC es una categoría**, no un gasto nuevo.
- `date` = fecha contable
- `createdAt` = cuándo se registró

---

## 🏗️ Arquitectura

```
repo/
├── backend/            # API + Prisma
├── ui/                 # Dashboard web
└── infra/              # Docker Compose (Postgres)
```

### Backend
- Fastify + TypeScript
- Prisma ORM
- PostgreSQL
- Rutas organizadas por módulo (months, incomes, assignments, transactions, summary, categories)

### UI
- React + Vite
- Tailwind CSS
- React Router (rutas reales: /inbox, /summary, /budgets, /transactions, /settings, /about)

---

## 🗄️ Base de datos

PostgreSQL en Docker.

**Credenciales locales**:
- Host: `localhost`
- Port: `5432`
- Database: `budget`
- User: `budget`
- Password: `budget`

Connection string:
```
postgresql://budget:budget@localhost:5432/budget
```

---

## ▶️ Cómo correr el proyecto

### 1) Infraestructura
```bash
cd infra
docker compose up -d
```

### 2) Backend
```bash
cd backend
npm install
npm run dev
```

### 3) Migraciones + seed
```bash
npx prisma migrate dev
npx prisma db seed
```

### 4) UI
```bash
cd ui
npm install
npm run dev
```

UI por defecto en `http://localhost:5173`

---

## ✅ Lo que está construido

### Inbox (No identificado)
- Lista transacciones sin categoría
- Recategorización rápida
- Resumen del mes (ingresos, gastos, net, no identificado)
- Donut: **No identificado vs categorizado**
- Crear ingreso y gasto desde modal

### Presupuesto
- Asignación por categoría (POST /budget-assignments)
- Tabla con asignado, gastado, disponible
- Gráfico: **Asignado vs Gastado por grupo**

### Transacciones
- Tabla completa del mes (gastos + ingresos)
- **Editar** por fila:
  - Gastos: fecha + categoría
  - Ingresos: fecha + monto
- **Eliminar** ingresos y gastos

### Settings
- Crear nuevas categorías
- Crear nuevos grupos
- Ver categorías por grupo
- Eliminar categorías (modo borrar)
- Eliminar grupos (modo borrar)
- Crear y eliminar meses completos
- Lista de grupos existentes

### About
- Pantalla informativa del producto

---

## 🌐 Endpoints principales

```
GET    /health
GET    /months
POST   /months
DELETE /months/:id

GET    /categories
POST   /categories
DELETE /categories/:id
GET    /category-groups
POST   /category-groups
DELETE /category-groups/:id

GET    /months/:monthId/summary
GET    /months/:monthId/unidentified
GET    /months/:monthId/transactions
GET    /months/:monthId/incomes
GET    /months/:monthId/assignments

POST   /incomes
PATCH  /incomes/:id
DELETE /incomes/:id

POST   /transactions
PATCH  /transactions/:id
DELETE /transactions/:id

POST   /budget-assignments
```

---

## 🧩 Cómo funciona el flujo

1) Se crea el mes (year/month)
2) Se registran ingresos
3) Se registran transacciones (algunas quedan “No identificado”)
4) En Inbox se recategoriza
5) En Presupuesto se asigna por categoría
6) En Transacciones se revisa y corrige

---

## 🔜 Mejoras posibles (resumen)

Ver `future.md` para más detalle.

- Multiusuario (sesiones, auth, multi-tenant)
- Métodos de pago dinámicos (tabla en DB)
- Presupuestos por grupo y metas
- Reportes (tendencias, comparativas)
- Importación de CSV/OFX
- UI móvil

---

## 🧪 Notas

- El proyecto usa **CommonJS** por simplicidad.
- Seed crea categorías base y grupos iniciales.
- “No identificado” es obligatorio para el flujo inbox.
