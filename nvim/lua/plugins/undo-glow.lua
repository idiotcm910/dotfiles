-- ============================================================
--  undo-glow.nvim — chớp sáng vùng vừa yank / paste / undo / redo
--  Giúp mắt nhận ra ngay chỗ vừa thay đổi.
-- ============================================================

return {
  "y3owk1n/undo-glow.nvim",
  version = "*",
  event = "VeryLazy",
  opts = {
    animation = { enabled = true, duration = 300, animation_type = "fade" },
  },
  init = function()
    -- Chớp sáng khi yank (copy)
    vim.api.nvim_create_autocmd("TextYankPost", {
      desc = "Chớp sáng khi copy",
      callback = function()
        require("undo-glow").yank()
      end,
    })
  end,
  keys = {
    { "u",     function() require("undo-glow").undo() end,        mode = "n", desc = "Undo (chớp sáng)" },
    { "<C-r>", function() require("undo-glow").redo() end,        mode = "n", desc = "Redo (chớp sáng)" },
    { "p",     function() require("undo-glow").paste_below() end, mode = "n", desc = "Paste dưới (chớp sáng)" },
    { "P",     function() require("undo-glow").paste_above() end, mode = "n", desc = "Paste trên (chớp sáng)" },
  },
}
