#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 1 ]]; then
  echo "Usage: ./scripts/db-restore.sh <backup-file.sql>" >&2
  exit 1
fi

BACKUP_FILE="$1"
if [[ ! -f "${BACKUP_FILE}" ]]; then
  echo "Backup file not found: ${BACKUP_FILE}" >&2
  exit 1
fi

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "DATABASE_URL is required" >&2
  exit 1
fi

psql "${DATABASE_URL}" < "${BACKUP_FILE}"
echo "Restore completed from ${BACKUP_FILE}"
