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
inoremap <A-h> <C-o>h
inoremap <A-j> <C-o>j
inoremap <A-k> <C-o>k
inoremap <A-l> <C-o>l
inoremap <A-b> <C-o>b
inoremap <A-w> <C-o>w

"remove buffer
map <S-x> :bd<CR>

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

