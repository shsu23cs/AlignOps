#!/usr/bin/env bash

# ==============================================================================
# AlignOps Enterprise Database Backup Utility
# Description: Automated Postgres database backup with compression, checksums,
#              and a strict retention rotation policy.
# ==============================================================================

set -euo pipefail

# Configuration
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_USER="${DB_USER:-postgres}"
DB_NAME="${DB_NAME:-alignops}"
BACKUP_DIR="${BACKUP_DIR:-/var/backups/alignops}"
RETENTION_DAYS=7
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/${DB_NAME}_backup_${TIMESTAMP}.sql.gz"
LOG_FILE="${BACKUP_DIR}/backup.log"

# Logger Function
log() {
  echo -e "[$(date +"%Y-%m-%d %H:%M:%S")] $1" | tee -a "${LOG_FILE}"
}

# Create backup directory
mkdir -p "${BACKUP_DIR}"

log "Starting database backup for database '${DB_NAME}' on '${DB_HOST}:${DB_PORT}'..."

# Verify postgres client tool is installed
if ! command -v pg_dump &> /dev/null; then
  log "ERROR: pg_dump utility is not installed. Backup aborted."
  exit 1
fi

# Run the backup
if pg_dump -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${DB_NAME}" | gzip > "${BACKUP_FILE}"; then
  log "Backup successfully created: ${BACKUP_FILE}"
  
  # Generate SHA256 checksum for audit trails
  log "Calculating checksum..."
  sha256sum "${BACKUP_FILE}" > "${BACKUP_FILE}.sha256"
  log "Checksum generated at ${BACKUP_FILE}.sha256"

  # Apply retention policy (delete backups older than N days)
  log "Enforcing retention policy (Retention: ${RETENTION_DAYS} Days)..."
  find "${BACKUP_DIR}" -name "${DB_NAME}_backup_*.sql.gz*" -mtime +"${RETENTION_DAYS}" -exec rm -fv {} \; | tee -a "${LOG_FILE}"
  log "Retention cleanup complete."
  
  log "Database backup process completed successfully."
else
  log "ERROR: Database backup failed."
  exit 1
fi
