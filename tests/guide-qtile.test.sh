#!/usr/bin/env bash
set -uo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PAGE="$ROOT/guide/qtile.html"
CONFIG="$ROOT/config/qtile/config.py"
APP="$ROOT/guide/assets/app.js"
INDEX="$ROOT/guide/index.html"
README="$ROOT/guide/README.md"
PASS=0
FAIL=0

pass() { printf '  \033[32m✓\033[0m %s\n' "$1"; PASS=$((PASS + 1)); }
fail() { printf '  \033[31m✗\033[0m %s\n' "$1"; FAIL=$((FAIL + 1)); }
assert_contains() {
  local file="$1" needle="$2" description="$3"
  if [[ -f "$file" ]] && grep -Fq -- "$needle" "$file"; then
    pass "$description"
  else
    fail "$description (thiếu: $needle)"
  fi
}

printf '\n── Trang Qtile ──\n'
[[ -f "$PAGE" ]] && pass "có qtile.html" || fail "có qtile.html"
assert_contains "$PAGE" 'data-page="qtile"' "page id đúng"
assert_contains "$PAGE" 'Super</kbd>' "giải thích phím Super"
assert_contains "$PAGE" 'Super + W' "cảnh báo đóng cửa sổ"
assert_contains "$PAGE" 'Super + Ctrl + Q' "cảnh báo thoát Qtile"
assert_contains "$PAGE" 'Button1' "có thao tác chuột trái"
assert_contains "$PAGE" 'Button2' "có thao tác chuột giữa"
assert_contains "$PAGE" 'Button3' "có thao tác chuột phải"

printf '\n── Binding đang hoạt động ──\n'
for key in h j k l space Return Tab w n m f r q; do
  assert_contains "$CONFIG" "\"$key\"" "config có binding $key"
  assert_contains "$PAGE" "data-qtile-key=\"$key\"" "guide có binding $key"
done
assert_contains "$PAGE" 'data-qtile-groups="1-9"' "guide có workspace 1–9"
assert_contains "$PAGE" 'data-qtile-action="swap"' "guide có đổi vị trí cửa sổ"
assert_contains "$PAGE" 'data-qtile-action="resize"' "guide có resize layout"
assert_contains "$PAGE" 'data-qtile-action="floating"' "guide có floating"

printf '\n── Navigation ──\n'
assert_contains "$APP" 'page: "qtile"' "sidebar đăng ký Qtile"
assert_contains "$INDEX" 'href="qtile.html"' "index có card Qtile"
assert_contains "$README" 'qtile.html' "README ghi trang Qtile"

printf '\nKết quả: %d đạt, %d lỗi\n' "$PASS" "$FAIL"
((FAIL == 0))
