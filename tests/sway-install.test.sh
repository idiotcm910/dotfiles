#!/usr/bin/env bash
# tests/sway-install.test.sh — regression checks for the Sway config installer.
set -euo pipefail

REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
INSTALLER="$REPO/sway/install.sh"
tmp="$(mktemp -d)"
fail=0

cleanup() { rm -rf "$tmp"; }
trap cleanup EXIT

ok() { printf '  \033[32m✓\033[0m %s\n' "$1"; }
no() { printf '  \033[31m✗\033[0m %s\n' "$1"; fail=1; }

assert_file_contains() {
  local label="$1" file="$2" expected="$3"
  if [ -f "$file" ] && rg -Fq "$expected" "$file"; then ok "$label"; else no "$label"; fi
}

echo "── Dry run ──"
mkdir -p "$tmp/home/.config" "$tmp/source/foot"
printf 'new\n' > "$tmp/source/foot/foot.ini"
before="$(find "$tmp/home/.config" -print | sort)"
out="$(HOME="$tmp/home" CONFIG_SOURCE="$tmp/source" SKIP_APT=1 bash "$INSTALLER" --dry-run 2>&1)" || rc=$?
rc="${rc:-0}"
after="$(find "$tmp/home/.config" -print | sort)"
[ "$rc" -eq 0 ] && ok "dry-run exits successfully" || no "dry-run exits successfully"
[ "$before" = "$after" ] && ok "dry-run does not write ~/.config" || no "dry-run does not write ~/.config"
printf '%s' "$out" | rg -Fq 'DRY RUN' && ok "dry-run announces itself" || no "dry-run announces itself"

echo ""
echo "── Apply with backup ──"
mkdir -p "$tmp/home/.config/foot"
printf 'old\n' > "$tmp/home/.config/foot/foot.ini"
HOME="$tmp/home" CONFIG_SOURCE="$tmp/source" SKIP_APT=1 bash "$INSTALLER"
assert_file_contains "apply copies source config" "$tmp/home/.config/foot/foot.ini" "new"
backup="$(find "$tmp/home/.config" -maxdepth 1 -type d -name 'foot.backup-*' | head -n 1)"
assert_file_contains "apply preserves old config in backup" "$backup/foot.ini" "old"

echo ""
[ "$fail" -eq 0 ] && echo "TẤT CẢ ĐỀU ĐẠT" || echo "CÓ TEST HỎNG"
exit "$fail"
