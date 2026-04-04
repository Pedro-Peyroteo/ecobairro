#!/bin/sh
set -eu

PACKAGE_NAME="${1:?Package name is required}"
shift

WORKSPACE_ROOT="/workspace"
LOCK_DIR="${WORKSPACE_ROOT}/node_modules/.install-lock"
LOCK_TIMESTAMP="${LOCK_DIR}/timestamp"
MARKER_FILE="${WORKSPACE_ROOT}/node_modules/.workspace-ready"
LOCK_TIMEOUT=300  # seconds — treat lock as stale after 5 minutes

needs_install() {
  if [ ! -f "${MARKER_FILE}" ]; then
    return 0
  fi

  for manifest in \
    "${WORKSPACE_ROOT}/package.json" \
    "${WORKSPACE_ROOT}/pnpm-workspace.yaml" \
    "${WORKSPACE_ROOT}/apps/web/package.json" \
    "${WORKSPACE_ROOT}/apps/api/package.json" \
    "${WORKSPACE_ROOT}/packages/contracts/package.json" \
    "${WORKSPACE_ROOT}/packages/config/package.json" \
    "${WORKSPACE_ROOT}/packages/tsconfig/package.json" \
    "${WORKSPACE_ROOT}/packages/eslint-config/package.json"
  do
    if [ "${manifest}" -nt "${MARKER_FILE}" ]; then
      return 0
    fi
  done

  return 1
}

acquire_lock() {
  while true; do
    if mkdir "${LOCK_DIR}" 2>/dev/null; then
      date +%s > "${LOCK_TIMESTAMP}"
      return 0
    fi

    # Remove stale lock if the holder died (no cleanup on SIGKILL)
    if [ ! -f "${LOCK_TIMESTAMP}" ]; then
      # Lock dir exists but no timestamp — orphaned lock from a crashed container
      echo "Orphaned lock detected (no timestamp), removing..."
      rm -rf "${LOCK_DIR}"
      continue
    fi

    lock_time=$(cat "${LOCK_TIMESTAMP}" 2>/dev/null || echo 0)
    age=$(( $(date +%s) - lock_time ))
    if [ "${age}" -gt "${LOCK_TIMEOUT}" ]; then
      echo "Stale lock detected (age: ${age}s), removing..."
      rm -rf "${LOCK_DIR}"
      continue
    fi

    echo "Waiting for pnpm workspace dependency lock..."
    sleep 2
  done
}

mkdir -p "${WORKSPACE_ROOT}/node_modules"

acquire_lock

cleanup() {
  rm -rf "${LOCK_DIR}" >/dev/null 2>&1 || true
}

trap cleanup EXIT

if needs_install; then
  echo "Installing workspace dependencies..."
  pnpm install --no-frozen-lockfile
  date -u +"%Y-%m-%dT%H:%M:%SZ" > "${MARKER_FILE}"
else
  echo "Using cached workspace dependencies."
fi

cleanup
trap - EXIT

exec pnpm --filter "${PACKAGE_NAME}" "$@"
