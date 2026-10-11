#!/usr/bin/env bash
set -Eeuo pipefail

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKUP_ROOT="$APP_DIR/.release-builds"
SERVICE_NAME="${PM2_SERVICE_NAME:-hmizh}"
HEALTH_URL="${HEALTH_URL:-http://127.0.0.1:3000/}"

cd "$APP_DIR"

if [[ "${1:-}" == "--list" ]]; then
  find "$BACKUP_ROOT" -mindepth 1 -maxdepth 1 -type d -printf '%f\n' 2>/dev/null | sort -r
  exit 0
fi

target="${1:-}"
if [[ -z "$target" ]]; then
  target="$(find "$BACKUP_ROOT" -mindepth 1 -maxdepth 1 -type d -printf '%f\n' 2>/dev/null | sort -r | head -n 1)"
fi

if [[ -z "$target" || ! -d "$BACKUP_ROOT/$target" ]]; then
  echo "找不到可回退版本。先执行：bash scripts/rollback-server.sh --list" >&2
  exit 1
fi

stamp="$(date -u +%Y%m%d%H%M%S)"
current_backup="$BACKUP_ROOT/manual-before-rollback-$stamp"
if [[ -d ".next-build" ]]; then
  cp -a ".next-build" "$current_backup"
fi

echo "正在回退到版本：$target"
rm -rf ".next-build"
cp -a "$BACKUP_ROOT/$target" ".next-build"
pm2 restart "$SERVICE_NAME" --update-env

healthy=0
for attempt in {1..20}; do
  if curl -fsS --max-time 5 -o /dev/null "$HEALTH_URL"; then
    healthy=1
    break
  fi
  sleep 1
done

if [[ "$healthy" != "1" ]]; then
  echo "回退后的健康检查仍失败，恢复回退前版本。" >&2
  if [[ -d "$current_backup" ]]; then
    rm -rf ".next-build"
    cp -a "$current_backup" ".next-build"
    pm2 restart "$SERVICE_NAME" --update-env
  fi
  exit 1
fi

echo "回退成功，当前版本：$target"
