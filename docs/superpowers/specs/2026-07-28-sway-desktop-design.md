# Sway desktop kit — thiết kế

## Mục tiêu

Thiết lập một desktop Sway dùng hằng ngày trên Ubuntu 24.04 LTS cho máy Intel UHD
620. Trải nghiệm ưu tiên cân bằng: giao diện Tokyo Night gọn, phím tắt dễ nhớ,
chuyển workspace nhẹ và ổn định. GNOME hiện tại vẫn được giữ nguyên làm phiên dự
phòng.

## Phạm vi

- Cài các gói Ubuntu cần thiết, chỉ dùng gói chính thức của Ubuntu khi có thể.
- Cấu hình Sway, Waybar, Wofi, Foot, Mako, swayidle và swaylock trong
  `~/.config`.
- Lưu bản cấu hình chuẩn, script áp dụng lặp lại được và danh sách package tại
  `~/thai/system/sway/`.
- Tạo trang hướng dẫn HTML tiếng Việt tại `~/thai/system/guide/sway.html`, và
  liên kết trang này từ trang chỉ mục guide nếu cấu trúc hiện có hỗ trợ.
- Xác minh cú pháp cấu hình và sự hiện diện của các tệp/package. Không thay đổi
  session GNOME đang chạy và không xoá bất cứ desktop nào.

## Ngoài phạm vi

- Không dùng SwayFX, PPA, bản git hay build từ mã nguồn.
- Không cài một desktop shell thứ hai, compositor hay hiệu ứng blur/bóng nặng.
- Không tự động thay đổi layout bàn phím, độ phân giải màn hình, hay đăng nhập
  mặc định.
- Không ghi đè cấu hình người dùng sẵn có mà không có bản sao lưu có dấu thời
  gian.

## Kiến trúc

```
Ubuntu packages
  └── sway session
        ├── ~/.config/sway/config             # phím tắt, cửa sổ, autostart
        ├── ~/.config/waybar/{config,style.css}
        ├── ~/.config/wofi/{config,style.css}
        ├── ~/.config/foot/foot.ini
        ├── ~/.config/mako/config
        └── ~/.config/swaylock/config

~/thai/system/sway/
  ├── config/                                # nguồn cấu hình được quản lý
  ├── install.sh                              # cài gói + sao lưu + áp dụng
  ├── packages.txt                            # danh sách phụ thuộc APT
  └── README.md                               # cách áp dụng/khôi phục

~/thai/system/guide/sway.html                 # tài liệu người dùng
```

Script `install.sh` là điểm ghi duy nhất vào `~/.config`: nó kiểm tra package,
tạo backup cho các thư mục cấu hình đích nếu đã tồn tại, sau đó đồng bộ từ
`sway/config` sang `~/.config`. Script không xoá file ngoài các thư mục mà nó
quản lý và không cần chạy trong phiên Sway.

## Thành phần

| Thành phần | Vai trò | Quyết định |
|---|---|---|
| Sway | compositor/tiling WM Wayland | bố cục tiling, gaps vừa phải, viền focus rõ |
| Waybar | thanh trạng thái | thông tin thiết yếu, module nhẹ, Tokyo Night |
| Wofi | launcher | mở app qua `Super+D`, tìm kiếm nhanh |
| Foot | terminal | terminal Wayland nhẹ, font dễ đọc, theme tối |
| Mako | thông báo | thông báo tối giản, timeout vừa phải |
| swaylock + swayidle | khóa và idle | khóa màn hình sau một khoảng nhàn rỗi hợp lý |
| grim + slurp + wl-clipboard | ảnh chụp/chọn vùng/clipboard | screenshot bằng phím tắt, không chạy nền nặng |
| pavucontrol | điều khiển âm thanh khi cần | mở qua launcher, không buộc applet riêng |
| playerctl + brightnessctl | media/độ sáng | chỉ map phím nếu phần cứng hỗ trợ |

## Trải nghiệm và phím tắt

`Super` là modifier chính. Cấu hình có các nhóm phím rõ ràng:

- Khởi chạy: `Super+Enter` Foot; `Super+D` Wofi; `Super+Shift+E` thoát Sway có
  xác nhận.
- Cửa sổ: `Super+Shift+Q` đóng; `Super+H/J/K/L` đổi focus; `Super+Shift+H/J/K/L`
  di chuyển cửa sổ; `Super+F` toàn màn hình; `Super+Space` floating.
- Workspace: `Super+1` đến `Super+9` chuyển workspace; thêm `Shift` để đưa cửa
  sổ đến workspace tương ứng; `Super+Tab` đổi workspace trước đó.
- Tiện ích: `Super+L` khóa màn hình; `Print` chụp màn hình; media và brightness
  keys điều khiển trực tiếp khi có thiết bị tương ứng.

Màu Tokyo Night dùng nền gần `#1a1b26`, panel `#24283b`, text `#c0caf5`, focus
cyan `#7dcfff` và cảnh báo/red `#f7768e`. Cửa sổ được bo góc bởi theme không phải
vì Sway không hỗ trợ bo góc gốc; cảm nhận “đẹp vừa đủ” đến từ khoảng cách, màu,
font và chuyển workspace native của Sway, không thêm compositor.

## Độ tin cậy và khôi phục

- Trước khi ghi `~/.config/<component>`, script đổi tên cấu hình hiện có thành
  một backup cùng thư mục, có timestamp.
- Dùng `swaymsg reload` chỉ khi đang trong phiên Sway; nếu không, hướng dẫn user
  đăng xuất rồi chọn Sway từ màn hình đăng nhập.
- Launcher/Waybar/notification daemon có lệnh autostart và restart an toàn,
tránh nhân nhiều tiến trình.
- Những module Waybar phụ thuộc phần cứng được cấu hình không làm hỏng thanh khi
  không đọc được dữ liệu.
- README mô tả lệnh khôi phục backup và cách quay về GNOME.

## Kiểm chứng

1. `apt` xác nhận các package trong `packages.txt` đã cài.
2. `sway -C -c ~/.config/sway/config` kiểm tra cú pháp không mở session đồ họa.
3. Kiểm tra các file cấu hình và guide HTML tồn tại; parse HTML bằng công cụ có
   sẵn nếu khả dụng.
4. Script hỗ trợ dry-run hoặc log rõ các tệp sẽ thay đổi trước khi áp dụng.
5. Không kiểm thử đăng nhập Sway tự động vì nó tác động phiên desktop hiện tại;
   hướng dẫn user thực hiện bước này thủ công.

## Tiêu chí hoàn thành

- Có thể cài và áp dụng lại toàn bộ setup từ `~/thai/system/sway/install.sh`.
- Sway qua kiểm tra cú pháp và đăng nhập được lựa chọn thủ công ở GDM.
- Các thành phần nhìn và hoạt động nhất quán theo Tokyo Night.
- Guide HTML tự chứa thông tin sử dụng và khôi phục, có thể mở trực tiếp bằng
  trình duyệt.
