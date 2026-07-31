#!/usr/bin/env bash
set -euo pipefail

if command -v hyprlock >/dev/null 2>&1; then
  exec hyprlock
fi

exec swaylock -f
