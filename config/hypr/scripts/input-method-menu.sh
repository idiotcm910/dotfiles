#!/usr/bin/env bash
set -euo pipefail

choice="$(printf '%s\n' \
  '󰌌  Lotus (Tiếng Việt)' \
  '󰌌  English' \
  '󰔎  Bật/tắt bộ gõ' \
  '⚙  Mở cấu hình Fcitx5' | fuzzel --dmenu --prompt='Bộ gõ: ' --width=36)"

case "$choice" in
  *'Lotus'* | *'Bamboo'*) fcitx5-remote -s lotus; fcitx5-remote -o ;;
  *'English'*) fcitx5-remote -s keyboard-us ;;
  *'Bật/tắt'*) fcitx5-remote -t ;;
  *'Mở cấu hình'*) fcitx5-configtool ;;
esac
