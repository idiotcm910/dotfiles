# Thiết kế: Multi-worktree Claude Code Workspace

**Ngày:** 2026-07-16
**Repo:** `~/thai/system`
**Trạng thái:** Đã brainstorm, chờ triển khai

---

## 1. Mục tiêu

Xây một môi trường làm việc cho **vibe coding với Claude Code** trên **một source có nhiều git worktree chạy song song**. Yêu cầu:

- Mỗi git worktree = một workspace **cách ly hoàn toàn**: nvim riêng (LSP đúng root), tập Claude Code riêng.
- Một worktree chạy được **nhiều Claude Code** cùng lúc — trong nvim (claude-multi) hoặc pane tmux.
- Chỉ cần mở **một terminal tmux**: tạo nhiều workspace, **focus/zoom full** một cái mà các cái khác **vẫn chạy nền**, chuyển qua lại nhanh, xem tổng quan tất cả.
- **Bền**: detach/đóng terminal không mất phiên; sống qua reboot.

## 2. Kiến trúc 3 tầng

```
┌─ tmux (tầng cách ly workspace) ─────────────────────────────┐
│  session: feat-login      session: fix-bug     session: ...  │
│  ┌───────────────────┐    ┌───────────────┐                  │
│  │ nvim (worktree A) │    │ nvim (wt B)   │                  │
│  │  ├ claude-multi   │    │               │                  │
│  │  │   ├ Claude #1  │    │               │                  │
│  │  │   └ Claude #2  │    │               │                  │
│  │  └ claudecode     │    │               │                  │
│  ├ pane: Claude #3   │    │ pane: shell   │                  │
│  └ pane: shell/test  │    └───────────────┘                  │
└──────────────────────────────────────────────────────────────┘
         ▲ switch bằng `sesh` (fuzzy popup)
```

- **Tầng 1 — tmux:** 1 session = 1 workspace = 1 worktree. Attach = full màn hình; session khác chạy nền (detached).
- **Tầng 2 — nvim:** mỗi session mở 1 nvim rooted đúng thư mục worktree.
- **Tầng 3 — Claude Code:** nhiều instance, chạy trong nvim (claude-multi.nvim) hoặc pane tmux.

## 3. Thành phần

### 3.1. tmux — cấu hình nền (`~/thai/system/tmux/tmux.conf`)

- Prefix đổi sang `Ctrl-a` (dễ bấm hơn `Ctrl-b`).
- Mouse on; copy-mode kiểu vi; index bắt đầu từ 1; escape-time 0 (nvim mượt).
- Tăng history-limit; terminal 24-bit màu (khớp nvim termguicolors).
- Bind reload config: `prefix + r`.

### 3.2. tmux — plugin (qua `tpm`)

| Plugin | Vai trò |
|---|---|
| `tmux-plugins/tpm` | Trình quản lý plugin (cài bằng `prefix + I`) |
| `catppuccin/tmux` | Status bar đẹp: tên session (workspace), git branch, cwd, danh sách window |
| `tmux-plugins/tmux-resurrect` | Lưu/khôi phục sessions thủ công (`prefix + Ctrl-s` / `Ctrl-r`) |
| `tmux-plugins/tmux-continuum` | Tự động lưu định kỳ + tự khôi phục khi mở tmux (sống qua reboot) |
| `christoomey/vim-tmux-navigator` | `Ctrl-h/j/k/l` nhảy liền mạch giữa pane nvim và pane tmux |
| `tmux-plugins/tmux-yank` | Copy trong copy-mode → vào clipboard hệ thống (Wayland: `wl-copy`) |

### 3.3. `sesh` — switcher (bản chọn thay tmux-sessionx)

- `sesh` (joshmedeski/sesh) là Go binary quản lý session thông minh: liệt kê tmux sessions + zoxide dirs + config, fuzzy connect.
- Cấu hình `~/thai/system/sesh/sesh.toml`:
  - `default_session.startup_command = "nvim"` — session mới tự mở nvim.
  - Một **custom source** liệt kê các git worktree của repo hiện tại (chạy `git worktree list`).
- Bind trong tmux: `prefix + o` (hoặc `Ctrl-a o`) mở popup `sesh connect $(sesh list | fzf-tmux)` để xem tất cả workspace + nhảy.

### 3.4. Scripts (`~/thai/system/bin/`, đưa vào PATH)

| Script | Chức năng |
|---|---|
| `wt-new <branch>` | `git worktree add` tại `../<repo>.worktrees/<branch>` + tạo branch nếu chưa có → `sesh connect <path>` (tạo/attach tmux session tên = branch, mở nvim). |
| `wt-status` | Liệt kê mọi worktree của repo + git status ngắn (branch, số file đổi, ahead/behind) + số Claude Code đang chạy trong session tương ứng. Bảng tổng quan "worktree nào đang bận". |
| `wt-clean` | Tìm worktree đã merge vào main → hỏi xác nhận → `git worktree remove` + `tmux kill-session` tương ứng. Dọn trong một phát. |
| (binding) `sync-panes` | `prefix + e` bật/tắt `synchronize-panes` — gõ 1 lệnh chạy trên mọi pane (ví dụ test đồng loạt nhiều pane). |

> `wt-status` đếm Claude bằng cách tìm tiến trình `claude` có cwd nằm trong đường dẫn worktree (qua `/proc` hoặc `pgrep -a`).

### 3.5. nvim — plugin bổ sung (vào config `~/thai/system/nvim/lua/plugins/`)

