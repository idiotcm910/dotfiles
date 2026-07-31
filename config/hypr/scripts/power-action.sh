#!/usr/bin/env bash
set -euo pipefail

action="${1:-}"
lock_screen() {
  if command -v hyprlock >/dev/null 2>&1; then
    hyprlock &
  else
    swaylock -f &
  fi
}

case "$action" in
  lock) exec "${HOME}/.config/hypr/scripts/lock-screen.sh" ;;
  suspend) lock_screen; sleep 0.5; exec systemctl suspend ;;
  logout)
    if command -v hyprshutdown >/dev/null 2>&1; then exec hyprshutdown; fi
    exec hyprctl dispatch exit
    ;;
  reboot)
    if command -v hyprshutdown >/dev/null 2>&1; then exec hyprshutdown -t 'Khởi động lại…' --post-cmd 'systemctl reboot'; fi
    exec systemctl reboot
    ;;
  shutdown)
    if command -v hyprshutdown >/dev/null 2>&1; then exec hyprshutdown -t 'Tắt máy…' --post-cmd 'systemctl poweroff'; fi
    exec systemctl poweroff
    ;;
  *) printf 'Power action không hợp lệ: %s\n' "$action" >&2; exit 2 ;;
esac
