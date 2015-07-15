(function($){
    var Msg = {
        ID : 0,
        mainTemplate :  '<div >' + 
                        '<div class="seven-windows-holder"></div>' +
                        '<div class="seven-windows-position">' + 
                            '<div class="seven-windows-contain">' +
                                '<span class="seven-windows-head">' +
                                    '<span class="seven-windows-head-title"></span>' +
                                    '<span class="seven-windows-head-close"></span>' +
                                '</span>' +
                                '<span class="seven-windows-body">' +
                                    '<span class="seven-windows-body-contain">' +
                                        '<span class="seven-windows-body-contain-font"></span>' +
                                    '</span>' +
                                '</span>' +
                                '<span class="seven-windows-body-foot">' +
                                    '<span class="seven-windows-body-foot-contain"></span>' +
                                '</span>' +
                            '</div>' +
                        '</div>' +
                    '</div>',
        btnTemplate : '<input class="seven-windows-button seven-windows-alert-button" value="OK" type="button" />',
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
        $('.seven-windows-head-title', msg).text(_options.title);
        $('.seven-windows-body-contain-font', msg).text(_options.info); 
        
        switch(_options.type)
        {
            case "alert":
                $('.seven-windows-body-foot-contain', msg).append(Msg.btnTemplate);
                $('.seven-windows-alert-button:first', msg).attr("value", _options.btnOk);
                $('.seven-windows-alert-button:first', msg).attr("for", "ok");
            break;

            case "confirm":
                $('.seven-windows-body-foot-contain', msg).append(Msg.btnTemplate);
                $('.seven-windows-body-foot-contain', msg).append(Msg.btnTemplate);
                $('.seven-windows-alert-button:first', msg).attr("value", _options.btnCancel);
                $('.seven-windows-alert-button:first', msg).attr("for", "cancel");
                $('.seven-windows-alert-button:last', msg).attr("value", _options.btnConfirm);
                $('.seven-windows-alert-button:last', msg).attr("for", "confirm");
            break;

            default:
                $('.seven-windows-body-foot-contain', msg).append(Msg.btnTemplate);
                $('.seven-windows-alert-button:first', msg).attr("value", _options.btnOk);
            break;
        }

        $('.seven-windows-contain', msg).css({
            "width": _options.width,
            "height": _options.height
        });

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

        // add object functions. so we can dynamic call this functions.
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

        $('.seven-windows-alert-button', msg).on('click', function(e){
            e.preventDefault();
            var type = $(this).attr("for");
            Msg[type](msg); 
        });

        $('.seven-windows-head-close', msg).on('click', function(e){
            e.preventDefault();
            Msg.close(msg);
        });

        $('body').bind('keydown', {msg: msg}, Msg.hotClose);

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
        cancel      :       function() {},
        ok          :       function() {},
        confirm     :       function() {},
        beforeInit  :       function() {},
    };
})(jQuery);