#!/usr/bin/env bash
set -euo pipefail

case "${1:-}" in
  lotus | bamboo | vietnamese | vi) fcitx5-remote -s lotus; fcitx5-remote -o ;;
  english | en | us) fcitx5-remote -s keyboard-us ;;
  toggle) fcitx5-remote -t ;;
  config) exec fcitx5-configtool ;;
  *)
    printf 'usage: %s {lotus|english|toggle|config}\n' "${0##*/}" >&2
    exit 2
    ;;
esac
