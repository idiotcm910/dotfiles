#!/usr/bin/env bash
# Khôi phục môi trường Arch Linux từ dotfiles này.
set -euo pipefail

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DRY_RUN=0
SKIP_AUR=0
ONLY="all"
PROFILE="x11"
BACKUP_ROOT="${BACKUP_ROOT:-${XDG_STATE_HOME:-$HOME/.local/state}/dotfiles-backup/$(date +%Y%m%d-%H%M%S)}"

readonly -a BASE_PACKAGES=(
  base-devel git curl wget unzip zip jq fontconfig ttf-nerd-fonts-symbols-mono
  ttf-iosevka-nerd
)

readonly -a X11_DESKTOP_PACKAGES=(
  xorg-server xorg-xinit
  qtile rofi kitty feh picom dunst thunar
  networkmanager pipewire pipewire-pulse wireplumber
  alsa-utils pavucontrol playerctl brightnessctl
  ibus xclip wl-clipboard
)

readonly -a WAYLAND_DESKTOP_PACKAGES=(
  hyprland waybar fuzzel swaync swaybg hyprlock hyprshutdown
  grim slurp satty wl-clipboard
  xdg-desktop-portal xdg-desktop-portal-gtk xdg-desktop-portal-hyprland
  qt5-wayland qt6-wayland guvcview
  kitty thunar networkmanager nm-connection-editor
  pipewire pipewire-pulse wireplumber alsa-utils pavucontrol playerctl brightnessctl
  fcitx5 fcitx5-bamboo fcitx5-gtk fcitx5-qt fcitx5-configtool
  polkit-kde-agent
)

readonly -a DEV_PACKAGES=(
  neovim tmux fzf ripgrep fd
  nodejs npm go python python-pip tree-sitter-cli
  zoxide
)

usage() {
  cat <<'EOF'
Usage: ./restore.sh [options]

Khôi phục một trong hai desktop profile:
  x11      Qtile + Polybar + Picom (mặc định)
  wayland  Hyprland + Waybar, thuần Wayland (không cài Xorg/XWayland)
  hyprland Alias của wayland

Options:
  --dry-run          In các thao tác nhưng không thay đổi hệ thống
  --only GROUP       Chỉ chạy một nhóm: desktop, dev, ai hoặc all
  --profile NAME     Chọn desktop: x11, wayland hoặc hyprland (mặc định: x11)
  --skip-aur         Không cài package AUR (Chrome, Orbit)
  -h, --help         Hiện trợ giúp
EOF
}

die() {
  printf 'Lỗi: %s\n' "$*" >&2
  exit 1
}

log() {
  printf '\n\033[1;34m==>\033[0m %s\n' "$*"
}

print_command() {
  printf '+'
  printf ' %q' "$@"
  printf '\n'
}

run() {
  if ((DRY_RUN)); then
    print_command "$@"
  else
    "$@"
  fi
}

backup_existing() {
  local target="$1"
  local relative destination
  [[ -e "$target" || -L "$target" ]] || return 0

  if [[ "$target" == "$HOME/"* ]]; then
    relative="${target#"$HOME/"}"
  else
    relative="${target#/}"
  fi
  destination="$BACKUP_ROOT/$relative"

  log "Backup $target -> $destination"
  run mkdir -p "$(dirname "$destination")"
  run mv "$target" "$destination"
}

link_managed() {
  local source_path="$1"
  local target="$2"

  [[ -e "$source_path" || -d "$source_path" ]] ||
    die "source không tồn tại: $source_path"

  if [[ -L "$target" ]] &&
    [[ "$(readlink "$target")" == "$source_path" ]]; then
    return 0
  fi

  backup_existing "$target"
  run mkdir -p "$(dirname "$target")"
  run ln -s "$source_path" "$target"
}

ensure_shell_block() {
  local file="$1"
  local name="$2"
  local content="$3"
  local begin="# >>> $name >>>"
  local end="# <<< $name <<<"

  if [[ -f "$file" ]] && grep -qF "$begin" "$file"; then
    return 0
  fi

  if ((DRY_RUN)); then
    printf '+ append block %q to %q\n' "$name" "$file"
    return 0
  fi

  mkdir -p "$(dirname "$file")"
  touch "$file"
  {
    printf '\n%s\n' "$begin"
    printf '%s\n' "$content"
    printf '%s\n' "$end"
  } >>"$file"
}

