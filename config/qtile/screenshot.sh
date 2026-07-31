#!/usr/bin/env bash
set -euo pipefail

screenshots_dir="$HOME/Pictures/Screenshots"
mkdir -p "$screenshots_dir"
filename="$screenshots_dir/Screenshot_$(date +%Y-%m-%d_%H-%M-%S-%N).png"

if [[ "${1:-area}" == "full" ]]; then
    maim "$filename"
else
    maim --select "$filename"
fi

exec satty --filename "$filename" --output-filename "$filename"
