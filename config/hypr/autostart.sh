#!/usr/bin/env bash
set -euo pipefail
repo_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
swaybg -i "$repo_dir/image/wallpaper-1.jpg" -m fill &
mako &
waybar &
ibus-daemon -drx &
/usr/lib/polkit-kde-authentication-agent-1 &
