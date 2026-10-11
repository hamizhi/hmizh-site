#!/usr/bin/env bash
set -Eeuo pipefail

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKUP_ROOT="$APP_DIR/.release-builds"
SERVICE_NAME="${PM2_SERVICE_NAME:-hmizh}"
HEALTH_URL="${HEALTH_URL:-http://127.0.0.1:3000/}"
KEEP_RELEASES="${KEEP_RELEASES:-5}"

cd "$APP_DIR"
mkdir -p "$BACKUP_ROOT"

stamp="$(date -u +%Y%m%d%H%M%S)"
backup_dir="$BACKUP_ROOT/$stamp"

if [[ ! -d ".next-build" ]]; then
  echo "当前没有可备份的 .next-build，无法建立回退点。" >&2
  exit 1
fi

echo "备份当前运行版本：$backup_dir"
cp -a ".next-build" "$backup_dir"
printf '%s\n' "$backup_dir" > "$BACKUP_ROOT/last-backup"

restore_backup() {
  echo "恢复版本：$backup_dir"
  rm -rf ".next-build"
  cp -a "$backup_dir" ".next-build"
}

echo "开始构建新版本..."
if ! npm run build; then
  echo "新版本构建失败，保留原版本不变。" >&2
  restore_backup
  exit 1
fi

echo "重启 PM2 服务：$SERVICE_NAME"
if ! pm2 restart "$SERVICE_NAME" --update-env; then
  echo "PM2 重启失败，正在恢复旧版本。" >&2
  restore_backup
  pm2 restart "$SERVICE_NAME" --update-env || true
  exit 1
fi

healthy=0
for attempt in {1..20}; do
  if curl -fsS --max-time 5 -o /dev/null "$HEALTH_URL"; then
    healthy=1
    break
  fi
  sleep 1
done

if [[ "$healthy" != "1" ]]; then
  echo "健康检查失败，正在自动恢复旧版本。" >&2
  restore_backup
  pm2 restart "$SERVICE_NAME" --update-env
  exit 1
fi

mapfile -t old_releases < <(
  find "$BACKUP_ROOT" -mindepth 1 -maxdepth 1 -type d -printf '%f\n' |
    sort -r |
    tail -n +"$((KEEP_RELEASES + 1))"
)
for release in "${old_releases[@]}"; do
  rm -rf "$BACKUP_ROOT/$release"
done

echo "发布成功，健康检查通过。保留最近 $KEEP_RELEASES 个回退版本。"
