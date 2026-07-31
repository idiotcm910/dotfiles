#!/usr/bin/env bash
set -euo pipefail
config_dir="$HOME/.config/eww"
eww --config "$config_dir" daemon >/tmp/eww-daemon.log 2>&1 &
sleep 1
eww --config "$config_dir" open aurora
pkill -x polybar || true
