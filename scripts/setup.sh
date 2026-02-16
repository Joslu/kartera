#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

command -v docker >/dev/null 2>&1 || { echo "docker no esta instalado"; exit 1; }
command -v npm >/dev/null 2>&1 || { echo "npm no esta instalado"; exit 1; }

echo "[1/5] Levantando Postgres..."
docker compose -f "$ROOT_DIR/infra/docker-compose.yaml" up -d

echo "[2/5] Instalando dependencias backend..."
(cd "$ROOT_DIR/backend" && npm install)

echo "[3/5] Aplicando migraciones y seed..."
(
  cd "$ROOT_DIR/backend"
  npx prisma migrate deploy
  npx prisma generate
  npx prisma db seed
)

echo "[4/5] Instalando dependencias UI..."
(cd "$ROOT_DIR/ui" && npm install)

echo "[5/5] Build inicial UI..."
(cd "$ROOT_DIR/ui" && npm run build)

echo "Listo. Usa ./scripts/dev.sh para desarrollo o ./scripts/prod-local.sh para modo produccion local."
