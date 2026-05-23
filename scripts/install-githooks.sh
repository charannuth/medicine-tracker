#!/usr/bin/env bash
# Point this repo at tracked hooks in .githooks/
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
chmod +x "$ROOT/.githooks/"* "$ROOT/scripts/append-dev-log.sh" 2>/dev/null || true
git -C "$ROOT" config core.hooksPath .githooks
echo "Git hooks installed (.githooks → core.hooksPath)"
