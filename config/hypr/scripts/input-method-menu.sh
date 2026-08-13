#!/usr/bin/env bash
set -euo pipefail

choice="$(printf '%s\n' \
  '󰌌  Bamboo (Tiếng Việt)' \
  '󰌌  English (US)' \
  '󰌌  Bật/tắt bộ gõ' \
  '⚙  Mở cấu hình Fcitx5' | fuzzel --dmenu --prompt='Bộ gõ: ' --width=36)"

case "$choice" in
  *'Bamboo'*) fcitx5-remote -s bamboo; fcitx5-remote -o ;;
  *'English'*) fcitx5-remote -s keyboard-us ;;
  *'Bật/tắt'*) fcitx5-remote -t ;;
  *'Mở cấu hình'*) fcitx5-configtool ;;
esac

pkill -RTMIN+9 -x waybar 2>/dev/null || true

