# Sway developer guide — thiết kế mở rộng

## Mục tiêu

Chuyển `guide/sway.html` từ cheat-sheet phím tắt thành cẩm nang dùng Sway hằng
ngày cho người lập trình làm việc chủ yếu với terminal và browser. Người đọc mới
có thể đăng nhập, bắt đầu một phiên làm việc, tự xử lý sự cố phổ biến, và biết
cách thay đổi cấu hình mà không làm mất đường quay lại GNOME.

## Đối tượng và nguyên tắc

- Người dùng Ubuntu 24.04, mới dùng Sway nhưng quen terminal/browser.
- Ưu tiên luồng công việc và hành động cụ thể trước bảng phím tắt.
- Mọi hướng dẫn phản ánh đúng config hiện có, không mô tả tính năng chưa cài.
- Mở ứng dụng theo một cách thống nhất: `Super+D` và Wofi. Không thêm shortcut
  mở browser riêng.
- Giữ thiết kế HTML và navigation hiện có để guide mới liền mạch với các trang
  trong `guide/`.

## Nội dung guide

1. **Bắt đầu an toàn** — những package cần có, chọn Sway tại GDM, cách xác nhận
   terminal/Waybar/network/âm thanh sau login, và lối thoát về GNOME.
2. **Một phiên lập trình điển hình** — mở terminal bằng `Super+Enter`; mở browser
   và app bằng `Super+D`; mở project từ terminal; đặt terminal/browser cạnh nhau;
   dùng workspace để tách dự án hoặc tác vụ; lock máy khi rời chỗ.
3. **Quản lý cửa sổ** — focus, move, layout tiling, floating, fullscreen, đóng
   app; nêu rõ phím thực tế (focus phải là `Super+Right`, không phải `Super+L`
   vì `Super+L` dùng để lock).
4. **Thao tác desktop** — Waybar đọc gì và click được gì; thông báo Mako; âm
   lượng, media, brightness; screenshot toàn màn hình/vùng/lưu file; clipboard
   Wayland và cách dán trong terminal/browser.
5. **Laptop và màn hình ngoài** — touchpad hiện được bật gì; cách xem output,
   dùng `wdisplays` nếu có hoặc lệnh `swaymsg`; hướng dẫn không hard-code monitor
   trong config; giới hạn: package/config hiện tại không tự quản lý wallpaper hay
   screen sharing.
6. **Sự cố hay gặp** — màn hình đen/login fail, Waybar/Mako/Wofi không chạy,
   không có âm thanh, screenshot/brightness không chạy vì package còn thiếu,
   layout keyboard sai, cửa sổ khó dùng với tiling; mỗi mục có triệu chứng, lệnh
   kiểm tra và recovery an toàn.
7. **Chỉnh config an toàn** — source-vs-live config, thay đổi theo chu trình
   edit → `sway -C` → installer → reload; backup naming; rollback từng component
   và quay về GNOME. Liệt kê file nào chỉnh theme, keybind, Waybar, terminal,
   launcher, lockscreen.
8. **Phụ lục tra nhanh** — bảng phím tắt đầy đủ, packages và tình trạng package;
   phân biệt keybind đã cấu hình với việc phụ thuộc package.

## Cấu hình bổ sung

Không thêm shortcut browser. Bổ sung shortcut hoặc package chỉ khi một thao tác
được guide yêu cầu nhưng config hiện có không đáp ứng; mặc định guide phải đánh
dấu rõ tính năng nào chưa sẵn sàng vì package không cài được do cần `sudo`.

## Kiểm chứng

- Cập nhật test guide để bắt buộc các heading/keyword cho luồng dev, desktop,
  troubleshooting và customisation.
- Test bảo đảm tất cả shortcut được nêu khớp `20-keybinds.conf`.
- Mở/parse HTML và xác nhận shared navigation không hỏng.
- Không tự động đăng nhập Sway; lần login đồ họa đầu tiên do người dùng thực hiện.

## Tiêu chí hoàn thành

Một người dùng có thể đọc guide từ trên xuống và: vào Sway, mở một terminal và
browser bằng các cách được cấu hình, tổ chức workspace, chụp ảnh màn hình, khoá
máy, xác định package còn thiếu, quay về GNOME khi lỗi, và thay một setting an
toàn mà không cần đoán file/lệnh tiếp theo.
