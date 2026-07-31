#!/usr/bin/env bash
set -euo pipefail
script_dir="$(cd "$(dirname "$(readlink -f "${BASH_SOURCE[0]}")")" && pwd)"
repo_dir="$(cd "$script_dir/../.." && pwd)"
wallpaper="$repo_dir/image/wallpaper-1.jpg"

if [[ -f "$wallpaper" ]]; then
  swaybg -i "$wallpaper" -m fill &
else
  printf 'Hyprland: không tìm thấy wallpaper: %s\n' "$wallpaper" >&2
fi
swaync &
waybar &
fcitx5 -d &
/usr/lib/polkit-kde-authentication-agent-1 &
