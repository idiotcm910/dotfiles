# Neovim — IDE nhẹ để đọc code

Cấu hình Neovim tối giản, tập trung vào **đọc & lần theo code**: tìm file, grep toàn repo, nhảy nhanh trong màn hình, và nhảy tới định nghĩa hàm xuyên file (LSP).

> **Leader = `Space`**. Bấm `Space` rồi khựng lại → **which-key** hiện popup nhắc phím. Không cần học thuộc.

---

## 1. Cài đặt

**Máy mới / cài lại Ubuntu — chạy 1 lệnh:**

```bash
bash ~/thai/system/nvim/install.sh
```

Script tự cài Neovim + công cụ (`rg`/`fd`/`fzf`/`node`/`go`...), symlink config, tải plugin & LSP.

Xem [`INSTALL.md`](./INSTALL.md) nếu muốn làm thủ công từng bước.

---

## 2. Phím di chuyển cơ bản (vim gốc — nền tảng)

### Theo dòng
| Phím | Tác dụng |
|---|---|
| `j` / `k` | Xuống / lên 1 dòng |
| `5j` / `12k` | Xuống 5 dòng / lên 12 dòng (dùng số dòng tương đối bên trái) |
| `gg` / `G` | Đầu file / cuối file |
| `42G` hoặc `:42` | Nhảy tới **dòng 42** |
| `H` / `M` / `L` | Đầu / giữa / cuối màn hình |
| `Ctrl-d` / `Ctrl-u` | Cuộn xuống / lên nửa trang (giữ con trỏ giữa) |
| `zz` | Kéo dòng hiện tại về giữa màn hình |

### Trong một dòng
| Phím | Tác dụng |
|---|---|
| `w` / `b` | Sang từ tiếp / về từ trước |
| `0` / `$` | Đầu dòng / cuối dòng |
| `^` | Ký tự đầu tiên (bỏ khoảng trắng) |
| `f)` / `F(` | Nhảy tới `)` phía sau / `(` phía trước |
| `t,` | Nhảy tới **ngay trước** dấu `,` |
| `;` / `,` | Lặp lại f/t lần nữa / theo chiều ngược |

### Theo khối / cấu trúc
| Phím | Tác dụng |
|---|---|
| `%` | Nhảy giữa cặp ngoặc `() {} []` |
| `{` / `}` | Sang đoạn (paragraph) trước / sau |
| `[[` / `]]` | Sang function trước / sau |
| `S` (flash) | Chọn/nhảy theo khối code — xem mục 3 |

### Quay lại chỗ cũ (jumplist)
| Phím | Tác dụng |
|---|---|
| `Ctrl-o` | Lùi về chỗ vừa nhảy đi |
| `Ctrl-i` | Tiến tới chỗ tiếp theo |
| `` `` `` (2 dấu backtick) | Về vị trí trước lần nhảy cuối |

---

## 3. Nhảy nhanh trong màn hình — flash.nvim

| Phím | Tác dụng |
|---|---|
| `s` + 2 ký tự | Mọi chỗ khớp hiện **nhãn chữ** → bấm nhãn là nhảy tới ngay |
| `S` | **Nhảy theo khối code**: chọn nhanh cả function / if / block (Treesitter) |

> Ví dụ: thấy chữ `render` ở xa → bấm `s` rồi `re` → các chỗ "re..." hiện nhãn a/b/c → bấm nhãn để tới.

---

## 4. Tìm file & grep toàn repo — fzf-lua

| Phím | Tác dụng |
|---|---|
| `<leader>ff` | **Tìm file** theo tên (gõ vài ký tự ra file) |
| `<leader>fg` | **Grep chuỗi** toàn repo (tìm ký tự/đoạn text ở mọi file) |
| `<leader>fw` | Grep nhanh **từ đang trỏ** |
| `<leader>fl` | Tìm dòng trong **file hiện tại** |
| `<leader>fb` | Chuyển nhanh giữa **buffer** đang mở |
| `<leader>fo` | File **mở gần đây** |
| `<leader>fr` | Mở lại **tìm kiếm trước** |
| `<leader>fk` | Xem **mọi phím tắt** đang có |
| `<leader>fh` | Tra **help** của Neovim |

> Trong cửa sổ fzf: gõ để lọc, `Ctrl-j`/`Ctrl-k` di chuyển, `Enter` mở, `Esc` đóng.

---

## 5. Cây thư mục — nvim-tree

