syntax on
set encoding=UTF-8 
set t_Co=256
set background=dark
set pumblend=10
set noswapfile
set nobackup

set ruler
set tabstop=4
set shiftwidth=4
"number

"map key movement int insert mode
inoremap <A-h> <Left>
inoremap <A-j> <Down>
inoremap <A-k> <Up>
inoremap <A-l> <Right>
inoremap <A-b> <C-o>b
inoremap <A-w> <C-o>w

"remove buffer
map <S-z> :bd<CR>

"auto save
map <C-s> :w<CR>

"Remove hightlight
map <S-h> :nohl<CR>

set number
set numberwidth=5
:augroup numbertoggle
:  autocmd!
:  autocmd BufEnter,FocusGained,InsertLeave,WinEnter * if &nu && mode() != "i" | set rnu   | endif
:  autocmd BufLeave,FocusLost,InsertEnter,WinLeave   * if &nu                  | set nornu | endif
:augroup END

""map key
"Tabs
nnoremap  <silent>   <tab>  :if &modifiable && !&readonly && &modified <CR> :write<CR> :endif<CR>:bnext<CR>
nnoremap  <silent> <s-tab>  :if &modifiable && !&readonly && &modified <CR> :write<CR> :endif<CR>:bprevious<CR>

"map esp to caplock
au VimEnter * silent! !xmodmap -e 'clear Lock' -e 'keycode 0x42 = Escape'
au VimLeave * silent! !xmodmap -e 'clear Lock' -e 'keycode 0x42 = Caps_Lock'
inoremap jk <Esc>
"highlight java
autocmd ColorScheme * highlight jvTypedef guifg=#a468ac cterm=bold
autocmd ColorScheme * highlight jvType guifg=#6f694f cterm=bold

"" deleteing without register overwrite
" Shortcut to use blackhole register by default
nnoremap d "_d
vnoremap d "_d
nnoremap D "_D
vnoremap D "_D
nnoremap c "_c
vnoremap c "_c
nnoremap C "_C
vnoremap C "_C
nnoremap x "_x
vnoremap x "_x
nnoremap X "_X
vnoremap X "_X
" Change <leader> to be comma
let mapleader = ","
let g:mapleader = ","
" Shortcut to use clipboard with <leader>
nnoremap <leader>d d
vnoremap <leader>d d
nnoremap <leader>D D
vnoremap <leader>D D
nnoremap <leader>c c
vnoremap <leader>c c
nnoremap <leader>C C
vnoremap <leader>C C
nnoremap <leader>x x
vnoremap <leader>x x
nnoremap <leader>X X
vnoremap <leader>X X

