# Flujo de trabajo (beta)

Este documento define el flujo base para iterar sobre la versión beta sin perder estabilidad.

---

## 📌 Convención de commits

Usa mensajes cortos y claros con prefijo:

- `feat:` nueva funcionalidad
- `fix:` corrección de bug
- `chore:` tareas de mantenimiento (deps, refactors pequeños)
- `docs:` documentación
- `style:` cambios visuales/UI
- `test:` pruebas

Ejemplos:
- `feat: agregar filtros en transacciones`
- `fix: corregir cálculo de disponible`
- `docs: actualizar changes.md`

---

## 🧱 Base beta

La base actual es **v0.1.0-beta**.  
Este commit es el punto de partida estable.

Sugerencias:
- Tag: `v0.1.0-beta`
- Sección de versiones en `changes.md`

---

## 🌱 Flujo de ramas (simple)

1) Crea una rama por feature:
```
git checkout -b feat/nombre-corto
```

2) Commits pequeños y frecuentes.

3) Volver a main y merge:
```
git checkout main
git merge feat/nombre-corto
```

4) Borrar la rama si ya está integrada:
```
git branch -d feat/nombre-corto
```

---

## 🏷️ Versionado (semver básico)

- **Patch** (`v0.1.1`): fix pequeño, sin cambios de comportamiento grandes
- **Minor** (`v0.2.0`): nuevas features compatibles
- **Major** (`v1.0.0`): cambios que rompen compatibilidad

Para betas:
- `v0.1.0-beta`, `v0.1.1-beta`, etc.

---

## ✅ Checklist antes de mergear

- `npm run dev` (UI y backend) sin errores
- Revisar `changes.md` si hay nuevas features
- Verificar que endpoints usados existen en backend
