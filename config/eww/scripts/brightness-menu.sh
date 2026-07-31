#!/usr/bin/env bash
set -euo pipefail
theme="$HOME/.config/rofi/aurora.rasi"
level="$(brightnessctl -m | awk -F, '{print $4}')"
choice="$(printf 'Tăng 5%%\nGiảm 5%%\n25%%\n50%%\n75%%\n100%%\n' | rofi -dmenu -i -p "Độ sáng $level" -theme "$theme" || true)"
case "$choice" in
  'Tăng 5%') brightnessctl set +5% ;;
  'Giảm 5%') brightnessctl set 5%- ;;
  25%|50%|75%|100%) brightnessctl set "$choice" ;;
esac
