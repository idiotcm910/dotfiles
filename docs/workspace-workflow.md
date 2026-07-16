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