copy_managed() {
  local source_path="$1"
  local target="$2"

  [[ -e "$source_path" ]] || die "source không tồn tại: $source_path"

  if ((DRY_RUN)); then
    print_command cp -a "$source_path" "$target"
    return 0
  fi

  if [[ -f "$source_path" && -f "$target" ]] &&
    cmp -s "$source_path" "$target"; then
    return 0
  fi
  if [[ -d "$source_path" && -d "$target" ]] &&
    diff -qr "$source_path" "$target" >/dev/null 2>&1; then
    return 0
  fi

  backup_existing "$target"
  mkdir -p "$(dirname "$target")"
  cp -a "$source_path" "$target"
}

parse_args() {
  while (($#)); do
    case "$1" in
      --dry-run)
        DRY_RUN=1
        ;;
      --skip-aur)
        SKIP_AUR=1
        ;;
      --only)
        (($# >= 2)) || die "--only cần một giá trị"
        ONLY="$2"
        shift
        ;;
      --profile)
        (($# >= 2)) || die "--profile cần một giá trị"
        PROFILE="$2"
        shift
        ;;
      -h | --help)
        usage
        exit 0
        ;;
      *)
        die "option không hỗ trợ: $1"
        ;;
    esac
    shift
  done

  case "$ONLY" in
    all | desktop | dev | ai) ;;
    *) die "nhóm không hỗ trợ: $ONLY" ;;
  esac
  case "$PROFILE" in
    x11 | wayland) ;;
    hyprland) PROFILE="wayland" ;;
    *) die "profile không hỗ trợ: $PROFILE (chỉ x11, wayland hoặc hyprland)" ;;
  esac
}

ensure_arch() {
  ((DRY_RUN)) && return 0
  [[ -r /etc/os-release ]] || die "không đọc được /etc/os-release"
  # shellcheck disable=SC1091
  source /etc/os-release
  [[ "${ID:-}" == "arch" || "${ID_LIKE:-}" == *arch* ]] ||
    die "script này chỉ hỗ trợ Arch Linux (dùng --dry-run để preview)"
  command -v pacman >/dev/null 2>&1 || die "không tìm thấy pacman"
}

selected_packages() {
  local -a packages=("${BASE_PACKAGES[@]}")
  case "$ONLY" in
    all)
      if [[ "$PROFILE" == "x11" ]]; then packages+=("${X11_DESKTOP_PACKAGES[@]}"); else packages+=("${WAYLAND_DESKTOP_PACKAGES[@]}"); fi
      packages+=("${DEV_PACKAGES[@]}")
      ;;
    desktop)
      if [[ "$PROFILE" == "x11" ]]; then packages+=("${X11_DESKTOP_PACKAGES[@]}"); else packages+=("${WAYLAND_DESKTOP_PACKAGES[@]}"); fi
      ;;
    dev)
      packages+=("${DEV_PACKAGES[@]}")
      ;;
    ai)
      packages+=(nodejs npm)
      ;;
  esac
  printf '%s\n' "${packages[@]}" | awk '!seen[$0]++'
}

install_pacman_packages() {
  local -a packages=()
  mapfile -t packages < <(selected_packages)
  log "Cài package Arch (${ONLY})"
  run sudo pacman -Syu --needed "${packages[@]}"
}

install_aur_package() {
  local package="$1"
  if ((!DRY_RUN)) && pacman -Q "$package" >/dev/null 2>&1; then
    return 0
  fi
  if ((!DRY_RUN)) && command -v paru >/dev/null 2>&1; then
    run paru -S --needed "$package"
    return 0
  fi
  if ((!DRY_RUN)) && command -v yay >/dev/null 2>&1; then
    run yay -S --needed "$package"
    return 0
  fi

  if ((DRY_RUN)); then
    print_command git clone --depth 1 \
      "https://aur.archlinux.org/${package}.git" "/tmp/$package"
    printf '+ (cd %q && makepkg -si --needed)\n' "/tmp/$package"
    return 0
  fi

  local build_root
  build_root="$(mktemp -d)"
  printf 'AUR là nội dung cộng đồng. Hãy kiểm tra PKGBUILD khi makepkg hỏi xác nhận.\n'
  git clone --depth 1 \
    "https://aur.archlinux.org/${package}.git" \
    "$build_root/$package"
  (
    cd "$build_root/$package"
    makepkg -si --needed
  )
  rm -rf -- "$build_root"
}

