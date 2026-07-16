# Multi-worktree Claude Code Workspace — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Dựng môi trường tmux + sesh + nvim để quản lý nhiều git worktree song song, mỗi worktree một nvim cách ly và chạy được nhiều Claude Code.

**Architecture:** tmux session = worktree (cách ly, chạy nền, zoom). `sesh` làm switcher fuzzy. Scripts `wt-*` quản vòng đời worktree. nvim thêm `claude-multi.nvim` + `claudecode.nvim` để quản Claude trong editor.

**Tech Stack:** tmux + tpm plugins, sesh (Go binary), bash scripts, Neovim + lazy.nvim (config sẵn tại `~/thai/system/nvim`).

## Global Constraints

- Mọi file mới nằm trong repo `~/thai/system` (dotfiles), kích hoạt bằng symlink.
- Đường dẫn worktree: `<dirname repo>/<repo>.worktrees/<branch>`.
- Tên tmux session = branch, thay `./:` bằng `_` (tmux cấm dấu `.`).
- Nvim đã có: leader = `Space`, lazy.nvim, các plugin ở `nvim/lua/plugins/`. `<leader>a*` và `<leader>c*` hiện chưa dùng làm nhóm (trừ `<leader>ca` LSP buffer-local — chấp nhận trùng, khác ngữ cảnh).
- Scripts để tại `~/thai/system/bin/`, thêm vào PATH qua shell rc.
- Git commit author: `idiotcm910 <lovinbot.com@gmail.com>`.
- Bash scripts: `set -euo pipefail`, shebang `#!/usr/bin/env bash`, `chmod +x`.

---

## File Structure

```
~/thai/system/
├── tmux/tmux.conf          # Task 1,2,7 — config nền + plugin + sync-panes
├── sesh/sesh.toml          # Task 3 — config switcher
├── bin/wt-new              # Task 4
├── bin/wt-status           # Task 5
├── bin/wt-clean            # Task 6
├── nvim/lua/plugins/
│   ├── snacks.lua          # Task 8 — dependency
│   ├── claude-multi.lua    # Task 8
│   └── claudecode.lua      # Task 9
├── nvim/lua/config/keymaps.lua   # Task 10 — thêm <leader>z
├── install.sh              # Task 11 — mở rộng cài đặt
└── README.md               # Task 12 — tài liệu workflow
```

---

### Task 1: tmux config nền + symlink

**Files:**
- Create: `~/thai/system/tmux/tmux.conf`
- Symlink: `~/.tmux.conf` → repo

- [ ] **Step 1: Tạo `tmux/tmux.conf` (phần nền, chưa có plugin)**

```tmux
# ~/thai/system/tmux/tmux.conf — cấu hình nền

# Prefix Ctrl-a (dễ bấm hơn Ctrl-b)
unbind C-b
set -g prefix C-a
bind C-a send-prefix

# Cơ bản
set -g mouse on
set -g base-index 1
setw -g pane-base-index 1
set -g renumber-windows on
set -sg escape-time 0
set -g history-limit 50000
set -g focus-events on
set -g default-terminal "tmux-256color"
set -ga terminal-overrides ",*256col*:Tc"   # true color, khớp nvim
setw -g mode-keys vi

# Reload config
bind r source-file ~/.tmux.conf \; display "Reloaded ~/.tmux.conf"

# Split giữ nguyên cwd
bind | split-window -h -c "#{pane_current_path}"
bind - split-window -v -c "#{pane_current_path}"
```

- [ ] **Step 2: Tạo symlink**

Run:
```bash
ln -sf ~/thai/system/tmux/tmux.conf ~/.tmux.conf
```

- [ ] **Step 3: Verify config nạp được**

Run:
```bash
tmux kill-server 2>/dev/null; tmux new-session -d -s _t && tmux show -g prefix && tmux kill-session -t _t
```
Expected: in ra `prefix C-a`.

- [ ] **Step 4: Commit**

