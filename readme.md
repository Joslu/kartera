# Budget MVP – Backend

Backend MVP para una app de **finanzas personales basada en presupuesto mensual**, inspirada en YNAB pero con un enfoque **minimalista y educativo**.

Este proyecto está construido como un **proyecto de aprendizaje continuo**, priorizando claridad, reglas de negocio explícitas y código ejecutable.

---

## 🎯 Objetivo

Proveer un backend que permita:

* Usar el **mes** como unidad principal
* Registrar **ingresos**
* Asignar **presupuesto por categoría**
* Registrar **transacciones** (gastos y movimientos)
* Re-categorizar transacciones
* Obtener un **resumen mensual** claro y confiable

> Sin autenticación (single user, local).

---

## 🧠 Reglas de negocio

* El **mes** es el contenedor principal del sistema.
* Un gasto pertenece al **mes donde ocurre** (según `date`).
* Todas las transacciones tienen `amount` **positivo**.
* El impacto lo define la categoría:

  * `EXPENSE` → consume presupuesto
  * `TRACKING` → solo se rastrea (pagos, transferencias, retiros)
* **“No identificado”** es una categoría temporal.
* El **pago de TDC es una categoría**, no un gasto nuevo.
* `date` = fecha contable
* `createdAt` = cuándo se registró la transacción

---

## 🏗️ Stack técnico

* Node.js + TypeScript
* Fastify
* Prisma ORM
* PostgreSQL
* Docker Compose
* DBeaver (cliente DB)
* npm (package manager)

Decisión explícita: **CommonJS (sin ESM)** para reducir complejidad.

---

## 🐳 Infraestructura local

PostgreSQL corre en Docker.

**Credenciales locales:**

* Host: `localhost`
* Port: `5432`
* Database: `budget`
* User: `budget`
* Password: `budget`

Connection string:

```
postgresql://budget:budget@localhost:5432/budget
```

---

## 📁 Estructura del proyecto

```
budget-mvp-backend/
├── README.md
├── .gitignore
├── infra/
│   └── docker-compose.yml
└── backend/
    ├── package.json
    ├── tsconfig.json
    ├── .env            # NO versionado
    ├── prisma/
    │   ├── schema.prisma
    │   ├── seed.ts
    │   └── migrations/
    └── src/
        ├── server.ts
        ├── db.ts
        └── routes/
            ├── categories.ts
            ├── months.ts
            ├── incomes.ts
            ├── assignments.ts
            ├── transactions.ts
            └── summary.ts
```

---

## 🌱 Seed inicial

Se crean automáticamente:

### CategoryGroups

* Hogar
* Esenciales
* Transporte
* Estilo de vida
* Estabilidad/Metas
* Movimientos

### Categories clave

* No identificado (EXPENSE)
* Pago TDC Banamex (TRACKING)
* Pago TDC Nubank (TRACKING)
* Retiro efectivo (Débito BBVA) (TRACKING)

El seed es **idempotente** (puede correrse varias veces).

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

### 3) Migraciones y seed

```bash
npx prisma migrate dev
npx prisma db seed
```

---

## 🌐 Endpoints disponibles

### Health

```bash
GET /health
```

---

### Categories

```bash
GET /categories
```

---

### Months

```bash
POST /months
{
  "year": 2026,
  "month": 1
}
```

```bash
GET /months
```

---

### Incomes

```bash
POST /incomes
{
  "monthId": "MONTH_ID",
  "date": "2026-01-15",
  "amount": 15000,
  "source": "Quincena 15"
}
```

```bash
GET /months/:monthId/incomes
```

---

### Budget Assignments

```bash
POST /budget-assignments
{
  "monthId": "MONTH_ID",
  "categoryId": "CATEGORY_ID",
  "amount": 5000
}
```

```bash
GET /months/:monthId/assignments
```

---

### Transactions

Crear transacción (categoría opcional):

```bash
POST /transactions
{
  "monthId": "MONTH_ID",
  "date": "2026-01-16",
  "amount": 250,
  "description": "Café",
  "paymentMethod": "CASH"
}
```

Listar transacciones del mes:

```bash
GET /months/:monthId/transactions
```

---

### Re-categorización

Listar transacciones no identificadas:

```bash
GET /months/:monthId/unidentified
```

Actualizar transacción:

```bash
PATCH /transactions/:id
{
  "categoryId": "CATEGORY_ID",
  "note": "revisado",
  "isReconciled": true
}
```

---

### Month Summary

```bash
GET /months/:monthId/summary
```

Devuelve:

* ingresos totales
* presupuesto asignado
* gasto real (EXPENSE)
* movimientos (TRACKING)
* detalle por categoría (assigned / spent / available)

---

## 🔜 Próximos pasos (cuando se retome)

* Derivar `monthId` automáticamente desde `date`
* Mejorar summary agrupado por CategoryGroup
* UI en React (dashboard mensual)
* PWA / formulario móvil para captura rápida

---

> Este proyecto es intencionalmente simple. La complejidad se agrega solo cuando aporta valor.