install_aur_apps() {
  ((SKIP_AUR)) && return 0
  [[ "$ONLY" == "all" || "$ONLY" == "desktop" ]] || return 0

  log "Cài ứng dụng AUR"
  install_aur_package google-chrome
  [[ "$PROFILE" == "wayland" ]] && install_aur_package orbit-wifi
}

install_codex() {
  [[ "$ONLY" == "all" || "$ONLY" == "ai" ]] || return 0
  if ((!DRY_RUN)) && command -v codex >/dev/null 2>&1; then
    log "Codex CLI đã có"
    return 0
  fi

  log "Cài Codex CLI"
  if ((DRY_RUN)); then
    print_command curl -fsSL https://chatgpt.com/codex/install.sh \
      -o /tmp/codex-install.sh
    print_command bash /tmp/codex-install.sh
    return 0
  fi

  local install_script
  install_script="$(mktemp)"
  curl -fsSL https://chatgpt.com/codex/install.sh -o "$install_script"
  bash "$install_script"
  rm -f -- "$install_script"
}

install_claude() {
  # The Wayland profile intentionally installs only Codex. Claude Code stays
  # available in the X11 profile where it is already part of the workflow.
  [[ "$PROFILE" == "x11" ]] || return 0
  [[ "$ONLY" == "all" || "$ONLY" == "ai" ]] || return 0
  if ((!DRY_RUN)) && command -v claude >/dev/null 2>&1; then
    log "Claude Code đã có"
    return 0
  fi

  log "Cài Claude Code bằng npm user-scope"
  run npm install -g --prefix "$HOME/.local" @anthropic-ai/claude-code
}

restore_ai_config() {
  [[ "$ONLY" == "all" || "$ONLY" == "ai" ]] || return 0
  log "Khôi phục config AI portable"
  copy_managed "$REPO_DIR/.codex/config.toml" "$HOME/.codex/config.toml"
  copy_managed "$REPO_DIR/.codex/prompts" "$HOME/.codex/prompts"
  copy_managed "$REPO_DIR/.codex/rules" "$HOME/.codex/rules"
  [[ "$PROFILE" == "x11" ]] || return 0
  copy_managed "$REPO_DIR/.claude/settings.json" "$HOME/.claude/settings.json"
  copy_managed "$REPO_DIR/.claude/agents" "$HOME/.claude/agents"
  copy_managed "$REPO_DIR/.claude/skills" "$HOME/.claude/skills"
}

