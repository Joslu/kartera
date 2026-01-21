## 🖥️ UI – Dashboard Web (Budget MVP)

El dashboard web es la primera interfaz del Budget MVP. Está diseñado para uso en laptop/desktop y permite procesar transacciones “No identificado” de forma rápida y clara, así como visualizar un resumen del mes activo.

### Stack
- Vite
- React
- TypeScript
- Tailwind CSS
- Sin autenticación (single user local)

---

## 🎯 Objetivo principal del UI

- Servir como Inbox de transacciones temporales sin categoría.
- Permitir recategorizar transacciones de forma rápida.
- Mostrar un resumen del mes para dar contexto financiero.
- Facilitar el cambio de mes desde el frontend.

---

## 📌 Pantalla principal: Inbox “No identificado”

### Funcionalidades
- Lista todas las transacciones sin categoría del mes seleccionado.
- Permite asignar una categoría desde un dropdown.
- Al recategorizar:
  - Se hace `PATCH /transactions/:id`
  - La transacción desaparece del inbox.
  - El resumen del mes se actualiza.

### Regla de negocio
> La categoría “No identificado” es temporal.  
> Todas las transacciones deben ser recategorizadas desde este inbox.

---

## 📅 Selector de mes

El dashboard incluye un selector de mes en la parte superior:

- Consume `GET /months`
- Muestra el mes en formato legible (ej. `enero de 2026`)
- Al cambiar el mes:
  - Se actualiza el `monthId` activo
  - Se recarga el inbox y el resumen

---

## 📊 Resumen del mes

El panel de resumen consume `GET /months/:monthId/summary` y muestra:

- Ingresos (`totals.income`)
- Gastos totales (`totals.spentExpense`)
- Net (ingresos − gastos)
- No identificado (gastado)

> Nota: El total de gastos no disminuye al recategorizar, ya que las transacciones siguen siendo gastos; solo cambia su categoría.

---

## 📋 Información del Inbox

Encima de la tabla se muestra:

- Cantidad de transacciones pendientes
- Monto total pendiente de categorizar

Esto representa el trabajo restante para “limpiar” el mes.

---

## 🔌 Endpoints utilizados por el UI

```txt
GET    /months
GET    /months/:monthId/unidentified
GET    /months/:monthId/summary
GET    /categories
PATCH  /transactions/:id
