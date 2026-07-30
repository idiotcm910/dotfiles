# Vibe Workspace · Guide

Cẩm nang tra cứu (tmux · Neovim · Claude Code) dạng nhiều trang HTML, dùng chung CSS/JS.

## Mở

```bash
xdg-open ~/thai/system/guide/index.html
```

## Cấu trúc

```
guide/
├── index.html            # Tổng quan (hub) — kiến trúc + luồng + link
├── tmux.html             # 01 · tmux
├── workspace.html        # 02 · wt-* / sesh / zoxide
├── nvim-motion.html      # 03 · di chuyển
├── nvim-search.html      # 04 · fzf / tree / dropbar
├── nvim-lsp-claude.html  # 05 · LSP / claude-multi / claudecode
├── setup.html            # 06 · cài đặt
├── arch-install.html     # 08 · checklist cài Arch + Qtile từ đầu
├── _template.html        # khuôn để tạo trang mới
└── assets/
    ├── style.css         # style dùng chung (đổi 1 chỗ → đổi cả site)
    └── app.js            # sidebar tự sinh + tìm kiếm + toggle sáng/tối
```

## Thêm một trang mới (mở rộng tính năng)

1. `cp _template.html ten-tinh-nang.html`
2. Sửa `<title>`, `data-page="id-duy-nhat"`, `data-title="Tiêu đề"`, rồi viết nội dung trong `<div class="doc">` (dùng mẫu `group` + `row`).
3. Thêm 1 dòng vào mảng `PAGES` trong `assets/app.js`:
   ```js
   { page: "id-duy-nhat", file: "ten-tinh-nang.html", n: "07", label: "Tên hiện" },
   ```
   Sidebar + điều hướng tự cập nhật trên mọi trang.

## Quy ước nội dung

- Một hàng phím: `<div class="row"><div class="keys">…kbd…</div><div class="d">mô tả</div></div>`
- Keycap: `<kbd>x</kbd>`; phím bổ trợ: `<kbd class="mod">Ctrl</kbd>`; nối: `<span class="plus">+</span>`; tuần tự: `<span class="then">rồi</span>`
- Lệnh shell: `<code class="cmd">wt-new</code>`
- Nhóm 2 cột: `<div class="rows two">`
- Ô tìm kiếm (phím `/`) lọc mọi `.row` trong trang.

## Checklist cài Arch

`arch-install.html` là checklist tương tác cho quy trình xóa ổ và cài lại Arch:

- task dùng `class="task-check"` và `data-task` duy nhất;
- tiến độ lưu local bằng key `vibe-guide:arch-install:v1`;
- command block liên kết nút copy qua `data-copy-target`;
- task phá hủy có thể khóa bằng `data-requires="backup-confirmed"`;
- reset luôn yêu cầu xác nhận, không có control nào thực thi lệnh hệ thống.
