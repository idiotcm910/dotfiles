#!/usr/bin/env bash
set -euo pipefail

if command -v swaync-client >/dev/null 2>&1; then
  exec swaync-client -t -sw
fi

choice="$(printf 'Tăng 5%%\nGiảm 5%%\nBật/tắt tiếng\nMở Audio Mixer\n' | fuzzel --dmenu --prompt-only='Âm thanh: ' || true)"
case "$choice" in 'Tăng 5%') wpctl set-volume -l 1.5 @DEFAULT_AUDIO_SINK@ 5%+;; 'Giảm 5%') wpctl set-volume @DEFAULT_AUDIO_SINK@ 5%-;; 'Bật/tắt tiếng') wpctl set-mute @DEFAULT_AUDIO_SINK@ toggle;; 'Mở Audio Mixer') pavucontrol;; esac
