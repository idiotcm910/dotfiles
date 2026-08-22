#!/usr/bin/env bash
set -uo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TMP_ROOT="$(mktemp -d)"
TEST_HOME="$TMP_ROOT/home"
FAKE_BIN="$TMP_ROOT/bin"
PASS=0
FAIL=0

cleanup() {
  rm -rf "$TMP_ROOT"
}
trap cleanup EXIT

mkdir -p "$TEST_HOME/.config" "$FAKE_BIN"

make_fake() {
  local name="$1"
  cat >"$FAKE_BIN/$name" <<'EOF'
#!/usr/bin/env bash
printf '%s' "${0##*/}"
printf ' %q' "$@"
printf '\n'
EOF
  chmod +x "$FAKE_BIN/$name"
}

for command_name in sudo pacman pip3 curl fc-cache; do
  make_fake "$command_name"
done

run_restore() {
  HOME="$TEST_HOME" \
    PATH="$FAKE_BIN:/usr/bin:/bin" \
    bash "$ROOT/restore.sh" "$@" 2>&1
}

pass() {
  printf '  \033[32m✓\033[0m %s\n' "$1"
  PASS=$((PASS + 1))
}

fail() {
  printf '  \033[31m✗\033[0m %s\n' "$1"
  FAIL=$((FAIL + 1))
}

assert_contains() {
  local haystack="$1"
  local needle="$2"
  local description="$3"
  if [[ "$haystack" == *"$needle"* ]]; then
    pass "$description"
  else
    fail "$description (thiếu: $needle)"
  fi
}

assert_not_contains() {
  local haystack="$1"
  local needle="$2"
  local description="$3"
  if [[ "$haystack" != *"$needle"* ]]; then
    pass "$description"
  else
    fail "$description (không được có: $needle)"
  fi
}

printf '\n── CLI restore ──\n'
help_output="$(run_restore --help)"
assert_contains "$help_output" "Usage:" "--help mô tả cách dùng"
assert_contains "$help_output" "--dry-run" "--help có chế độ preview"
assert_contains "$help_output" "--only" "--help có chọn nhóm cài đặt"

if run_restore --khong-ton-tai >/dev/null; then
  fail "option lạ phải trả exit code khác 0"
else
  pass "option lạ bị từ chối"
fi

printf '\n── Package Arch ──\n'
dry_output="$(run_restore --dry-run)"
assert_contains "$dry_output" "pacman -Syu --needed" "package được cài bằng một transaction pacman an toàn"
assert_contains "$dry_output" "qtile" "cài Qtile"
assert_contains "$dry_output" "polybar" "cài Polybar"
assert_contains "$dry_output" "neovim" "cài Neovim"
assert_contains "$dry_output" "tmux" "cài tmux"
assert_contains "$dry_output" "tree-sitter-cli" "cài tree-sitter CLI"
assert_not_contains "$dry_output" "hyprland" "không cài Hyprland"
assert_not_contains "$dry_output" "sway" "không cài Sway"
assert_not_contains "$dry_output" "plasma" "không cài Plasma"

printf '\n── Config an toàn và idempotent ──\n'
CONFIG_HOME="$TMP_ROOT/config-home"
BACKUP_HOME="$TMP_ROOT/backups"
mkdir -p "$CONFIG_HOME/.config/qtile"
printf 'config cũ\n' >"$CONFIG_HOME/.config/qtile/old.conf"

if HOME="$CONFIG_HOME" BACKUP_ROOT="$BACKUP_HOME" bash -c '
  source "$1"
  repo="$(dirname "$1")"
  link_managed "$repo/config/qtile" "$HOME/.config/qtile"
  link_managed "$repo/config/qtile" "$HOME/.config/qtile"
' _ "$ROOT/restore.sh"; then
  pass "helper symlink chạy thành công"
else
  fail "helper symlink chạy thành công"
fi

if [[ -L "$CONFIG_HOME/.config/qtile" ]] &&
  [[ "$(readlink "$CONFIG_HOME/.config/qtile")" == "$ROOT/config/qtile" ]]; then
  pass "Qtile trỏ đúng config trong repo"
else
  fail "Qtile trỏ đúng config trong repo"
fi

backup_count="$(
  find "$BACKUP_HOME" -type f -name old.conf 2>/dev/null | wc -l
)"
if [[ "$backup_count" -eq 1 ]]; then
  pass "config cũ được backup đúng một lần"
else
  fail "config cũ được backup đúng một lần (thực tế: $backup_count)"
fi

if HOME="$CONFIG_HOME" bash -c '
  source "$1"
  ensure_shell_block "$HOME/.bashrc" "dotfiles-path" \
    '\''export PATH="$HOME/thai/system/bin:$HOME/.local/bin:$PATH"'\''
  ensure_shell_block "$HOME/.bashrc" "dotfiles-path" \
    '\''export PATH="$HOME/thai/system/bin:$HOME/.local/bin:$PATH"'\''
' _ "$ROOT/restore.sh"; then
  marker_count="$(grep -c '^# >>> dotfiles-path >>>$' "$CONFIG_HOME/.bashrc" 2>/dev/null || true)"
  if [[ "$marker_count" -eq 1 ]]; then
    pass ".bashrc chỉ có một block PATH"
  else
    fail ".bashrc chỉ có một block PATH (thực tế: $marker_count)"
  fi
