-- ============================================================
--  alpha-nvim — màn hình dashboard khi mở nvim không kèm file
--  (chạy `nvim` trong 1 folder sẽ ra menu thay vì buffer trống)
-- ============================================================

return {
  "goolord/alpha-nvim",
  event = "VimEnter",
  dependencies = { "nvim-tree/nvim-web-devicons" },
  config = function()
    local alpha = require("alpha")
    local dashboard = require("alpha.themes.dashboard")

    dashboard.section.header.val = {
      "      ███╗   ██╗██╗   ██╗██╗███╗   ███╗      ",
      "      ████╗  ██║██║   ██║██║████╗ ████║      ",
      "      ██╔██╗ ██║██║   ██║██║██╔████╔██║      ",
      "      ██║╚██╗██║╚██╗ ██╔╝██║██║╚██╔╝██║      ",
      "      ██║ ╚████║ ╚████╔╝ ██║██║ ╚═╝ ██║      ",
      "      ╚═╝  ╚═══╝  ╚═══╝  ╚═╝╚═╝     ╚═╝      ",
    }

    dashboard.section.buttons.val = {
      dashboard.button("f", "  Tìm file",       "<cmd>FzfLua files<CR>"),
      dashboard.button("g", "  Grep toàn repo", "<cmd>FzfLua live_grep<CR>"),
      dashboard.button("r", "  File gần đây",   "<cmd>FzfLua oldfiles<CR>"),
      dashboard.button("e", "  Cây thư mục",    "<cmd>NvimTreeToggle<CR>"),
      dashboard.button("n", "  File mới",        "<cmd>ene | startinsert<CR>"),
      dashboard.button("c", "  Config nvim",     "<cmd>e ~/.config/nvim/init.lua<CR>"),
      dashboard.button("q", "  Thoát",           "<cmd>qa<CR>"),
    }

    dashboard.section.footer.val = "Space rồi khựng lại → which-key nhắc phím"

    -- Căn giữa & màu
    dashboard.section.header.opts.hl = "Function"
    dashboard.section.footer.opts.hl = "Comment"

    alpha.setup(dashboard.opts)
  end,
}
