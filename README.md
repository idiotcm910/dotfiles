# System configs

Nơi chứa cấu hình cá nhân của máy để đồng bộ qua git.

## Nội dung

| Thư mục | Mô tả | Kích hoạt |
|---|---|---|
| [`nvim/`](./nvim) | Cấu hình Neovim — IDE nhẹ để đọc code | `ln -s ~/thai/system/nvim ~/.config/nvim` |
| [`tmux/`](./tmux) | Cấu hình tmux và workflow workspace hiện tại | `ln -s ~/thai/system/tmux/tmux.conf ~/.tmux.conf` |
| [`sesh/`](./sesh) | Danh sách và switcher workspace | `bash setup-workspace.sh` |
| [`.codex/`](./.codex) | Config, prompts và rules Codex an toàn để đồng bộ | Copy chọn lọc vào `~/.codex` |
| [`.claude/`](./.claude) | Settings, agents và skills Claude Code | Copy chọn lọc vào `~/.claude` |
| [`config/`](./config) | Config Kitty, Qtile, Polybar và Rofi được giữ từ dotfiles cũ | Khôi phục thủ công khi cần |
| [`font/`](./font) | Font từ dotfiles cũ | Cài thủ công khi cần |
| [`image/`](./image) | Wallpaper từ dotfiles cũ | Dùng thủ công |
| [`docs/workspace-workflow.md`](./docs/workspace-workflow.md) | Multi-worktree Claude Code workspace (tmux + sesh) | `bash setup-workspace.sh` |

Neovim, tmux và workflow lấy bản mới trong repo này. Các config còn lại được giữ
từ dotfiles cũ. Xem `nvim/README.md` để biết toàn bộ phím tắt và
`nvim/INSTALL.md` để cài đặt lần đầu.
