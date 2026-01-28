# Plan de respaldo y uso seguro (personal)

Este documento propone un plan práctico para **mantener tus datos seguros** mientras usas la app en modo personal.

---

## ✅ Opción recomendada (inicio): Local + backups automáticos

### Objetivo
Mantener la base de datos en tu laptop, pero con copias de seguridad confiables para no perder datos.

### Pasos sugeridos
1) **DB local en Docker** (ya existente)
2) **Backups automáticos** diarios
3) **Guardar backups en nube** (Google Drive / iCloud / Dropbox)
4) **Cifrar backups** (zip con contraseña)

### Ventajas
- Datos no salen de tu máquina
- Menos superficie de ataque
- Fácil de mantener

### Riesgos
- Si pierdes la laptop y no hay backup, pierdes todo

---

## 🔒 Buenas prácticas mínimas

- Hacer **backup diario**
- Verificar al menos 1 vez al mes que puedas restaurar
- Guardar una copia externa (drive o disco)
- No exponer el puerto de la DB a internet

---

## 🧰 Plan de backup local (simple)

**Frecuencia sugerida:** 1 vez al día

1) Exportar DB
2) Comprimir
3) Guardar en una carpeta sincronizada (Google Drive / iCloud)

Ejemplo:
```
/Backups/budget/
  budget_2026-01-27.sql
  budget_2026-01-28.sql
```

---

## 🚀 Próximo paso (si quieres usar celular siempre)

### Opción B: Servidor privado

- Montar backend + DB en un VPS (Railway, Render, Fly, DigitalOcean)
- Agregar autenticación
- Backups automáticos del proveedor
- Acceso desde cualquier dispositivo

### Ventajas
- Acceso 24/7 desde celular
- Datos más seguros si tienes backups

### Riesgos
- Más configuración
- Requiere seguridad básica (HTTPS, auth)

---

## 👫 Multiusuario (tu pareja)

Para sesiones separadas:
1) Crear tabla `User`
2) Agregar `userId` a Month, Income, Transaction, Assignment, Category
3) Autenticación (email/password)
4) Aislar todos los queries por `userId`

---

## ✅ Recomendación final

Empieza con **local + backups**. Es simple, seguro y suficiente para uso personal.
Si ya lo usas diario o quieres capturar desde celular, migra a un VPS con login.