```bash
cd ~/thai/system && git add -A && git -c user.name="idiotcm910" -c user.email="lovinbot.com@gmail.com" commit -m "feat(tmux): config nền + symlink ~/.tmux.conf"
```

---

### Task 2: tpm + plugin tmux

**Files:**
- Modify: `~/thai/system/tmux/tmux.conf` (thêm khối plugin ở cuối)
- Create (clone): `~/.tmux/plugins/tpm`

**Interfaces:**
- Produces: các plugin catppuccin/resurrect/continuum/vim-tmux-navigator/yank sẵn cho session.

- [ ] **Step 1: Cài tpm**

Run:
```bash
git clone https://github.com/tmux-plugins/tpm ~/.tmux/plugins/tpm
```

- [ ] **Step 2: Thêm khối plugin vào CUỐI `tmux/tmux.conf`**

```tmux

# ─── Plugins (tpm) ───
set -g @plugin 'tmux-plugins/tpm'
set -g @plugin 'catppuccin/tmux#v0.3.0'
set -g @plugin 'tmux-plugins/tmux-resurrect'
set -g @plugin 'tmux-plugins/tmux-continuum'
set -g @plugin 'christoomey/vim-tmux-navigator'
set -g @plugin 'tmux-plugins/tmux-yank'

# continuum: tự lưu + tự khôi phục qua reboot
set -g @continuum-restore 'on'
set -g @continuum-save-interval '15'

# catppuccin
set -g @catppuccin_flavour 'mocha'

# yank: dùng wl-copy (Wayland)
set -g @yank_selection_mouse 'clipboard'

# tpm PHẢI ở dòng cuối cùng
run '~/.tmux/plugins/tpm/tpm'
```

- [ ] **Step 3: Cài plugin qua tpm (headless)**

Run:
```bash
tmux kill-server 2>/dev/null; tmux new-session -d -s _p
~/.tmux/plugins/tpm/bin/install_plugins
tmux kill-session -t _p 2>/dev/null || true
ls ~/.tmux/plugins/
```
Expected: thấy các thư mục `tmux`, `tmux-resurrect`, `tmux-continuum`, `vim-tmux-navigator`, `tmux-yank`.

- [ ] **Step 4: Commit**

```bash
cd ~/thai/system && git add -A && git -c user.name="idiotcm910" -c user.email="lovinbot.com@gmail.com" commit -m "feat(tmux): tpm + plugin (catppuccin/resurrect/continuum/navigator/yank)"
```

---

### Task 3: sesh — switcher + config + binding

**Files:**
- Create: `~/thai/system/sesh/sesh.toml`
- Symlink: `~/.config/sesh/sesh.toml` → repo
- Modify: `~/thai/system/tmux/tmux.conf` (thêm bind `prefix o`)
- Install: binary `sesh` → `~/.local/bin/sesh`

**Interfaces:**
- Produces: lệnh `sesh` (list/connect); session mới tự chạy `nvim`.

- [ ] **Step 1: Cài sesh binary**

Run:
```bash
mkdir -p ~/.local/bin
SESH_VER="$(curl -s https://api.github.com/repos/joshmedeski/sesh/releases/latest | grep -oP '"tag_name": "\K[^"]+')"
curl -sL "https://github.com/joshmedeski/sesh/releases/download/${SESH_VER}/sesh_Linux_x86_64.tar.gz" -o /tmp/sesh.tgz
tar -xzf /tmp/sesh.tgz -C ~/.local/bin sesh
chmod +x ~/.local/bin/sesh && rm /tmp/sesh.tgz
~/.local/bin/sesh --version
```
Expected: in ra version sesh.

- [ ] **Step 2: Tạo `sesh/sesh.toml`**

```toml
# ~/thai/system/sesh/sesh.toml

[default_session]
startup_command = "nvim ."

# Nhóm hiển thị icon cho tmux sessions
[[session]]
name = "dotfiles ~/thai/system"
path = "~/thai/system"
startup_command = "nvim ."
```

- [ ] **Step 3: Symlink config**

