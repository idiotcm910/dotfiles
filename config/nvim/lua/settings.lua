local set = vim.opt
local api = vim.api
local g = vim.g
local opt = vim.opt

api.nvim_set_keymap("", "<Space>", "<Nop>", { noremap = true, silent = true })
g.mapleader = " "
g.maplocalleader = " "

opt.timeoutlen = 300
opt.linespace = 20

set.termguicolors = true
vim.cmd [[
	syntax enable
	set background=dark
	set t_Co=256
    colorscheme onedark
    set number
    set relativenumber
    set tabstop=4
    set softtabstop=4
    set shiftwidth=4
    set smarttab
    set expandtab
    set autoindent
    set list
    set listchars=tab:▸\ ,trail:·
    set clipboard=unnamedplus
    set encoding=UTF-8
    
    syntax on
    filetype plugin on
]]
