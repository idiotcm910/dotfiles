-- ============================================================
--  nvim-treesitter (nhánh MAIN) — syntax highlight cho Neovim 0.12+
--  Nhánh main có API mới: install() tải parser, highlight bật qua
--  vim.treesitter.start(). Cần tree-sitter-cli (xem INSTALL.md).
-- ============================================================

return {
  "nvim-treesitter/nvim-treesitter",
  branch = "main",          -- nhánh mới, hợp Neovim >= 0.12
  lazy = false,             -- nạp sớm để đăng ký autocmd trước khi mở file
  build = ":TSUpdate",
  config = function()
    -- Ngôn ngữ hay đọc — tự tải parser (chạy nền lần đầu)
    local langs = {
      "typescript", "tsx", "javascript", "json",
      "python", "go", "gomod",
      "lua", "vim", "vimdoc",
      "html", "css", "yaml", "toml", "markdown", "markdown_inline", "bash",
    }
    require("nvim-treesitter").install(langs)

    -- Bật highlight + indent cho mọi file có parser
    vim.api.nvim_create_autocmd("FileType", {
      callback = function(ev)
        -- pcall: nếu chưa có parser cho ngôn ngữ này thì bỏ qua, không lỗi
        local ok = pcall(vim.treesitter.start, ev.buf)
        if ok then
          vim.bo[ev.buf].indentexpr = "v:lua.require'nvim-treesitter'.indentexpr()"
        end
      end,
    })
  end,
}
