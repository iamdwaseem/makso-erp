#!/bin/bash
set -euo pipefail

# Configuration
BACKUP_DIR="${BACKUP_DIR:-/var/backups/wareflow}"
DB_NAME="${DB_NAME:-erpdb}"
DB_USER="${DB_USER:-}"
DB_PASSWORD="${DB_PASSWORD:-}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"

if [ -z "${DB_USER}" ] || [ -z "${DB_PASSWORD}" ]; then
  echo "DB_USER and DB_PASSWORD must be provided via environment variables."
  exit 1
fi

# Date formats
TODAY=$(date +%Y-%m-%d)
MONTH=$(date +%Y-%m)

# File names
DAILY_BACKUP="${BACKUP_DIR}/daily/erpdb_${TODAY}.sql.gz"
MONTHLY_BACKUP="${BACKUP_DIR}/monthly/erpdb_${MONTH}.sql.gz"

# Ensure directories exist
mkdir -p "${BACKUP_DIR}/daily"
mkdir -p "${BACKUP_DIR}/monthly"

# Password authentication for pg_dump
export PGPASSWORD="${DB_PASSWORD}"

# Dump the database and compress
echo "Starting backup of ${DB_NAME} to ${DAILY_BACKUP}..."
pg_dump -U "${DB_USER}" -h "${DB_HOST}" -p "${DB_PORT}" -c "${DB_NAME}" | gzip > "${DAILY_BACKUP}"

echo "Backup successfully created: ${DAILY_BACKUP}"

# Monthly snapshot logic (if it's the 1st of the month)
if [ "$(date +%d)" -eq "01" ]; then
  echo "Creating monthly snapshot..."
  cp "${DAILY_BACKUP}" "${MONTHLY_BACKUP}"
  echo "Monthly snapshot created: ${MONTHLY_BACKUP}"
fi

# Rotate old daily backups (keep 7 days)
echo "Cleaning up old daily backups (older than 7 days)..."
find "${BACKUP_DIR}/daily/" -type f -name "*.sql.gz" -mtime +7 -delete
echo "Cleanup completed."

# Unset password
unset PGPASSWORD
