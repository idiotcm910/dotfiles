-- ============================================================
--  Colorscheme — tokyonight (tương phản tốt, dễ đọc code lâu)
--  Đổi "night" thành "storm" / "moon" / "day" nếu muốn sáng hơn.
-- ============================================================

return {
  "folke/tokyonight.nvim",
  lazy = false,    -- nạp ngay khi mở (là giao diện nền)
  priority = 1000, -- nạp TRƯỚC mọi plugin khác
  config = function()
    require("tokyonight").setup({ style = "night" })
    vim.cmd.colorscheme("tokyonight")
  end,
}
