# Trang guide "Hành trình" — Thiết kế

Ngày: 2026-07-22

## Vấn đề

Guide hiện có 6 trang, xếp theo công cụ: tmux, Workspace, ba trang Nvim, Cài đặt. Mỗi trang là một bảng phím. Cấu trúc đó trả lời được "phím X làm gì" nhưng không trả lời được "tôi đang ở tình huống Y, giờ bấm gì".

Hệ quả đo được — những khoảnh khắc guide bỏ rơi người dùng:

| Khoảnh khắc | Tình trạng |
|---|---|
| Vừa gộp lưới, nhảy giữa các pane | `Ctrl-h/j/k/l` có ở mục Pane nhưng không nối với chế độ lưới |
| Ở lưới, `prefix 1/2/3` mất tác dụng | Không nhắc. `prefix q` (nhảy pane theo số) không có ở đâu |
| Đổi kiểu chia khi đang ở lưới | `prefix Space` không có |
| Kéo pane to nhỏ bằng phím | Không có; chỉ một dòng cuối trang nói kéo chuột được |
| Làm xong workspace thì làm gì | Không có. `wt-rm`/`wt-clean` có trong bảng lệnh nhưng không nói lúc nào dùng cái nào |
| Rời máy mà giữ Claude chạy | `prefix d` có trong bảng nhưng không phân biệt với `wt-rm` |
| Sửa `tmux.conf` mà phím mới không ăn | `prefix r` có trong bảng nhưng không cảnh báo phải reload |

Thêm dòng vào các bảng cũ không chữa được nguyên nhân: thiếu một mạch kể theo thời gian.

## Giải pháp

Thêm một trang kể theo dòng thời gian một vòng đời workspace, đặt ở đầu mục lục. Các trang cũ giữ nguyên vai trò tra cứu nhanh, chỉ vá những phím còn thiếu.

## Thành phần

| File | Thay đổi |
|---|---|
| `guide/hanh-trinh.html` | Tạo mới |
| `guide/assets/app.js` | Thêm một phần tử vào đầu mảng `PAGES`: `{ page: "hanh-trinh", file: "hanh-trinh.html", n: "00", label: "Hành trình" }` |
| `guide/index.html` | Thêm card trỏ sang trang mới, đặt trước card `tmux` |
| `guide/tmux.html` | Vá mục Pane và mục Persistence |
| `guide/workspace.html` | Thêm một dòng dẫn sang trang mới |

Dùng số `00` để không phải đánh số lại năm trang còn lại.

Trang mới theo đúng khuôn `_template.html`: cùng `<head>`, cùng `data-page`/`data-title` trên `<body>`, cùng cấu trúc `div.layout > aside.sidebar + main.content`, cùng `assets/style.css` và `assets/app.js`. Dùng lại các class sẵn có (`group`, `rows`, `row`, `keys`, `d`, `cmd`, `callout`, `tag`, `lede`) — không thêm class hay CSS mới.

## Nội dung trang Hành trình

Tám cảnh theo thứ tự thời gian, mỗi cảnh một `div.group`:

1. **Mở máy** — terminal tự vào tmux session `main` (do khối auto-tmux trong `.bashrc`). Lỡ thoát thì `tmux attach`.
2. **Mở workspace mới** — `wt-new <branch>` tạo worktree tại `<repo>.worktrees/<branch>`, tạo tmux session tên bằng branch (đã thay `.`, `/`, `:` thành `_`), tự mở nvim.
3. **Làm việc** — mở Claude, gửi code, nhận diff: bốn dòng phím rồi link sang trang Nvim · LSP & Claude. Không lặp lại nội dung trang đó.
4. **Chạy nhiều việc song song** — `prefix c` mở window mới, `prefix |` và `prefix -` chia pane; nói rõ khác biệt: window là tab riêng, pane chia cùng màn hình.
5. **Nhìn tất cả cùng lúc** — `prefix g` gộp lưới, kèm bảng thao tác bên trong lưới (xem dưới).
6. **Nhảy qua workspace khác** — `prefix o` mở switcher sesh; workspace cũ vẫn chạy nền.
7. **Tạm rời, mai làm tiếp** — `prefix d` detach; quay lại bằng `tmux attach` hoặc `prefix o`; reboot vẫn còn nhờ continuum (tự lưu mỗi 15 phút).
8. **Xong hẳn** — commit, push, mở PR, đợi merge, rồi `wt-clean` dọn các worktree đã merge.