| Phím | Tác dụng |
|---|---|
| `<leader>e` | Bật / tắt cây thư mục (bên trái) |
| `<leader>o` | Nhảy con trỏ vào cây |

**Khi đang ở trong cây** (bấm `g?` để xem đầy đủ):
| Phím | Tác dụng |
|---|---|
| `Enter` / `o` | Mở file / thư mục |
| `Tab` | Xem trước file (không rời cây) |
| `>` / `<` | Mở / đóng thư mục con |
| `H` | Ẩn/hiện file ẩn |
| `R` | Nạp lại cây |

---

## 6. Header / tab đang mở — bufferline

Thanh trên cùng liệt kê các file (buffer) đang mở, có icon + dấu lỗi LSP.
*(Icon chỉ hiện khi terminal dùng Nerd Font — xem `INSTALL.md`.)*

| Phím | Tác dụng |
|---|---|
| `Shift-l` / `Shift-h` | Sang tab phải / trái |
| `<leader>bp` | Chọn tab bằng nhãn chữ |
| `<leader>bc` | Đóng tab hiện tại |
| `<leader>bo` | Đóng các tab khác |
| `<leader>b1` … `b3` | Nhảy thẳng tới tab số 1 / 2 / 3 |

---

## 7. Hiểu code (LSP) — nhảy tới định nghĩa, references, hover

*(Phím chỉ hoạt động trong file có LSP: `.ts/.tsx/.js`, `.py`, `.go`, `.lua`)*

| Phím | Tác dụng |
|---|---|
| `gd` | **Nhảy tới định nghĩa** hàm/biến (kể cả file khác) |
| `gD` | Nhảy tới khai báo |
| `gr` | **Tìm mọi nơi được gọi** (references) |
| `gi` | Nhảy tới implementation |
| `gt` | Nhảy tới định nghĩa type |
| `K` | **Hover**: xem type / docstring của thứ đang trỏ |
| `<leader>ds` | Outline: liệt kê symbol trong file |
| `[d` / `]d` | Nhảy tới lỗi/cảnh báo trước / sau |
| `<leader>dl` | Xem chi tiết lỗi tại dòng |
| `<leader>rn` | Đổi tên symbol (rename) |
| `<leader>la` | Code action (sửa nhanh) |

> Sau `gd`/`gr` nhảy đi rồi, bấm `Ctrl-o` để quay lại chỗ cũ.

---

## 8. Tiện ích khác

| Phím | Tác dụng |
|---|---|
| `Esc` | Xoá tô sáng kết quả tìm |
| `Ctrl-h/j/k/l` | Di chuyển giữa các cửa sổ (split) |
| `<leader>w` / `<leader>q` | Lưu file / đóng cửa sổ |
| `<leader>?` | Hiện phím tắt của buffer hiện tại |
| `/từ` rồi `Enter` | Tìm trong file · `n`/`N` sang kết quả tiếp/trước |

> **Mẹo:** không nhớ phím? Bấm `Space` rồi chờ 0.4s → **which-key** hiện popup nhắc tất cả.

---

## Cấu trúc config

```
nvim/
├── init.lua                  # điểm vào
├── lua/config/
│   ├── options.lua           # cài đặt editor + leader
│   ├── keymaps.lua           # phím tự định nghĩa
│   └── lazy.lua              # bootstrap lazy.nvim
└── lua/plugins/
    ├── colorscheme.lua       # tokyonight
    ├── bufferline.lua        # header tab đang mở
    ├── lualine.lua           # thanh trạng thái (preset evil_lualine)
    ├── dropbar.lua           # breadcrumb đầu file (class > function)
    ├── noice.lua             # UI cmdline/thông báo nổi đẹp
    ├── indent-blankline.lua  # đường kẻ thụt lề
    ├── rainbow-delimiters.lua# tô màu cặp ngoặc
    ├── mini-animate.lua      # cuộn/resize mượt
    ├── undo-glow.lua         # chớp sáng vùng vừa sửa
    ├── treesitter.lua        # highlight + chọn khối code
    ├── fzf.lua               # tìm file + grep
    ├── flash.lua             # nhảy màn hình
    ├── nvim-tree.lua         # cây thư mục
    ├── lsp.lua               # LSP (gd/gr/K)
    └── which-key.lua         # popup nhắc phím
```

Muốn thêm tính năng (autocomplete, format, git...) → tạo 1 file mới trong `lua/plugins/`, lazy.nvim tự nạp.
