#!/usr/bin/env bash
set -euo pipefail

if ! command -v pavucontrol >/dev/null 2>&1; then
  notify-send -u normal 'Mic' 'Chưa cài pavucontrol.'
  exit 1
fi

# Tab 4 is Input Devices, which provides a proper microphone volume slider,
# mute control, level meter and input-device selector.
exec pavucontrol --tab=4
