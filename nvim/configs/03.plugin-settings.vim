"colorscheme
let g:sonokai_style = 'andromeda'
let g:onedark_termcolors=256
set termguicolors

""dark theme
colorscheme onedark
let g:airline_theme='onedark'

""highlight react
let g:jsx_ext_required = 1
let g:jsx_pragma_required = 1

let g:airline_powerline_fonts=1

if !exists('g:airline_symbols')
		let g:airline_symbols = {}
endif

"powerline symbols
let g:airline_left_sep = ''
let g:airline_left_alt_sep = ''
let g:airline_right_sep = ''
let g:airline_right_alt_sep = ''
let g:airline_symbols.branch = ''
let g:airline_symbols.readonly = ''
let g:airline_symbols.linenr = 'ln'
let g:airline_symbols.maxlinenr = ''
let g:airline_symbols.dirty='⚡'
let g:airline_symbols.colnr='col'"

"branch name
let g:airline#extensions#tabline#enabled = 1
"let g:airline#extensions#hunks#enabled=0
"let g:airline#extensions#hunks#coc_git = 1

""NerdTree
"Map key NerdTree
nnoremap <S-b> :NERDTreeToggle<CR>

"Tu dong dong' NerdTree khi dong tab
autocmd BufEnter * if tabpagenr('$') == 1 && winnr('$') == 1 && exists('b:NERDTree') && b:NERDTree.isTabTree() | quit | endif
autocmd bufenter * if (winnr("$") == 1 && exists("b:NERDTree") 
      \ && b:NERDTree.isTabTree()) | q | endif
map <leader>r :NERDTreeFind<cr>
"https://www.laptrinhdeom.xyz/p/vim-la-cai-quai-gi-cach-cai-dat-va-su-dung-vim-nhu-vscode-phan-5-sidebar-with-nerdtree/

""FZF
nnoremap <silent> <C-p> :Files<CR>
"map key up ,down
autocmd FileType fzf tnoremap <buffer> <A-j> <Down>
autocmd FileType fzf tnoremap <buffer> <A-k> <Up>
"remove folder node_modules in search
set wildmode=list:longest,list:full
set wildignore+=*.o,*.obj,.git,*.rbc,*.pyc,__pycache__
let $FZF_DEFAULT_COMMAND =  "find * -path '*/\.*' -prune -o -path '**/node_modules/**' -prune -o -path '*.class' -prune -o -path 'node_modules/**' -prune -o -path 'target/**' -prune -o -path 'dist/**' -prune -o  -type f -print -o -type l -print 2> /dev/null"

"rainbow
let g:rainbow_active = 1
let g:rainbow_load_separately = [
    \ [ '*' , [['(', ')'], ['\[', '\]'], ['{', '}']] ],
    \ [ '*.tex' , [['(', ')'], ['\[', '\]']] ],
    \ [ '*.cpp' , [['(', ')'], ['\[', '\]'], ['{', '}']] ],
    \ [ '*.{html,htm}' , [['(', ')'], ['\[', '\]'], ['{', '}'], ['<\a[^>]*>', '</[^>]*>']] ],
    \ ]
let g:rainbow_guifgs = ['#00afaf', '#D95F74', 'LightSkyBlue', '#FF9363']
let g:rainbow_ctermfgs = ['darkblue', 'darkmagenta', 'darkcyan', 'darkred'] 

let g:airline_powerline_fonts = 1
let g:cpp_named_requirements_highlight = 1

""Coc
" Use K to show documentation in preview window.
nnoremap <silent> K :call <SID>show_documentation()<CR>

""vim-smooth-scroll
noremap <silent> <c-b> :call smooth_scroll#up(&scroll*1, 10, 2)<CR>
noremap <silent> <c-f> :call smooth_scroll#down(&scroll*1, 10, 2)<CR>


""keymap autocompleted coc
" use <tab> for trigger completion and navigate to the next complete item
function! s:check_back_space() abort
  let col = col('.') - 1
  return !col || getline('.')[col - 1]  =~ '\s'
endfunction

inoremap <silent><expr> <Tab>
      \ pumvisible() ? "\<C-n>" :
      \ <SID>check_back_space() ? "\<Tab>" :
      \ coc#refresh()

let g:UltiSnipsExpandTrigger="<s-tab>"
let g:UltiSnipsJumpForwardTrigger="<c-b>"
let g:UltiSnipsJumpBackwardTrigger="<c-z>"
let g:UltiSnipsEditSplit="vertical"
