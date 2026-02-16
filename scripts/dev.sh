#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "Levantando base de datos..."
docker compose -f "$ROOT_DIR/infra/docker-compose.yaml" up -d

echo "Iniciando backend (dev) y UI (dev)..."
(
  cd "$ROOT_DIR/backend"
  npm run dev
) &
BACK_PID=$!

(
  cd "$ROOT_DIR/ui"
  npm run dev -- --host 0.0.0.0 --port 5173
) &
UI_PID=$!

cleanup() {
  echo "Deteniendo procesos..."
  kill "$BACK_PID" "$UI_PID" >/dev/null 2>&1 || true
}

trap cleanup INT TERM EXIT

wait "$BACK_PID" "$UI_PID"
