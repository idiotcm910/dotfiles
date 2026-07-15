#!/usr/bin/env bash
# ============================================================
#  install.sh — Cài Neovim IDE (config này) trên Ubuntu mới
#  Chạy:  bash ~/thai/system/nvim/install.sh
#  An toàn chạy lại nhiều lần (idempotent).
# ============================================================
set -euo pipefail

NVIM_VERSION="stable"          # đổi thành "v0.11.4" nếu muốn ghim phiên bản
REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"  # = ~/thai/system/nvim
CONFIG_DIR="$HOME/.config/nvim"

log()  { printf "\n\033[1;34m==>\033[0m %s\n" "$*"; }
ok()   { printf "  \033[1;32m✓\033[0m %s\n" "$*"; }

# ------------------------------------------------------------
# 1. Công cụ Neovim cần (qua apt)
#    rg/fd/fzf: fzf-lua tìm file + grep
#    build-essential + git: treesitter biên dịch parser, lazy/mason tải plugin
#    nodejs/npm + golang: để mason tải LSP (ts_ls, pyright, gopls)
#    xclip/wl-clipboard: dùng chung clipboard hệ thống
# ------------------------------------------------------------
log "Cài công cụ phụ thuộc qua apt"
sudo apt-get update -qq
sudo apt-get install -y \
  git curl wget unzip \
  ripgrep fd-find fzf \
  build-essential \
  nodejs npm \
  golang-go \
  xclip wl-clipboard
ok "Đã cài package apt"

# Ubuntu đặt tên fd là 'fdfind' → tạo lệnh 'fd'
if ! command -v fd >/dev/null 2>&1; then
  mkdir -p "$HOME/.local/bin"
  ln -sf "$(command -v fdfind)" "$HOME/.local/bin/fd"
  ok "Tạo lệnh 'fd' -> fdfind (nhớ để ~/.local/bin trong PATH)"
fi

# tree-sitter-cli — nhánh main của nvim-treesitter cần nó để biên dịch parser
if ! command -v tree-sitter >/dev/null 2>&1; then
  log "Cài tree-sitter-cli (cho nvim-treesitter nhánh main)"
  mkdir -p "$HOME/.local/bin"
  tmpts="$(mktemp -d)"
  curl -sL "https://github.com/tree-sitter/tree-sitter/releases/latest/download/tree-sitter-linux-x64.gz" -o "$tmpts/ts.gz"
  gunzip -c "$tmpts/ts.gz" > "$HOME/.local/bin/tree-sitter"
  chmod +x "$HOME/.local/bin/tree-sitter"; rm -rf "$tmpts"
  ok "tree-sitter $("$HOME/.local/bin/tree-sitter" --version 2>/dev/null | awk '{print $2}')"
fi
export PATH="$HOME/.local/bin:$PATH"

# ------------------------------------------------------------
# 1b. Nerd Font — để nvim-tree / bufferline hiện icon
#     (nhớ chỉnh terminal dùng font "JetBrainsMono Nerd Font")
# ------------------------------------------------------------
if ! fc-list 2>/dev/null | grep -qi "JetBrainsMono Nerd"; then
  log "Cài JetBrainsMono Nerd Font"
  fdir="$HOME/.local/share/fonts/JetBrainsMonoNerdFont"
  tmpf="$(mktemp -d)"
  curl -sL "https://github.com/ryanoasis/nerd-fonts/releases/latest/download/JetBrainsMono.zip" -o "$tmpf/f.zip"
  mkdir -p "$fdir"; unzip -o -q "$tmpf/f.zip" -d "$fdir"
  fc-cache -f "$fdir" >/dev/null 2>&1; rm -rf "$tmpf"
  ok "Đã cài font — nhớ đặt terminal dùng 'JetBrainsMono Nerd Font'"
else
  ok "Nerd Font đã có"
fi

# ------------------------------------------------------------
# 2. Cài Neovim mới nhất (tarball chính thức, không đụng bản apt cũ)
# ------------------------------------------------------------
NEED_NVIM=1
if command -v nvim >/dev/null 2>&1; then
  ver="$(nvim --version | head -1 | grep -oE '[0-9]+\.[0-9]+' | head -1)"
  # cần >= 0.10
  if [ "$(printf '%s\n0.10' "$ver" | sort -V | head -1)" = "0.10" ]; then
    NEED_NVIM=0
    ok "Neovim đã đủ mới (v$ver)"
  fi
fi

if [ "$NEED_NVIM" = "1" ]; then
  log "Cài Neovim $NVIM_VERSION"
  arch="$(uname -m)"; case "$arch" in
    x86_64)  file="nvim-linux-x86_64" ;;
    aarch64) file="nvim-linux-arm64" ;;
    *) echo "Kiến trúc chưa hỗ trợ: $arch"; exit 1 ;;
  esac
  tmp="$(mktemp -d)"
  curl -L "https://github.com/neovim/neovim/releases/download/${NVIM_VERSION}/${file}.tar.gz" \
    -o "$tmp/nvim.tar.gz"
  sudo rm -rf /opt/nvim
  sudo tar -C /opt -xzf "$tmp/nvim.tar.gz"
  sudo mv "/opt/${file}" /opt/nvim
  sudo ln -sf /opt/nvim/bin/nvim /usr/local/bin/nvim
  rm -rf "$tmp"; hash -r
  ok "Neovim: $(nvim --version | head -1)"
fi

# ------------------------------------------------------------
# 3. Symlink config: ~/.config/nvim -> repo này
# ------------------------------------------------------------
log "Liên kết config"
if [ -e "$CONFIG_DIR" ] && [ ! -L "$CONFIG_DIR" ]; then
  backup="${CONFIG_DIR}.bak.$(date +%s 2>/dev/null || echo old)"
  mv "$CONFIG_DIR" "$backup"
  ok "Đã backup config cũ -> $backup"
fi
mkdir -p "$HOME/.config"
ln -sfn "$REPO_DIR" "$CONFIG_DIR"
ok "$CONFIG_DIR -> $REPO_DIR"

# ------------------------------------------------------------
# 4. Cài plugin + LSP server (chạy nvim headless)
# ------------------------------------------------------------
log "Tải plugin (lazy.nvim) — chờ một chút..."
nvim --headless "+Lazy! sync" +qa 2>/dev/null || true
ok "Đã đồng bộ plugin"

log "Biên dịch parser Treesitter (chờ tới khi xong)..."
nvim --headless -c "lua require('nvim-treesitter').install({'typescript','tsx','javascript','json','python','go','gomod','lua','vim','vimdoc','html','css','yaml','toml','markdown','markdown_inline','bash'}):wait(300000)" -c "qa" 2>/dev/null || true
ok "Đã cài parser Treesitter"

log "Tải LSP server (mason): ts_ls, pyright, gopls, lua_ls"
nvim --headless "+MasonInstall typescript-language-server pyright gopls lua-language-server" +qa 2>/dev/null || true
ok "Đã yêu cầu tải LSP server"

echo ""
echo "============================================================"
echo "  ✅ XONG! Mở 'nvim' để bắt đầu."
echo "  • Bấm Space rồi khựng lại → which-key nhắc phím"
echo "  • Xem README.md để biết toàn bộ phím tắt"
echo "  • Kiểm tra: :checkhealth  |  :Lazy  |  :Mason"
echo "============================================================"
