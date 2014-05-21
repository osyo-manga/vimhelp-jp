# -*- encoding: UTF-8 -*-
require 'erb'


def next_tag(file, first)
	result = file[first+1, file.length].index{ |item| /(\*.+\*$)|(={70})/i =~ item }
	if result
		result = result + first
		return result == first ? next_tag(file, first+1) : result
	else
		return file.length
	end
# 	result = file[first+1, file.length].index{ |item| /\*.+\*$/ =~ item } + first
end


def vim_escape(word)
	word.gsub(/"/, "quote").gsub(/\*/, "star").gsub(/\|/, "bar")
end


class VimHelp
	def initialize(root, tagfiles)
		self.load(root, tagfiles)
		@help_files = {}
	end

	def load(root, tagfiles)
		@tagfile = tagfiles.map { |file|
			File.readlines(root + "/" + file, :encoding => Encoding::UTF_8)
		}.flatten
		@tags = @tagfile.map { |line| line[/([^\t]*)\t.*/, 1] }
		@root = root
	end

	def load_help_file(root, file)
		if !@help_files.has_key? file
			@help_files[file] = File.readlines(root + "/" + file, :encoding => Encoding::UTF_8)
		end
		return @help_files[file]
	end
	
	def search(query, default = "")
		result = self.search_tag(Regexp.escape(vim_escape(query)))
		if result.empty?
			return { :vimdoc_url => "", :text => default }
		end
		tag, file, word = result.split(/	/)

		vimdoc = "http://vim-jp.org/vimdoc-ja/#{file[/^.*\/(.*)\..*$/, 1]}.html##{ ERB::Util.url_encode tag }"
		word = word[/\/(.+)\n/, 1]
		f = self.load_help_file(@root, file)
		
		first = f.index{ |item| /#{Regexp.escape(word).gsub(/\\\\/, '\\')}/ =~ item }
		if !first
			return default
		end
		last = next_tag(f, first)

		{ :vimdoc_url => vimdoc, :text => f[first, last - first + 1].join("").gsub(/	/, "　　　　").chomp }
	end

	def search_tag(query)
		result = @tagfile.grep(/\/\*#{query}\*$/).fetch(0, "")
		if result.empty?
			result = @tagfile.grep(/\/\*#{query}/).fetch(0, "")
			if result.empty?
				result = @tagfile.grep(/#{query}/i).fetch(0, "")
				if result.empty?
					return ""
				end
			end
		end
		result
	end

	def tags
		@tags
	end
end

