#!/usr/bin/env bash
set -euo pipefail

volume="$(wpctl get-volume @DEFAULT_AUDIO_SOURCE@ 2>/dev/null || true)"
if [[ -z "$volume" ]]; then
  printf '{"text":"<span font=\x27Font Awesome 6 Pro 14\x27></span>","class":"missing","tooltip":"Không tìm thấy microphone"}\n'
elif grep -q '\[MUTED\]' <<< "$volume"; then
  printf '{"text":"<span font=\x27Font Awesome 6 Pro 14\x27></span>  muted","class":"muted","tooltip":"Mic: đã tắt\\nClick: mở bảng chỉnh · Chuột phải: bật mic"}\n'
else
  percent="$(awk '{ printf "%.0f", $2 * 100 }' <<< "$volume")"
  printf '{"text":"<span font=\x27Font Awesome 6 Pro 14\x27></span>  %s%%","class":"on","tooltip":"Mic: %s%%\\nClick: mở slider · Chuột phải: tắt mic"}\n' "$percent" "$percent"
fi
