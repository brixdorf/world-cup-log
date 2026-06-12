#!/usr/bin/env bash
# Usage: ./scripts/backup-db.sh
# Backs up the SQLite database to ~/worldcuplog-backups/ with a timestamp.
# Suggested cron (daily at 2 AM):
#   0 2 * * * /var/www/worldcuplog/scripts/backup-db.sh >> /var/log/wcl-backup.log 2>&1

set -euo pipefail

DB_PATH="${DB_PATH:-/var/www/worldcuplog/server/data/worldcuplog.db}"
BACKUP_DIR="${BACKUP_DIR:-$HOME/worldcuplog-backups}"
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
BACKUP_FILE="$BACKUP_DIR/worldcuplog_$TIMESTAMP.db"

mkdir -p "$BACKUP_DIR"

if [ ! -f "$DB_PATH" ]; then
    echo "[$(date)] ERROR: DB not found at $DB_PATH"
    exit 1
fi

# Use SQLite's .backup command for a safe hot backup (works while the server is writing)
sqlite3 "$DB_PATH" ".backup '$BACKUP_FILE'"

echo "[$(date)] Backed up to $BACKUP_FILE ($(du -sh "$BACKUP_FILE" | cut -f1))"

# Keep only the 30 most recent backups
cd "$BACKUP_DIR"
ls -t worldcuplog_*.db | tail -n +31 | xargs -r rm --
echo "[$(date)] Cleanup done — kept $(ls worldcuplog_*.db | wc -l) backups"
