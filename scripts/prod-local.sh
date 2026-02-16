#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

UI_PORT="${UI_PORT:-4173}"
API_PORT="${API_PORT:-3000}"
RUN_MIGRATIONS="${RUN_MIGRATIONS:-0}"

export PORT="$API_PORT"
export HOST="0.0.0.0"

echo "Levantando base de datos..."
docker compose -f "$ROOT_DIR/infra/docker-compose.yaml" up -d

if [ "$RUN_MIGRATIONS" = "1" ]; then
  echo "Aplicando migraciones de backend..."
  (
    cd "$ROOT_DIR/backend"
    npx prisma migrate deploy
    npx prisma generate
  )
else
  echo "Saltando migraciones (RUN_MIGRATIONS=$RUN_MIGRATIONS)."
  echo "Usa RUN_MIGRATIONS=1 ./scripts/prod-local.sh para aplicarlas."
fi

echo "Compilando UI..."
(
  cd "$ROOT_DIR/ui"
  VITE_API_BASE_URL="http://localhost:${API_PORT}" npm run build
)

echo "Iniciando backend (modo start) y UI compilada (preview)..."
(
  cd "$ROOT_DIR/backend"
  npm run start
) &
BACK_PID=$!

(
  cd "$ROOT_DIR/ui"
  npm run preview -- --host 0.0.0.0 --port "$UI_PORT"
) &
UI_PID=$!

cleanup() {
  echo "Deteniendo procesos..."
  kill "$BACK_PID" "$UI_PID" >/dev/null 2>&1 || true
}

trap cleanup INT TERM EXIT

echo "UI:  http://localhost:${UI_PORT}"
echo "API: http://localhost:${API_PORT}"

wait "$BACK_PID" "$UI_PID"
