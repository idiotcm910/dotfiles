# Sway desktop kit

Cấu hình Sway Tokyo Night nhẹ cho Ubuntu 24.04. Bộ này không gỡ GNOME; chọn
**Sway** ở biểu tượng bánh răng của màn hình đăng nhập để dùng.

## Áp dụng

```bash
cd ~/thai/system
bash sway/install.sh --dry-run
bash sway/install.sh
```

Script chỉ cài những package Ubuntu còn thiếu và quản lý các thư mục Sway,
Waybar, Wofi, Foot, Mako, swaylock trong `~/.config`. Nếu một thư mục đích đã có,
script đổi tên nó thành `<tên>.backup-YYYYmmdd-HHMMSS` trước khi copy cấu hình
mới.

Sau khi đã đăng nhập Sway, sửa source trong `~/thai/system/sway/config/`, chạy
lại installer rồi dùng `swaymsg reload`. Không chạy `swaymsg reload` trong GNOME.

## Khôi phục

Đăng xuất Sway và chọn GNOME ở màn hình đăng nhập. Để trả lại một component,
xóa thư mục config mới rồi đổi tên bản backup gần nhất về tên cũ, ví dụ:

```bash
mv ~/.config/foot.backup-YYYYmmdd-HHMMSS ~/.config/foot
```

Xem `../guide/sway.html` để có cẩm nang dùng hằng ngày: workflow terminal/browser,
workspace, window management, lỗi thường gặp, package còn thiếu và khôi phục.
