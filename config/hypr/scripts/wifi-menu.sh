#!/usr/bin/env bash
set -euo pipefail
iface="$(nmcli -t -f DEVICE,TYPE device status | awk -F: '$2=="wifi"{print $1;exit}')"
[[ -n "$iface" ]] || { notify-send 'Wi-Fi' 'Không tìm thấy card Wi-Fi'; exit 1; }
choice="$(nmcli -t -f IN-USE,SSID,SIGNAL device wifi list | awk -F: '$2!=""&&!seen[$2]++{printf "%s  %s  %s%%\\n",($1=="*"?"●":"○"),$2,$3}' | fuzzel --dmenu --prompt-only='Wi-Fi: ' || true)"
[[ -z "$choice" ]] && exit 0
ssid="$(printf '%s' "$choice" | sed -E 's/^[●○][[:space:]]+//;s/[[:space:]]+[0-9]+%$//')"
nmcli connection up id "$ssid" 2>/dev/null || { password="$(fuzzel --dmenu --password --prompt-only="Mật khẩu $ssid: " </dev/null || true)"; [[ -n "$password" ]] && nmcli device wifi connect "$ssid" password "$password" ifname "$iface"; }
