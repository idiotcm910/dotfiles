-- ============================================================
--  noice.nvim — thay UI dòng lệnh / thông báo / popup bằng cửa sổ nổi đẹp
--  cmdline hiện giữa màn hình, thông báo dạng popup (qua nvim-notify).
-- ============================================================

return {
  "folke/noice.nvim",
  event = "VeryLazy",
  dependencies = {
    "MunifTanjim/nui.nvim",
    { "rcarriga/nvim-notify", opts = { background_colour = "#000000" } },
  },
  opts = {
    lsp = {
      override = {
        ["vim.lsp.util.convert_input_to_markdown_lines"] = true,
        ["vim.lsp.util.stylize_markdown"] = true,
        ["cmp.entry.get_documentation"] = true,
      },
    },
    presets = {
      bottom_search = true,        -- ô tìm kiếm '/' nằm dưới đáy
      command_palette = true,      -- cmdline + popup gộp ở giữa
      long_message_to_split = true,-- thông báo dài mở ra split
      lsp_doc_border = true,       -- viền cho popup hover LSP
    },
  },
}
