-- ============================================================
--  Phím tắt tự định nghĩa (không thuộc plugin cụ thể)
--  Phím của plugin nằm trong file plugin tương ứng.
-- ============================================================

local map = vim.keymap.set

-- Xoá tô sáng kết quả tìm bằng Esc
map("n", "<Esc>", "<cmd>nohlsearch<CR>", { desc = "Xoá tô sáng tìm kiếm" })

-- Di chuyển giữa các cửa sổ (split) bằng Ctrl + h/j/k/l
map("n", "<C-h>", "<C-w>h", { desc = "Sang cửa sổ trái" })
map("n", "<C-j>", "<C-w>j", { desc = "Sang cửa sổ dưới" })
map("n", "<C-k>", "<C-w>k", { desc = "Sang cửa sổ trên" })
map("n", "<C-l>", "<C-w>l", { desc = "Sang cửa sổ phải" })

-- Giữ con trỏ ở giữa màn hình khi cuộn nửa trang / nhảy kết quả tìm
map("n", "<C-d>", "<C-d>zz", { desc = "Cuộn xuống (giữ giữa)" })
map("n", "<C-u>", "<C-u>zz", { desc = "Cuộn lên (giữ giữa)" })
map("n", "n", "nzzzv", { desc = "Kết quả tìm tiếp (giữ giữa)" })
map("n", "N", "Nzzzv", { desc = "Kết quả tìm trước (giữ giữa)" })

-- Chuyển nhanh giữa buffer đang mở
map("n", "<S-h>", "<cmd>bprevious<CR>", { desc = "Buffer trước" })
map("n", "<S-l>", "<cmd>bnext<CR>", { desc = "Buffer sau" })

-- Lưu / thoát nhanh (dù chủ yếu đọc, thỉnh thoảng vẫn cần)
map("n", "<leader>w", "<cmd>write<CR>", { desc = "Lưu file" })
map("n", "<leader>q", "<cmd>quit<CR>", { desc = "Đóng cửa sổ" })
