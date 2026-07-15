-- ============================================================
--  LSP — "hiểu code": nhảy tới định nghĩa, tìm references, hover doc
--  mason tự tải server; nvim-lspconfig cung cấp cấu hình sẵn.
--  Server: TypeScript/JS (ts_ls), Python (pyright), Go (gopls), Lua (lua_ls)
-- ============================================================

return {
  "neovim/nvim-lspconfig",
  event = { "BufReadPre", "BufNewFile" },
  dependencies = {
    { "mason-org/mason.nvim", opts = {} },
    "mason-org/mason-lspconfig.nvim",
  },
  config = function()
    local servers = { "ts_ls", "pyright", "gopls", "lua_ls" }

    require("mason").setup()
    require("mason-lspconfig").setup({ ensure_installed = servers })

    -- Cấu hình riêng cho lua_ls: hiểu biến toàn cục `vim` (khỏi báo lỗi giả)
    vim.lsp.config("lua_ls", {
      settings = { Lua = { diagnostics = { globals = { "vim" } } } },
    })

    -- Phím LSP — chỉ gắn khi 1 server thực sự bám vào buffer
    vim.api.nvim_create_autocmd("LspAttach", {
      callback = function(ev)
        local map = function(keys, fn, desc)
          vim.keymap.set("n", keys, fn, { buffer = ev.buf, desc = "LSP: " .. desc })
        end
        map("gd", vim.lsp.buf.definition,      "Nhảy tới định nghĩa")
        map("gD", vim.lsp.buf.declaration,     "Nhảy tới khai báo")
        map("gr", vim.lsp.buf.references,      "Tìm nơi được gọi (references)")
        map("gi", vim.lsp.buf.implementation,  "Nhảy tới implementation")
        map("gt", vim.lsp.buf.type_definition, "Nhảy tới định nghĩa type")
        map("K",  vim.lsp.buf.hover,           "Xem type/doc (hover)")
        map("<leader>rn", vim.lsp.buf.rename,      "Đổi tên symbol")
        map("<leader>ca", vim.lsp.buf.code_action, "Code action")
        map("<leader>ds", "<cmd>FzfLua lsp_document_symbols<CR>",  "Outline symbol trong file")
        map("[d", function() vim.diagnostic.jump({ count = -1 }) end, "Lỗi/cảnh báo trước")
        map("]d", function() vim.diagnostic.jump({ count = 1 })  end, "Lỗi/cảnh báo sau")
        map("<leader>dl", vim.diagnostic.open_float, "Xem chi tiết lỗi tại dòng")
      end,
    })

    -- Hiện dấu lỗi ở cột trái + gạch chân
    vim.diagnostic.config({
      virtual_text = true,
      signs = true,
      underline = true,
      update_in_insert = false,
    })
  end,
}
