#!/usr/bin/env bash
set -euo pipefail

method="$(fcitx5-remote -n 2>/dev/null || true)"
state="$(fcitx5-remote 2>/dev/null || true)"

if [[ "$method" == "bamboo" && "$state" == "2" ]]; then
  printf '{"text":"<span font=\\"Font Awesome 6 Pro 14\\"></span>  VI","class":"vietnamese","tooltip":"Bamboo: đang bật (Alt+Shift+Space để đổi)"}\n'
elif [[ "$method" == "keyboard-us" ]]; then
  printf '{"text":"<span font=\\"Font Awesome 6 Pro 14\\"></span>  EN","class":"english","tooltip":"English (US) (Alt+Shift+Space để đổi)"}\n'
else
  printf '{"text":"<span font=\\"Font Awesome 6 Pro 14\\"></span>  OFF","class":"inactive","tooltip":"Bộ gõ đang tắt (click để chọn)"}\n'
fi
