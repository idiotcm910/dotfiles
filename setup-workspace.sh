#!/usr/bin/env bash
# setup-workspace.sh — cài tmux + tpm + sesh + scripts (chạy sau nvim/install.sh)
set -euo pipefail
log(){ printf "\n\033[1;34m==>\033[0m %s\n" "$*"; }

log "Cài tmux + fzf"
sudo apt-get update -qq && sudo apt-get install -y tmux fzf

log "Symlink tmux.conf"
ln -sf ~/thai/system/tmux/tmux.conf ~/.tmux.conf

log "Cài tpm"
[ -d ~/.tmux/plugins/tpm ] || git clone https://github.com/tmux-plugins/tpm ~/.tmux/plugins/tpm

log "Cài sesh"
if ! command -v sesh >/dev/null 2>&1; then
  mkdir -p ~/.local/bin
  url="$(curl -s https://api.github.com/repos/joshmedeski/sesh/releases/latest \
    | grep -oP '"browser_download_url": "\K[^"]*' | grep -iE 'linux.*(x86_64|amd64).*tar\.gz$' | head -1)"
  curl -sL "$url" -o /tmp/sesh.tgz
  tar -xzf /tmp/sesh.tgz -C ~/.local/bin sesh && chmod +x ~/.local/bin/sesh && rm /tmp/sesh.tgz
fi
mkdir -p ~/.config/sesh && ln -sf ~/thai/system/sesh/sesh.toml ~/.config/sesh/sesh.toml

log "Cài zoxide (sesh nhảy tới thư mục hay dùng)"
command -v zoxide >/dev/null 2>&1 || curl -sSfL https://raw.githubusercontent.com/ajeetdsouza/zoxide/main/install.sh | sh
grep -q 'zoxide init bash' ~/.bashrc || echo 'eval "$(zoxide init bash)"' >> ~/.bashrc

log "PATH cho scripts"
grep -q 'thai/system/bin' ~/.bashrc || echo 'export PATH="$HOME/thai/system/bin:$HOME/.local/bin:$PATH"' >> ~/.bashrc
chmod +x ~/thai/system/bin/*

log "Auto-tmux khi mở terminal (trừ Warp)"
if ! grep -qF '# >>> auto-tmux (trừ Warp) >>>' ~/.bashrc; then
cat >> ~/.bashrc <<'BASHRC'

# >>> auto-tmux (trừ Warp) >>>
# Tự vào tmux khi mở terminal thường; BỎ QUA Warp (giữ Blocks) + editor + shell non-interactive
if command -v tmux >/dev/null 2>&1 \
  && [ -z "${TMUX:-}" ] \
  && [[ $- == *i* ]] && [ -t 0 ] \
  && [ "${TERM_PROGRAM:-}" != "WarpTerminal" ] \
  && [ "${TERM_PROGRAM:-}" != "vscode" ]; then
  exec tmux new-session -A -s main
fi
# <<< auto-tmux (trừ Warp) <<<
BASHRC
fi

log "Cài plugin tmux (tpm)"
tmux kill-server 2>/dev/null || true
tmux new-session -d -s _setup && ~/.tmux/plugins/tpm/bin/install_plugins && tmux kill-session -t _setup 2>/dev/null || true

log "Cài ble.sh (gợi ý lệnh kiểu fish cho bash)"
if [ ! -f ~/.local/share/blesh/ble.sh ]; then
  tmpb="$(mktemp -d)"
  burl="$(curl -s https://api.github.com/repos/akinomyoga/ble.sh/releases/latest \
    | grep -oP '"browser_download_url": "\K[^"]*' | grep -E 'tar\.xz$' | head -1)"
  [ -z "$burl" ] && burl="https://github.com/akinomyoga/ble.sh/releases/download/nightly/ble-nightly.tar.xz"
  curl -sL "$burl" -o "$tmpb/ble.tar.xz" && tar xJf "$tmpb/ble.tar.xz" -C "$tmpb"
  bsrc="$(find "$tmpb" -maxdepth 1 -type d -name 'ble-*' | head -1)"
  mkdir -p ~/.local/share && rm -rf ~/.local/share/blesh && mv "$bsrc" ~/.local/share/blesh
  rm -rf "$tmpb"
fi
if ! grep -qF '# >>> ble.sh (gợi ý lệnh) >>>' ~/.bashrc; then
cat >> ~/.bashrc <<'BLESH'

# >>> ble.sh (gợi ý lệnh) >>>
# Gợi ý lệnh cũ dạng chữ mờ (bấm → hoặc End để nhận) + tô màu cú pháp.
# Đặt SAU khối auto-tmux: shell ngoài exec thẳng vào tmux, shell trong tmux mới load.
[[ $- == *i* ]] && [[ -f ~/.local/share/blesh/ble.sh ]] && source ~/.local/share/blesh/ble.sh
# <<< ble.sh (gợi ý lệnh) <<<
BLESH
fi

echo ""
echo "✅ XONG. Mở terminal mới → gõ 'tmux' → 'wt-new <branch>' để bắt đầu."
