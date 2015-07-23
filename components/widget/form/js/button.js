(function($){
	$.fn.Button = function(){
		var currentButton = $(this);
		currentButton.addClass("widget-button");
	}
	$(function(){
		$('.button').each(function(){
			$(this).Button();
		});
	})
})(jQuery)