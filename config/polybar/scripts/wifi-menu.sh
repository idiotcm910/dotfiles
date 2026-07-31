#!/usr/bin/env bash
set -euo pipefail

theme="$HOME/.config/rofi/aurora.rasi"
iface="$(nmcli -t -f DEVICE,TYPE device status | awk -F: '$2 == "wifi" {print $1; exit}')"
[[ -n "$iface" ]] || { notify-send "Wi‑Fi" "Không tìm thấy card Wi‑Fi"; exit 1; }

menu() { rofi -dmenu -i -p "Wi‑Fi" -theme "$theme" -mesg "Chọn mạng để kết nối"; }
radio="$(nmcli -t -f WIFI general)"
if [[ "$radio" != "enabled" ]]; then
  choice="$(printf 'Bật Wi‑Fi\n' | menu)"
  [[ "$choice" == "Bật Wi‑Fi" ]] && nmcli radio wifi on
  exit 0
fi

networks="$(nmcli -t --escape no -f IN-USE,SSID,SIGNAL,SECURITY device wifi list --rescan auto | awk -F: '
  $2 != "" && !seen[$2]++ { printf "%s  %s  %s%%  %s\n", ($1 == "*" ? "●" : "○"), $2, $3, $4 }
')"
choice="$(printf 'Tắt Wi‑Fi\nNgắt kết nối\n%s\n' "$networks" | menu || true)"
[[ -z "$choice" ]] && exit 0
case "$choice" in
  "Tắt Wi‑Fi") nmcli radio wifi off ;;
  "Ngắt kết nối") nmcli device disconnect "$iface" ;;
  *)
    ssid="$(printf '%s' "$choice" | sed -E 's/^[●○][[:space:]]+//; s/[[:space:]]+[0-9]+%[[:space:]].*$//')"
    if nmcli -t -f NAME connection show | grep -Fxq "$ssid"; then
      nmcli connection up id "$ssid"
    else
      password="$(printf '' | rofi -dmenu -password -p "Mật khẩu: $ssid" -theme "$theme" || true)"
      [[ -n "$password" ]] && nmcli device wifi connect "$ssid" password "$password" ifname "$iface"
    fi
    notify-send "Wi‑Fi" "Đang kết nối $ssid"
    ;;
esac
