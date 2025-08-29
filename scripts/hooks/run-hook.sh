#!/bin/bash
# Wrapper script to run individual hooks

if [ $# -eq 0 ]; then
    echo "Usage: $0 <hook-name> [args...]"
    echo "Available hooks:"
    ls .claude/hooks/*.js | xargs -n 1 basename | sed 's/.js$//' | sed 's/^/  - /'
    exit 1
fi

HOOK_NAME="$1"
shift

HOOK_FILE=".claude/hooks/$HOOK_NAME.js"

if [ ! -f "$HOOK_FILE" ]; then
    echo "Error: Hook not found: $HOOK_NAME"
    exit 1
fi

echo "Running hook: $HOOK_NAME"
node "$HOOK_FILE" "$@"