### Bảng "đang ở trong lưới thì bấm gì" (thuộc cảnh 5)

| Muốn | Bấm |
|---|---|
| Nhảy pane theo hướng | `Ctrl-h/j/k/l`, xuyên cả nvim |
| Nhảy pane theo số | `prefix q` rồi bấm số hiện trên pane |
| Phóng to pane đang làm | `prefix z`, bấm lại về lưới |
| Đổi kiểu chia | `prefix Space` xoay qua các layout |
| Kéo pane to nhỏ | `prefix Ctrl-mũi tên` (1 ô) hoặc `prefix Alt-mũi tên` (5 ô); giữ prefix rồi bấm tiếp được. Hoặc kéo viền bằng chuột |
| Nhảy pane bằng mũi tên | `prefix` + mũi tên (không kèm Ctrl/Alt) |
| Mở thêm pane khi đang ở lưới | `prefix \|` — pane này ở lại khi tách |
| Trả về window riêng | `prefix g` |

Kèm cảnh báo: trong lưới chỉ còn một window nên `prefix 1/2/3` không còn tác dụng; dùng `prefix q`.

### Bảng "Bốn kiểu đóng — đừng nhầm"

| Lệnh | Mất gì | Dùng khi |
|---|---|---|
| `prefix d` | Không mất gì, Claude chạy tiếp | Tắt máy, mai làm tiếp |
| `prefix X` | Đóng một window trong workspace | Xong một việc nhỏ |
| `prefix Q` | Đóng session; code trên đĩa còn nguyên | Dọn màn hình, worktree vẫn đó |
| `wt-rm <branch>` | Xoá worktree **và** `git branch -D` | Bỏ hẳn; code chưa merge sẽ mất |

Kèm cách cứu khi lỡ `wt-rm` nhầm: `git reflog` tìm commit cuối, `git branch <tên> <sha>` dựng lại branch.

## Vá các trang cũ

`guide/tmux.html`, mục **Pane (chia màn hình)** — thêm ba dòng:

- `prefix q` — hiện số pane, bấm số để nhảy thẳng
- `prefix Space` — xoay qua các layout dựng sẵn
- `prefix Ctrl-mũi tên` / `prefix Alt-mũi tên` — chỉnh kích thước pane 1 ô / 5 ô
- `prefix` + mũi tên — nhảy pane theo hướng (phân biệt với hai dòng trên, dễ nhầm)

`guide/tmux.html`, mục **Persistence & config** — thêm cảnh báo: tmux chỉ đọc `~/.tmux.conf` một lần lúc khởi động server; sửa config xong phải `prefix r`, nếu không phím mới không có tác dụng trong server đang chạy.

`guide/workspace.html` — thêm một dòng ngay dưới `p.lede` dẫn sang trang Hành trình cho người muốn xem thứ tự làm việc thay vì tra lệnh.

## Kiểm thử

Không có test tự động cho HTML tĩnh. Kiểm bằng tay:

1. Đếm thẻ mở/đóng của `div`, `h2`, `p`, `kbd`, `span` trong mỗi file đã sửa — phải khớp nhau.
2. Mở `guide/index.html` trên trình duyệt: card mới hiện trước card tmux; bấm vào ra đúng trang.
3. Trên trang mới: thanh bên trái hiện đủ bảy mục, mục Hành trình được đánh dấu đang xem.
4. Gõ vào ô tìm kiếm của trang một từ khoá có trong bảng mới (ví dụ `prefix q`) — dòng đó phải hiện, các dòng khác ẩn.
5. Mọi phím nêu trong trang phải khớp với `tmux/tmux.conf` và `bin/*` thật; đối chiếu từng dòng trước khi commit.

## Ngoài phạm vi

- Không lặp lại nội dung ba trang Nvim.
- Không viết hướng dẫn git cơ bản (commit, push, PR là kiến thức có sẵn).
- Không đổi cách dựng menu, không thêm class CSS mới.
- Không đánh số lại các trang cũ.
