#!/usr/bin/env bash
# Database backup: one compressed pg_dump per run, named by date. Keeps every backup for 14 days, and Sunday's
# backups for 12 weeks. Run it as the postgres system user (no password needed), e.g. from /etc/cron.d:
#
#   0 21 * * * postgres /path/to/backup-db.sh <database> >> <backup folder>/backup.log 2>&1
#
# Usage:   backup-db.sh <database> [backup folder]        (default folder: /var/backups/qr-genie)
# Restore: pg_restore --clean --if-exists --no-owner --role=<app user> -d <database> <file>.dump
#          (stop the app first; to look inside without touching the live data, restore into a new empty database)
set -euo pipefail

DB="${1:?Usage: backup-db.sh <database> [backup folder]}"
DIR="${2:-/var/backups/qr-genie}"
KEEP_DAYS=14
KEEP_WEEKLY_DAYS=84

umask 077
mkdir -p "$DIR/daily" "$DIR/weekly"

FILE="$DIR/daily/$DB-$(date -u +%Y-%m-%d_%H%M).dump"
trap 'rm -f "$FILE.part"' EXIT

pg_dump --format=custom --compress=9 --file="$FILE.part" "$DB"
# A dump that can't be read fails here, not on the day it's needed
pg_restore --list "$FILE.part" >/dev/null
mv "$FILE.part" "$FILE"

if [ "$(date -u +%u)" = 7 ]; then
  cp "$FILE" "$DIR/weekly/"
fi

find "$DIR/daily" -name '*.dump' -mtime +"$KEEP_DAYS" -delete
find "$DIR/weekly" -name '*.dump' -mtime +"$KEEP_WEEKLY_DAYS" -delete

echo "$(date -u +%FT%TZ) ok $(basename "$FILE") $(du -h "$FILE" | cut -f1)"