else
  fail "helper .bashrc chạy thành công"
fi

printf '\n── Chrome và AI CLI ──\n'
ai_output="$(run_restore --dry-run --only ai)"
assert_contains "$ai_output" "chatgpt.com/codex/install.sh" "Codex dùng installer chính thức"
assert_contains "$ai_output" "@anthropic-ai/claude-code" "Claude dùng package npm chính thức"
assert_contains "$ai_output" "--prefix" "Claude được cài user-scope, không cần sudo npm"
assert_contains "$ai_output" ".codex/config.toml" "khôi phục Codex config portable"
assert_contains "$ai_output" ".codex/prompts" "khôi phục Codex prompts"
assert_contains "$ai_output" ".claude/settings.json" "khôi phục Claude settings"
assert_contains "$ai_output" ".claude/agents" "khôi phục Claude agents"
assert_contains "$ai_output" "dotfiles-path" "--only ai vẫn thêm user bin vào PATH"
assert_not_contains "$ai_output" "qtile" "--only ai không cài desktop"
assert_not_contains "$ai_output" "polybar" "--only ai không cài Polybar"

all_output="$(run_restore --dry-run)"
assert_contains "$all_output" "https://aur.archlinux.org/google-chrome.git" "Chrome có fallback AUR chính thức"
assert_not_contains "$all_output" "https://aur.archlinux.org/fcitx5-lotus.git" "profile x11 mặc định không cài Fcitx5 Lotus"

skip_aur_output="$(run_restore --dry-run --skip-aur --profile wayland)"
assert_not_contains "$skip_aur_output" "https://aur.archlinux.org/google-chrome.git" "--skip-aur bỏ qua Chrome"
assert_not_contains "$skip_aur_output" "https://aur.archlinux.org/fcitx5-lotus.git" "--skip-aur bỏ qua Fcitx5 Lotus"

wayland_output="$(run_restore --dry-run --profile wayland)"
assert_contains "$wayland_output" "https://aur.archlinux.org/fcitx5-lotus.git" "wayland cài Fcitx5 Lotus"
assert_contains "$wayland_output" "fcitx5-lotus-server@" "wayland bật lotus server"
assert_contains "$wayland_output" ".config/fcitx5" "wayland khôi phục fcitx5 config"

printf '\n── Desktop và developer workflow ──\n'
assert_contains "$all_output" ".config/qtile" "khôi phục Qtile config"
assert_contains "$all_output" ".config/polybar" "khôi phục Polybar config"
assert_contains "$all_output" ".config/kitty" "khôi phục Kitty config"
assert_contains "$all_output" ".config/rofi" "khôi phục Rofi config"
assert_contains "$all_output" ".xinitrc" "khôi phục xinitrc"
assert_contains "$all_output" ".config/nvim" "khôi phục Neovim config mới"
assert_contains "$all_output" ".tmux.conf" "khôi phục tmux config mới"
assert_contains "$all_output" ".config/sesh/sesh.toml" "khôi phục sesh config"
assert_contains "$all_output" "tmux-plugins/tpm" "cài TPM"
assert_contains "$all_output" "mkdir -p $TEST_HOME/.tmux/plugins" "tạo thư mục cha cho TPM"
assert_contains "$all_output" "tpm/bin/install_plugins" "cài plugin tmux qua TPM"
assert_contains "$all_output" "joshmedeski/sesh" "cài sesh"
assert_contains "$all_output" "mkdir -p $TEST_HOME/.local/bin" "tạo ~/.local/bin cho sesh và AI CLI"
assert_contains "$all_output" "dotfiles-path" "thêm PATH bằng block quản lý"
assert_contains "$all_output" "auto-tmux" "thêm auto-tmux bằng block quản lý"
assert_contains "$all_output" "zoxide" "cài và kích hoạt zoxide"
assert_contains "$all_output" "akinomyoga/ble.sh" "cài ble.sh cho command suggestion"

desktop_files="$(cat "$ROOT/.xinitrc" "$ROOT/config/qtile/autostart.sh")"
assert_not_contains "$desktop_files" "workspace/dotfiles" "desktop không còn path repo cũ"
assert_not_contains "$desktop_files" "Downloads/wallpaper.png" "desktop không phụ thuộc wallpaper trong Downloads"
assert_contains "$(cat "$ROOT/config/qtile/config.py")" "@hook.subscribe.startup_once" "Qtile gọi autostart đúng một lần"
assert_contains "$(cat "$ROOT/.xinitrc")" "exec qtile start" "xinit trao process cho Qtile"

PATH_HOME="$TMP_ROOT/path-home"
mkdir -p "$PATH_HOME"
HOME="$PATH_HOME" bash -c '
  source "$1"
  ONLY=ai
  configure_user_path
' _ "$ROOT/restore.sh"
assert_contains "$(cat "$PATH_HOME/.bashrc")" "$ROOT/bin" "PATH dùng vị trí repo thực tế"

printf '\nKết quả: %d đạt, %d lỗi\n' "$PASS" "$FAIL"
((FAIL == 0))
