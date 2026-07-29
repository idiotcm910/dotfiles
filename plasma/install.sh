#!/usr/bin/env bash
# Install Plasma Wayland and prepare its first login; it never deletes Sway.
set -euo pipefail
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd -P)"
mapfile -t packages < <(awk 'NF && $1 !~ /^#/' "$ROOT_DIR/packages.txt")
sudo apt update
sudo apt install -y "${packages[@]}"
install -d "$HOME/.local/share/color-schemes" "$HOME/.config/autostart" "$HOME/.config/plasma-workspace/env" "$HOME/.config/autostart-scripts"
install -m 0644 "$ROOT_DIR/config/TokyoNight.colors" "$HOME/.local/share/color-schemes/TokyoNight.colors"
install -m 0644 "$ROOT_DIR/config/ibus.desktop" "$HOME/.config/autostart/ibus-bamboo.desktop"
install -m 0644 "$ROOT_DIR/config/ibus.sh" "$HOME/.config/plasma-workspace/env/ibus.sh"
install -m 0755 "$ROOT_DIR/config/first-login-polish.sh" "$HOME/.config/autostart-scripts/first-login-polish.sh"
gsettings set org.freedesktop.ibus.general preload-engines "['BambooUs', 'Bamboo']"
gsettings set org.freedesktop.ibus.general engines-order "['BambooUs', 'Bamboo']"
kwriteconfig5 --file kdeglobals --group General --key ColorScheme TokyoNight
kwriteconfig5 --file kdeglobals --group General --key widgetStyle Breeze
kwriteconfig5 --file kwinrc --group Compositing --key AnimationSpeed 3
kwriteconfig5 --file kwinrc --group Plugins --key blurEnabled true
kwriteconfig5 --file kwinrc --group Plugins --key translucencyEnabled true
kwriteconfig5 --file kwinrc --group Windows --key FocusPolicy ClickToFocus
kwriteconfig5 --file kwinrc --group Windows --key BorderlessMaximizedWindows true
printf '\nLog out, select "Plasma (Wayland)" at GDM, and log in. The first login creates a top stats panel and starts Bamboo.\n'
printf 'After confirming Plasma works, run: bash %s/remove-sway.sh\n' "$ROOT_DIR"
