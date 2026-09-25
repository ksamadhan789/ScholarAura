#!/bin/bash
# Installs npm dependencies at the start of a Claude Code on the web session so
# type checking, tests and builds work straight away. Only runs in the cloud.
set -euo pipefail

if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

cd "$CLAUDE_PROJECT_DIR"

# `npm install` (not `npm ci`) so the cached container's node_modules is reused.
# Its postinstall step runs `prisma generate`, so the Prisma client is ready too.
npm install --no-audit --no-fund
