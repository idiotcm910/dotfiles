-- ============================================================
--  flash.nvim — nhảy tới bất kỳ đâu trên màn hình bằng vài phím
--  s  = nhảy tới ký tự (hiện nhãn, bấm nhãn là tới)
--  S  = nhảy theo KHỐI code (Treesitter node)
-- ============================================================

return {
  "folke/flash.nvim",
  event = "VeryLazy",
  opts = {},
  keys = {
    { "s", mode = { "n", "x", "o" }, function() require("flash").jump() end,       desc = "Flash: nhảy tới ký tự" },
    { "S", mode = { "n", "x", "o" }, function() require("flash").treesitter() end, desc = "Flash: nhảy theo khối code" },
    { "r", mode = "o",               function() require("flash").remote() end,     desc = "Flash: thao tác từ xa" },
    { "R", mode = { "o", "x" },       function() require("flash").treesitter_search() end, desc = "Flash: tìm theo Treesitter" },
  },
}
