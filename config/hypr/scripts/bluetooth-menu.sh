#!/usr/bin/env bash
set -euo pipefail

if command -v orbit >/dev/null 2>&1; then
  exec orbit toggle --tab bluetooth
fi

if command -v blueman-manager >/dev/null 2>&1; then
  # Blueman does not always start discovery when opened from a Waybar click.
  # Prime BlueZ first so nearby devices populate immediately in its manager.
  bluetoothctl --timeout 12 scan on >/dev/null 2>&1 &
  sleep 0.4
  exec blueman-manager
fi

notify-send 'Bluetooth' 'Cài package blueman để mở trình quản lý Bluetooth.'