Run:
```bash
mkdir -p ~/.config/sesh
ln -sf ~/thai/system/sesh/sesh.toml ~/.config/sesh/sesh.toml
```

- [ ] **Step 4: Thêm bind `prefix o` vào `tmux/tmux.conf` (TRƯỚC dòng `run tpm`)**

```tmux
# sesh: popup xem tất cả workspace + nhảy
bind o run-shell "sesh connect \"$(sesh list -i | fzf-tmux -p 60%,55% --no-sort)\""
```

- [ ] **Step 5: Verify sesh list chạy**

Run:
```bash
tmux kill-server 2>/dev/null; tmux new-session -d -s _s
tmux send-keys -t _s "PATH=\$HOME/.local/bin:\$PATH sesh list" C-m
sleep 1; PATH=$HOME/.local/bin:$PATH sesh list | head
tmux kill-session -t _s 2>/dev/null || true
```
Expected: liệt kê ít nhất session `_s` + config session `dotfiles`.

- [ ] **Step 6: Commit**

```bash
cd ~/thai/system && git add -A && git -c user.name="idiotcm910" -c user.email="lovinbot.com@gmail.com" commit -m "feat(sesh): switcher + config + bind prefix o"
```

---

### Task 4: script `wt-new`

**Files:**
- Create: `~/thai/system/bin/wt-new`
- Modify: `~/.bashrc` (thêm PATH + alias, một lần)

**Interfaces:**
- Produces: lệnh `wt-new <branch>` tạo worktree + tmux session (tên = branch sanitize) + nvim.

- [ ] **Step 1: Tạo `bin/wt-new`**

```bash
#!/usr/bin/env bash
# wt-new <branch> — tạo git worktree + tmux session + nvim
set -euo pipefail
branch="${1:?Cần tên branch: wt-new <branch>}"
repo_root="$(git rev-parse --show-toplevel 2>/dev/null)" || { echo "Không ở trong git repo"; exit 1; }
repo_name="$(basename "$repo_root")"
wt_dir="$(dirname "$repo_root")/${repo_name}.worktrees/${branch}"

if [ ! -d "$wt_dir" ]; then
  if git -C "$repo_root" show-ref --verify --quiet "refs/heads/${branch}"; then
    git -C "$repo_root" worktree add "$wt_dir" "$branch"
  else
    git -C "$repo_root" worktree add -b "$branch" "$wt_dir"
  fi
fi

session="$(echo "$branch" | tr './:' '___')"
if ! tmux has-session -t "$session" 2>/dev/null; then
  tmux new-session -d -s "$session" -c "$wt_dir"
  tmux send-keys -t "$session" "nvim ." C-m
fi

if [ -n "${TMUX:-}" ]; then
  tmux switch-client -t "$session"
else
  tmux attach -t "$session"
fi
```

- [ ] **Step 2: chmod + PATH**

Run:
```bash
chmod +x ~/thai/system/bin/wt-new
grep -q 'thai/system/bin' ~/.bashrc || echo 'export PATH="$HOME/thai/system/bin:$HOME/.local/bin:$PATH"' >> ~/.bashrc
```

- [ ] **Step 3: Verify tạo worktree + session (không cần attach)**

Run:
```bash
cd ~/thai/system
export PATH="$HOME/thai/system/bin:$HOME/.local/bin:$PATH"
# repo test: dùng chính ~/thai/system (đã là git repo)
tmux kill-server 2>/dev/null || true
# chạy phần lõi thủ công để verify (không attach)
b=wt-test-$$; d="$(dirname "$PWD")/system.worktrees/$b"
git worktree add -b "$b" "$d" >/dev/null 2>&1 && echo "worktree OK: $d"
tmux new-session -d -s "$b" -c "$d" && tmux has-session -t "$b" && echo "session OK"
# dọn
tmux kill-session -t "$b"; git worktree remove "$d" --force; git branch -D "$b"
```
Expected: `worktree OK` + `session OK`.

- [ ] **Step 4: Commit**

