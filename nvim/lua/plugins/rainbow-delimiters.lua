-- ============================================================
--  rainbow-delimiters — tô màu cặp ngoặc () {} [] theo tầng lồng nhau
--  Dùng Treesitter để nhận biết cặp ngoặc.
-- ============================================================

return {
  "HiPhish/rainbow-delimiters.nvim",
  event = { "BufReadPost", "BufNewFile" },
  config = function()
    require("rainbow-delimiters.setup").setup({})
  end,
}
