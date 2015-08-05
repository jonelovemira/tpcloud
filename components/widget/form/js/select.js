(function($){

	$.fn.Select = function(options){

		var _options = $.extend(true, {}, $.fn.Select.defaults, options);
		var $select = $(this);

		$select.show();

		var optionWidth = $select.attr("select-width");
		if (optionWidth != undefined) {
			_options.optionWidth = parseInt(optionWidth);
		};

		// preserve initial select informations
		var name = $(this).attr("id") || "";

		var $selectOptions = $select.find("option");
		var width = $select.width() == 0 ? _options.width : ($select.outerWidth()),
			slideWidth = _options.optionWidth == null ? width : _options.optionWidth,
			slideHeight = Math.min(_options.slideMaxHeight, (_options.slideOptionHeight + 8) * $selectOptions.length);
		var disabled = $select.attr("disabled");

		$select.hide();

		var temp;
		if ($select.val()) {
			temp = $select.find("option[value='" + $select.val() + "']").html() || $select.val();
		}
		else{
			temp = $select.find("option:first").html();
		}



		// generate new styled select widget
		var a = "<div class='plugin-select select" + ("disabled" == disabled ? " select-disabled" : "") + " " + name + " select-slide'>";

		a += "<div class='selected' ><span lang=\"en\">" + (null == temp ? "" : temp) + "</span></div>";
		a += "<div class='triangle'></div>";
		a += "<div class='forDisabled'></div>";
		a += "<div class='slide'>";
		a += "<div class='slide-item-holder'>";

		$selectOptions.each(function(i) {
			if ($(this).css("display") != "none") {
				a += " <div class='slide-item' xvalue='" + $(this).attr("value") + "' class='forOption'><span lang=\"en\">" + $(this).html() + "</span></div>";
			}

		});

		a += " </div>";
		a += "</div>";
		a += "</div>";

		var $widgetSelect = $(a);

		// render to document
		$widgetSelect.insertBefore($select);

		// widget click insteads of original select click
		$widgetSelect.bind({
			click: function(e) {
				//adjust the direction when widget locate at conner of the document
				var screenHeight = screen.availHeight,
					selectPositionY = e.pageY;
				if (screenHeight - selectPositionY < Math.min(_options.slideMaxHeight, _options.slideOptionHeight * $selectOptions.length)) {
					$widgetSelect.find(".slide").css({
						"bottom": $(this).height(),
						"top": ""
					});
				} else {
					$widgetSelect.find(".slide").css({
						"top": $(this).height(),
						"bottom": ""
					});
				}

				//hide or show
				if (!$(this).hasClass("select-slide")) {

					//inform other selects object to hide
					$(".select-slide").removeClass("select-slide");

					$(this).addClass("select-slide");
				} else {
					$(this).removeClass("select-slide");
				}

				$select.focus();

				e.stopPropagation();
			}
		});

		// self-defined widget "select" change
		$widgetSelect.find(".slide").find(".slide-item").bind({
			click: function(e) {
				optionSelected(this);
				e.stopPropagation();

			}
		});

		//css styles update
		$widgetSelect.width(width);
		$widgetSelect.find(".selected").width(width - 30);
		$widgetSelect.find(".slide").width(slideWidth).height(slideHeight);
		$widgetSelect.find(".slide-item").height(_options.slideOptionHeight);
		$widgetSelect.find(".slide-item").css({
			"font-size": _options.slideOptionHeight - 11,
		})
		$widgetSelect.find(".slide-item-holder").width(slideWidth).attr({
			height: 25 * $selectOptions.length
		}); //.height(15*$selectOptions.length);
		$widgetSelect.find(".forDisabled").width(width).bind({
			click: function(e) {
				e.stopPropagation();
			}
		});

		// add scrollbar
		$widgetSelect.find(".slide").Scrollbar({
			target: $widgetSelect.find(".slide .slide-item-holder")
		});

		// initially hide element
		$widgetSelect.removeClass("select-slide");

		function optionSelected(objx) {
			$widgetSelect.removeClass("select-slide");

			var value = $(objx).attr("xvalue");

			$widgetSelect.find(".selected").html("<span lang=\"en\">" + $(objx).html() + "</span>");

			$select.val(value);

			$select.change();
		};

		// changes to original select changes the value of widget select too.
		$select.change(function() {
			$widgetSelect.find(".selected").html("<span lang=\"en\">" + $(this).children("option:selected").html() + "</span>");
		});
	}

	$.fn.Select.defaults = {
		width: 200,
		slideMaxHeight: 288,
		slideOptionHeight: 25
	}

	$(function(){
		$('select.select').each(function(){
			$(this).Select({});
		});
	})
})(jQuery)

// collapse all expanded widget select
$("body").click(function() {
	$('div.select-slide').removeClass("select-slide");
});