```bash
cd ~/thai/system && git add -A && git -c user.name="idiotcm910" -c user.email="lovinbot.com@gmail.com" commit -m "feat(bin): wt-new — tạo worktree + tmux session + nvim"
```

---

### Task 5: script `wt-status`

**Files:**
- Create: `~/thai/system/bin/wt-status`

**Interfaces:**
- Consumes: worktree do `wt-new` tạo; session tmux tên = branch sanitize.
- Produces: lệnh `wt-status` in bảng worktree + git + số Claude.

- [ ] **Step 1: Tạo `bin/wt-status`**

```bash
#!/usr/bin/env bash
# wt-status — tổng quan worktree + git status + số Claude Code
set -euo pipefail
repo_root="$(git rev-parse --show-toplevel 2>/dev/null)" || { echo "Không ở trong git repo"; exit 1; }

printf "%-28s %-22s %-6s %-7s\n" "WORKTREE" "BRANCH" "ĐỔI" "CLAUDE"
printf "%-28s %-22s %-6s %-7s\n" "--------" "------" "---" "------"
git -C "$repo_root" worktree list --porcelain | awk '/^worktree /{print $2}' | while read -r wt; do
  [ -d "$wt" ] || continue
  branch="$(git -C "$wt" branch --show-current 2>/dev/null || echo '-')"
  changed="$(git -C "$wt" status --porcelain 2>/dev/null | wc -l | tr -d ' ')"
  claude=0
  for pid in $(pgrep -x claude 2>/dev/null || true); do
    cwd="$(readlink -f "/proc/$pid/cwd" 2>/dev/null || true)"
    case "$cwd" in "$wt"|"$wt"/*) claude=$((claude+1));; esac
  done
  printf "%-28s %-22s %-6s %-7s\n" "$(basename "$wt")" "$branch" "$changed" "$claude"
done
```

- [ ] **Step 2: chmod + verify**

Run:
```bash
chmod +x ~/thai/system/bin/wt-status
cd ~/thai/system && ~/thai/system/bin/wt-status
```
Expected: bảng có header + ít nhất dòng cho `system` (repo gốc).

- [ ] **Step 3: Commit**

```bash
cd ~/thai/system && git add -A && git -c user.name="idiotcm910" -c user.email="lovinbot.com@gmail.com" commit -m "feat(bin): wt-status — bảng tổng quan worktree + git + Claude"
```

---

### Task 6: script `wt-clean`

**Files:**
- Create: `~/thai/system/bin/wt-clean`

**Interfaces:**
- Consumes: worktree + session do `wt-new` tạo.
- Produces: lệnh `wt-clean` xóa worktree đã merge + kill session.

- [ ] **Step 1: Tạo `bin/wt-clean`**

```bash
#!/usr/bin/env bash
# wt-clean — xóa worktree đã merge vào main + kill session tương ứng
set -euo pipefail
repo_root="$(git rev-parse --show-toplevel 2>/dev/null)" || { echo "Không ở trong git repo"; exit 1; }
main_branch="$(git -C "$repo_root" symbolic-ref --short refs/remotes/origin/HEAD 2>/dev/null | sed 's@^origin/@@' || echo main)"
git -C "$repo_root" rev-parse --verify "$main_branch" >/dev/null 2>&1 || main_branch=main

git -C "$repo_root" worktree list --porcelain | awk '/^worktree /{print $2}' | while read -r wt; do
  [ "$wt" = "$repo_root" ] && continue
  [ -d "$wt" ] || continue
  branch="$(git -C "$wt" branch --show-current 2>/dev/null || echo '')"
  [ -z "$branch" ] && continue
  if git -C "$repo_root" branch --merged "$main_branch" | sed 's/^[* ]*//' | grep -qx "$branch"; then
    read -r -p "Xóa worktree '$branch' (đã merge vào $main_branch)? [y/N] " ans
    if [ "$ans" = "y" ] || [ "$ans" = "Y" ]; then
      git -C "$repo_root" worktree remove "$wt" --force
      git -C "$repo_root" branch -d "$branch" 2>/dev/null || true
      session="$(echo "$branch" | tr './:' '___')"
      tmux kill-session -t "$session" 2>/dev/null || true
      echo "→ Đã xóa $branch"
    fi
  fi
done
```

