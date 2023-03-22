require('plugins')
require('settings')
require('plugins-settings')

-- invoke file config
require('config.treesitter')
require('keymaps')
require('config.colorscheme.tokyonight')
require('config.windline')
require('config.hop')
-----
vim.cmd [[packadd packer.nvim]]
