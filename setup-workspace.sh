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

log "Cài plugin tmux (tpm)"
tmux kill-server 2>/dev/null || true
tmux new-session -d -s _setup && ~/.tmux/plugins/tpm/bin/install_plugins && tmux kill-session -t _setup 2>/dev/null || true

echo ""
echo "✅ XONG. Mở terminal mới → gõ 'tmux' → 'wt-new <branch>' để bắt đầu."