- [ ] **Step 2: chmod + verify (dựng worktree giả đã merge rồi clean)**

Run:
```bash
chmod +x ~/thai/system/bin/wt-clean
cd ~/thai/system
b=clean-test-$$; d="$(dirname "$PWD")/system.worktrees/$b"
git worktree add -b "$b" "$d" >/dev/null 2>&1   # branch mới = đã "merged" (không có commit thừa)
echo "y" | ~/thai/system/bin/wt-clean | grep -q "Đã xóa $b" && echo "CLEAN OK" || echo "check thủ công"
git worktree prune 2>/dev/null || true
```
Expected: `CLEAN OK` (branch mới không có commit riêng nên tính là đã merged).

- [ ] **Step 3: Commit**

```bash
cd ~/thai/system && git add -A && git -c user.name="idiotcm910" -c user.email="lovinbot.com@gmail.com" commit -m "feat(bin): wt-clean — dọn worktree đã merge + kill session"
```

---

### Task 7: binding sync-panes

**Files:**
- Modify: `~/thai/system/tmux/tmux.conf` (thêm bind, TRƯỚC dòng `run tpm`)

- [ ] **Step 1: Thêm bind vào `tmux/tmux.conf`**

```tmux
# Đồng bộ gõ trên mọi pane (chạy 1 lệnh nhiều pane)
bind e setw synchronize-panes \; display "sync-panes: #{?pane_synchronized,ON,OFF}"
```

- [ ] **Step 2: Verify bind tồn tại**

Run:
```bash
tmux kill-server 2>/dev/null; tmux new-session -d -s _e
tmux list-keys | grep -q "synchronize-panes" && echo "BIND OK"
tmux kill-session -t _e 2>/dev/null || true
```
Expected: `BIND OK`.

- [ ] **Step 3: Commit**

```bash
cd ~/thai/system && git add -A && git -c user.name="idiotcm910" -c user.email="lovinbot.com@gmail.com" commit -m "feat(tmux): bind prefix e — toggle sync-panes"
```

---

### Task 8: nvim — snacks + claude-multi.nvim

**Files:**
- Create: `~/thai/system/nvim/lua/plugins/snacks.lua`
- Create: `~/thai/system/nvim/lua/plugins/claude-multi.lua`

**Interfaces:**
- Consumes: lazy.nvim, leader = Space.
- Produces: lệnh `:Claude*` + phím `<leader>c*`.

- [ ] **Step 1: Tạo `snacks.lua`**

```lua
-- snacks.nvim — QoL library, dependency cho claude-multi & claudecode
return {
  "folke/snacks.nvim",
  priority = 900,
  lazy = false,
  opts = {},
}
```

- [ ] **Step 2: Tạo `claude-multi.lua`**

```lua
-- claude-multi.nvim — quản nhiều Claude Code TRONG nvim (tab + winbar)
return {
  "mb6611/claude-multi.nvim",
  dependencies = { "folke/snacks.nvim" },
  event = "VeryLazy",
  opts = {
    layout = "float", -- 'float' (nổi giữa) hoặc 'sidebar' (cột phải)
  },
  keys = {
    { "<leader>c",  nil,                       desc = "Claude (multi)" },
    { "<leader>cc", "<cmd>ClaudeToggle<cr>",   desc = "Claude: bật/tắt" },
    { "<leader>cn", "<cmd>ClaudeNew<cr>",      desc = "Claude: phiên mới" },
    { "<leader>cw", "<cmd>ClaudeNewWorktree<cr>", desc = "Claude: phiên worktree mới" },
    { "<leader>ch", "<cmd>ClaudePrev<cr>",     desc = "Claude: phiên trước" },
    { "<leader>cl", "<cmd>ClaudeNext<cr>",     desc = "Claude: phiên sau" },
    { "<leader>cr", "<cmd>ClaudeRecall<cr>",   desc = "Claude: recall hội thoại" },
    { "<leader>cx", "<cmd>ClaudeClose<cr>",    desc = "Claude: đóng phiên" },
  },
}
```

