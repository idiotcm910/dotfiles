#!/usr/bin/env bash
# tests/tmux-grid.test.sh — kiểm bin/tmux-grid trên tmux server RIÊNG (socket gridtest).
# CẢNH BÁO: mọi lệnh tmux phải đi qua T(); gọi tmux trần sẽ đụng session thật của người dùng.
set -uo pipefail

SOCK=gridtest
REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
GRID="$REPO/bin/tmux-grid"
fail=0

T() { tmux -L "$SOCK" "$@"; }
ok() { printf "  \033[32m✓\033[0m %s\n" "$1"; }
no() { printf "  \033[31m✗\033[0m %s\n      mong đợi: %s\n      thực tế : %s\n" "$1" "$2" "$3"; fail=1; }
eq() { [ "$2" = "$3" ] && ok "$1" || no "$1" "$2" "$3"; }

# mkwins <session> <tên window>... — dựng session sạch với các window cho trước
mkwins() {
  local s="$1"; shift
  T kill-session -t "$s" 2>/dev/null
  T new-session -d -s "$s" -n "$1"; shift
  local w; for w in "$@"; do T new-window -t "$s": -n "$w"; done
}

# grid <session> <window active> [layout] — chạy tmux-grid như tmux sẽ chạy (run-shell)
grid() {
  local s="$1" w="$2" layout="${3:-}"
  T select-window -t "$s:$w"
  T run-shell "$GRID $layout"
}

cleanup() { T kill-server 2>/dev/null; }
trap cleanup EXIT
cleanup

echo "── Gộp ──"
mkwins t1 alpha beta gamma
grid t1 alpha tiled
eq "session còn 1 window"        "1" "$(T list-windows -t t1 -F x | wc -l)"
eq "window đó có 3 pane"         "3" "$(T list-panes -t t1 -F x | wc -l)"
eq "window được đánh cờ @grid"   "on" "$(T display-message -p -t t1 '#{@grid}')"
eq "pane nhớ tên window nguồn"   "beta gamma" \
   "$(T list-panes -t t1 -F '#{@grid_win_name}' | grep -v '^$' | tr '\n' ' ' | sed 's/ *$//')"

echo ""
[ "$fail" -eq 0 ] && echo "TẤT CẢ ĐỀU ĐẠT" || echo "CÓ TEST HỎNG"
exit "$fail"
