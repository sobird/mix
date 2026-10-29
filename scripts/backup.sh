#!/usr/bin/env bash
set -euo pipefail
APP_ROOT="${APP_ROOT:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)}"
[ -d "$APP_ROOT/current" ] || { echo "no current release at $APP_ROOT/current" >&2; exit 1; }
cd "$APP_ROOT/current"
node db-tools.cjs backup \
  --to "$APP_ROOT/backups/database-$(date -u +%Y%m%dT%H%M%SZ).sqlite" \
  --keep "${BACKUP_KEEP:-30}"
