# Arch Qtile dotfiles

Dotfiles cho môi trường code trên Arch Linux dùng Qtile + Polybar.

## Khôi phục máy

Xem trước toàn bộ thao tác:

```bash
bash restore.sh --dry-run
```

Cài và khôi phục toàn bộ:

```bash
bash restore.sh
```

Script dùng `pacman` cho package chính thức, AUR cho Google Chrome và IBus
Bamboo, installer chính thức cho Codex/Grok CLI, npm cho Claude Code và Pi.
Config cũ được backup vào `~/.local/state/dotfiles-backup/<timestamp>/` trước
khi tạo symlink.

Có thể chạy riêng từng phần:

```bash
bash restore.sh --only desktop   # Qtile, Polybar, Kitty, Rofi
bash restore.sh --only dev       # Neovim, tmux, sesh, zoxide, ble.sh
bash restore.sh --only ai        # Codex, Claude, Grok, Pi và portable config
bash restore.sh --skip-aur       # bỏ qua Google Chrome
```

Sau khi restore desktop, chạy `startx` để vào Qtile. Codex, Claude, Grok, Pi
và Chrome vẫn yêu cầu đăng nhập thủ công; credential và session không được lưu
trong repo.

## Nội dung

| Thư mục | Mô tả | Kích hoạt |
|---|---|---|
| [`nvim/`](./nvim) | Cấu hình Neovim — IDE nhẹ để đọc code | `bash restore.sh --only dev` |
| [`tmux/`](./tmux) | Cấu hình tmux và workflow workspace hiện tại | `bash restore.sh --only dev` |
| [`sesh/`](./sesh) | Danh sách và switcher workspace | `bash restore.sh --only dev` |
| [`.codex/`](./.codex) | Config, prompts và rules Codex an toàn để đồng bộ | `bash restore.sh --only ai` |
| [`.claude/`](./.claude) | Settings, agents và skills Claude Code | `bash restore.sh --only ai` |
| [`.grok/`](./.grok) | Config Grok CLI (model, UI, plugins) | `bash restore.sh --only ai` |
| [`.pi/`](./.pi) | Settings/packages/themes Pi coding agent (`~/.pi/agent`) | `bash restore.sh --only ai` |
| [`config/`](./config) | Config Kitty, Qtile, Polybar và Rofi | `bash restore.sh --only desktop` |
| [`font/`](./font) | Font dùng cho terminal và desktop | `bash restore.sh --only desktop` |
| [`image/`](./image) | Wallpaper từ dotfiles cũ | Dùng thủ công |
| [`docs/workspace-workflow.md`](./docs/workspace-workflow.md) | Multi-worktree Claude Code workspace (tmux + sesh) | `bash setup-workspace.sh` |

Neovim, tmux và workflow dùng bản mới trong repo này. Xem `nvim/README.md` để
biết toàn bộ phím tắt.
