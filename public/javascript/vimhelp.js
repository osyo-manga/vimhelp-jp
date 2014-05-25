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
// 		vimdoc_url = "http://vim-help-jp.herokuapp.com/vimdoc/?query=" + encodeURIComponent(keyword)
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


function modal_open(keyword, body){
	$("#myModal").modal("show");
	$(".modal-title").text(":help " + keyword);
	$(".modal-title").attr("href", "./?query=" + encodeURIComponent(keyword));
	vimdoc_url = "http://vim-help-jp.herokuapp.com/vimdoc/?query=" + encodeURIComponent(keyword)
	$(".btn.btn-info.vimdoc").attr("href", vimdoc_url);
	$("#result-body").html(body);
	$('.tag_keyword').click(function(e) {
		keyword = $(this).attr("data-keyword");
		search(keyword);
	});
	hist.add(keyword);

	console.log(hist);

	if( hist.is_top() ){
		$(".btn.btn-default.next").attr("disabled", "")
	}
	else{
		$(".btn.btn-default.next").removeAttr("disabled")
	}

	if( hist.is_last() ){
		$(".btn.btn-default.prev").attr("disabled", "")
	}
	else{
		$(".btn.btn-default.prev").removeAttr("disabled")
	}

};

function search(keyword){
	$("#loading").fadeIn();

	$.post("./search", { in:keyword}, function(ret){
		$("#loading").fadeOut();
		modal_open(keyword, ret)
	});
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
		search(keyword);
	});
	$('.btn.btn-default.next').click(function(e) {
		keyword = hist.next();
		if( keyword == "" ){
			return;
		}
		search(keyword);
	});

	$(function() {
		$('[data-toggle=tooltip]').tooltip();
	});

	$('[data-toggle="search"]').click(function(e) {
		search($("#input_text").val());
	});

	$("#myModal").on("hidden.bs.modal", function (){
		hist.reset();
		$(".btn.btn-default.next").attr("disabled", "")
		$(".btn.btn-default.prev").attr("disabled", "")
	});

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

