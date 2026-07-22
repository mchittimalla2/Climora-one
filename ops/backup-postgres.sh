#!/usr/bin/env bash
set -Eeuo pipefail

APP_ROOT="${CLIMORAONE_APP_ROOT:-/opt/platform/apps/climoraone-dev/backend}"
BACKUP_DIR="${CLIMORAONE_BACKUP_DIR:-/opt/backups/climoraone}"
RETENTION_COUNT="${CLIMORAONE_BACKUP_RETENTION:-4}"
LOCK_FILE="${CLIMORAONE_BACKUP_LOCK:-/var/lock/climoraone-postgres-backup.lock}"
LOG_FILE="${CLIMORAONE_BACKUP_LOG:-/var/log/climoraone-postgres-backup.log}"

log() {
  printf '%s %s\n' "$(date '+%Y-%m-%d %H:%M:%S %z')" "$*" | tee -a "$LOG_FILE"
}

fail() {
  log "ERROR: $*"
  exit 1
}

[[ "${EUID}" -eq 0 ]] || fail "run this script with sudo/root"
[[ -d "$APP_ROOT" ]] || fail "Laravel backend directory not found: $APP_ROOT"
[[ -f "$APP_ROOT/artisan" ]] || fail "artisan not found under: $APP_ROOT"
command -v php >/dev/null 2>&1 || fail "php is not installed"
command -v pg_dump >/dev/null 2>&1 || fail "pg_dump is not installed"
command -v pg_restore >/dev/null 2>&1 || fail "pg_restore is not installed"
command -v flock >/dev/null 2>&1 || fail "flock is not installed"

mkdir -p "$BACKUP_DIR"
chmod 700 "$BACKUP_DIR"
touch "$LOG_FILE"
chmod 600 "$LOG_FILE"

exec 9>"$LOCK_FILE"
flock -n 9 || fail "another backup job is already running"

read_laravel_config() {
  local key="$1"
  APP_ROOT="$APP_ROOT" CONFIG_KEY="$key" php -r '
    $root = getenv("APP_ROOT");
    require $root . "/vendor/autoload.php";
    $app = require $root . "/bootstrap/app.php";
    $kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
    $kernel->bootstrap();
    $value = config(getenv("CONFIG_KEY"));
    if ($value === null) { exit(2); }
    echo $value;
  '
}

DB_HOST="$(read_laravel_config 'database.connections.pgsql.host')"
DB_PORT="$(read_laravel_config 'database.connections.pgsql.port')"
DB_NAME="$(read_laravel_config 'database.connections.pgsql.database')"
DB_USER="$(read_laravel_config 'database.connections.pgsql.username')"
DB_PASSWORD="$(read_laravel_config 'database.connections.pgsql.password')"

[[ -n "$DB_NAME" && -n "$DB_USER" ]] || fail "database name or username is empty"

TIMESTAMP="$(date '+%Y-%m-%d_%H%M%S')"
FINAL_FILE="$BACKUP_DIR/climoraone_${TIMESTAMP}.dump"
TEMP_FILE="${FINAL_FILE}.partial"

cleanup() {
  rm -f "$TEMP_FILE"
}
trap cleanup EXIT

log "Starting PostgreSQL backup for database '$DB_NAME'"

PGPASSWORD="$DB_PASSWORD" pg_dump \
  --host="$DB_HOST" \
  --port="$DB_PORT" \
  --username="$DB_USER" \
  --dbname="$DB_NAME" \
  --format=custom \
  --compress=9 \
  --no-owner \
  --no-privileges \
  --file="$TEMP_FILE"

[[ -s "$TEMP_FILE" ]] || fail "pg_dump produced an empty backup"
pg_restore --list "$TEMP_FILE" >/dev/null || fail "backup integrity check failed"

mv "$TEMP_FILE" "$FINAL_FILE"
chmod 600 "$FINAL_FILE"
trap - EXIT

mapfile -t backups < <(find "$BACKUP_DIR" -maxdepth 1 -type f -name 'climoraone_*.dump' -printf '%T@ %p\n' | sort -nr | cut -d' ' -f2-)

if (( ${#backups[@]} > RETENTION_COUNT )); then
  for old_backup in "${backups[@]:RETENTION_COUNT}"; do
    rm -f -- "$old_backup"
    log "Deleted expired backup: $(basename "$old_backup")"
  done
fi

log "Backup completed successfully: $FINAL_FILE ($(du -h "$FINAL_FILE" | awk '{print $1}'))"
