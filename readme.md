# Kartera – Full Stack

```text
kartera@local:~$ Kartera es una app sencilla para organizar gastos, ingresos y el estado de tus tarjetas.
kartera@local:~$ Captura, categoriza y revisa tu mes con una vista clara y rapida.


$$\   $$\                     $$\                                  
$$ | $$  |                    $$ |                                 
$$ |$$  / $$$$$$\   $$$$$$\ $$$$$$\    $$$$$$\   $$$$$$\  $$$$$$\  
$$$$$  /  \____$$\ $$  __$$\\_$$  _|  $$  __$$\ $$  __$$\ \____$$\ 
$$  $$<   $$$$$$$ |$$ |  \__| $$ |    $$$$$$$$ |$$ |  \__|$$$$$$$ |
$$ |\$$\ $$  __$$ |$$ |       $$ |$$\ $$   ____|$$ |     $$  __$$ |
$$ | \$$\\$$$$$$$ |$$ |       \$$$$  |\$$$$$$$\ $$ |     \$$$$$$$ |
\__|  \__|\_______|\__|        \____/  \_______|\__|      \_______|
.
.
.
.
.
.
.

by @joslu
```

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
- Los **métodos de pago** son dinámicos (cash, débito, crédito).
- Las **tarjetas de crédito** tienen corte y periodo de pago.
- Los **ingresos** se asignan a una cuenta (cash o débito).

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

## ▶️ Quick Start

```bash
# 1) Infraestructura
cd infra
docker compose up -d

# 2) Backend
cd ../backend
npm install
npx prisma migrate deploy
npx prisma generate
npx prisma db seed
npm run dev

# 3) UI
cd ../ui
npm install
npm run dev
```

UI por defecto en `http://localhost:5173`

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
npx prisma migrate deploy
npx prisma generate
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
- **Filtro por método de pago**

### Settings
- Crear nuevas categorías
- Crear nuevos grupos
- Ver categorías por grupo
- Eliminar categorías (modo borrar)
- Eliminar grupos (modo borrar)
- Crear y eliminar meses completos
- Lista de grupos existentes
- Métodos de pago (crear / activar / eliminar)
- Tarjetas de crédito (corte + dias despues + categoría de pago)

### About
- Pantalla informativa del producto (estilo terminal)

### Tarjetas
- Estado de deuda por ciclo (actual/anterior)
- Indicador de periodo de pago
- Detalle de gastos y pagos del ciclo
- Cuentas débito con saldo (ingresos - gastos)

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

GET    /payment-methods
POST   /payment-methods
PATCH  /payment-methods/:id
DELETE /payment-methods/:id
GET    /payment-methods/balances

GET    /credit-cards
POST   /credit-cards
PATCH  /credit-cards/:id
DELETE /credit-cards/:id
GET    /credit-cards/summary
GET    /credit-cards/:id/cycle

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
- Tarjetas de crédito con ciclos y deuda
- Saldos por cuenta (cash/debito)
- Presupuestos por grupo y metas
- Reportes (tendencias, comparativas)
- Importación de CSV/OFX
- UI móvil

---

## 🧪 Notas

- El proyecto usa **CommonJS** por simplicidad.
- Seed crea categorías base y grupos iniciales.
- “No identificado” es obligatorio para el flujo inbox.
