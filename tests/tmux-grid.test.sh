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
echo "── Tách khôi phục ──"
mkwins t2 alpha beta gamma
grid t2 alpha tiled
grid t2 alpha            # bấm lần hai = tách
eq "về lại 3 window"        "3" "$(T list-windows -t t2 -F x | wc -l)"
eq "tên window đúng như cũ" "alpha beta gamma" \
   "$(T list-windows -t t2 -F '#{window_name}' | tr '\n' ' ' | sed 's/ *$//')"
eq "cờ @grid đã xoá"        "" "$(T display-message -p -t t2 '#{@grid}')"
eq "pane option đã xoá"     "" \
   "$(T list-panes -s -t t2 -F '#{@grid_win_id}' | tr -d '\n')"

echo ""
echo "── Tên window trùng nhau ──"
mkwins t3 repo repo repo
grid t3 1 tiled
eq "gộp được dù tên trùng"  "3" "$(T list-panes -t t3 -F x | wc -l)"
grid t3 1
eq "tách ra đúng 3 window"  "3" "$(T list-windows -t t3 -F x | wc -l)"
eq "cả ba đều tên repo"     "repo repo repo" \
   "$(T list-windows -t t3 -F '#{window_name}' | tr '\n' ' ' | sed 's/ *$//')"

echo ""
echo "── Window vốn có nhiều pane ──"
mkwins t4 alpha beta gamma
T split-window -t t4:beta          # beta có 2 pane
grid t4 alpha tiled
eq "gộp đủ 4 pane"          "4" "$(T list-panes -t t4 -F x | wc -l)"
grid t4 alpha
eq "tách lại đúng 3 window" "3" "$(T list-windows -t t4 -F x | wc -l)"
eq "beta gom lại 2 pane"    "1 2 1" \
   "$(T list-windows -t t4 -F '#{window_panes}' | tr '\n' ' ' | sed 's/ *$//')"

echo ""
echo "── Session chỉ có một window ──"
mkwins t5 alpha
grid t5 alpha tiled
eq "không đổi gì"      "1" "$(T list-windows -t t5 -F x | wc -l)"
eq "không đánh cờ"     ""  "$(T display-message -p -t t5 '#{@grid}')"

echo ""
echo "── Sau khi gộp không kẹt zoom (tmux tự bỏ zoom) ──"
# tmux 3.4's join-pane/break-pane tự unzoom window đích khi thao tác — đã kiểm
# chứng thực nghiệm trên socket gridtest — nên script không cần code unzoom
# riêng. Nhóm này chỉ là regression check: gộp xong không được kẹt zoom, bất
# kể ai (script hay tmux) là người bỏ zoom.
mkwins t6 alpha beta gamma
T select-window -t t6:alpha
T split-window -t t6:alpha        # alpha 2 pane để zoom được
T resize-pane -Z -t t6:alpha
eq "đang zoom thật"      "1" "$(T display-message -p -t t6:alpha '#{window_zoomed_flag}')"
grid t6 alpha tiled
eq "gộp xong không kẹt zoom" "0" "$(T display-message -p -t t6 '#{window_zoomed_flag}')"
eq "gộp đủ 4 pane"       "4" "$(T list-panes -t t6 -F x | wc -l)"

echo ""
echo "── Pane tự mở thêm khi đang ở lưới ──"
mkwins t7 alpha beta gamma
grid t7 alpha tiled
T split-window -t t7:1            # pane mới, không có cờ nguồn
eq "lưới có 4 pane"    "4" "$(T list-panes -t t7 -F x | wc -l)"
grid t7 1
eq "tách ra 3 window"  "3" "$(T list-windows -t t7 -F x | wc -l)"
eq "pane mới ở lại"    "2" "$(T list-panes -t t7:1 -F x | wc -l)"

echo ""
echo "── Chạy ngoài tmux ──"
if TMUX= "$GRID" tiled >/dev/null 2>&1; then
  no "ngoài tmux phải lỗi" "mã thoát khác 0" "mã thoát 0"
else
  ok "ngoài tmux thoát với lỗi"
fi

echo ""
[ "$fail" -eq 0 ] && echo "TẤT CẢ ĐỀU ĐẠT" || echo "CÓ TEST HỎNG"
exit "$fail"
