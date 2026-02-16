#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
COMPOSE_FILE="$ROOT_DIR/infra/docker-compose.yaml"
BACKUP_DIR="$ROOT_DIR/backups"
TS="$(date +%Y%m%d_%H%M%S)"
OUT_FILE="${1:-$BACKUP_DIR/budget_${TS}.dump}"

mkdir -p "$BACKUP_DIR"

echo "Levantando DB si no esta activa..."
docker compose -f "$COMPOSE_FILE" up -d db >/dev/null

echo "Creando backup en: $OUT_FILE"
docker compose -f "$COMPOSE_FILE" exec -T db \
  pg_dump -U budget -d budget -Fc > "$OUT_FILE"

echo "Backup completado: $OUT_FILE"
