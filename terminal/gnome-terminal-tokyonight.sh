#!/usr/bin/env bash
# gnome-terminal-tokyonight.sh — set màu GNOME Terminal khớp tokyonight (night),
# đồng bộ với colorscheme của Neovim. Áp vào profile MẶC ĐỊNH.
#   Dùng:  bash gnome-terminal-tokyonight.sh [transparency%]
#   transparency%: 0 = đục, 100 = trong suốt tối đa (mặc định 22).
set -euo pipefail

TRANSPARENCY="${1:-22}"

if ! command -v gnome-terminal >/dev/null 2>&1; then
  echo "gnome-terminal chưa cài — bỏ qua."
  exit 0
fi

# UUID profile mặc định
p="$(gsettings get org.gnome.Terminal.ProfilesList default | tr -d \"\')"
base="org.gnome.Terminal.Legacy.Profile:/org/gnome/terminal/legacy/profiles:/:$p/"

# ── Màu tokyonight (night) ──
gsettings set "$base" use-theme-colors false
gsettings set "$base" background-color '#1A1B26'
gsettings set "$base" foreground-color '#C0CAF5'
gsettings set "$base" bold-color-same-as-fg true
gsettings set "$base" cursor-colors-set true
gsettings set "$base" cursor-background-color '#C0CAF5'
gsettings set "$base" cursor-foreground-color '#1A1B26'
gsettings set "$base" highlight-colors-set true
gsettings set "$base" highlight-background-color '#33467C'
gsettings set "$base" highlight-foreground-color '#C0CAF5'
gsettings set "$base" palette "['#15161E','#F7768E','#9ECE6A','#E0AF68','#7AA2F7','#BB9AF7','#7DCFFF','#A9B1D6','#414868','#F7768E','#9ECE6A','#E0AF68','#7AA2F7','#BB9AF7','#7DCFFF','#C0CAF5']"

# ── Trong suốt (khớp nvim transparent + thấy wallpaper) ──
gsettings set "$base" use-theme-transparency false
gsettings set "$base" use-transparent-background true
gsettings set "$base" background-transparency-percent "$TRANSPARENCY"

echo "✓ GNOME Terminal: tokyonight night, trong suốt ${TRANSPARENCY}% (profile $p)"
echo "  Mở cửa sổ GNOME Terminal mới để thấy."
