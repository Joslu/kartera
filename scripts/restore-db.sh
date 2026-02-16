#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
COMPOSE_FILE="$ROOT_DIR/infra/docker-compose.yaml"
BACKUP_FILE="${1:-}"

if [ -z "$BACKUP_FILE" ]; then
  echo "Uso: ./scripts/restore-db.sh <ruta_backup.dump>"
  exit 1
fi

if [ ! -f "$BACKUP_FILE" ]; then
  echo "No existe el archivo: $BACKUP_FILE"
  exit 1
fi

echo "Levantando DB si no esta activa..."
docker compose -f "$COMPOSE_FILE" up -d db >/dev/null

echo "Restaurando backup: $BACKUP_FILE"
docker compose -f "$COMPOSE_FILE" exec -T db \
  pg_restore -U budget -d budget --clean --if-exists --no-owner --no-privileges \
  < "$BACKUP_FILE"

echo "Restore completado."