restore_desktop_config() {
  [[ "$ONLY" == "all" || "$ONLY" == "desktop" ]] || return 0
  log "Khôi phục desktop profile: $PROFILE"
  if [[ "$PROFILE" == "x11" ]]; then
    link_managed "$REPO_DIR/config/qtile" "$HOME/.config/qtile"
    link_managed "$REPO_DIR/config/polybar" "$HOME/.config/polybar"
    link_managed "$REPO_DIR/config/rofi" "$HOME/.config/rofi"
    link_managed "$REPO_DIR/.xinitrc" "$HOME/.xinitrc"
  else
    link_managed "$REPO_DIR/config/hypr" "$HOME/.config/hypr"
    link_managed "$REPO_DIR/config/waybar" "$HOME/.config/waybar"
    link_managed "$REPO_DIR/config/swaync" "$HOME/.config/swaync"
    link_managed "$REPO_DIR/config/orbit" "$HOME/.config/orbit"
    link_managed "$REPO_DIR/config/fuzzel" "$HOME/.config/fuzzel"
    link_managed "$REPO_DIR/config/environment.d" "$HOME/.config/environment.d"
    link_managed "$REPO_DIR/config/fcitx5" "$HOME/.config/fcitx5"
    copy_managed "$REPO_DIR/config/chrome-flags.conf" "$HOME/.config/chrome-flags.conf"
  fi
  link_managed "$REPO_DIR/config/kitty" "$HOME/.config/kitty"
  run chmod +x \
    "$REPO_DIR/config/qtile/autostart.sh" \
    "$REPO_DIR/config/qtile/screenshot.sh" \
    "$REPO_DIR/config/hypr/autostart.sh" \
    "$REPO_DIR/config/hypr/scripts/brightness-menu.sh" \
    "$REPO_DIR/config/hypr/scripts/audio-menu.sh" \
    "$REPO_DIR/config/hypr/scripts/wifi-menu.sh" \
    "$REPO_DIR/config/hypr/scripts/bluetooth-menu.sh" \
    "$REPO_DIR/config/hypr/scripts/mic-toggle.sh" \
    "$REPO_DIR/config/hypr/scripts/mic-status.sh" \
    "$REPO_DIR/config/hypr/scripts/camera-menu.sh" \
    "$REPO_DIR/config/hypr/scripts/screenshot.sh" \
    "$REPO_DIR/config/hypr/scripts/lock-screen.sh" \
    "$REPO_DIR/config/hypr/scripts/power-action.sh"
  copy_managed "$REPO_DIR/font" "$HOME/.local/share/fonts/dotfiles"
  run fc-cache -f "$HOME/.local/share/fonts/dotfiles"
  run sudo systemctl enable NetworkManager
  [[ "$PROFILE" == "wayland" ]] && run sudo systemctl enable --now bluetooth
  if [[ "$PROFILE" == "wayland" && "$SKIP_AUR" -eq 0 ]]; then
    run systemctl --user daemon-reload
    run systemctl --user enable --now orbit
  fi

}

install_tpm() {
  local target="$HOME/.tmux/plugins/tpm"
  run mkdir -p "$HOME/.tmux/plugins"
  if ((DRY_RUN)) || [[ ! -d "$target/.git" ]]; then
    run git clone https://github.com/tmux-plugins/tpm "$target"
  fi
  run "$target/bin/install_plugins"
}

install_sesh() {
  if ((!DRY_RUN)) && command -v sesh >/dev/null 2>&1; then
    return 0
  fi

  log "Cài sesh"
  if ((DRY_RUN)); then
    print_command mkdir -p "$HOME/.local/bin"
    print_command curl -fsSL \
      https://api.github.com/repos/joshmedeski/sesh/releases/latest
    print_command tar -xzf /tmp/sesh.tar.gz -C "$HOME/.local/bin" sesh
    return 0
  fi

  local architecture pattern release_url temp_root
  architecture="$(uname -m)"
  case "$architecture" in
    x86_64) pattern='Linux_x86_64\.tar\.gz$' ;;
    aarch64 | arm64) pattern='Linux_arm64\.tar\.gz$' ;;
    *) die "sesh chưa hỗ trợ kiến trúc: $architecture" ;;
  esac

  release_url="$(
    curl -fsSL https://api.github.com/repos/joshmedeski/sesh/releases/latest |
      jq -r '.assets[].browser_download_url' |
      grep -E "$pattern" |
      head -n 1
  )"
  [[ -n "$release_url" ]] || die "không tìm thấy sesh release cho $architecture"

  temp_root="$(mktemp -d)"
  mkdir -p "$HOME/.local/bin"
  curl -fsSL "$release_url" -o "$temp_root/sesh.tar.gz"
  tar -xzf "$temp_root/sesh.tar.gz" -C "$HOME/.local/bin" sesh
  chmod +x "$HOME/.local/bin/sesh"
  rm -rf -- "$temp_root"
}

