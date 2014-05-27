function unique(array){
	var storage = {};
	var result = [];
	for(var i = 0 ; i < array.length ; i++){
		value = array[i];
		if( !(value in storage) ){
			storage[value] = true;
			result.push(value);
		}
	}
	return result;
}

function history(){
		this.index = 0;
		this.data = []
		this.add = function (keyword){
			if( this.data[this.index] == keyword ){
					return;
			}
			this.data.splice(this.index + 1);
			this.data.push(keyword);
			this.index = this.data.length - 1;
		}
		this.next = function (){
				if( this.data.length <= this.index + 1 ){
						return "";
				}
				return this.data[++this.index];
		}
		this.prev = function (){
				if( 0 >= this.index ){
						return "";
				}
				return this.data[--this.index];
		}
		this.reset = function (){
				this.data = [];
				this.index = 0;
		}
		this.is_last = function (){
			return this.index == 0;
		}
		this.is_top = function (){
			return this.index == this.data.length - 1;
		}
}
var hist = new history();

// function modal_open(keyword){
// 	$("#myModal").modal("show");
// 	$("#loading").fadeIn();
// 	$.post("./search", { in:keyword}, function(ret){
// 		$("#loading").fadeOut();
// // 		$("#result-body").html("Searching...");
// 		$(".modal-title").text(":help " + keyword);
// 		$(".modal-title").attr("href", "./?query=" + encodeURIComponent(keyword));
// 		vimdoc_url = "http://vim-help-jp.herokuapp.com/vimdoco 85 + 85?query=" + encodeURIComponent(keyword)
// 		$(".btn.btn-default.vimdoc").attr("href", vimdoc_url);
// 		$("#result-body").html(ret);
//
// // 		$('.tag_keyword').attr("data-placement", "bottom")
// // 		$('.tag_keyword').attr("data-toggle", "tooltip")
// // 		$('.tag_keyword').attr("title", "新しく開く")
// 		$('.tag_keyword').click(function(e) {
// 			keyword = $(this).attr("data-keyword");
// 			hist.add(keyword);
// 			modal_open(keyword);
// 		});
// // 		$('[data-toggle=tooltip]').tooltip();
// 	});
// };

function disable_button(class_){
	$(class_).attr("disabled", "disabled");
	$(class_).attr("color", "#c0c0c0");
}

function enable_button(class_){
	$(class_).removeAttr("disabled");
	$(class_).attr("color", "#0066ff");
}


function modal_open(keyword, body){
	vimdoc_url = body["vimdoc_url"];
	text = body["text"];

	$("#myModal").modal("show");
	$(".modal-title").text(":help " + keyword);
	$(".modal-title").attr("href", "#" + keyword);
	if( vimdoc_url == "" ){
		disable_button(".btn.btn-info.vimdoc");
	}
	else{
		enable_button(".btn.btn-info.vimdoc");
	}
	$(".btn.btn-info.vimdoc").attr("href", vimdoc_url);
	$("#result-body").html(text);

	$('.tag_keyword').click(function(e) {
		keyword = $(this).attr("data-keyword");
		open(keyword);
	});

	hist.add(keyword);

	if( hist.is_top() ){
		disable_button(".btn.btn-default.next");
	}
	else{
		enable_button(".btn.btn-default.next");
	}

	if( hist.is_last() ){
		disable_button(".btn.btn-default.prev");
	}
	else{
		enable_button(".btn.btn-default.prev");
	}

};

function search(keyword){
	$("#loading").fadeIn();

	$.post("./search", { in:keyword}, function(ret){
		$("#loading").fadeOut();
		modal_open(keyword, ret)
	});
}

function open(query){
	location.replace("#" + query);
}

function get_param(key) {
	var url = location.search;
	if( url == "" ){
		return "";
	}
	parameters = url.split("?");
	params = parameters[1].split("&");
	var paramsArray = [];
	for ( i = 0; i < params.length; i++ ) {
			neet = params[i].split("=");
			paramsArray.push(neet[0]);
			paramsArray[neet[0]] = neet[1];
	}
	return paramsArray[key];
}


$(document).ready(function() {
	$('[data-toggle="modal"]').click(function(e) {
		hist.reset();
		keyword = $("#input_text").val();
		$("#result-body").html("Searching...");
		modal_open(keyword);
	});

	query = get_param("query");
	if( query != "" ){
		keyword = decodeURIComponent(query);
		$("#input_text").val(keyword);
		search(decodeURIComponent(query));
	}

	$('.btn.btn-default.prev').click(function(e) {
		keyword = hist.prev()
		if( keyword == "" ){
			return;
		}
		open(keyword);
	});
	$('.btn.btn-default.next').click(function(e) {
		keyword = hist.next();
		if( keyword == "" ){
			return;
		}
		open(keyword);
	});

	$(function() {
		$('[data-toggle=tooltip]').tooltip();
	});

	$('[data-toggle="search"]').click(function(e) {
		open($("#input_text").val());
	});

	$("#myModal").on("hidden.bs.modal", function (){
		hist.reset();
		open("")
		$(".btn.btn-default.next").attr("disabled", "")
		$(".btn.btn-default.prev").attr("disabled", "")
	});

	$(window).bind("hashchange", function (){
		if( location.hash == ""){
			return
		}
		search(location.hash.slice(1));
	});
	if( location.hash != ""){
		search(location.hash.slice(1));
	}
});

$(function() {
	var tags = []
	$.get("./api/tags/json", function(data){
		var tags = data;
		$("#input_text").autocomplete({
			source: function (request, response){
				completion = $.grep(data, function(value){
					return value.indexOf(request.term) === 0
						|| value.indexOf("'" + request.term) === 0
						|| value.indexOf(":" + request.term) === 0;
				});
				req = new RegExp(request.term);
				completion = completion.concat($.grep(data, function(value){
					return value.match(req);
				}));
				completion = unique(completion);
				completion.splice(30);
				response(completion);
			},
			minLength: 2
		})
	}, "json");
});

$(function() {
	$("#loading").fadeOut();
});

