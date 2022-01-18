for f in split(glob('~/.config/nvim/configs/*.vim'), '\n')
	exe 'source' f
endfor

""neovide 
let g:neovide_cursor_vfx_mode = "pixiedust"
let g:neovide_input_use_logo=v:true
set guifont=Fira\ Code:h12