- [ ] **Step 3: Verify sync + load không lỗi**

Run:
```bash
export PATH="$HOME/.local/bin:/usr/local/bin:$PATH"
nvim --headless "+Lazy! sync" +qa 2>&1 | tail -1
nvim --headless -c "Lazy load claude-multi.nvim snacks.nvim" -c "lua for _,p in ipairs({'snacks','claude-multi'}) do local o,e=pcall(require,p); print((o and 'OK ' or 'LỖI ')..p..(o and '' or ' '..tostring(e))) end" -c "qa" 2>&1 | grep -E 'OK|LỖI'
```
Expected: `OK snacks` + `OK claude-multi` (nếu tên module khác, chỉnh require cho khớp — kiểm tra `ls ~/.local/share/nvim/lazy/claude-multi.nvim/lua`).

- [ ] **Step 4: Commit**

```bash
cd ~/thai/system && git add -A && git -c user.name="idiotcm910" -c user.email="lovinbot.com@gmail.com" commit -m "feat(nvim): snacks + claude-multi.nvim (quản nhiều Claude trong nvim)"
```

---

### Task 9: nvim — claudecode.nvim

**Files:**
- Create: `~/thai/system/nvim/lua/plugins/claudecode.lua`

**Interfaces:**
- Consumes: snacks.nvim (Task 8), Claude CLI `~/.local/bin/claude`.
- Produces: lệnh `:ClaudeCode*` + phím `<leader>a*`.

- [ ] **Step 1: Tạo `claudecode.lua`**

```lua
-- claudecode.nvim — tích hợp IDE cho Claude Code (gửi selection, diff)
return {
  "coder/claudecode.nvim",
  dependencies = { "folke/snacks.nvim" },
  config = true,
  cmd = {
    "ClaudeCode", "ClaudeCodeFocus", "ClaudeCodeSelectModel",
    "ClaudeCodeAdd", "ClaudeCodeSend", "ClaudeCodeTreeAdd",
    "ClaudeCodeDiffAccept", "ClaudeCodeDiffDeny",
  },
  keys = {
    { "<leader>a",  nil,                              desc = "AI / Claude Code" },
    { "<leader>ac", "<cmd>ClaudeCode<cr>",            desc = "Claude: toggle IDE" },
    { "<leader>af", "<cmd>ClaudeCodeFocus<cr>",       desc = "Claude: focus" },
    { "<leader>am", "<cmd>ClaudeCodeSelectModel<cr>", desc = "Claude: chọn model" },
    { "<leader>ab", "<cmd>ClaudeCodeAdd %<cr>",       desc = "Claude: thêm buffer làm ngữ cảnh" },
    { "<leader>as", "<cmd>ClaudeCodeSend<cr>", mode = "v", desc = "Claude: gửi selection" },
    { "<leader>aa", "<cmd>ClaudeCodeDiffAccept<cr>",  desc = "Claude: nhận diff" },
    { "<leader>ad", "<cmd>ClaudeCodeDiffDeny<cr>",    desc = "Claude: từ chối diff" },
  },
}
```

- [ ] **Step 2: Verify sync + load**

Run:
```bash
export PATH="$HOME/.local/bin:/usr/local/bin:$PATH"
nvim --headless "+Lazy! sync" +qa 2>&1 | tail -1
nvim --headless -c "Lazy load claudecode.nvim" -c "lua print(pcall(require,'claudecode') and 'OK claudecode' or 'LỖI')" -c "qa" 2>&1 | grep -E 'OK|LỖI'
```
Expected: `OK claudecode`.

- [ ] **Step 3: Commit**

