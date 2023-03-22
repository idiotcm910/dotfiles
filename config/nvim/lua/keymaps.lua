-----------------------------------------------------------
-- Define keymaps of Neovim and installed plugins.
-----------------------------------------------------------

local function map(mode, lhs, rhs, opts)
  local options = { noremap=true, silent=true }
  if opts then
    options = vim.tbl_extend('force', options, opts)
  end
  vim.api.nvim_set_keymap(mode, lhs, rhs, options)
end

-----------------------------------------------------------
-- Neovim shortcuts
-----------------------------------------------------------

-- moving in insert mode
map('i', '<A-h>', '<Left>')
map('i', '<A-j>', '<Down>')
map('i', '<A-k>', '<Up>')
map('i', '<A-l>', '<Right>')

-- buffer
map('n', '<Tab>', ':bnext<CR>')
map('n', '<S-Tab>', ':bprevious<CR>')
map('n', '<S-z>', ':bdelete<CR>')
