#!/usr/bin/env bash
set -euo pipefail

echo "[1/6] Stopping old React Native/Metro processes..."
pkill -f "react-native" || true
pkill -f "metro" || true
pkill -f "node.*cli.js start" || true

echo "[2/6] Clearing Watchman watches (if installed)..."
if command -v watchman >/dev/null 2>&1; then
  watchman watch-del-all || true
else
  echo "watchman not found, skipping."
fi

echo "[3/6] Clearing Metro/React temp caches..."
rm -rf "${TMPDIR:-/tmp}"/metro-* || true
rm -rf "${TMPDIR:-/tmp}"/react-* || true
rm -rf "${TMPDIR:-/tmp}"/haste-map-* || true

echo "[4/6] Ensuring port 8081 is free..."
if command -v lsof >/dev/null 2>&1; then
  pids="$(lsof -ti tcp:8081 || true)"
  if [ -n "${pids}" ]; then
    kill -9 ${pids} || true
  fi
fi

echo "[5/6] Starting Metro with reset cache..."
npm start -- --reset-cache
