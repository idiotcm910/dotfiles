# System configs

Nơi chứa cấu hình cá nhân của máy để đồng bộ qua git.

## Nội dung

| Thư mục | Mô tả | Kích hoạt |
|---|---|---|
| [`nvim/`](./nvim) | Cấu hình Neovim — IDE nhẹ để đọc code | `ln -s ~/thai/system/nvim ~/.config/nvim` |
| [`sway/`](./sway) | Sway Tokyo Night — desktop tiling nhẹ | `bash sway/install.sh --dry-run` rồi `bash sway/install.sh` |
| [`docs/workspace-workflow.md`](./docs/workspace-workflow.md) | Multi-worktree Claude Code workspace (tmux + sesh) | `bash setup-workspace.sh` |

Xem `nvim/README.md` để biết toàn bộ phím tắt, `nvim/INSTALL.md` để cài đặt lần đầu, và `guide/sway.html` cho Sway.
