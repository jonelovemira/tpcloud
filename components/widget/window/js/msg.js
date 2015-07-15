(function($){
    var IpcMsg = {
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
            $('body').unbind('keydown', IpcMsg.hotClose);
            msg.remove();
            return context;
        },
        cancel : function(msg){
            var context = msg.parent();
            msg.option.cancel();
            return IpcMsg.close(msg);
        },
        confirm : function(msg){
            var context = msg.parent();
            msg.option.confirm();
            return IpcMsg.close(msg);
        },
        ok : function(msg){
            var context = msg.parent();
            msg.option.ok();
            return IpcMsg.close(msg);
        },
        hotClose: function(event){
            if (event.keyCode == "27") {
                IpcMsg.close(event.data.msg);
            };
        }

    };

    $.IpcMsg = function(options){

        var _options = $.extend(true, {}, $.IpcMsg.defaults, options);

        var id = "IpcMsg-1";
        if ($("#" + id).length > 0) {
            $('#' + id).remove();
        }
        _options.id = id;
        

        var rHtml = IpcMsg.mainTemplate;
        var ipcMsg = $(rHtml);

        //render id, title, info, button and size
        ipcMsg.attr("id", id);
        $('.seven-windows-head-title', ipcMsg).text(_options.title);
        $('.seven-windows-body-contain-font', ipcMsg).text(_options.info); 
        
        switch(_options.type)
        {
            case "alert":
                $('.seven-windows-body-foot-contain', ipcMsg).append(IpcMsg.btnTemplate);
                $('.seven-windows-alert-button:first', ipcMsg).attr("value", _options.btnOk);
                $('.seven-windows-alert-button:first', ipcMsg).attr("for", "ok");
            break;

            case "confirm":
                $('.seven-windows-body-foot-contain', ipcMsg).append(IpcMsg.btnTemplate);
                $('.seven-windows-body-foot-contain', ipcMsg).append(IpcMsg.btnTemplate);
                $('.seven-windows-alert-button:first', ipcMsg).attr("value", _options.btnCancel);
                $('.seven-windows-alert-button:first', ipcMsg).attr("for", "cancel");
                $('.seven-windows-alert-button:last', ipcMsg).attr("value", _options.btnConfirm);
                $('.seven-windows-alert-button:last', ipcMsg).attr("for", "confirm");
            break;

            default:
                $('.seven-windows-body-foot-contain', ipcMsg).append(IpcMsg.btnTemplate);
                $('.seven-windows-alert-button:first', ipcMsg).attr("value", _options.btnOk);
            break;
        }

        $('.seven-windows-contain', ipcMsg).css({
            "width": _options.width,
            "height": _options.height
        });

        _options.beforeInit();

        try {
            ipcMsg.appendTo('body');
        } catch(e)
        {
            console.log(e);
            console.log('can not append msg to body');
            return false;
        }

        ipcMsg.option = _options;

        // add object functions. so we can dynamic call this functions.
        ipcMsg.close = function(){
            IpcMsg.close(ipcMsg);
        };

        ipcMsg.cancel = function(){
            IpcMsg.cancel(ipcMsg);
        }

        ipcMsg.confirm = function(){
            IpcMsg.confirm(ipcMsg);
        }

        ipcMsg.ok = function()
        {
            IpcMsg.ok(ipcMsg);
        }

        $('.seven-windows-alert-button', ipcMsg).on('click', function(e){
            e.preventDefault();
            var type = $(this).attr("for");
            IpcMsg[type](ipcMsg); 
        });

        $('.seven-windows-head-close', ipcMsg).on('click', function(e){
            e.preventDefault();
            IpcMsg.close(ipcMsg);
        });

        $('body').bind('keydown', {msg: ipcMsg}, IpcMsg.hotClose);

        return ipcMsg;
    };

    // make default options writable outside
    $.IpcMsg.defaults = {
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