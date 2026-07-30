-- ============================================================
--  dropbar.nvim — breadcrumb ở đầu file (winbar)
--  Hiện đường dẫn code đang đứng: file > class > function > block.
--  Rất hữu ích khi đọc file dài. Bấm <leader>; để mở menu chọn.
-- ============================================================

return {
  "Bekaboo/dropbar.nvim",
  dependencies = { "nvim-tree/nvim-web-devicons" },
  event = { "BufReadPost", "BufNewFile" },
  config = function()
    require("dropbar").setup()
  end,
  keys = {
    { "<leader>;", function() require("dropbar.api").pick() end, desc = "Dropbar: chọn breadcrumb" },
  },
}
