#!/usr/bin/env bash
set -euo pipefail

source_id="@DEFAULT_AUDIO_SOURCE@"
volume="$(wpctl get-volume "$source_id" 2>/dev/null || true)"
if [[ -z "$volume" ]]; then
  notify-send -u normal 'Mic' 'Không tìm thấy microphone PipeWire.'
  exit 1
fi

wpctl set-mute "$source_id" toggle
pkill -RTMIN+8 -x waybar 2>/dev/null || true
if wpctl get-volume "$source_id" | grep -q '\[MUTED\]'; then
  notify-send 'Mic' 'Đã tắt microphone'
else
  notify-send 'Mic' 'Đã bật microphone'
fi
