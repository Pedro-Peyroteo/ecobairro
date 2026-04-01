#!/bin/sh
set -eu

PACKAGE_NAME="${1:?Package name is required}"
shift

WORKSPACE_ROOT="/workspace"
LOCK_DIR="${WORKSPACE_ROOT}/node_modules/.install-lock"
MARKER_FILE="${WORKSPACE_ROOT}/node_modules/.workspace-ready"

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

mkdir -p "${WORKSPACE_ROOT}/node_modules"

while ! mkdir "${LOCK_DIR}" 2>/dev/null; do
  echo "Waiting for pnpm workspace dependency lock..."
  sleep 2
done

cleanup() {
  rmdir "${LOCK_DIR}" >/dev/null 2>&1 || true
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