| Plugin | Vai trò | Phím chính |
|---|---|---|
| `folke/snacks.nvim` | Dependency cho 2 plugin dưới (terminal, picker) | — |
| `mb6611/claude-multi.nvim` | Quản nhiều Claude Code **trong nvim** (tab + winbar) | `<leader>cn` mới · `<leader>ch`/`cl` chuyển · `<leader>cc` toggle · `<leader>cx` đóng · `<leader>cr` recall |
| `coder/claudecode.nvim` | Tích hợp IDE: gửi selection, xem/nhận diff | `<leader>as` gửi (visual) · `<leader>ab` gửi buffer · `<leader>aa`/`ad` nhận/từ chối diff |
| (keymap) zoom | Phóng to cửa sổ hiện tại toàn màn hình (bật/tắt) | `<leader>z` |

> **Lưu ý phím:** `claude-multi` dùng `<leader>c*`, `claudecode` dùng `<leader>a*` — không đụng nhau. Kiểm tra không trùng phím cũ (`<leader>c` chưa dùng làm nhóm; `<leader>a` chưa dùng).

## 4. Bảng phím tổng hợp (UX cuối cùng)

**Tầng tmux** (prefix = `Ctrl-a`)
| Phím | Tác dụng |
|---|---|
| `prefix + o` | Popup `sesh`: xem tất cả workspace + nhảy |
| `Ctrl-f` (shell alias) | Chạy `wt-new`/chọn worktree nhanh |
| `prefix + z` | Zoom full pane hiện tại (nvim hoặc Claude) |
| `prefix + c` / `prefix + ,` | Tạo window mới / đổi tên |
| `prefix + e` | Bật/tắt sync-panes |
| `prefix + Ctrl-s` / `Ctrl-r` | Lưu / khôi phục sessions |
| `Ctrl-h/j/k/l` | Nhảy pane (xuyên nvim ↔ tmux) |

**Tầng nvim** (leader = `Space`)
| Phím | Tác dụng |
|---|---|
| `<leader>cn` / `ch` / `cl` / `cx` | Claude mới / trước / sau / đóng (claude-multi) |
| `<leader>as` / `aa` / `ad` | Gửi selection / nhận diff / từ chối (claudecode) |
| `<leader>z` | Zoom full cửa sổ trong nvim |

## 5. Luồng thao tác điển hình

1. Mở terminal → `tmux` (một lần).
2. `Ctrl-f` → gõ tên feature → `wt-new` tạo worktree + branch + session + nvim tự mở.
3. Trong nvim: `<leader>cn` mở Claude Code, vibe code. Thêm Claude → `<leader>cn` nữa, hoặc mở pane tmux chạy `claude`.
4. `<leader>z` / `prefix z` → zoom full khi cần tập trung.
5. `prefix o` → popup xem *tất cả* workspace, nhảy sang cái khác (cái cũ vẫn chạy nền).
6. Đóng terminal → mọi thứ chạy tiếp. Mở lại `tmux attach` (hoặc continuum tự khôi phục) → nguyên trạng.
7. Xong feature → `wt-clean` dọn worktree + session.

## 6. Bố cục file trong `~/thai/system`

```
~/thai/system/
├── nvim/                       # (đã có) config Neovim
│   └── lua/plugins/
│       ├── claude-multi.lua    # MỚI
│       ├── claudecode.lua      # MỚI
│       └── ...
├── tmux/
│   └── tmux.conf               # MỚI — cấu hình + khai báo plugin tpm
├── sesh/
│   └── sesh.toml               # MỚI — config switcher
├── bin/                        # MỚI — scripts, đưa vào PATH
│   ├── wt-new
│   ├── wt-status
│   └── wt-clean
├── install.sh                  # (đã có) — mở rộng: cài tmux, tpm, sesh, plugin
└── docs/specs/                 # spec này
```

## 7. Cài đặt (mở rộng `install.sh`)

Thêm vào `install.sh`:
- `apt install tmux fzf` (fzf đã có), `wl-clipboard` (đã có).
- Cài `sesh`: tải Go binary từ release về `~/.local/bin/sesh` (hoặc `go install`).
- Cài `tpm`: `git clone` vào `~/.tmux/plugins/tpm`.
- Symlink: `~/.tmux.conf` → `~/thai/system/tmux/tmux.conf`; `~/.config/sesh/sesh.toml` → repo; thêm `~/thai/system/bin` vào PATH (qua `.bashrc`/`.zshrc`).
- Chạy `tpm` cài plugin: `~/.tmux/plugins/tpm/bin/install_plugins`.

## 8. Ngoài phạm vi (YAGNI / tương lai)

- Không dùng plugin git-worktree trong nvim (tránh chồng chéo — worktree do `wt-new` quản lý, một nguồn chân lý).
- Không làm dashboard TUI riêng (dùng `wt-status` in ra là đủ ở giai đoạn này).
- Chưa tích hợp `claude-squad`/`crystal` — để dành nếu sau này muốn orchestrator dựng sẵn.

## 9. Tiêu chí hoàn thành

- Từ một terminal trống: `tmux` → `Ctrl-f` tạo được worktree mới + nvim mở đúng root.
- Trong nvim mở được ≥ 2 Claude Code (claude-multi) + gửi selection qua claudecode + xem diff.
- `prefix o` liệt kê + nhảy giữa ≥ 2 workspace; workspace không active vẫn chạy Claude.
- `prefix z` / `<leader>z` zoom full được.
- `wt-status` hiện đúng danh sách worktree + git status + số Claude.
- `wt-clean` xóa được worktree đã merge + kill session.
- Detach rồi attach lại (hoặc reboot + continuum) → workspaces còn nguyên.