install_blesh() {
  local target="$HOME/.local/share/blesh"
  if ((!DRY_RUN)) && [[ -f "$target/ble.sh" ]]; then
    return 0
  fi

  log "Cài ble.sh"
  if ((DRY_RUN)); then
    print_command curl -fsSL \
      https://api.github.com/repos/akinomyoga/ble.sh/releases/latest
    print_command tar -xJf /tmp/ble.sh.tar.xz -C "$HOME/.local/share"
    return 0
  fi

  local release_url temp_root extracted
  release_url="$(
    curl -fsSL https://api.github.com/repos/akinomyoga/ble.sh/releases/latest |
      jq -r '.assets[].browser_download_url' |
      grep -E 'ble-[0-9].*\.tar\.xz$' |
      head -n 1
  )"
  [[ -n "$release_url" ]] || die "không tìm thấy ble.sh release"

  temp_root="$(mktemp -d)"
  curl -fsSL "$release_url" -o "$temp_root/ble.tar.xz"
  tar -xJf "$temp_root/ble.tar.xz" -C "$temp_root"
  extracted="$(find "$temp_root" -mindepth 1 -maxdepth 1 -type d -name 'ble-*' | head -n 1)"
  [[ -n "$extracted" ]] || die "archive ble.sh không đúng định dạng"
  mkdir -p "$(dirname "$target")"
  mv "$extracted" "$target"
  rm -rf -- "$temp_root"
}

configure_user_path() {
  [[ "$ONLY" == "all" || "$ONLY" == "dev" || "$ONLY" == "ai" ]] || return 0
  local path_line
  path_line="export PATH=\"$REPO_DIR/bin:\$HOME/.local/bin:\$PATH\""
  run mkdir -p "$HOME/.local/bin"
  ensure_shell_block "$HOME/.bashrc" "dotfiles-path" "$path_line"
}

configure_bash() {
  ensure_shell_block "$HOME/.bashrc" "zoxide" \
    'command -v zoxide >/dev/null 2>&1 && eval "$(zoxide init bash)"'
  ensure_shell_block "$HOME/.bashrc" "auto-tmux" \
    'if command -v tmux >/dev/null 2>&1 \
  && [[ -z "${TMUX:-}" ]] \
  && [[ $- == *i* ]] && [[ -t 0 ]] \
  && [[ "${TERM_PROGRAM:-}" != "WarpTerminal" ]] \
  && [[ "${TERM_PROGRAM:-}" != "vscode" ]]; then
  exec tmux new-session -A -s main
fi'
  ensure_shell_block "$HOME/.bashrc" "ble.sh" \
    '[[ $- == *i* ]] && [[ -f "$HOME/.local/share/blesh/ble.sh" ]] && source "$HOME/.local/share/blesh/ble.sh"'
}

setup_nvim() {
  log "Đồng bộ Neovim plugins"
  if ((DRY_RUN)); then
    print_command nvim --headless '+Lazy! sync' +qa
    print_command nvim --headless \
      '+MasonInstall typescript-language-server pyright gopls lua-language-server' +qa
    return 0
  fi

  nvim --headless '+Lazy! sync' +qa ||
    printf 'Cảnh báo: Lazy sync chưa hoàn tất; mở Neovim để chạy lại.\n' >&2
  nvim --headless \
    '+MasonInstall typescript-language-server pyright gopls lua-language-server' +qa ||
    printf 'Cảnh báo: Mason chưa hoàn tất; mở :Mason để kiểm tra.\n' >&2
}

restore_developer_workflow() {
  [[ "$ONLY" == "all" || "$ONLY" == "dev" ]] || return 0
  log "Khôi phục Neovim/tmux/workflow"
  link_managed "$REPO_DIR/nvim" "$HOME/.config/nvim"
  link_managed "$REPO_DIR/tmux/tmux.conf" "$HOME/.tmux.conf"
  link_managed "$REPO_DIR/sesh/sesh.toml" "$HOME/.config/sesh/sesh.toml"
  run chmod +x "$REPO_DIR"/bin/*
  install_tpm
  install_sesh
  install_blesh
  configure_bash
  setup_nvim
}

main() {
  parse_args "$@"
  ensure_arch
  install_pacman_packages
  configure_user_path
  install_aur_apps
  restore_desktop_config
  restore_developer_workflow
  install_codex
  install_claude
  restore_ai_config
}

if [[ "${BASH_SOURCE[0]}" == "$0" ]]; then
  main "$@"
fi
