#!/usr/bin/env bash
set -euo pipefail

case "${1:-}" in
  bamboo) fcitx5-remote -s bamboo; fcitx5-remote -o ;;
  english) fcitx5-remote -s keyboard-us ;;
  toggle) fcitx5-remote -t ;;
  config) exec fcitx5-configtool ;;
  *) exit 2 ;;
esac

pkill -RTMIN+9 -x waybar 2>/dev/null || true

