#!/usr/bin/env bash
set -euo pipefail

volume="$(wpctl get-volume @DEFAULT_AUDIO_SOURCE@ 2>/dev/null || true)"
if [[ -z "$volume" ]]; then
  printf '{"text":"","class":"missing","tooltip":"Không tìm thấy microphone"}\n'
elif grep -q '\[MUTED\]' <<< "$volume"; then
  printf '{"text":"","class":"muted","tooltip":"Mic: đã tắt (click để bật)"}\n'
else
  printf '{"text":"","class":"on","tooltip":"Mic: đang bật (click để tắt)"}\n'
fi

