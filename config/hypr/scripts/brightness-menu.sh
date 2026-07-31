#!/usr/bin/env bash
set -euo pipefail

if command -v swaync-client >/dev/null 2>&1; then
  exec swaync-client -t -sw
fi

choice="$(printf 'Tăng 5%%\nGiảm 5%%\n25%%\n50%%\n75%%\n100%%\n' | fuzzel --dmenu --prompt-only='Độ sáng: ' || true)"
case "$choice" in 'Tăng 5%') brightnessctl set +5%;; 'Giảm 5%') brightnessctl set 5%-;; 25%|50%|75%|100%) brightnessctl set "$choice";; esac
