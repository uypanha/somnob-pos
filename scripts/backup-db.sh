#!/usr/bin/env bash
# ==============================================================================
# Somnob POS - Production Automated Database Backup Script
# Usage: ./scripts/backup-db.sh [container_name] [db_name] [db_user]
# ==============================================================================
set -euo pipefail

CONTAINER_NAME="${1:-somnob-postgres-prod}"
DB_NAME="${2:-somnob_pos_prod}"
DB_USER="${3:-somnob_admin}"
BACKUP_DIR="${BACKUP_DIR:-./backups}"
RETENTION_DAYS="${RETENTION_DAYS:-7}"

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/${DB_NAME}_${TIMESTAMP}.sql.gz"

echo "=========================================================="
echo " Starting Somnob POS Automated Backup: ${TIMESTAMP}"
echo " Database: ${DB_NAME} (Container: ${CONTAINER_NAME})"
echo "=========================================================="

# Ensure backup destination directory exists
mkdir -p "${BACKUP_DIR}"

# Execute pg_dump inside container and compress with gzip
if docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    echo "▶ Container '${CONTAINER_NAME}' is running. Executing pg_dump..."
    docker exec "${CONTAINER_NAME}" pg_dump -U "${DB_USER}" -d "${DB_NAME}" --clean --if-exists --no-owner --no-privileges | gzip > "${BACKUP_FILE}"
else
    echo "⚠️  Container '${CONTAINER_NAME}' is not running. Attempting direct pg_dump via localhost..."
    pg_dump -h localhost -p 5432 -U "${DB_USER}" -d "${DB_NAME}" --clean --if-exists --no-owner --no-privileges | gzip > "${BACKUP_FILE}"
fi

# Verify backup was created and is non-empty
if [ -s "${BACKUP_FILE}" ]; then
    FILE_SIZE=$(du -h "${BACKUP_FILE}" | cut -f1)
    echo "✅ Backup successfully created: ${BACKUP_FILE} (${FILE_SIZE})"
else
    echo "❌ ERROR: Backup file is empty or failed to generate!"
    exit 1
fi

# Cleanup old backups exceeding retention policy
echo "▶ Applying retention policy (retaining last ${RETENTION_DAYS} days)..."
find "${BACKUP_DIR}" -name "${DB_NAME}_*.sql.gz" -mtime +"${RETENTION_DAYS}" -exec rm -f {} \; || true
echo "✅ Retention cleanup completed."

echo "=========================================================="
echo " Backup Completed Successfully at $(date)"
echo "=========================================================="
