-- ============================================================
--  alpha-nvim — màn hình dashboard khi mở nvim không kèm file
--  (chạy `nvim` trong 1 folder sẽ ra menu thay vì buffer trống)
-- ============================================================

return {
  "goolord/alpha-nvim",
  event = "VimEnter",
  dependencies = { "nvim-tree/nvim-web-devicons" },
  init = function()
    -- Khi mở `nvim .` (một thư mục): cd vào đó rồi hiện dashboard
    -- thay vì để lại buffer thư mục trống.
    vim.api.nvim_create_autocmd("VimEnter", {
      callback = function()
        local argv = vim.fn.argv()
        if #argv == 1 and vim.fn.isdirectory(argv[1]) == 1 then
          local dir = vim.fn.fnamemodify(argv[1], ":p")
          vim.cmd.cd(dir)
          local dir_buf = vim.api.nvim_get_current_buf()
          require("lazy").load({ plugins = { "alpha-nvim" } })
          require("alpha").start(false)
          pcall(vim.api.nvim_buf_delete, dir_buf, { force = true })
        end
      end,
    })
  end,
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
