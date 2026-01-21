# Budget MVP – Backend

MVP de finanzas personales basado en **presupuesto mensual**, inspirado en YNAB, con enfoque **minimalista** y backend-first.

Proyecto pensado como **aprendizaje continuo**, construido paso a paso, sin sobre-ingeniería.

---

## 🎯 Objetivo

Construir un backend que permita:

* Usar el **mes** como unidad principal
* Registrar **ingresos**
* Asignar **presupuesto por categoría**
* Registrar **transacciones**
* Obtener un **resumen mensual** claro (ingresos, gastado, disponible)

Sin autenticación (single user, local).

---

## 🧠 Reglas de negocio

* El gasto pertenece al **mes donde ocurre** (según fecha)
* **"No identificado"** es una categoría temporal
* El **pago de TDC es una categoría** (no es gasto nuevo)
* Distinguir:

  * **Gasto real** → consume presupuesto
  * **Movimientos / tracking** → pagos, transferencias, retiros

---

## 🏗️ Stack técnico

### Backend

* Node.js + TypeScript
* Fastify
* Prisma ORM
* PostgreSQL

### Infraestructura

* Docker Compose
* DBeaver (cliente de base de datos)

---

## 📱 Enfoque de producto

* **Laptop / Dashboard web**:

  * Crear meses
  * Asignar presupuestos
  * Ver resúmenes

* **Celular**:

  * Registrar gastos rápido
  * Sin dashboards complejos

---

## 🐳 Infraestructura local

PostgreSQL corre en Docker.

**Credenciales (local):**

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

## 📁 Estructura actual

```
budget-mvp-backend/
├── infra/
│   └── docker-compose.yml
└── README.md
```

---

## 🧭 Metodología

* Avanzar **paso a paso**
* No generar todo de golpe
* Priorizar código ejecutable
* Mantener el sistema simple y entendible

---

## ✅ Estado actual

* PostgreSQL corre en Docker (infra lista)
* Backend base con Fastify + TypeScript
* Prisma conectado a Postgres
* Seeds creados (CategoryGroups + Categories)
* Endpoint inicial funcionando: `GET /health`, `GET /categories`


## ✅ Funcionalidad implementada

El backend ya soporta el flujo completo de un presupuesto mensual:

### Entidades principales
- Month (año + mes)
- CategoryGroup y Category
- Income
- BudgetAssignment
- Transaction

### Endpoints disponibles
- `GET /health`
- `GET /categories`
- `GET /months`
- `POST /months`
- `POST /incomes`
- `GET /months/:monthId/incomes`
- `POST /budget-assignments`
- `GET /months/:monthId/assignments`
- `POST /transactions`
- `GET /months/:monthId/transactions`
- `GET /months/:monthId/unidentified`
- `PATCH /transactions/:id`
- `GET /months/:monthId/summary`

### Flujo soportado
- Registrar ingresos por mes
- Asignar presupuesto por categoría
- Registrar transacciones rápidamente (por default caen en “No identificado”)
- Re-categorizar transacciones después
- Separar gasto real (EXPENSE) vs movimientos (TRACKING)
- Obtener resumen mensual con:
  - ingresos
  - asignado
  - gastado
  - disponible por categoría

---

## 🧾 Notas rápidas

* Los IDs son UUIDs (ej. `034fea7d-c344-4f79-aa48-b44f742726bf`). Son largos a propósito: evitan colisiones y se pueden generar sin depender de un contador global.


- Las transacciones usan `amount` siempre positivo.
- El tipo de impacto se determina por `Category.kind`:
  - `EXPENSE` consume presupuesto
  - `TRACKING` solo se rastrea
- La categoría “No identificado” existe como estado temporal.
- `date` representa la fecha contable.
- `createdAt` representa cuándo se registró la transacción.
- IDs usan UUID para evitar colisiones y permitir escalabilidad futura.
---

## 🔜 Próximos pasos

* `GET /category-groups` (si la UI lo necesita)
* Endpoints de Month (`POST /months`, `GET /months`)
* Luego Income, BudgetAssignment, Transaction, y Month summary

---

> Este proyecto es intencionalmente simple. La complejidad se agrega solo cuando aporta valor.
