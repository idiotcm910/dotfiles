#!/usr/bin/env bash
set -euo pipefail

if command -v guvcview >/dev/null 2>&1; then
  exec guvcview
fi

notify-send -u normal 'Camera' 'Chưa cài guvcview. Hãy chạy restore.sh để cài giao diện camera.'

