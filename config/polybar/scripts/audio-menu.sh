#!/usr/bin/env bash
set -euo pipefail

theme="$HOME/.config/rofi/aurora.rasi"
volume="$(wpctl get-volume @DEFAULT_AUDIO_SINK@ | awk '{printf "%d", $2 * 100}')"
choice="$(printf 'Tăng 5%%\nGiảm 5%%\nBật/tắt tiếng\nMở Audio Mixer\n' | rofi -dmenu -i -p "Âm thanh $volume%%" -theme "$theme" || true)"
case "$choice" in
  "Tăng 5%") wpctl set-volume -l 1.5 @DEFAULT_AUDIO_SINK@ 5%+ ;;
  "Giảm 5%") wpctl set-volume @DEFAULT_AUDIO_SINK@ 5%- ;;
  "Bật/tắt tiếng") wpctl set-mute @DEFAULT_AUDIO_SINK@ toggle ;;
  "Mở Audio Mixer") exec pavucontrol ;;
esac
