# -*- encoding: UTF-8 -*-
require "bundler"
require 'sinatra'
require 'json'
require 'set'
require 'digest/sha1'
require 'erb'
require 'open-uri'
require "cgi"
require "haml"
require 'sinatra/reloader' if development?
require 'rdiscount'


# set :markdown, :layout_engine => :haml, :layout => :pos


load "vimhelp.rb"

$stdout.sync = true


root = "plugins"
tagfiles = ["tags-ja", "tags"]

vimhelp = VimHelp.new(root, tagfiles)


get '/' do
	haml :index
end

get '/dev' do
	haml :index
end

get '/about' do
	haml :about
end


post '/search' do
	content_type :json
	response.headers['Access-Control-Allow-Origin'] = '*'
	query = params[:in]
	if !query || query == ""
		return "Not found."
	end
	result = vimhelp.search(query, "Not found.")
	text = result[:text]
	text = CGI.escapeHTML(text)

	# option link
	text = text.gsub(/\|(.+?)\||(&#39;[[:alpha:]]+?&#39;)/){ |text|
		query = CGI.unescapeHTML($1 ? $1 : $2)
		title = vimhelp.search(query)[:text].sub(/^.*\n/, "").gsub(/　+|\s+|\t+\n/, " ").slice(0, 200)
# 		title = result[:text].gsub(/　+|\s+|\t+\n/, " ").slice(0, 200)
		if title.empty?
			query
		else
			"<a class=\"tag_keyword\" data-keyword=\"#{ query }\" title=\"#{ CGI.escapeHTML title }\">#{ query }</a>"
		end
	}
	text = text.gsub(/\n/, "<br>")
	{ :vimdoc_url => result[:vimdoc_url], :text => text }.to_json
end


# ?query={}
get '/api/search/json/' do
	content_type :json
	query  = params[:query]
	if !query
		return ""
	end
	vimhelp.search(query, "").to_json
end


# ?query={}
get '/api/redirect_vimdoc_ja/' do
	url = "http://vim-jp.org/vimdoc-ja/"
	query  = params[:query]
	if query && !query.empty?
		result = vimhelp.search(query, "")
		url = result[:vimdoc_url] unless result[:vimdoc_url].empty?
	end
# 	puts url
	redirect url
end


get '/api/tags/json' do
	content_type :json
	response.headers['Access-Control-Allow-Origin'] = '*'
	if params.has_key? "term"
		vimhelp.tags.select{ |item| item =~ /#{params[:term]}/i }.to_json
	else
		vimhelp.tags.to_json
	end
end



# -------------------- lingr-bot --------------------
def post_lingr_help(room, query, vimhelp)
	Thread.start do
		url = "http://vim-help-jp.herokuapp.com/##{query}"
# 		url = "http://vim-help-jp.herokuapp.com/?query=#{ERB::Util.url_encode query}"
		help = vimhelp.search(query, "Not found.")
		result = (url + "\n" + help[:text].gsub(/^$/, "　")).slice(0, 1000)
# 		result = (url + "\n" + help[:vimdoc_url] + "\n" + help[:text].gsub(/^$/, "　")).slice(0, 1000)
# 		result = (help[:vimdoc_url] + "\n" + help[:text].gsub(/^$/, "　")).slice(0, 1000)
		param = {
			room: room,
			bot: 'vimhelpjp',
			text: result,
			bot_verifier: ENV['LINGR_BOT_KEY']
		}.tap {|p| p[:bot_verifier] = Digest::SHA1.hexdigest(p[:bot] + p[:bot_verifier]) }

		query_string = param.map {|e|
			e.map {|s| ERB::Util.url_encode s.to_s }.join '='
		}.join '&'

		open "http://lingr.com/api/room/say?#{query_string}"
	end
end


post '/lingr/vimhelpjp' do
	content_type :text
	json = JSON.parse(request.body.string)
	json["events"].select {|e| e['message'] }.map {|e|
		text = e["message"]["text"]
		room = e["message"]["room"]
		
		if /^:h[\s　]+(.+)/ =~ text
			query = text[/^:h[\s　]+(.+)/, 1]
			post_lingr_help(room, query, vimhelp)
		end

		if /^:help[\s　]+(.+)/ =~ text
			query = text[/^:help[\s　]+(.+)/, 1]
			post_lingr_help(room, query, vimhelp)
		end
	}
	return ""
end



# ?query={}
get '/vimdoc/' do
	query  = params[:query]
	redirect "./api/redirect_vimdoc_ja/?query=" + query
end

get '/api/redirect_vimdoc/' do
	query  = params[:query]
	redirect "./api/redirect_vimdoc_ja/?query=" + query
end


# ?query={}
get '/search/' do
	query  = params[:query]
	redirect "./?query=" + query
end

