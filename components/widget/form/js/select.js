(function ($) {
    "use strict";

    var tmpSelect = {
        mainTemplate:   '<div class="plugin-select">' +
                            '<div class="selected"><span lang="en"></span></div>' +
                            '<div class="triangle"></div>' + 
                            '<div class="slide">' +
                                '<div class="slide-item-holder"></div>' +
                            '</div>' +
                        '</div>',
        optionTemplate: '<div class="slide-item" xvalue=""><span lang="en"></span></div>',
        uniqueAttrKey: 'only-for-plugin-select',
        uniqueAttrValuePrefix: 'i-am-unique-',
        collapse: function(select) {
            select.removeClass("select-slide");
        },
        addSelectOptionElements: function(select, selectOptionElements) {
            var htmlStr = "";
            selectOptionElements.each(function(i) {
                if ($(this).css("display") != "none") {
                    htmlStr += '<div class="slide-item" xvalue="' + $(this).attr("value") + '"><span lang="en">' + $(this).html() + '</span></div>';
                };
            });
            select.find(".slide-item-holder").append(htmlStr);
        },
        addSelectOptionForOrigin: function(originSelect, selectOptionElements) {
            originSelect.append(selectOptionElements);
        },
        changeFromOrigin: function(select, originSelect) {
            originSelect.change(function() {
                tmpSelect.feedSelectValue(select, originSelect);
            })
        },
        expand: function(select) {
            select.addClass("select-slide");
        },
        updateDisplayStyle: function(select, _options, originSelect) {
            var pluginSelectWidth = originSelect.width() == 0 ? _options.pluginSelectWidth : originSelect.outerWidth();
            var maxDisplayContainerWidth = _options.optionWidth || pluginSelectWidth;
            var tmpSelectOptionHeight = _options.slideOptionHeight;
            var totalOptionHeightWithoutScroll = (tmpSelectOptionHeight + 8) * select.find(".slide-item").length;
            var maxDisplayContainerHeight = Math.min(_options.slideMaxHeight, totalOptionHeightWithoutScroll);
            
            if (undefined == pluginSelectWidth || pluginSelectWidth <= 30 ||
                undefined == maxDisplayContainerWidth ||
                undefined == tmpSelectOptionHeight || undefined == totalOptionHeightWithoutScroll ||
                undefined == maxDisplayContainerHeight) {
                console.error("args error for init plugin-select");
            };
            select.width(pluginSelectWidth);
            select.find(".selected").width(pluginSelectWidth - 30);
            select.find(".slide").width(maxDisplayContainerWidth).height(maxDisplayContainerHeight);
            select.find(".slide-item").height(tmpSelectOptionHeight);
            select.find(".slide-item-holder").width(maxDisplayContainerWidth).height(totalOptionHeightWithoutScroll);
            select.css("position", originSelect.css("position"));
            select.css("left", originSelect.css("left"));
            select.css("top",originSelect.css("left"));
        },
        generateAddedOptionElements: function(addedOptions) {
            if (undefined == addedOptions) {
                return $("");
            };
            var optionPrefix = "<option>";
            var optionPostfix = "</option>";
            var htmlStr = "";
            for (var key in addedOptions) {
                htmlStr += optionPrefix + key + optionPostfix;
            };
            return $(htmlStr);
        },
        feedSelectValue: function(select, originSelect) {
            var selectedValue;
            if (originSelect.val()) {
                selectedValue = originSelect.find(":selected").html() || originSelect.val();
            } else {
                selectedValue = originSelect.find("option:first").html();
            };

            select.find(".selected span").html(selectedValue);
        },
        feedTemplate: function(select, originSelect, options) {
            select.toggleClass("select-disabled", options.disabled);
            tmpSelect.feedSelectValue(select, originSelect);
        },
        generatePluginConstructOption: function(options, originSelect) {
            var _options = $.extend(true, {}, $.fn.Select.defaults, options)
            var optionWidth = originSelect.attr("select-width");
            if (optionWidth) {
                _options.optionWidth = parseInt(optionWidth);
            };
            _options.disabled = originSelect.attr("disabled") == "disabled";
            return _options;
        },
        generateSelectId: function() {
            return tmpSelect.uniqueAttrValuePrefix + $.now() + Math.floor(Math.random() * 6);
        },
        onClick: function(select, e, originSelect) {
            var screenAvailableHeight = screen.availHeight;
            var selectPositionY = e.pageY;
            var slideContainer = select.find(".slide");
            if (screenAvailableHeight - selectPositionY < slideContainer.height()) {
                slideContainer.css({
                    "bottom": select.height(),
                    "top": ""
                });
            } else {
                slideContainer.css({
                    "top": select.height(),
                    "bottom": ""
                });
            };

            if (select.hasClass("select-slide")) {
                select.removeClass("select-slide");
            } else {
                $(".select-slide").removeClass("select-slide");
                select.addClass("select-slide");
            }

            originSelect.focus();

            e.stopPropagation();
        },
        onOptionClick: function(select, e, originSelect, selectedOption) {
            select.removeClass("select-slide");
            var value = selectedOption.attr("xvalue");
            var selectedText = selectedOption.text();
            select.find(".selected span").text(selectedText);
            originSelect.val(value);
            originSelect.change();
            e.stopPropagation();
        },
        addScrollbar: function(select) {
            select.find(".slide").Scrollbar({
                target: select.find(".slide .slide-item-holder")
            });
        }
    };

    $.fn.Select = function(options) {
        var originSelect = $(this);
        var _options = tmpSelect.generatePluginConstructOption(options, originSelect);
        
        var id = originSelect.attr(tmpSelect.uniqueAttrKey) || tmpSelect.generateSelectId();
        if ($("#" + id).length > 0) {
            $("#" + id).remove();
        };
        
        var select = $(tmpSelect.mainTemplate);

        select.attr("id", id);
        originSelect.attr(tmpSelect.uniqueAttrKey, id);
        
        var addedOptionElements = tmpSelect.generateAddedOptionElements(_options.addedOptions);
        tmpSelect.addSelectOptionForOrigin(originSelect, addedOptionElements);

        tmpSelect.feedTemplate(select, originSelect, _options);

        tmpSelect.addSelectOptionElements(select, originSelect.find("option"));

        tmpSelect.updateDisplayStyle(select, _options, originSelect);
        tmpSelect.addScrollbar(select);

        select.insertBefore(originSelect);

        select.on('click', function(e) {
            tmpSelect.onClick(select, e, originSelect);
        });

        $('.slide-item', select).on('click', function(e) {
            tmpSelect.onOptionClick(select, e, originSelect, $(this));
        });


        tmpSelect.changeFromOrigin(select, originSelect);
        originSelect.hide();
        tmpSelect.collapse(select);

    };

    $.fn.Select.defaults = {
        pluginSelectWidth           :       200,
        optionWidth                 :       null,
        slideMaxHeight              :       288,
        slideOptionHeight           :       25,
        hotKey                      :       false,
        disabled                    :       false 
    }
    
})(jQuery);

$("body").click(function() {
    $('div.select-slide').removeClass("select-slide");
});