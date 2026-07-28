#!/usr/bin/env bash
# tests/sway-install.test.sh — regression checks for the Sway config installer.
set -euo pipefail

REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
INSTALLER="$REPO/sway/install.sh"
tmp="$(mktemp -d)"
fail=0

cleanup() { rm -rf "$tmp"; }
trap cleanup EXIT

ok() { printf '  \033[32m✓\033[0m %s\n' "$1"; }
no() { printf '  \033[31m✗\033[0m %s\n' "$1"; fail=1; }

assert_file_contains() {
  local label="$1" file="$2" expected="$3"
  if [ -f "$file" ] && rg -Fq "$expected" "$file"; then ok "$label"; else no "$label"; fi
}

echo "── Dry run ──"
mkdir -p "$tmp/home/.config" "$tmp/source/foot"
printf 'new\n' > "$tmp/source/foot/foot.ini"
before="$(find "$tmp/home/.config" -print | sort)"
out="$(HOME="$tmp/home" CONFIG_SOURCE="$tmp/source" SKIP_APT=1 bash "$INSTALLER" --dry-run 2>&1)" || rc=$?
rc="${rc:-0}"
after="$(find "$tmp/home/.config" -print | sort)"
[ "$rc" -eq 0 ] && ok "dry-run exits successfully" || no "dry-run exits successfully"
[ "$before" = "$after" ] && ok "dry-run does not write ~/.config" || no "dry-run does not write ~/.config"
printf '%s' "$out" | rg -Fq 'DRY RUN' && ok "dry-run announces itself" || no "dry-run announces itself"

echo ""
echo "── Apply with backup ──"
mkdir -p "$tmp/home/.config/foot"
printf 'old\n' > "$tmp/home/.config/foot/foot.ini"
HOME="$tmp/home" CONFIG_SOURCE="$tmp/source" SKIP_APT=1 bash "$INSTALLER"
assert_file_contains "apply copies source config" "$tmp/home/.config/foot/foot.ini" "new"
backup="$(find "$tmp/home/.config" -maxdepth 1 -type d -name 'foot.backup-*' | head -n 1)"
assert_file_contains "apply preserves old config in backup" "$backup/foot.ini" "old"

echo ""
echo "── Sway core config ──"
SWAY_SOURCE="$REPO/sway/config/sway"
assert_file_contains "entry config includes component files" "$SWAY_SOURCE/config" "include ~/.config/sway/config.d/*.conf"
assert_file_contains "theme defines Super as main modifier" "$SWAY_SOURCE/config.d/00-theme.conf" 'set $mod Mod4'
assert_file_contains "terminal shortcut opens Foot" "$SWAY_SOURCE/config.d/20-keybinds.conf" 'bindsym $mod+Return exec foot'
assert_file_contains "launcher shortcut opens Wofi" "$SWAY_SOURCE/config.d/20-keybinds.conf" 'bindsym $mod+d exec wofi --show drun'
assert_file_contains "close shortcut is explicit" "$SWAY_SOURCE/config.d/20-keybinds.conf" 'bindsym $mod+Shift+q kill'
assert_file_contains "lock shortcut uses swaylock" "$SWAY_SOURCE/config.d/20-keybinds.conf" 'bindsym $mod+l exec swaylock'
assert_file_contains "workspace shortcut one exists" "$SWAY_SOURCE/config.d/20-keybinds.conf" 'bindsym $mod+1 workspace number 1'
assert_file_contains "workspace shortcut nine exists" "$SWAY_SOURCE/config.d/20-keybinds.conf" 'bindsym $mod+9 workspace number 9'
assert_file_contains "screenshot shortcut uses grim and slurp" "$SWAY_SOURCE/config.d/20-keybinds.conf" 'grim -g "$(slurp)"'
assert_file_contains "resize shortcut enters resize mode" "$SWAY_SOURCE/config.d/20-keybinds.conf" 'bindsym $mod+r mode "resize"'
assert_file_contains "resize mode is defined" "$SWAY_SOURCE/config.d/20-keybinds.conf" 'mode "resize" {'
assert_file_contains "resize mode exits with Escape" "$SWAY_SOURCE/config.d/20-keybinds.conf" 'bindsym Escape mode "default"'
assert_file_contains "resize mode exits with Enter" "$SWAY_SOURCE/config.d/20-keybinds.conf" 'bindsym Return mode "default"'

