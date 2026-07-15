-- ============================================================
--  mini.animate — hiệu ứng động: cuộn mượt + resize cửa sổ mượt
--  (tắt animate con trỏ để đỡ rối mắt khi đọc code)
-- ============================================================

return {
  "echasnovski/mini.animate",
  event = "VeryLazy",
  opts = function()
    return {
      cursor = { enable = false }, -- không animate con trỏ
      scroll = { enable = true },  -- cuộn mượt
      resize = { enable = true },  -- đổi kích thước cửa sổ mượt
      open = { enable = false },
      close = { enable = false },
    }
  end,
}
