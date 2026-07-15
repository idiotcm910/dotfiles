-- ============================================================
--  smear-cursor.nvim — con trỏ để lại vệt trượt khi di chuyển
--  (giống Neovide, chạy trên mọi terminal)
--  Không xung đột mini.animate vì đã tắt animate con trỏ ở đó.
-- ============================================================

return {
  "sphamba/smear-cursor.nvim",
  event = "VeryLazy",
  opts = {
    smear_between_buffers = true,          -- trượt cả khi đổi cửa sổ/buffer
    smear_between_neighbor_lines = true,   -- trượt khi nhảy dòng gần
    scroll_buffer_space = true,
    legacy_computing_symbols_support = false,
  },
}
