(function($){

    function addScrollbar(obj){
        obj.find(".slide").Scrollbar({
            target: obj.find(".slide .slide-item-holder")
        });
    };

    function optionHtml($tmpSelectOptions)
    {
        var htmlStr = "";
        $tmpSelectOptions.each(function(i) {
            if ($(this).css("display") != "none") {
                htmlStr += " <div class='slide-item' xvalue='" + $(this).attr("value") + "' class='forOption'><span lang=\"en\">" + $(this).html() + "</span></div>";
            }
        });
        return htmlStr;
    };

    $.fn.Select = function(options){

        if( $(this).siblings(".plugin-select").first().length > 0 ) {
            
            if (options.addedOptions) {
                var addedOptionsLength = 0;
                for (var key in options.addedOptions) {
                    addedOptionsLength += 1;
                };

                var _options = $.extend(true, {}, $.fn.Select.defaults, options);
                var selectPlugin = $(this).siblings(".plugin-select").first();
                var slideRealHeight = selectPlugin.find(".slide-item").first().outerHeight();
                var slideContainerHeight = Math.min(_options.slideMaxHeight, (slideRealHeight) * (addedOptionsLength + $(this).find("option").length))


                var optionElements = options.addedOptions;
                var originOptiontags = getOriginOptionTags(optionElements);
                var htmlStr = optionHtml($(originOptiontags));
                selectPlugin.find(".slide .slide-item-holder").append(htmlStr);
                selectPlugin.find(".slide").height(slideContainerHeight);
                addScrollbar(selectPlugin);
                $(this).append(originOptiontags);
            };
            return selectPlugin;
        }

        var _options = $.extend(true, {}, $.fn.Select.defaults, options);
        var $select = $(this);

        // some attributes can only retrieved after it show up.
        $select.show();

        var optionWidth = $select.attr("select-width");
        if (optionWidth != undefined) {
            _options.optionWidth = parseInt(optionWidth);
        };

        // preserve original select informations.
        var name = $(this).attr("id") || "";

        var $selectOptions = $select.find("option");
        var width = $select.width() == 0 ? _options.width : ($select.outerWidth()),
            slideWidth = _options.optionWidth == null ? width : _options.optionWidth,
            slideHeight = Math.min(_options.slideMaxHeight, (_options.slideOptionHeight + 8) * $selectOptions.length);
        var disabled = $select.attr("disabled");

        // corresponding hide
        $select.hide();

        // save option selected or first.
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

        

        a += optionHtml($selectOptions);

        

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
        function bindItemClickCallback(){
            $widgetSelect.find(".slide").find(".slide-item").bind({
                click: function(e) {
                    optionSelected(this);
                    e.stopPropagation();
                }
            });
        }

        bindItemClickCallback();
        

        //css styles update
        function updateStyle(tmpSelectWidth, tmpSlideWidth, tmpSlideHeight, tmpOptionHeight, $tmpSelectOptions)
        {
            $widgetSelect.width(tmpSelectWidth);
            $widgetSelect.find(".selected").width(tmpSelectWidth - 30);
            $widgetSelect.find(".slide").width(tmpSlideWidth).height(tmpSlideHeight);
            $widgetSelect.find(".slide-item").height(tmpOptionHeight);
            // $widgetSelect.find(".slide-item").css({
            //     "font-size": tmpOptionHeight - 11,
            // })
            $widgetSelect.find(".slide-item-holder").width(tmpSlideWidth).attr({
                height: (tmpOptionHeight + 8) * $tmpSelectOptions.length
            }); //.height(15*$selectOptions.length);
        }

        updateStyle(width, slideWidth, slideHeight, _options.slideOptionHeight, $selectOptions);


        // add scrollbar
        
        addScrollbar($widgetSelect);
        

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


        $widgetSelect.update = function (){
            $select.show();
            $select.removeClass("select");
            var optionWidth = $select.width() + 10;
            $select.addClass("select");
            var $selectOptions = $select.find("option");
            var width = $select.width() == 0 ? _options.width : ($select.outerWidth()),
                slideWidth = optionWidth == null ? width : Math.max(optionWidth + 10, width),
                slideHeight = Math.min(_options.slideMaxHeight, (_options.slideOptionHeight + 8) * $selectOptions.length);
            $select.hide();
            $widgetSelect.find(".slide-item-holder").empty();
            $widgetSelect.find(".slide-item-holder").append(optionHtml($selectOptions));
            updateStyle(width, slideWidth, slideHeight, _options.slideOptionHeight, $selectOptions);
            bindItemClickCallback();
            addScrollbar();
        }

        $widgetSelect.originalSelect = $select;
        return $widgetSelect;
    };

    function getOriginOptionTags(optionElements) {
        if (undefined == optionElements) {
            return "";
        };
        var optionPrefix = "<option lang=\"en\">";
        var optionPostfix = "</option>";
        var htmlStr = "";
        for (var key in optionElements) {
            htmlStr += optionPrefix + key + optionPostfix;
        };
        return htmlStr;
    };

    $.fn.Select.defaults = {
        width: 200,
        slideMaxHeight: 288,
        slideOptionHeight: 25
    }

    $(function(){
        // $('select.select').each(function(){
        //     var ref = $(this).Select({});
        //     $(this)[0]["widgetRef"] = ref;
        // });
    })
})(jQuery)

// collapse all expanded widget select
$("body").click(function() {
    $('div.select-slide').removeClass("select-slide");
});