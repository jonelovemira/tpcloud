define(["Model", "jquery", "inheritPrototype", "Device", "User"], function (Model, $, inheritPrototype, Device, User) {
    "use strict";

    function Player() {
        Model.call(this, arguments);
        this.device = null;
        this.playerObj = null;
        this.stateChangeCallback = $.Callbacks("unique stopOnFalse");
    };

    inheritPrototype(Player, Model);

    Player.prototype.multiAsyncRequest = function(args) {
        $.when.apply($, args.ajaxArr).always(args.always).done(args.success).fail(args.fail);
    };

    Player.prototype.getDeviceLinkieData = function(callbacks) {
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

    return Player;
});