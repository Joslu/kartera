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

## 🖥️ Backend base creado

Estructura:

budget-mvp-backend/
├── backend/
│   ├── src/
│   │   └── server.ts
│   ├── package.json
│   ├── tsconfig.json
│   └── .gitignore
├── infra/
│   └── docker-compose.yml
└── README.md


- Servidor Fastify mínimo:

- Endpoint /health

- TypeScript funcionando

npm run dev levanta el server
---

> Este proyecto es intencionalmente simple. La complejidad se agrega solo cuando aporta valor.
