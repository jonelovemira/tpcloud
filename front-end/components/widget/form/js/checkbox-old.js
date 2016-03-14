(function($) {

    $.fn.Checkbox = function() {
        var $check = $(this);
        $check.show();
        var id = $(this).attr("id") || "",
            name = $(this).attr("name") || "";

        var checked = $(this).attr("checked"),
            disabled = $(this).attr("disabled");

        var style;
        if (checked == "checked") {
            if (disabled == "disabled") {
                style = "checkbox-checked-disabled";
            } else {
                style = "checkbox-checked";
            }
        } else {
            if (disabled == "disabled") {
                style = "checkbox-disabled";
            } else {
                style = "";
            }
        }
        $check.hide();

        var tabIndex = $check.attr("tabindex");
        var tabIndexStr = "";
        if (tabIndex) {
            tabIndexStr += "tabindex=\"" + tabIndex + "\"";
        };

        var innerHtml = "<div class=\"checkbox " + style + "\" name=\"" + name + "\" " + tabIndexStr + "></div>";
        var $checkboxDiv = $(innerHtml);

        $(this).after($checkboxDiv);


        $checkboxDiv.bind({
            click: function(e) {

                if ($check.attr("disabled") == "disabled") {
                    return;
                }
                // this.previousSibling.click(); //运用jquery中对象获取(例如$("this"))，进行click()事件时会出现checked属性相反
                $check.click(); //具体验证可以获取checkbox本身checked属性进行，鼠标点击和用jquery对象的click()事件触发时，checked的值显而易见的不同。
                //此处应使用原生JS对象进行click()事件调用。
            },
            keydown: function(e) {
                if ($check.attr("disabled") == "disabled") {
                    return;
                };
                var tmpEvent = $.Event("keydown");
                tmpEvent.keyCode = e.which;
                // this.previousSibling.click(); //运用jquery中对象获取(例如$("this"))，进行click()事件时会出现checked属性相反
                $check.trigger(tmpEvent);
                e.originalEvent.cancelBubble = true;
                e.originalEvent.returnValue = false;
                e.originalEvent.preventDefault()
                e.originalEvent.stopPropagation();
            }
        });

        if (id != "") {
            $("[for=" + id + "]").bind({
                click: function() {
                    if ($check.attr("disabled") == "disabled") {
                        return;
                    }

                    if ($checkboxDiv.hasClass("checkbox-checked")) {

                        $checkboxDiv.removeClass("checkbox-checked");
                    } else {
                        $checkboxDiv.addClass("checkbox-checked");
                    }

                    $check.click();
                }
            }).removeAttr("for");
        };
        $check.change(function() { //将原checkbox的状态同时也返回到自定义层上
            if ($(this).attr("checked")) {
                $checkboxDiv.addClass("checkbox-checked");
            } else {
                $checkboxDiv.removeClass("checkbox-checked");
            }
        });
    }

    $(function() {
        $(".checkbox").each(function() {
            $(this).Checkbox();
        });
    });



})(jQuery)