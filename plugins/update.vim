" $ git submodule foreach git pull origin master
" $ git add plugins/*
let s:root = expand("<sfile>:h")
echo s:root


let s:F = vital#of("vital").import("System.File")
let s:vimdoc = "/usr/local/share/vim/vim74/doc"

function! s:copy_vimdoc(from, to)
	let docs = split(globpath(a:from, "*.txt"), "\n")
	for doc in docs
		let src  = doc
		let dest = a:to . "/" . fnamemodify(src, ":t")
		call s:F.copy(src, dest)
	endfor
endfunction



function! s:replace_path(text,plugin)
	return substitute(a:text, '\t', '\t' . a:plugin . "/doc/", "")
endfunction


function! s:add_lang_tag(text, lang)
	return substitute(a:text, '\*$', '@' . a:lang . '\*', "")
endfunction


function! s:to_vimhelp_format(text, plugin, lang)
	return s:add_lang_tag(s:replace_path(a:text, a:plugin), a:lang)
endfunction


function! s:make_tags(root, plugin)
	let dir = a:root . "/" . a:plugin . "/doc"
	execute "helptags" dir
	let tags = []
	if filereadable(dir . "/tags")
		let tags = map(readfile(dir . "/tags"), "s:to_vimhelp_format(v:val, a:plugin, 'en')")
		call delete(dir . "/tags")
	endif

	let tags_ja = []
	if filereadable(dir . "/tags-ja")
		let tags_ja = map(readfile(dir . "/tags-ja"), "s:to_vimhelp_format(v:val, a:plugin, 'ja')")
		call delete(dir . "/tags-ja")
	endif

	return [tags, tags_ja]
endfunction

function! s:main()
	call s:copy_vimdoc(s:vimdoc, s:root . "/vim/doc")

	let plugins = map(split(globpath(s:root, "**/doc/"), "\n"), 'fnamemodify(v:val, ":h:h:t")')
	let tags = []
	let tags_ja = []
	for [tags_, tags_ja_] in map(plugins, "s:make_tags(s:root, v:val)")
		let tags += tags_
		let tags_ja += tags_ja_
	endfor
	call writefile(tags, s:root . "/tags")
	call writefile(tags_ja, s:root . "/tags-ja")
endfunction
call s:main()


