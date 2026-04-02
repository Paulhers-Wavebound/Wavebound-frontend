#!/bin/bash
COMMAND=$(cat | jq -r '.tool_input.command // empty')
BLOCKED_PATTERNS="rm -rf|git push --force|git push -f|DROP TABLE|DROP DATABASE|docker compose down -v"

if echo "$COMMAND" | grep -qE "$BLOCKED_PATTERNS"; then
  echo "BLOCKED: Destructive command detected: $COMMAND" >&2
  exit 2
fi
exit 0
