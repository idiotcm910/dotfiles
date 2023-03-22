local M = {}

local servers = {
  gopls = {
    settings = {
      gopls = {
        hints = {
          assignVariableTypes = true,
          compositeLiteralFields = true,
          compositeLiteralTypes = true,
          constantValues = true,
          functionTypeParameters = true,
          parameterNames = true,
          rangeVariableTypes = true,
        },
        semanticTokens = true,
      },
    },
    cmd = {"gopls", "serve"},
    filetypes = {"go", "gomod"},
  },
  cssls = {
      cmd = { "vscode-css-language-server", "--stdio" },
      filetypes = { "css", "scss", "less" },
      settings = {
          css = {
              validate = true
          },
          less = {
              validate = true
          },
          scss = {
              validate = true
          },
      },
  },
  html = {},
  jsonls = {},
  pyright = {},
  rust_analyzer = {},
  tsserver = {
      cmd = { "typescript-language-server", "--stdio" },
      filetypes = { "javascript", "javascriptreact", "javascript.jsx", "typescript", "typescriptreact", "typescript.tsx" },
      init_options = { hostInfo = "neovim" },
  },
  dartls = {},
}

local function on_attach(client, bufnr)
  -- Enable completion triggered by <C-X><C-O>
  -- See `:help omnifunc` and `:help ins-completion` for more information.
  vim.api.nvim_buf_set_option(bufnr, "omnifunc", "v:lua.vim.lsp.omnifunc")

  -- Use LSP as the handler for formatexpr.
  -- See `:help formatexpr` for more information.
  vim.api.nvim_buf_set_option(0, "formatexpr", "v:lua.vim.lsp.formatexpr()")

  -- Configure key mappings
  require("config.lsp.keymaps").setup(client, bufnr)
end

local lsp_signature = require "lsp_signature"
lsp_signature.setup {
  bind = true,
  handler_opts = {
    border = "rounded",
  },
}
local capabilities = require("cmp_nvim_lsp").default_capabilities(vim.lsp.protocol.make_client_capabilities())

local opts = {
  on_attach = on_attach,
  capabilities = capabilities,
  flags = {
    debounce_text_changes = 150,
  },
}

require('lspconfig').gopls.setup({
    on_attach = on_attach
})

require('lspconfig').cssls.setup({
    on_attach = on_attach
})

require('lspconfig').tsserver.setup({
    on_attach = on_attach
})

function M.setup()
  require("config.lsp.installer").setup(servers, opts)
end

return M
