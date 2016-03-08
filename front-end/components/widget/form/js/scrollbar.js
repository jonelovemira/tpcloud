(function($) {
    "use strict";

    var tmpScrollbar = {
        verticalScrollbarTemplate: "<div class=\"scrollbar scrollbar-vertical\">" +
            "<div class=\"scroll-area\">" +
            "<div class=\"scroll-block\">" +
            "</div></div></div>",
        horizontalScrollbarTemplate: "<div class=\"scrollbar scrollbar-horizontal\">" +
            "<div class=\"scroll-area\">" +
            "<div class=\"scroll-block\">" + 
            "</div></div></div>",
        addVerticalScroll: function(completeContent, displayContent) {
            if (completeContent && displayContent) {
                var completeContentHeight = completeContent.attr("height") ||
                    completeContent.outerHeight();
                completeContent.css({
                    top: 0
                });
                if (completeContentHeight > displayContent.outerHeight()) {
                    displayContent.prepend(tmpScrollbar.verticalScrollbarTemplate);
                }
            } else {
                console.error("args error");
            }
        },
        addHorizontalScroll: function(completeContent, displayContent) {
            if (completeContent && displayContent) {
                completeContent.css({
                    left: 0
                });
                if (completeContent.width() > displayContent.width()) {
                    completeContent.prepend(tmpScrollbar.horizontalScrollbarTemplate);
                    var scrollbarPercent = Math.floor((completeContent.width() - displayContent.width()) / 1000) * 100;
                    displayContent.find(".scrollbar-horizontal .scroll-block").css({
                        width: Math.min(85, Math.max(5, 100 - scrollbarPercent)) + "%"
                    })
                };
            } else {
                console.error("args error");                
            }
        },
        addDraggable: function(completeContent, displayContent) {
            if (displayContent) {
                var scrollBlock = displayContent.find(".scroll-block");
                scrollBlock.draggable({
                    containment: 'parent',
                    drag: function (event, ui) {
                        var positionInPercent = {
                            top: ui.position.top / (ui.helper.parent().height() - ui.helper.height()),
                            left: ui.position.left / (ui.helper.parent().width() - ui.helper.width())
                        };
                        var contentPositionReverse = {
                            top: (completeContent.height() - displayContent.height()) * positionInPercent.top,
                            left: (completeContent.width() - displayContent.width()) * positionInPercent.left
                        };

                        var completeContentTop = Math.min(-contentPositionReverse.top, 0);
                        completeContentTop = Math.max(-contentPositionReverse.top, displayContent.height()-completeContent.height());
                        var completeContentLeft = isNaN(-contentPositionReverse.left) ? 0:-contentPositionReverse.left;

                        completeContent.css({
                            top: completeContentTop,
                            left: completeContentLeft
                        });
                    }
                })
            } else {
                console.error("args error");
            }
        },
        clearExistedScroll: function(displayContent) {
            if (displayContent) {
                displayContent.find(".scrollbar-vertical").remove();
            } else {
                console.error("args error");
            }
        },
        getWheelDelta: function(event) {
            var normalized;
            if (event.originalEvent.wheelDelta) {
                normalized = (event.originalEvent.wheelDelta % 120 - 0) == -0 ? event.originalEvent.wheelDelta / 120 : event.originalEvent.wheelDelta / 12;
            } else {
                var rawAmmount = event.originalEvent.deltaY ? event.originalEvent.deltaY : event.originalEvent.detail;
                normalized = -(rawAmmount % 3 ? rawAmmount * 10 : rawAmmount / 3);
            }
            return normalized * 120;
        },
        stopEventBubble: function(event) {
            if (event.cancelBubble != undefined) {
                event.cancelBubble = true;
                event.returnValue = false;
                event.preventDefault()
                event.stopPropagation();
            } else if (event.originalEvent != undefined) {
                event.originalEvent.cancelBubble = true;
                event.originalEvent.returnValue = false;
                event.originalEvent.preventDefault()
                event.originalEvent.stopPropagation();
                return false;
            }
        }
    };

    $.fn.Scrollbar = function(options) {
        var _options = $.extend(true, $.fn.Scrollbar.defaults, options);
        var displayContent = this;
        var completeContent = _options.target;
        if (completeContent) {
            tmpScrollbar.addVerticalScroll(completeContent,
                displayContent);

            tmpScrollbar.addHorizontalScroll(completeContent,
                displayContent);

            tmpScrollbar.addDraggable(completeContent, displayContent);

            completeContent.on('mousewheel DOMMouseScroll wheel', function (event) {
                if (completeContent.outerHeight() <= displayContent.outerHeight()) {
                    return;
                }
                if (_options.overflowFlag) {
                    completeContent.css({
                        overflow: "hidden"
                    });
                };
                var top = completeContent.position().top;
                var wheelDelta = tmpScrollbar.getWheelDelta(event);
                if (wheelDelta > 0) {
                    completeContent.css("top", Math.min(top + 15, 0));
                } else {
                    completeContent.css("top", Math.max(top - 15, displayContent.height() - completeContent.height()));
                };

                var topInPercent = completeContent.position().top / (displayContent.height() - completeContent.height());
                var block = displayContent.find(".scrollbar-vertical .scroll-area .scroll-block");
                var blockTopPosition =  (block.height() - (block.parent().height())) * topInPercent;

                block.css({
                    top: -blockTopPosition
                });

                _options.overflowFlag && completeContent.css({
                    overflow: "visible"
                });

                tmpScrollbar.stopEventBubble(event);
            });

            displayContent.find(".scrollbar").mousedown(tmpScrollbar.stopEventBubble);
        } else {
            console.error("some options is required");
        }
    };

    $.fn.Scrollbar.defaults = {
        "target": null,
        "overflowFlag": false
    }

})(jQuery);