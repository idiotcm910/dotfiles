-- ============================================================
--  nvim-tree — cây thư mục bên trái (kiểu VS Code)
--  <leader>e  bật/tắt cây · <leader>o  focus vào cây
-- ============================================================

return {
  "nvim-tree/nvim-tree.lua",
  dependencies = { "nvim-tree/nvim-web-devicons" },
  cmd = { "NvimTreeToggle", "NvimTreeFocus" },
  keys = {
    { "<leader>e", "<cmd>NvimTreeToggle<CR>", desc = "Bật/tắt cây thư mục" },
    { "<leader>o", "<cmd>NvimTreeFocus<CR>",  desc = "Nhảy vào cây thư mục" },
  },
  init = function()
    -- Tắt netrw để nvim-tree quản lý
    vim.g.loaded_netrw = 1
    vim.g.loaded_netrwPlugin = 1
  end,
  opts = {
    view = { width = 34 },
    renderer = { group_empty = true },
    filters = { dotfiles = false },        -- vẫn hiện file .env, .gitignore...
    actions = { open_file = { quit_on_open = false } },
    update_focused_file = { enable = true }, -- tự highlight file đang mở trong cây
  },
}

-- Phím trong cây (bấm g? khi đang ở cây để xem đầy đủ):
--   Enter / o : mở file        |  a : tạo mới     |  d : xoá
--   Tab       : xem trước       |  R : nạp lại cây  |  H : ẩn/hiện file ẩn
--   >         : mở thư mục con   |  < : đóng
