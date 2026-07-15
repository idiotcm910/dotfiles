-- ============================================================
--  bufferline — thanh header trên cùng liệt kê các buffer đang mở
--  Đẹp: separator vát chéo, icon màu theo loại file, dấu lỗi LSP.
--  ⚠️ Icon chỉ hiện khi terminal dùng Nerd Font (xem INSTALL.md).
--  Chuyển tab: Shift-h / Shift-l (map trong keymaps.lua)
-- ============================================================

return {
  "akinsho/bufferline.nvim",
  dependencies = { "nvim-tree/nvim-web-devicons" },
  event = "VeryLazy",
  opts = {
    options = {
      mode = "buffers",
      themable = true,                    -- để tokyonight tô màu header
      indicator = { icon = "▎", style = "icon" }, -- vạch sáng ở tab đang mở
      buffer_close_icon = "󰅖",
      modified_icon = "●",                -- chấm tròn = file chưa lưu
      left_trunc_marker = "",
      right_trunc_marker = "",
      max_name_length = 24,
      tab_size = 18,
      color_icons = true,                 -- icon loại file có màu
      show_buffer_close_icons = true,
      show_close_icon = false,
      separator_style = "slant",          -- tab vát chéo cho đẹp
      always_show_bufferline = true,
      hover = { enabled = true, delay = 150, reveal = { "close" } },
      diagnostics = "nvim_lsp",
      diagnostics_indicator = function(count, level)
        local icon = level:match("error") and " " or " "
        return " " .. icon .. count
      end,
      offsets = {
        {
          filetype = "NvimTree",
          text = "  EXPLORER",
          text_align = "center",
          highlight = "Directory",
          separator = true,               -- vạch ngăn giữa cây và header
        },
      },
    },
  },
  keys = {
    { "<leader>bp", "<cmd>BufferLinePick<CR>",        desc = "Chọn tab bằng nhãn" },
    { "<leader>bc", "<cmd>bdelete<CR>",               desc = "Đóng tab hiện tại" },
    { "<leader>bo", "<cmd>BufferLineCloseOthers<CR>", desc = "Đóng các tab khác" },
    { "<leader>b1", "<cmd>BufferLineGoToBuffer 1<CR>", desc = "Tới tab 1" },
    { "<leader>b2", "<cmd>BufferLineGoToBuffer 2<CR>", desc = "Tới tab 2" },
    { "<leader>b3", "<cmd>BufferLineGoToBuffer 3<CR>", desc = "Tới tab 3" },
  },
}
