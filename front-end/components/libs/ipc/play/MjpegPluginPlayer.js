define(["PluginPlayer", "inheritPrototype", "jquery"], 
    function (PluginPlayer, inheritPrototype, $) {
    function MjpegPluginPlayer() {
        PluginPlayer.call(this, arguments);
    };
    inheritPrototype(MjpegPluginPlayer, PluginPlayer);


    MjpegPluginPlayer.prototype.feedMyArgs = function() {};

    MjpegPluginPlayer.prototype.setResolution = function(val) {
        var _self = this;
        var width = null;
        var height = null;
        if (_self.device.currentVideoResolution.pluginPlayerObjCss) {
            width = _self.device.currentVideoResolution.pluginPlayerObjCss.css.width;
            height = _self.device.currentVideoResolution.pluginPlayerObjCss.css.height;
        } else {
            width = _self.device.currentVideoResolution.playerContainerCss.player.width;
            height = _self.device.currentVideoResolution.playerContainerCss.player.height;
        };
        var data = JSON.stringify({
            "method": "passthrough",
            "params": {
                "requestData": {
                    "command": "SET_RESOLUTION",
                    "content": {
                        "width": width,
                        "height": height
                    }
                },
                "deviceId": _self.device.id
            }
        });

        var changeStateFunc = function(response) {
            this.playerObj.PlayVideo();
            this.playerObj.PlayAudio();
        };
        var callbacks = {
            "errorCodeCallbackMap": {
                "-1": $.proxy(changeStateFunc, _self)
            },
            "errorCallback": $.proxy(changeStateFunc, _self)
        };

        var args = {
            url: _self.generateAjaxUrl({
                appServerUrl: _self.device.appServerUrl,
                token: _self.device.owner.token,
            }),
            data: data,
            callbacks: callbacks,
            changeState: changeStateFunc
        };
        _self.makeAjaxRequest(args, "xDomain");
    };

    return MjpegPluginPlayer;
})