-- ============================================================
--  bufferline — thanh header trên cùng liệt kê các buffer/tab đang mở
--  Chuyển tab: Shift-h / Shift-l (đã map trong keymaps.lua)
-- ============================================================

return {
  "akinsho/bufferline.nvim",
  dependencies = { "nvim-tree/nvim-web-devicons" },
  event = "VeryLazy",
  opts = {
    options = {
      mode = "buffers",                 -- mỗi file mở = 1 tab trên header
      diagnostics = "nvim_lsp",         -- hiện dấu lỗi LSP ngay trên tab
      show_buffer_close_icons = true,
      show_close_icon = false,
      separator_style = "slant",        -- kiểu vát chéo cho đẹp
      always_show_bufferline = true,
      offsets = {
        { filetype = "NvimTree", text = "  Files", highlight = "Directory", separator = true },
      },
    },
  },
  keys = {
    { "<leader>bp", "<cmd>BufferLinePick<CR>",        desc = "Chọn tab bằng nhãn" },
    { "<leader>bc", "<cmd>bdelete<CR>",               desc = "Đóng tab hiện tại" },
    { "<leader>bo", "<cmd>BufferLineCloseOthers<CR>", desc = "Đóng các tab khác" },
  },
}
