#!/usr/bin/env bash
set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-./backups}"
TIMESTAMP="$(date +%Y%m%d-%H%M%S)"
OUTPUT_FILE="${BACKUP_DIR}/streaming-app-${TIMESTAMP}.sql"

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "DATABASE_URL is required" >&2
  exit 1
fi

mkdir -p "${BACKUP_DIR}"
pg_dump "${DATABASE_URL}" --no-owner --no-privileges > "${OUTPUT_FILE}"
echo "Backup created at ${OUTPUT_FILE}"
