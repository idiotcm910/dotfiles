call plug#begin()
Plug 'vim-scripts/AutoClose--Alves'
Plug 'vim-airline/vim-airline'
Plug 'vim-airline/vim-airline-themes'
Plug 'preservim/nerdtree'
Plug 'junegunn/fzf', { 'do': { -> fzf#install() } }
Plug 'junegunn/fzf.vim'
Plug 'neoclide/coc.nvim', {'branch': 'release'}
Plug 'frazrepo/vim-rainbow'
Plug 'terryma/vim-smooth-scroll'
Plug 'SirVer/ultisnips'
"syntax highlight
Plug 'jelera/vim-javascript-syntax'
Plug 'leafgarland/typescript-vim'
Plug 'mxw/vim-jsx'
Plug 'MaxMEllon/vim-jsx-pretty'
"colorscheme
Plug 'joshdick/onedark.vim'
call plug#end()

