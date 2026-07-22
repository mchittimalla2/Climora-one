#!/usr/bin/env bash
set -Eeuo pipefail

BACKUP_DIR="${CLIMORAONE_BACKUP_DIR:-/opt/backups/climoraone}"
LOG_FILE="${CLIMORAONE_BACKUP_LOG:-/var/log/climoraone-postgres-backup.log}"

log() {
  printf '%s %s\n' "$(date '+%Y-%m-%d %H:%M:%S %z')" "$*" | tee -a "$LOG_FILE"
}

latest_backup="$(find "$BACKUP_DIR" -maxdepth 1 -type f -name 'climoraone_*.dump' -printf '%T@ %p\n' | sort -nr | head -n 1 | awk '{print $2}')"

if [[ -z "$latest_backup" ]]; then
  log "ERROR: no backup found in $BACKUP_DIR"
  exit 1
fi

if [[ ! -s "$latest_backup" ]]; then
  log "ERROR: latest backup is empty: $latest_backup"
  exit 1
fi

if ! pg_restore --list "$latest_backup" >/dev/null; then
  log "ERROR: latest backup failed integrity validation: $latest_backup"
  exit 1
fi

log "Backup verification successful: $latest_backup"
