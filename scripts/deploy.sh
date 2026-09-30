#!/usr/bin/env bash
# Production deploy, run on the server after the code is updated to origin/main
# (the GitHub Actions workflow does that; by hand: git fetch && git reset --hard origin/main && bash scripts/deploy.sh).
#
# The live site keeps serving the old build while the new one compiles into .next-build.
# Only the swap and restart cause a few seconds of downtime. If the new build doesn't answer,
# the previous build is put back and the deploy fails, which GitHub reports by email.
set -euo pipefail

APP_NAME="qr-genie-next"
PORT=3000
cd "$(dirname "$0")/.."

# One deploy at a time
exec 9>/tmp/qr-genie-deploy.lock
flock -n 9 || { echo "Another deploy is running."; exit 1; }

echo "==> Deploying $(git log -1 --format='%h %s')"
echo "    Node $(node -v), npm $(npm -v)"

# Dependencies: reinstall only when the lockfile changed (npm ci briefly empties node_modules)
LOCK_HASH="$(sha256sum package-lock.json | cut -d' ' -f1)"
if [ ! -d node_modules ] || [ "$(cat node_modules/.deploy-lock-hash 2>/dev/null)" != "$LOCK_HASH" ]; then
  echo "==> Installing dependencies"
  npm ci --include=dev --no-audit --no-fund
  echo "$LOCK_HASH" > node_modules/.deploy-lock-hash
else
  echo "==> Dependencies unchanged"
  npx prisma generate >/dev/null
fi

echo "==> Applying database migrations"
npx prisma migrate deploy

echo "==> Building"
# The build needs roughly 1.5 GB; on a small server that only works with swap turned on
MEM_KB="$(awk '/^(MemTotal|SwapTotal):/ {sum += $2} END {print sum}' /proc/meminfo)"
if [ "$MEM_KB" -lt 1500000 ]; then
  echo "!!  Only $((MEM_KB / 1024)) MB of memory + swap: the build would be killed. Turn swap on (swapon --show) and deploy again."
  exit 1
fi
rm -rf .next-build
NODE_ENV=production NEXT_DIST_DIR=.next-build npx next build

echo "==> Switching to the new build"
rm -rf .next-prev
if [ -d .next ]; then mv .next .next-prev; fi
mv .next-build .next
pm2 restart "$APP_NAME"
pm2 save >/dev/null

healthy() {
  for _ in $(seq 1 30); do
    if curl -fsS -o /dev/null --max-time 5 "http://127.0.0.1:$PORT/"; then return 0; fi
    sleep 2
  done
  return 1
}

if healthy; then
  echo "==> Live and healthy"
else
  echo "!!  New build is not responding; restoring the previous build"
  if [ -d .next-prev ]; then
    rm -rf .next-failed
    mv .next .next-failed
    mv .next-prev .next
    pm2 restart "$APP_NAME"
  fi
  exit 1
fi