echo ""
echo "── Companion UI config ──"
CONFIG_SOURCE="$REPO/sway/config"
assert_file_contains "Waybar shows Sway workspaces" "$CONFIG_SOURCE/waybar/config.jsonc" '"sway/workspaces"'
assert_file_contains "Waybar shows the focused window" "$CONFIG_SOURCE/waybar/config.jsonc" '"sway/window"'
assert_file_contains "Waybar includes essential system modules" "$CONFIG_SOURCE/waybar/config.jsonc" '"cpu", "memory", "network", "pulseaudio", "battery", "clock", "tray"'
assert_file_contains "Waybar uses Tokyo Night background" "$CONFIG_SOURCE/waybar/style.css" '#1a1b26'
assert_file_contains "Waybar uses Tokyo Night cyan focus" "$CONFIG_SOURCE/waybar/style.css" '#7dcfff'
assert_file_contains "Foot uses JetBrains Mono" "$CONFIG_SOURCE/foot/foot.ini" 'font=JetBrains Mono:size=11'
assert_file_contains "Mako uses Tokyo Night background" "$CONFIG_SOURCE/mako/config" 'background-color=#24283b'
assert_file_contains "Swaylock uses cyan ring" "$CONFIG_SOURCE/swaylock/config" 'inside-color=1a1b26'

echo ""
echo "── Sway guide ──"
GUIDE="$REPO/guide/sway.html"
assert_file_contains "guide declares Vietnamese language" "$GUIDE" 'lang="vi"'
assert_file_contains "guide registers the Sway page" "$GUIDE" 'data-page="sway"'
assert_file_contains "guide loads shared stylesheet" "$GUIDE" 'href="assets/style.css"'
assert_file_contains "guide loads shared behavior" "$GUIDE" 'src="assets/app.js"'
assert_file_contains "guide explains first login" "$GUIDE" 'Bắt đầu'
assert_file_contains "guide documents shortcuts" "$GUIDE" 'Phím tắt'
assert_file_contains "guide documents workspaces" "$GUIDE" 'Workspace'
assert_file_contains "guide documents screenshots" "$GUIDE" 'Ảnh chụp màn hình'
assert_file_contains "guide documents config changes" "$GUIDE" 'Chỉnh cấu hình'
assert_file_contains "guide documents recovery" "$GUIDE" 'Khôi phục'
assert_file_contains "shared sidebar links Sway" "$REPO/guide/assets/app.js" 'sway.html'
assert_file_contains "guide index links Sway" "$REPO/guide/index.html" 'sway.html'
assert_file_contains "guide starts a developer work session" "$GUIDE" 'Phiên lập trình đầu tiên'
assert_file_contains "guide explains application launcher" "$GUIDE" 'Mở ứng dụng'
assert_file_contains "guide explains resize mode" "$GUIDE" 'Resize cửa sổ'
assert_file_contains "guide explains the status bar" "$GUIDE" 'Waybar'
assert_file_contains "guide explains clipboard behavior" "$GUIDE" 'Clipboard'
assert_file_contains "guide explains external monitors" "$GUIDE" 'Màn hình ngoài'
assert_file_contains "guide includes troubleshooting" "$GUIDE" 'Khi có trục trặc'
assert_file_contains "guide calls out pending packages" "$GUIDE" 'Package còn thiếu'
assert_file_contains "guide distinguishes source and live config" "$GUIDE" 'Source và live config'
assert_file_contains "guide documents resize shortcut" "$GUIDE" 'Super+R'
assert_file_contains "guide documents launcher shortcut" "$GUIDE" 'Super+D'
assert_file_contains "guide documents config validation" "$GUIDE" 'sway -C'
assert_file_contains "guide documents output inspection" "$GUIDE" 'swaymsg -t get_outputs'
assert_file_contains "guide documents package-limited apply" "$GUIDE" 'SKIP_APT=1'
assert_file_contains "guide documents GNOME recovery" "$GUIDE" 'chọn GNOME'

echo ""
[ "$fail" -eq 0 ] && echo "TẤT CẢ ĐỀU ĐẠT" || echo "CÓ TEST HỎNG"
exit "$fail"
