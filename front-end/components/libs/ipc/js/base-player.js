(function($) {
    "use strict";

    $.ipc = $.ipc || {};

    function MyPlayer() {
        $.ipc.Model.call(this, arguments);
        this.device = null;
        this.playerObj = null;
        this.stateChangeCallback = $.Callbacks("unique stopOnFalse");
    };

    $.ipc.inheritPrototype(MyPlayer, $.ipc.Model);

    MyPlayer.prototype.multiAsyncRequest = function(args) {
        $.when.apply($, args.ajaxArr).always(args.always).done(args.success).fail(args.fail);
    };

    MyPlayer.prototype.getDeviceLinkieData = function(callbacks) {
        var _self = this;
        var device = _self.device;
        if (device && device.owner.token && device.appServerUrl) {
            if (device.isNeedGetLinkie()) {
                var result = device.getLinkie({
                    "id": device.id,
                    "token": device.owner.token,
                    "appServerUrl": device.appServerUrl
                }, callbacks)["ajaxObj"];
                return result;
            };
        };
    };

    $.ipc.MyPlayer = MyPlayer;

})(jQuery);