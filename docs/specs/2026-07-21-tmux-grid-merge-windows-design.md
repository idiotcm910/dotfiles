# Gộp window thành lưới pane (`tmux-grid`) — Thiết kế

Ngày: 2026-07-21

## Vấn đề

Một session workspace (ví dụ `sach-tinh-hoa-video`) thường có nhiều window, mỗi window chạy một phiên Claude Code. Muốn theo dõi cả ba phiên phải bấm `prefix 1/2/3` để lần lượt chuyển qua từng window — chỉ nhìn được một cái tại một thời điểm.

Cần: xem tất cả window cùng lúc trong một khu vực màn hình, và khi cần thì phóng to một cái để làm việc.

## Giải pháp

Một phím `prefix g` toggle giữa hai trạng thái:

- **Trạng thái thường** — mỗi phiên một window, như hiện nay.
- **Trạng thái lưới** — mọi window của session bị hút về thành pane trong một window duy nhất.

Phóng to một pane dùng `prefix z` (tmux built-in, đã có sẵn) — bấm lần nữa để về lưới.

## Thành phần

| File | Vai trò |
|---|---|
| `bin/tmux-grid` | Toàn bộ logic. Chạy không tham số = toggle. |
| `tmux/tmux.conf` | `bind g run-shell tmux-grid` |
| `docs/workspace-workflow.md` | Thêm dòng vào bảng phím tmux |
| `guide/workspace.html` | Thêm mục hướng dẫn tương ứng |

`bin/` đã nằm trong `PATH` (thêm bởi `setup-workspace.sh`), không cần bước cài đặt mới.

## Luồng hoạt động

### Toggle

Đọc user option `@grid` của window hiện tại:

- `@grid` = `on` → chạy nhánh **tách**.
- ngược lại → chạy nhánh **gộp**.

### Gộp

1. Đếm số window trong session. Nếu chỉ có 1 → hiện thông báo "Không có window nào để gộp" và dừng.
2. Đếm tổng số pane sẽ có sau khi gộp. Nếu > 6 → `confirm-before` hỏi xác nhận, huỷ thì dừng.
3. Không cần bỏ zoom: `join-pane` tự bỏ zoom window đích, script không làm gì thêm (kiểm chứng thực nghiệm trên tmux 3.4 — bản nháp trước của spec ghi "join-pane thất bại trên window có pane zoom", điều đó sai).
4. Hiện popup fzf chọn layout: `tiled`, `even-horizontal`, `even-vertical`, `main-vertical`, `main-horizontal`. Thoát fzf mà không chọn → huỷ toàn bộ, không gộp gì.
5. Với mỗi pane của mỗi window khác (duyệt theo thứ tự index window tăng dần):
   - Ghi lên pane ba user option: `@grid_win_id` (window id gốc, dạng `@2`), `@grid_win_name` (tên window gốc), `@grid_win_idx` (index gốc).
   - `join-pane -s <pane_id> -t <window đích>`.
6. `select-layout <layout đã chọn>` trên window đích.
7. Đặt `@grid on` và `@grid_layout <layout>` lên window đích.

Lưu **window id** chứ không phải tên vì tên window có thể trùng nhau — trong workspace thực tế cả ba window đều mang tên repo.

### Tách

1. Không cần bỏ zoom: `break-pane` tự bỏ zoom, window kết quả có `window_zoomed_flag=0`.
2. Liệt kê pane của window hiện tại kèm `@grid_win_id`.
3. Pane không có `@grid_win_id` (do người dùng tự split sau khi gộp) → để nguyên tại window hiện tại.
4. Nhóm pane theo `@grid_win_id`, sắp nhóm theo `@grid_win_idx` tăng dần. Với mỗi nhóm:
   - `break-pane -d -s <pane đầu> -n <@grid_win_name>` → tạo window mới mang tên gốc.
   - Các pane còn lại trong nhóm: `join-pane -d -s <pane> -t <window vừa tạo>`.
   - Xoá `@grid_win_id`, `@grid_win_name`, `@grid_win_idx` khỏi các pane đó.
5. Xoá `@grid` và `@grid_layout` khỏi window hiện tại.

`renumber-windows on` (đã bật trong `tmux.conf`) tự đánh lại index liên tục sau khi tách.

## Các trường hợp lệch

| Tình huống | Xử lý |
|---|---|
| Pane đang zoom khi gộp/tách | tmux tự bỏ zoom khi join/break pane, script không cần bước bỏ zoom |
| Session chỉ có 1 window, chưa gộp | Thông báo, không làm gì |
| Thoát popup layout không chọn | Huỷ, không gộp |
| Tổng pane > 6 | Hỏi xác nhận |
| Pane tự split sau khi gộp | Ở lại window hiện tại khi tách, không mất |
| Window gốc có sẵn nhiều pane | Gộp hết, khi tách được gom lại đúng nhóm cũ |
| Chạy ngoài tmux | Thông báo lỗi và thoát mã khác 0 |

## Kiểm thử

`bin/tmux-grid` được kiểm bằng script test chạy trên session tmux tạm (detached, tên có tiền tố riêng), không đụng session đang dùng. Test dọn session tạm ở cuối kể cả khi thất bại.

Các trường hợp kiểm:

1. **Gộp** — tạo session 3 window → chạy gộp với layout `tiled` → window hiện tại có đúng 3 pane, session còn đúng 1 window.
2. **Tách khôi phục** — từ trạng thái trên chạy tiếp → session có lại đúng 3 window, tên từng window khớp tên ban đầu.
3. **Tên trùng** — 3 window cùng tên → sau gộp/tách vẫn ra 3 window, không mất pane.
4. **Window nhiều pane** — window có 2 pane → sau gộp/tách, 2 pane đó về chung một window.
5. **Session 1 window** — chạy gộp → không đổi gì, thoát êm.

Vì popup fzf cần tương tác, script nhận layout qua biến môi trường hoặc tham số ẩn để test bỏ qua bước chọn; ở chế độ dùng tay vẫn hiện popup như thiết kế.

## Ngoài phạm vi

Cố tình không làm:

- Map lại `prefix 1/2/3` thành chọn pane khi ở chế độ lưới.
- Khái niệm "window được ghim, không bị gộp".
- Nhớ layout đã chọn lần trước — mỗi lần gộp đều hỏi lại.
- Gộp window từ nhiều session khác nhau.
