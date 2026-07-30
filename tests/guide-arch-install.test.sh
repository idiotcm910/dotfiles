#!/usr/bin/env bash
set -uo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PAGE="$ROOT/guide/arch-install.html"
APP="$ROOT/guide/assets/app.js"
CSS="$ROOT/guide/assets/style.css"
INDEX="$ROOT/guide/index.html"
PASS=0
FAIL=0

pass() {
  printf '  \033[32m✓\033[0m %s\n' "$1"
  PASS=$((PASS + 1))
}

fail() {
  printf '  \033[31m✗\033[0m %s\n' "$1"
  FAIL=$((FAIL + 1))
}

assert_file_contains() {
  local file="$1"
  local needle="$2"
  local description="$3"
  if [[ -f "$file" ]] && grep -Fq -- "$needle" "$file"; then
    pass "$description"
  else
    fail "$description (thiếu: $needle)"
  fi
}

printf '\n── Cấu trúc trang ──\n'
if [[ -f "$PAGE" ]]; then
  pass "có trang arch-install.html"
else
  fail "có trang arch-install.html"
fi

stage_count="$(grep -c 'class="install-step' "$PAGE" 2>/dev/null || true)"
if [[ "$stage_count" -eq 9 ]]; then
  pass "có đúng 9 chặng"
else
  fail "có đúng 9 chặng (thực tế: $stage_count)"
fi

assert_file_contains "$PAGE" 'id="installProgress"' "có progress bar"
assert_file_contains "$PAGE" 'id="progressText"' "có progress text"
assert_file_contains "$PAGE" 'id="resetChecklist"' "có nút reset"
assert_file_contains "$PAGE" 'data-task="backup-confirmed"' "có bước xác nhận backup"
assert_file_contains "$PAGE" 'data-requires="backup-confirmed"' "bước xóa ổ phụ thuộc backup"
assert_file_contains "$PAGE" 'data-copy-target=' "command có nút copy"
assert_file_contains "$PAGE" 'https://archlinux.org/download/' "link trang tải Arch chính thức"
assert_file_contains "$PAGE" 'https://wiki.archlinux.org/title/Installation_guide' "link Installation Guide chính thức"
assert_file_contains "$PAGE" 'https://wiki.archlinux.org/title/Archinstall' "link Archinstall chính thức"
assert_file_contains "$PAGE" 'data-task="chrome-cookie-restored"' "có bước khôi phục cookie Chrome"
assert_file_contains "$PAGE" 'gnome-keyring libsecret' "hướng dẫn cài GNOME Keyring cho Chrome"
assert_file_contains "$PAGE" 'chrome-cookies-and-keyring-' "hướng dẫn dùng file backup cookie"
assert_file_contains "$PAGE" '-C ~/.config google-chrome' "lệnh restore Chrome đúng thư mục"
assert_file_contains "$PAGE" '-C ~ .local' "lệnh restore keyring đúng thư mục"

task_ids="$(
  grep -o 'data-task="[^"]*"' "$PAGE" 2>/dev/null |
    cut -d'"' -f2
)"
task_total="$(printf '%s\n' "$task_ids" | sed '/^$/d' | wc -l)"
task_unique="$(printf '%s\n' "$task_ids" | sed '/^$/d' | sort -u | wc -l)"
if [[ "$task_total" -gt 0 && "$task_total" -eq "$task_unique" ]]; then
  pass "mọi task ID là duy nhất"
else
  fail "mọi task ID là duy nhất (tổng: $task_total, unique: $task_unique)"
fi

printf '\n── Navigation và behavior ──\n'
assert_file_contains "$APP" 'page: "arch-install"' "sidebar đăng ký trang Arch"
assert_file_contains "$APP" 'localStorage' "checklist lưu tiến độ localStorage"
assert_file_contains "$APP" 'navigator.clipboard' "copy command dùng Clipboard API"
assert_file_contains "$APP" 'confirm(' "reset yêu cầu xác nhận"
assert_file_contains "$INDEX" 'href="arch-install.html"' "index có card cài Arch"
assert_file_contains "$CSS" '.sb-nav{flex-direction:row;overflow-x:auto' "mobile sidebar chuyển thành nav ngang"
assert_file_contains "$CSS" '.progress-copy{flex-direction:column;align-items:stretch}' "mobile progress không cắt nút reset"
assert_file_contains "$CSS" '.command-block{margin-left:0;margin-right:0}' "mobile command không tràn khỏi rail"
desktop_nav_line="$(grep -n '\.sb-nav{display:flex; flex-direction:column' "$CSS" | tail -1 | cut -d: -f1)"
mobile_nav_line="$(grep -n '\.sb-nav{flex-direction:row;overflow-x:auto' "$CSS" | tail -1 | cut -d: -f1)"
if [[ -n "$desktop_nav_line" && -n "$mobile_nav_line" && "$mobile_nav_line" -gt "$desktop_nav_line" ]]; then
  pass "mobile nav đứng sau desktop rule trong cascade"
else
  fail "mobile nav đứng sau desktop rule trong cascade"
fi

printf '\nKết quả: %d đạt, %d lỗi\n' "$PASS" "$FAIL"
((FAIL == 0))