```bash
cd ~/thai/system && git add -A && git -c user.name="idiotcm910" -c user.email="lovinbot.com@gmail.com" commit -m "feat(nvim): claudecode.nvim (gửi selection + diff accept/deny)"
```

---

### Task 10: nvim — phím zoom `<leader>z`

**Files:**
- Modify: `~/thai/system/nvim/lua/config/keymaps.lua` (thêm ở cuối)

- [ ] **Step 1: Thêm keymap zoom vào cuối `keymaps.lua`**

```lua
-- Zoom cửa sổ nvim: phóng to cửa sổ hiện tại, bấm lần nữa trả về (toggle)
map("n", "<leader>z", function()
  if vim.t.zoom_restore then
    vim.cmd(vim.t.zoom_restore)
    vim.t.zoom_restore = nil
  else
    local restore = vim.fn.winrestcmd()
    vim.cmd("resize | vertical resize")
    vim.t.zoom_restore = restore
  end
end, { desc = "Zoom cửa sổ (toggle)" })
```

- [ ] **Step 2: Verify không lỗi**

Run:
```bash
export PATH="$HOME/.local/bin:/usr/local/bin:$PATH"
nvim --headless -c "lua require('config.keymaps')" -c "lua print(vim.fn.maparg('<leader>z','n') ~= '' and 'ZOOM OK' or 'thiếu')" -c "qa" 2>&1 | grep -E 'ZOOM|thiếu|error'
```
Expected: `ZOOM OK`.

- [ ] **Step 3: Commit**

```bash
cd ~/thai/system && git add -A && git -c user.name="idiotcm910" -c user.email="lovinbot.com@gmail.com" commit -m "feat(nvim): phím <leader>z zoom cửa sổ (toggle)"
```

---

### Task 11: mở rộng `install.sh`

**Files:**
- Modify: `~/thai/system/nvim/install.sh` → tách phần workspace ra script mới, hoặc thêm script `~/thai/system/setup-workspace.sh`
- Create: `~/thai/system/setup-workspace.sh`

**Interfaces:**
- Produces: 1 script cài toàn bộ tầng tmux/sesh/scripts trên máy mới.

- [ ] **Step 1: Tạo `setup-workspace.sh`**

```bash
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
  V="$(curl -s https://api.github.com/repos/joshmedeski/sesh/releases/latest | grep -oP '"tag_name": "\K[^"]+')"
  curl -sL "https://github.com/joshmedeski/sesh/releases/download/${V}/sesh_Linux_x86_64.tar.gz" -o /tmp/sesh.tgz
  tar -xzf /tmp/sesh.tgz -C ~/.local/bin sesh && chmod +x ~/.local/bin/sesh && rm /tmp/sesh.tgz
fi
mkdir -p ~/.config/sesh && ln -sf ~/thai/system/sesh/sesh.toml ~/.config/sesh/sesh.toml

log "PATH cho scripts"
grep -q 'thai/system/bin' ~/.bashrc || echo 'export PATH="$HOME/thai/system/bin:$HOME/.local/bin:$PATH"' >> ~/.bashrc
chmod +x ~/thai/system/bin/*

log "Cài plugin tmux (tpm)"
tmux kill-server 2>/dev/null || true
tmux new-session -d -s _setup && ~/.tmux/plugins/tpm/bin/install_plugins && tmux kill-session -t _setup 2>/dev/null || true

echo ""
echo "✅ XONG. Mở terminal mới → gõ 'tmux' → 'wt-new <branch>' để bắt đầu."
```

- [ ] **Step 2: chmod + verify cú pháp**

Run:
```bash
chmod +x ~/thai/system/setup-workspace.sh
bash -n ~/thai/system/setup-workspace.sh && echo "SYNTAX OK"
```
Expected: `SYNTAX OK`.

- [ ] **Step 3: Commit**

```bash
cd ~/thai/system && git add -A && git -c user.name="idiotcm910" -c user.email="lovinbot.com@gmail.com" commit -m "feat(setup): setup-workspace.sh — cài tmux/tpm/sesh/scripts"
```

