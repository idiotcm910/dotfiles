#!/usr/bin/env bash
set -euo pipefail

source_id="@DEFAULT_AUDIO_SOURCE@"

if ! wpctl get-volume "$source_id" >/dev/null 2>&1; then
  notify-send -u normal 'Mic' 'Không tìm thấy microphone PipeWire.'
  exit 1
fi

case "${1:-}" in
  up)
    wpctl set-volume -l 1.5 "$source_id" 5%+
    ;;
  down)
    wpctl set-volume "$source_id" 5%-
    ;;
  *)
    printf 'Usage: %s {up|down}\n' "${0##*/}" >&2
    exit 2
    ;;
esac

# Adjusting the level is an explicit request to use the microphone.
wpctl set-mute "$source_id" 0
pkill -RTMIN+8 -x waybar 2>/dev/null || true

volume="$(wpctl get-volume "$source_id")"
percent="$(awk '{ printf "%.0f", $2 * 100 }' <<< "$volume")"
notify-send -h "int:value:$percent" 'Mic' "Âm lượng: ${percent}%"
