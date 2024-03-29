call plug#begin()
Plug 'vim-scripts/AutoClose--Alves'
Plug 'tamton-aquib/staline.nvim'
Plug 'junegunn/fzf', { 'do': { -> fzf#install() } }
Plug 'junegunn/fzf.vim'
Plug 'neoclide/coc.nvim', {'branch': 'release'}
Plug 'frazrepo/vim-rainbow'
Plug 'terryma/vim-smooth-scroll'
Plug 'SirVer/ultisnips'
Plug 'kyazdani42/nvim-web-devicons' " for file icons
Plug 'kyazdani42/nvim-tree.lua'
Plug 'nvim-treesitter/nvim-treesitter', {'do': ':TSUpdate'}
Plug 'tribela/vim-transparent'
Plug 'easymotion/vim-easymotion'
Plug 'voldikss/vim-floaterm'
"syntax highlight
Plug 'jelera/vim-javascript-syntax'
Plug 'leafgarland/typescript-vim'
Plug 'mxw/vim-jsx'
Plug 'MaxMEllon/vim-jsx-pretty'
"snippets
Plug 'honza/vim-snippets'
"colorscheme
Plug 'joshdick/onedark.vim'
Plug 'dracula/vim'
Plug 'drewtempelmeyer/palenight.vim'
Plug 'NLKNguyen/papercolor-theme'
Plug 'sainnhe/everforest'
call plug#end()

