(function($){
	$(function(){

		var EventUtil = {
			getEvent: function(event) {
				return event ? event : window.event;
			},
			addHandler: function(element, type, handler) {
				if (element.addEventListener) {
					element.addEventListener(type, handler, false);
				} else if (element.attachEvent) {
					element.attachEvent("on" + type, handler);
				} else {
					element["on" + type] = handler;
				}
			},
			removeHandler: function(element, type, handler) {
				if (element.removeEventListener) { //检测DOM2级方法  
					element.removeEventListener(type, handler, false);
				} else if (element.detachEvent) { //检测IE方法  
					element.detachEvent("on" + type, handler);
				} else {
					element["on" + type] = null; //使用DOM0方法  
				}
			},
			getWheelDelta: function(event) {
				if (event.wheelDelta) {
					return event.wheelDelta;
				} else {
					return -event.detail * 40;
				}
			}
		};




		$('select').each(function(){
			var $select = $(this);

			$select.show();

			var name = $(this).attr("id");

			var $selectOptions = $select.find("option");
			var width = $select.width() == 0 ? 200 : ($select.outerWidth()),
				slideWidth = $select.attr("Optionwidth") == null ? width : $select.attr("Optionwidth"),
				slideHeight = Math.min(288, 25 * $selectOptions.length);
			var disabled = $select.attr("disabled");

			$select.hide();

			var temp = $select.find("option[value='" + $select.val() + "']").html();

			var a = "<div class='plugin-select select" + ("disabled" == disabled ? " select-disabled" : "") + " select-" + name + " " + name + " select-slide'>";

			a += "<div class='selected lang'>" + (null == temp ? "" : temp) + "</div>";
			a += "<div class='triangle'></div>";
			a += "<div class='forDisabled'></div>";
			a += "<div class='slide'>";
			a += "<div class='slide-item-holder'>";

			$selectOptions.each(function(i) {
				if ($(this).css("display") != "none") {
					a += "  <div class='slide-item lang' xvalue='" + $(this).attr("value") + "' class='forOption'>" + $(this).html() + "</div>";
				}

			});

			a += " </div>";
			a += "</div>";
			a += "</div>";

			var $widgetSelect = $(a);

			$widgetSelect.insertBefore($select);


			$widgetSelect.bind({
				click: function(e) {
					//判断select展开朝向
					var screenHeight = screen.availHeight,
						selectPositionY = e.pageY;
					if (screenHeight - selectPositionY < Math.min(288, 25 * $selectOptions.length)) {
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
					//
					if (!$(this).hasClass("select-slide")) {
						$widgetSelect.removeClass("select-slide")
						$(this).addClass("select-slide");
					} else {
						$(this).removeClass("select-slide");
					}

					$select.focus();

					e.stopPropagation();
				}
			}).disableSelection();

			$widgetSelect.find(".slide").find(".slide-item").bind({
				click: function(e) {
					optionSelected(this);
					e.stopPropagation();

				}
			});
			$widgetSelect.width(width);
			$widgetSelect.find(".selected").width(width - 30);
			$widgetSelect.find(".slide").width(slideWidth).height(slideHeight);
			$widgetSelect.find(".slide-item-holder").width(slideWidth).attr({
				height: 23 * $selectOptions.length
			}); //.height(15*$selectOptions.length);
			$widgetSelect.find(".forDisabled").width(width).bind({
				click: function(e) {
					e.stopPropagation();
				}
			});

			plug({
				$target: $widgetSelect.find(".slide .slide-item-holder"),
				$holder: $widgetSelect.find(".slide")
			});

			$widgetSelect.removeClass("select-slide");

			function optionSelected(objx) {
				$widgetSelect.removeClass("select-slide");

				var value = $(objx).attr("xvalue");

				$widgetSelect.find(".selected").html($(objx).html());

				$select.val(value);

				$select.change();
			};
			$("body").click(function() {
				$('div.select-slide').removeClass("select-slide");
			});

			$select.change(function() {
				$widgetSelect.find(".selected").html($(this).children("option:selected").html());
			});
		});


		function plug(options) {
			var $target = options.$target,
				$holder = options.$holder,
				revert = options.revert == false ? false : true,
				overflowFlag = options.overflowFlag || false;

			function handleMouseWheel(event) {

				if ($target.outerHeight() <= $holder.outerHeight()) return;

				if (overflowFlag) {
					$target.css({
						overflow: "hidden"
					});
				}

				var $top = $target.position().top;
				var delta = EventUtil.getWheelDelta(event);

				if (delta > 0) {
					$target.css("top", Math.min($top + 15, 0));
				} else {

					$target.css("top", Math.max($top - 15, $holder.height() - $target.height()));
				}

				ration.top = $target.position().top / ($holder.height() - $target.height());

				dd.top = ($scrollVerticalBlock.height() - ($scrollVerticalBlock.parent().height())) * ration.top;

				$scrollVerticalBlock.css({
					top: -dd.top
				});

				if (overflowFlag) {
					$target.css({
						overflow: "visible"
					});
				}
				stopBubble(event);
			}
			var $targetHeight = $target.attr("height") || $target.outerHeight();
			if ($targetHeight > $holder.outerHeight()) {
				if (revert) {
					$target.css({
						top: 0
					});
				}
				if ($holder.find(".scrollBar-vertical").length == 0) { //没有滚动条

					var a = "<div class='scrollBar scrollBar-vertical' onmousedown='stopBubble(event)'>";
					a += "	<div class='scroll-area'>";
					a += "	<div class='scroll-block'></div>";
					a += "	</div>";
					a += "</div>";
					$holder.prepend(a);

					var scrollBlockPercent = Math.floor(($targetHeight - $holder.height()) / 1000) * 100

					$holder.find(".scrollBar-vertical .scroll-block").css({
						//	height: Math.min(85, Math.max(5, 100 - scrollBlockPercent)) + "%"
					});

					var ration = {}, dd = {}, $scrollVerticalBlock = $holder.find(".scrollBar-vertical .scroll-area .scroll-block");

					if ($.browser.mozilla) {
						EventUtil.addHandler($target[0], "DOMMouseScroll", handleMouseWheel);
					} else {
						EventUtil.addHandler($target[0], "mousewheel", handleMouseWheel);
					}
				} else { //有滚动条，block位置重置

					if (!revert) {
						return;
					}

					var $scrollVerticalBlock = $holder.find(".scrollBar-vertical .scroll-area .scroll-block");

					$scrollVerticalBlock.css({
						top: 0
					});

					var scrollBlockPercent = Math.floor(($target.height() - $holder.height()) / 1000) * 100

					$holder.find(".scrollBar-vertical .scroll-block").css({
						height: Math.min(85, Math.max(5, 100 - scrollBlockPercent)) + "%"
					});
				}
				if (overflowFlag) {
					$target.css({
						overflow: "visible"
					});
				}
			} else {
				$target.css({
					top: 0
				});
				if (overflowFlag) {
					$target.css({
						overflow: "visible"
					});
				}


				$holder.find(".scrollBar-vertical").remove();
			}

			if ($target.width() > $holder.width()) {
				if ($holder.find(".scrollBar-horizontal").length == 0) { //没有滚动条

					var a = "<div class='scrollBar scrollBar-horizontal' onmousedown='stopBubble(event)'>";
					a += "	<div class='scroll-area'>";
					a += "		<div class='scroll-block'></div>";
					a += "	</div>";
					a += "</div>";
					$holder.prepend(a);

					var scrollBlockPercent = Math.floor(($target.width() - $holder.width()) / 1000) * 100
					$holder.find(".scrollBar-horizontal .scroll-block").css({
						width: Math.min(85, Math.max(5, 100 - scrollBlockPercent)) + "%"
					});
				} else { //有滚动条，block位置重置
				}
			} else {
				$target.css({
					left: 0
				});
				$holder.find(".scrollBar-horizontal").remove();
			}

			var $scrollBlock = $holder.find(".scroll-block");

			$scrollBlock.draggable({
				containment: 'parent',
				drag: function(event, ui) {
					var ration = {
						top: ui.position.top / (ui.helper.parent().height() - ui.helper.height()),
						left: ui.position.left / (ui.helper.parent().width() - ui.helper.width())
					},
					dd = {
						top: ($target.height() - $holder.height()) * ration.top,
						left: ($target.width() - $holder.width()) * ration.left
					};
					/*block隐藏掉会影响jquery position对象*/

					$target.css({
						top: -dd.top,
						left: -dd.left
					});
				},
				stop: function(event, ui) {

				}
			});
		}


	})
})(jQuery)
function stopBubble(event) {
	event.cancelBubble = true;
	event.returnValue = false;
	event.preventDefault()
	event.stopPropagation();
	return false;
}

$(document).click(function() {
	// console.log("test");
	$('div.select-slide').removeClass("select-slide");
});