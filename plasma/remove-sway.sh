#!/usr/bin/env bash
# Only remove Sway after a Plasma Wayland session exists.
set -euo pipefail
[ -f /usr/share/wayland-sessions/plasmawayland.desktop ] || { printf 'Plasma Wayland session not found; refusing to remove Sway.\n' >&2; exit 1; }
printf '%s\n' 'This purges Sway, Waybar, Wofi, Foot, Mako, Grim and Slurp. Their configs move to Trash.'
read -r -p 'Type REMOVE-SWAY to continue: ' confirmation
[ "$confirmation" = REMOVE-SWAY ] || { printf 'Cancelled.\n'; exit 0; }
sudo apt purge -y sway swaybg swayidle swaylock waybar wofi foot mako-notifier grim slurp
for prefix in sway swaylock waybar wofi foot mako; do
  while IFS= read -r -d '' target; do gio trash -- "$target"; done < <(find "$HOME/.config" -maxdepth 1 \( -name "$prefix" -o -name "$prefix.backup-*" \) -print0)
done
printf 'Sway removed. ~/thai/system/sway remains as a recoverable source archive.\n'
