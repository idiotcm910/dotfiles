#!/usr/bin/env bash
set -euo pipefail

SCRIPT_PATH="$(readlink -f "${BASH_SOURCE[0]}")"
QTILE_DIR="$(cd "$(dirname "$SCRIPT_PATH")" && pwd)"
REPO_DIR="$(cd "$QTILE_DIR/../.." && pwd)"

feh --bg-scale "$REPO_DIR/image/wallpaper-1.jpg" &
if ! pgrep -x picom >/dev/null; then
    picom --config "$HOME/.config/picom/picom.conf" &
fi
"$HOME/.config/polybar/launch.sh" &
ibus-daemon -drx &
