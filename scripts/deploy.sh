#!/usr/bin/env bash
#
# Deploy a release bundle on the server.
#
# The deploy workflow uploads release.tar.gz and this script to APP_ROOT and
# then runs it over SSH:
#
#   APP_PORT=8085 RELEASE_ID=<run_id>-<run_attempt> bash scripts/deploy.sh
#
# Every release is extracted into its own directory under RELEASES_DIR (default
# APP_ROOT/releases) and the "current" symlink is switched to it, so a failed
# deploy can roll back to the previous release.

set -eu

APP_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
RELEASES_DIR="${RELEASES_DIR:-$APP_ROOT/releases}"
RELEASE_ID="${RELEASE_ID:?RELEASE_ID is required}"
RELEASE_DIR="$RELEASES_DIR/$RELEASE_ID"
CURRENT="$APP_ROOT/current"
APP_PORT="${APP_PORT:-8085}"

log() {
  printf '[deploy] %s\n' "$*"
}

# Start the app on the first deploy and reload it on later ones.
start_or_reload() {
  if [ "$FIRST_DEPLOY" -eq 1 ]; then
    pm2 delete mix >/dev/null 2>&1 || true
    PORT="$APP_PORT" AUTHMAIL="${AUTHMAIL:-}" AUTHCODE="${AUTHCODE:-}" pm2 start pm2.config.cjs
  else
    PORT="$APP_PORT" AUTHMAIL="${AUTHMAIL:-}" AUTHCODE="${AUTHCODE:-}" pm2 reload pm2.config.cjs --update-env
  fi
}

# Poll the app until it answers or 30 seconds pass.
wait_healthy() {
  local status
  for _ in $(seq 1 15); do
    status="$(curl -s -o /dev/null -w '%{http_code}' "http://127.0.0.1:$APP_PORT/" || true)"
    case "$status" in
      2?? | 3?? | 4??) return 0 ;;
    esac
    sleep 2
  done
  return 1
}

rollback() {
  if [ "$FIRST_DEPLOY" -eq 1 ]; then
    # The previous in-place deployment is still untouched at APP_ROOT.
    pm2 delete mix >/dev/null 2>&1 || true
    rm -f "$CURRENT"
    cd "$APP_ROOT" || exit 1
    PORT="$APP_PORT" AUTHMAIL="${AUTHMAIL:-}" AUTHCODE="${AUTHCODE:-}" pm2 start pm2.config.cjs
  elif [ -n "$PREVIOUS" ]; then
    ln -sfn "$PREVIOUS" "$CURRENT"
    cd "$CURRENT" || exit 1
    PORT="$APP_PORT" AUTHMAIL="${AUTHMAIL:-}" AUTHCODE="${AUTHCODE:-}" pm2 reload pm2.config.cjs --update-env
  fi
}

mkdir -p "$RELEASE_DIR"
tar -xzf "$APP_ROOT/release.tar.gz" -C "$RELEASE_DIR"
rm -f "$APP_ROOT/release.tar.gz"

# Runtime state stays outside the release directories and is symlinked in so
# that every version keeps using the same data.
for file in .env .env.production .env.local .env.production.local database.sqlite; do
  if [ -e "$APP_ROOT/$file" ]; then
    ln -sfn "$APP_ROOT/$file" "$RELEASE_DIR/$file"
  fi
done

FIRST_DEPLOY=0
PREVIOUS=""
if [ -L "$CURRENT" ] && [ -d "$(readlink "$CURRENT")" ]; then
  PREVIOUS="$(readlink "$CURRENT")"
else
  FIRST_DEPLOY=1
fi

ln -sfn "$RELEASE_DIR" "$CURRENT"
cd "$CURRENT" || exit 1

start_or_reload

# shellcheck disable=SC2310 # a failing probe is the expected result here
if ! wait_healthy; then
  log "health check failed, rolling back"
  rollback
  exit 1
fi

# Keep the last five releases for rollbacks.
find "$RELEASES_DIR" -mindepth 1 -maxdepth 1 -type d -printf '%T@ %p\n' |
  sort -rn |
  tail -n +6 |
  cut -d' ' -f2- |
  xargs -r rm -rf
