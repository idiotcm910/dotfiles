#!/usr/bin/env bash
for name in 1 2 3 4 5; do
  if qtile cmd-obj -o group "$name" -f info | jq -e '.screen != null' >/dev/null 2>&1; then
    printf '%s\n' "$name"
    exit 0
  fi
done
printf '1\n'