---

### Task 12: tài liệu — README workflow

**Files:**
- Create: `~/thai/system/docs/workspace-workflow.md`
- Modify: `~/thai/system/README.md` (thêm 1 dòng trỏ tới)

- [ ] **Step 1: Tạo `docs/workspace-workflow.md`**

```markdown
# Multi-worktree Claude Code Workspace — Cách dùng

## Cài đặt (máy mới)
```bash
bash ~/thai/system/nvim/install.sh      # nvim + plugin
bash ~/thai/system/setup-workspace.sh   # tmux + sesh + scripts
```

## Luồng làm việc
1. `tmux` — mở một lần.
2. `wt-new <branch>` — tạo worktree + session + nvim (tự mở).
3. Trong nvim: `<Space>cn` mở Claude Code; thêm nữa `<Space>cn`. `<Space>as` (visual) gửi code cho Claude; `<Space>aa` nhận diff.
4. `<Space>z` hoặc `prefix z` — zoom full.
5. `prefix o` — popup xem tất cả workspace, nhảy (cái cũ vẫn chạy nền).
6. `wt-status` — bảng tổng quan mọi worktree + git + số Claude.
7. `wt-clean` — dọn worktree đã merge.

## Phím tmux (prefix = Ctrl-a)
| Phím | Tác dụng |
|---|---|
| `prefix o` | Switcher sesh (xem/nhảy workspace) |
| `prefix z` | Zoom full pane |
| `prefix e` | Toggle sync-panes |
| `prefix \|` / `prefix -` | Split dọc / ngang |
| `Ctrl-h/j/k/l` | Nhảy pane (xuyên nvim ↔ tmux) |
| `prefix r` | Reload config |

## Phím nvim Claude (leader = Space)
| Phím | Tác dụng |
|---|---|
| `<leader>cc/cn/ch/cl/cx` | Claude toggle/mới/trước/sau/đóng (claude-multi) |
| `<leader>cr` | Recall hội thoại cũ |
| `<leader>ac/af` | Claude IDE toggle/focus (claudecode) |
| `<leader>as` | Gửi selection (visual) |
| `<leader>aa/ad` | Nhận / từ chối diff |
| `<leader>z` | Zoom cửa sổ nvim |
```

- [ ] **Step 2: Thêm dòng vào `README.md` bảng "Nội dung"**

Thêm dòng:
```markdown
| [`docs/workspace-workflow.md`](./docs/workspace-workflow.md) | Multi-worktree Claude Code workspace (tmux + sesh) | `bash setup-workspace.sh` |
```

- [ ] **Step 3: Commit**

```bash
cd ~/thai/system && git add -A && git -c user.name="idiotcm910" -c user.email="lovinbot.com@gmail.com" commit -m "docs: hướng dẫn multi-worktree Claude Code workspace"
```

---

## Self-Review

**Spec coverage:**
- §3.1 tmux nền → Task 1 ✓ · §3.2 plugin → Task 2 ✓ · §3.3 sesh → Task 3 ✓
- §3.4 scripts: wt-new → Task 4 ✓, wt-status → Task 5 ✓, wt-clean → Task 6 ✓, sync-panes → Task 7 ✓
- §3.5 nvim: snacks/claude-multi → Task 8 ✓, claudecode → Task 9 ✓, zoom → Task 10 ✓
- §7 install → Task 11 ✓ · §4 bảng phím + §5 luồng → Task 12 ✓
- §9 tiêu chí hoàn thành: được phủ bởi verify của các task + kiểm thử tay khi dùng thật.

**Placeholder scan:** Không có TBD/TODO; mọi file có nội dung đầy đủ.

**Điểm cần kiểm khi chạy:** tên module require của `claude-multi` (Task 8 Step 3 đã nhắc kiểm `ls .../lua`); config catppuccin pin `#v0.3.0` để chắc chắn API `@catppuccin_flavour` đúng.
