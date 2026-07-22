#!/usr/bin/env bash
set -Eeuo pipefail

APP_ROOT="${CLIMORAONE_APP_ROOT:-/opt/platform/apps/climoraone-dev/backend}"
BACKUP_DIR="${CLIMORAONE_BACKUP_DIR:-/opt/backups/climoraone}"

fail() {
  printf 'ERROR: %s\n' "$*" >&2
  exit 1
}

[[ "${EUID}" -eq 0 ]] || fail "run this script with sudo/root"
[[ -d "$APP_ROOT" && -f "$APP_ROOT/artisan" ]] || fail "Laravel backend not found: $APP_ROOT"
command -v php >/dev/null 2>&1 || fail "php is not installed"
command -v pg_restore >/dev/null 2>&1 || fail "pg_restore is not installed"

read_laravel_config() {
  local key="$1"
  APP_ROOT="$APP_ROOT" CONFIG_KEY="$key" php -r '
    $root = getenv("APP_ROOT");
    require $root . "/vendor/autoload.php";
    $app = require $root . "/bootstrap/app.php";
    $kernel = $app->make(Illuminate\\Contracts\\Console\\Kernel::class);
    $kernel->bootstrap();
    $value = config(getenv("CONFIG_KEY"));
    if ($value === null) { exit(2); }
    echo $value;
  '
}

mapfile -t backups < <(find "$BACKUP_DIR" -maxdepth 1 -type f -name 'climoraone_*.dump' -printf '%T@ %p\n' | sort -nr | awk '{print $2}')
(( ${#backups[@]} > 0 )) || fail "no backups found in $BACKUP_DIR"

printf 'Available backups:\n'
for index in "${!backups[@]}"; do
  printf '  %d) %s\n' "$((index + 1))" "$(basename "${backups[$index]}")"
done

read -r -p "Select backup number: " selection
[[ "$selection" =~ ^[0-9]+$ ]] || fail "invalid selection"
(( selection >= 1 && selection <= ${#backups[@]} )) || fail "selection out of range"

BACKUP_FILE="${backups[$((selection - 1))]}"
pg_restore --list "$BACKUP_FILE" >/dev/null || fail "selected backup failed integrity validation"

DB_HOST="$(read_laravel_config 'database.connections.pgsql.host')"
DB_PORT="$(read_laravel_config 'database.connections.pgsql.port')"
DB_NAME="$(read_laravel_config 'database.connections.pgsql.database')"
DB_USER="$(read_laravel_config 'database.connections.pgsql.username')"
DB_PASSWORD="$(read_laravel_config 'database.connections.pgsql.password')"

printf '\nWARNING: This will overwrite the current database: %s\n' "$DB_NAME"
read -r -p "Type RESTORE to continue: " confirmation
[[ "$confirmation" == "RESTORE" ]] || fail "restore cancelled"

cd "$APP_ROOT"
php artisan down --retry=60 || true
trap 'cd "$APP_ROOT" && php artisan up >/dev/null 2>&1 || true' EXIT

PGPASSWORD="$DB_PASSWORD" pg_restore \
  --host="$DB_HOST" \
  --port="$DB_PORT" \
  --username="$DB_USER" \
  --dbname="$DB_NAME" \
  --clean \
  --if-exists \
  --no-owner \
  --no-privileges \
  --exit-on-error \
  "$BACKUP_FILE"

php artisan optimize:clear
php artisan up
trap - EXIT

printf 'Restore completed successfully from: %s\n' "$BACKUP_FILE"
