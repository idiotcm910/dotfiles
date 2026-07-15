-- ============================================================
--  indent-blankline (ibl) — đường kẻ dọc theo mức thụt lề
--  Đọc code lồng nhau (Python, JSX) dễ nhìn hơn.
-- ============================================================

return {
  "lukas-reineke/indent-blankline.nvim",
  main = "ibl",
  event = { "BufReadPost", "BufNewFile" },
  opts = {
    indent = { char = "│" },
    scope = { enabled = true, show_start = false, show_end = false }, -- tô đậm khối đang đứng
  },
}
