#!/usr/bin/env bash
# ==============================================================================
# Somnob POS - Production Database Restoration Script
# Usage: ./scripts/restore-db.sh <backup_file.sql.gz> [container_name] [db_name] [db_user]
# ==============================================================================
set -euo pipefail

BACKUP_FILE="${1:-}"
CONTAINER_NAME="${2:-somnob-postgres-prod}"
DB_NAME="${3:-somnob_pos_prod}"
DB_USER="${4:-somnob_admin}"

if [ -z "${BACKUP_FILE}" ]; then
    echo "❌ Usage: $0 <path_to_backup_file.sql.gz> [container_name] [db_name] [db_user]"
    exit 1
fi

if [ ! -f "${BACKUP_FILE}" ]; then
    echo "❌ ERROR: Backup file not found: ${BACKUP_FILE}"
    exit 1
fi

echo "=========================================================="
echo " Somnob POS Database Restoration"
echo " Backup File: ${BACKUP_FILE}"
echo " Target DB:   ${DB_NAME} (Container: ${CONTAINER_NAME})"
echo "=========================================================="
echo "⚠️  WARNING: This will overwrite existing data in '${DB_NAME}'!"

if docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    echo "▶ Restoring into Docker container '${CONTAINER_NAME}'..."
    gunzip -c "${BACKUP_FILE}" | docker exec -i "${CONTAINER_NAME}" psql -U "${DB_USER}" -d "${DB_NAME}"
else
    echo "▶ Restoring via localhost psql..."
    gunzip -c "${BACKUP_FILE}" | psql -h localhost -p 5432 -U "${DB_USER}" -d "${DB_NAME}"
fi

echo "✅ Restoration completed successfully from: ${BACKUP_FILE}"
