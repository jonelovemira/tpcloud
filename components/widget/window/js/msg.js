(function($){
    var Msg = {
        ID : 0,
        mainTemplate :  '<div >' + 
                            '<div class="window-msg-bg"></div>' +
                            '<div class="window-msg-holder">' + 
                                '<div class="window-msg-contain">' +
                                    '<div class="window-msg-head">' +
                                        '<span class="window-msg-head-title"></span>' +
                                    '</div>' +
                                    '<div class="window-msg-body">' +
                                        '<div class="window-msg-body-content">' +
                                        '</div>' +
                                    '</div>' +
                                    '<div class="window-msg-body-foot">' +
                                    '</div>' +
                                '</div>' +
                            '</div>' +
                        '</div>',
        closeIconTemplate : '<span class="window-msg-head-close"></span>',
        btnTemplate : '<input class="window-msg-btn" value="OK" type="button" />',
        close : function(msg){
            var context = msg.parent();
            $('body').unbind('keydown', Msg.hotClose);
            msg.remove();
            return context;
        },
        cancel : function(msg){
            var context = msg.parent();
            msg.option.cancel();
            return Msg.close(msg);
        },
        confirm : function(msg){
            var context = msg.parent();
            msg.option.confirm();
            return Msg.close(msg);
        },
        ok : function(msg){
            var context = msg.parent();
            msg.option.ok();
            return Msg.close(msg);
        },
        hotClose: function(event){
            if (event.keyCode == "27") {
                Msg.close(event.data.msg);
            };
        }

    };

    $.Msg = function(options){

        var _options = $.extend(true, {}, $.Msg.defaults, options);

        var id = "Msg-1";
        if ($("#" + id).length > 0) {
            $('#' + id).remove();
        }
        _options.id = id;
        

        var rHtml = Msg.mainTemplate;
        var msg = $(rHtml);

        //render id, title, info, button and size
        msg.attr("id", id);
        $('.window-msg-head-title', msg).text(_options.title);
        $('.window-msg-body-content', msg).text(_options.info); 
        
        switch(_options.type)
        {
            case "alert":
                $('.window-msg-body-foot', msg).append(Msg.btnTemplate);
                $('.window-msg-btn:first', msg).attr("value", _options.btnOk);
                $('.window-msg-btn:first', msg).attr("for", "ok");
            break;

            case "confirm":
                $('.window-msg-body-foot', msg).append(Msg.btnTemplate);
                $('.window-msg-body-foot', msg).append(Msg.btnTemplate);
                $('.window-msg-btn:first', msg).attr("value", _options.btnCancel);
                $('.window-msg-btn:first', msg).attr("for", "cancel");
                $('.window-msg-btn:last', msg).attr("value", _options.btnConfirm);
                $('.window-msg-btn:last', msg).attr("for", "confirm");
            break;

            case "info":
            break;

            default:
                $('.window-msg-body-foot', msg).append(Msg.btnTemplate);
                $('.window-msg-btn:first', msg).attr("value", _options.btnOk);
                $('.window-msg-btn:first', msg).attr("for", "ok");
            break;
        }

        $('.window-msg-contain', msg).css({
            "width": _options.width,
            "height": _options.height
        });

        if (_options.closeIcon) {
            $('.window-msg-head', msg).append(Msg.closeIconTemplate);
        };

        _options.beforeInit();

        try {
            msg.appendTo('body');
        } catch(e)
        {
            console.log(e);
            console.log('can not append msg to body');
            return false;
        }

        msg.option = _options;

        // add object functions. so we can dynamic call these functions.
        msg.close = function(){
            Msg.close(msg);
        };

        msg.cancel = function(){
            Msg.cancel(msg);
        }

        msg.confirm = function(){
            Msg.confirm(msg);
        }

        msg.ok = function()
        {
            Msg.ok(msg);
        }

        $('.window-msg-btn', msg).on('click', function(e){
            e.preventDefault();
            var type = $(this).attr("for");
            Msg[type](msg); 
        });

        $('.window-msg-head-close', msg).on('click', function(e){
            e.preventDefault();
            Msg.close(msg);
        });

        if (msg.option.hotKey) {
            $('body').bind('keydown', {msg: msg}, Msg.hotClose);
        };

        return msg;
    };

    // make default options writable outside
    $.Msg.defaults = {
        type        :       "alert",
        title       :       "",
        info        :       "",
        html        :       "",
        btnConfirm  :       "Confirm",
        btnCancel   :       "Cancel",
        btnOk       :       "OK",
        width       :       400,
        height      :       260,
        hotKey      :       true,
        closeIcon   :       true,
        cancel      :       function() {},
        ok          :       function() {},
        confirm     :       function() {},
        beforeInit  :       function() {},
    };
})(jQuery);