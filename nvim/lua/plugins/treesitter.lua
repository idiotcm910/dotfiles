-- ============================================================
--  nvim-treesitter — syntax highlight chuẩn + hiểu cấu trúc code
--  (flash.nvim dựa vào Treesitter để nhảy theo khối)
-- ============================================================

return {
  "nvim-treesitter/nvim-treesitter",
  build = ":TSUpdate",
  event = { "BufReadPost", "BufNewFile" },
  main = "nvim-treesitter.configs",
  opts = {
    -- Ngôn ngữ hay đọc (tự cài parser lần đầu)
    ensure_installed = {
      "typescript", "tsx", "javascript", "json",
      "python", "go", "gomod",
      "lua", "vim", "vimdoc",
      "html", "css", "yaml", "toml", "markdown", "bash",
    },
    highlight = { enable = true },  -- tô màu theo Treesitter
    indent = { enable = true },     -- thụt lề thông minh
    -- Chọn nhanh khối code bằng phím (mở rộng dần theo cấu trúc)
    incremental_selection = {
      enable = true,
      keymaps = {
        init_selection = "<CR>",    -- Enter: bắt đầu chọn
        node_incremental = "<CR>",  -- Enter tiếp: mở rộng ra node cha
        node_decremental = "<BS>",  -- Backspace: thu nhỏ lại
      },
    },
  },
}
