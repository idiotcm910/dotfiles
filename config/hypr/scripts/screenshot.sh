#!/usr/bin/env bash
set -euo pipefail
mode="${1:-area}"
directory="${XDG_PICTURES_DIR:-$HOME/Pictures}/Screenshots"
mkdir -p "$directory"
file="$directory/$(date '+%Y-%m-%d_%H-%M-%S').png"
if [[ "$mode" == full ]]; then
  grim "$file"
else
  grim -g "$(slurp)" "$file"
fi
wl-copy < "$file"
satty --filename "$file" --output-filename "$file"
