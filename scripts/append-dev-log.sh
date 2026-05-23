#!/usr/bin/env bash
# Append a line to the Development log section in README.md (newest first)
# Usage: ./scripts/append-dev-log.sh "Commit subject" [optional-short-sha]

set -euo pipefail

MSG="${1:-}"
SHA="${2:-}"

if [[ -z "$MSG" ]]; then
  echo "Usage: $0 \"Commit message subject\" [sha]" >&2
  exit 1
fi

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
README="$ROOT/README.md"
START_MARKER="<!-- DEVLOG:START -->"

if [[ ! -f "$README" ]]; then
  echo "README.md not found" >&2
  exit 1
fi

if ! grep -q "$START_MARKER" "$README"; then
  echo "Dev log marker $START_MARKER not found in README.md" >&2
  exit 1
fi

DATE="$(date +%Y-%m-%d)"
SHA_PART=""
if [[ -n "$SHA" ]]; then
  SHA_PART=" (\`${SHA:0:7}\`)"
fi

SAFE_MSG="${MSG//|/\\|}"
LINE="- **${DATE}**${SHA_PART} — ${SAFE_MSG}"

if grep -Fq -- "$LINE" "$README"; then
  exit 0
fi

TMP="$(mktemp)"
awk -v line="$LINE" -v marker="$START_MARKER" '
  $0 == marker { print; print line; print ""; next }
  { print }
' "$README" > "$TMP"
mv "$TMP" "$README"
