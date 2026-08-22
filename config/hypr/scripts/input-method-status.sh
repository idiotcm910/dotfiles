#!/usr/bin/env bash
set -euo pipefail

method="$(fcitx5-remote -n 2>/dev/null || true)"
state="$(fcitx5-remote 2>/dev/null || true)"

if [[ "$method" == "lotus" && "$state" == "2" ]]; then
  printf '{"text":"<span font=\\"Font Awesome 6 Pro 14\\"></span>  VI","class":"vi","tooltip":"Lotus (Tiếng Việt)"}'
elif [[ "$method" == "keyboard-us" || "$state" == "1" || "$state" == "0" ]]; then
  printf '{"text":"<span font=\\"Font Awesome 6 Pro 14\\"></span>  EN","class":"en","tooltip":"English"}'
else
  printf '{"text":"<span font=\\"Font Awesome 6 Pro 14\\"></span>  %s","class":"other","tooltip":"%s"}' \
    "${method:-?}" "${method:-unknown}"
fi
