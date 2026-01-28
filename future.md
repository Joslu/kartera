# Future Ideas

Este archivo lista mejoras y siguientes pasos posibles para el proyecto.

---

## ✅ Multiusuario (compartir con mi pareja)

Hoy el sistema es **single-user local**. Para permitir sesiones separadas:

### Recomendado
1) **Agregar autenticacion**
   - Registro / login (email + password)
   - Hashing con bcrypt
   - Tokens (JWT) o cookies de sesion

2) **Multi-tenant en DB**
   - Crear tabla `User`
   - Agregar `userId` a Month, Income, Transaction, Assignment, Category
   - Aislar datos por usuario en cada query

3) **Roles** (opcional)
   - Admin / user

Con esto tu pareja puede tener su propio set de meses, categorias y transacciones sin mezclarse.

---

## 🔐 Seguridad

- Rate limit en endpoints sensibles
- Validaciones mas estrictas
- Logs estructurados

---

## 💳 Metodos de pago dinamicos

Hoy los metodos son un enum. Para permitir crear desde UI:
- Migrar a tabla `PaymentMethod`
- CRUD desde Settings
- Asociar transactions a paymentMethodId

---

## 📊 Reportes

- Tendencia de gasto por categoria
- Comparativo mes vs mes
- Presupuesto vs gasto por semana
- Dashboard con graficos (donut, linea, barras)

---

## 📥 Importacion

- CSV bancario
- OFX
- Deteccion automatica de categoria

---

## ✅ Calidad de vida

- Tema oscuro
- Atajos de teclado en Inbox
- Buscador global de transacciones
- Plantillas de categorias

---

## 📱 UI

- Version movil responsive
- Accesibilidad (WAI-ARIA)
- Estados vacios mas visuales

---

## 🧱 Infra

- Docker para UI + Backend
- Deploy en Render/Railway
- Backups automaticos

