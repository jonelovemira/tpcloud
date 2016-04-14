(function($) {
    "use strict";

    $.ipc = $.ipc || {};

    var devicePlayingState = {
        IDLE: 0,
        BEGIN_PLAY: 1,
        DEVICE_LOCAL_INFO_READY: 2
    };

    function PluginPlayer() {
        $.ipc.MyPlayer.call(this, arguments);
        this.volume = 0;

        this.recordCallback = null;
        this.snapshotCallback = null;
        this.timeupCallback = null;

        this.videoLoadingRenderFunc = null;
        this.pluginPlayerRender = null;
        this.updatePlayerObjView = null;
        this.showOffline = null;
        this.rubbishAjaxArr = [];

        this.state = devicePlayingState.IDLE;
        this.videoReadyCallback = $.Callbacks("unique stopOnFalse");
    };

    $.ipc.inheritPrototype(PluginPlayer, $.ipc.MyPlayer);

    PluginPlayer.prototype.triggerPlay = function() {
        if (this.playerObj) {
            this.state = devicePlayingState.BEGIN_PLAY;
            this.stateChangeCallback.fireWith(this);
            this.videoLoadingRenderFunc(this.device);
        };
    };

    PluginPlayer.prototype.initPluginPlayer = function(args) {
        args = args || {};
        this.recordCallback = args.recordCallback;
        this.snapshotCallback = args.snapshotCallback;
        this.timeupCallback = args.timeupCallback;
        this.videoLoadingRenderFunc = args.videoLoadingRenderFunc;
        this.pluginPlayerRender = args.pluginPlayerRender;
        this.updatePlayerObjView = args.updatePlayerObjView;
        this.showOffline = args.showOffline;

        var contextFunc = $.proxy(this.pluginPlayerStateChangeHandler, this);
        this.stateChangeCallback.add(contextFunc);

        this.videoReadyCallback.add(this.pluginPlayerRender);
        this.videoReadyCallback.add(this.updatePlayerObjView);
        var contextSetVolume = $.proxy(this.setVideoVolume, this);
        this.videoReadyCallback.add(contextSetVolume);
    };

    PluginPlayer.prototype.setVideoVolume = function() {
        if (this.playerObj && this.volume != undefined) {
            this.playerObj.SetAudioVolume(parseInt(this.volume));
        };
    };

    PluginPlayer.prototype.back2Idle = function() {
        this.state = devicePlayingState.IDLE;
        if (this.playerObj && $.ipc.Browser.prototype.type.indexOf("MSIE") >= 0) {
            this.playerObj.StopVideo();
            this.playerObj.StopAudio();
        };
        this.clearLastStepRubbish();
    };

    PluginPlayer.prototype.getDeviceLocalInfo = function() {
        var _self = this;
        var args = {
            appServerUrl: _self.device.appServerUrl,
            token: _self.device.owner.token,
            id: _self.device.id
        };

        var result = _self.device.getLocalInfo(args);
        if (result["validateResult"] != undefined && !result["validateResult"].code) {
            console.error(result["validateResult"].msg);
        };
        return result["ajaxObj"];
    };

    PluginPlayer.prototype.getLinkieAndLocal = function(currentTryIndex) {
        var _self = this;
        var currentTry = currentTryIndex || 0;
        if (currentTry >= 3) {
            _self.state = devicePlayingState.DEVICE_LOCAL_INFO_READY;
            _self.stateChangeCallback.fireWith(_self);
            return;
        }
        var getLocalInfoAjaxObj = _self.getDeviceLocalInfo();
        var getLinkieAjaxObj = _self.getDeviceLinkieData();
        _self.rubbishAjaxArr.push(getLocalInfoAjaxObj);
        _self.rubbishAjaxArr.push(getLinkieAjaxObj);
        var successFunc = function() {
            var product;
            try {
                var linkieData = _self.device.getLocalLinkieData();
                product = _self.device.getProductFromLinkieData(linkieData);
            } catch (err) {
                console.error(err);
            };
            if (product) {
                _self.device.updateProduct(product);
            };
            _self.state = devicePlayingState.DEVICE_LOCAL_INFO_READY;
            _self.stateChangeCallback.fireWith(_self);
        };
        var failFunc = function() {
            if (getLocalInfoAjaxObj.status != 200 && getLocalInfoAjaxObj.statusText != "abort") {
                _self.getLinkieAndLocal(currentTry)
            };
        };
        var alwaysFunc = function() {
            currentTry += 1;
        }
        _self.multiAsyncRequest({
            success: successFunc,
            fail: failFunc,
            ajaxArr: [getLocalInfoAjaxObj, getLinkieAjaxObj],
            always: alwaysFunc
        });
    };

    PluginPlayer.prototype.clearLastStepRubbish = function() {
        for (var i = 0; i < this.rubbishAjaxArr.length; i++) {
            this.rubbishAjaxArr[i] && this.rubbishAjaxArr[i].abort();
        };
        delete this.rubbishAjaxArr;
        this.rubbishAjaxArr = [];
    };

    PluginPlayer.prototype.pluginPlayerStateChangeHandler = function() {
        if (this.device.isActive == false) {
            this.back2Idle();
        } else {
            this.clearLastStepRubbish();
            var stateLogicMap = {};
            stateLogicMap[devicePlayingState.BEGIN_PLAY] = this.getLinkieAndLocal;
            stateLogicMap[devicePlayingState.DEVICE_LOCAL_INFO_READY] = this.play;

            var defaultFunc = function() {
                console.log("unkonw current state: " + currentState + ", back to idle");
                this.back2Idle();
            };
            var currentState = this.state;
            var contextFunc = $.proxy(stateLogicMap[currentState] || defaultFunc, this);
            contextFunc();
        }
    };

    PluginPlayer.prototype.setVolume = function(volume) {
        if (volume < 0 || volume > 100) {
            console.error("args error in setVolume");
        };
        this.volume = volume;
        this.setVideoVolume();
    };

    PluginPlayer.prototype.updateDeviceResAtVideoReady = function(resolutionStr) {
        var device = this.device;
        var supportVideoResArr = this.device.product.supportVideoResArr;
        for (var i = 0; i < supportVideoResArr.length; i++) {
            if (supportVideoResArr[i].name == resolutionStr) {
                device.currentVideoResolution = supportVideoResArr[i];
            }
        };
    };

    PluginPlayer.prototype.detectVideoReady = function() {
        var _self = this;
        var maxTryCount = 32;
        var currentTryIndex = 0;
        var interval = setInterval(function() {
            if (_self.playerObj.resolution) {
                clearInterval(interval);
                _self.updateDeviceResAtVideoReady(_self.playerObj.resolution);
                _self.videoReadyCallback.fire(_self.device);
            } else if (currentTryIndex == maxTryCount) {
                _self.showOffline();
                _self.back2Idle();
            }

            currentTryIndex += 1;
        }, 2000);
    };

    PluginPlayer.prototype.play = function() {
        this.feedPluginArgs();
        this.playerObj.SetAudioVolume(0);
        this.playerObj.PlayVideo();
        this.playerObj.PlayAudio();
        this.detectVideoReady();

        this.gatherStatics()
    };

    PluginPlayer.prototype.feedPluginArgs = function() {
        this.feedNormalPluginArgs();
        this.feedMyArgs();
    };

    PluginPlayer.prototype.feedNormalPluginArgs = function() {
        var _self = this;
        _self.device["auth_name"] && (_self.playerObj.username = _self.device["auth_name"]);
        _self.device["password"] && (_self.playerObj.password = _self.device["password"]);
        _self.playerObj.port = Number(_self.device["stream_port"]) || 8080;
        _self.device["iip"] && (_self.playerObj.ip = _self.device["iip"]);
        _self.device["web_port"] && (_self.playerObj.web_port = _self.device["web_port"]);
        _self.playerObj.cloud = true;
        _self.playerObj.recordcb = _self.recordCallback;
        _self.playerObj.snapshotcb = _self.snapshotCallback;
        _self.playerObj.devname = _self.device.name;
        _self.playerObj.timeout = 2;
        _self.playerObj.cldusr = _self.device.owner.account;
        _self.playerObj.cldtoken = _self.device.owner.token;
        _self.playerObj.clddns = _self.device.appServerUrl;
        _self.playerObj.cldmac = _self.device.mac;
        _self.playerObj.cldtime = 30;
        _self.playerObj.clddevid = _self.device.id;
        if ($.ipc.Browser.prototype.type.indexOf("MSIE") >= 0) {
            _self.playerObj.recordcbinvoke(_self.recordCallback);
            _self.playerObj.overtimecallback(_self.timeupCallback);
            _self.playerObj.SetCloudDevID(_self.device.id);
        } else {
            _self.playerObj.overtimecb = _self.timeupCallback;
        }
    };

    PluginPlayer.prototype.gatherStatics = function() {
        var statistics = new $.ipc.PluginStatistics();
        statistics.devID = this.device.id;
        statistics.devModel = this.device.model.substring(0, 5);
        statistics.firmwareVersion = this.device.fwVer;
        statistics.token = this.device.owner.token;
        statistics.send();
    };

    PluginPlayer.prototype.generateAjaxUrl = function(args) {
        if (undefined == args.appServerUrl || undefined == args.token) {
            console.error("args error in generateAjaxUrl");
        };
        return args.appServerUrl + "/?token=" + args.token;
    };


    function MjpegPluginPlayer() {
        PluginPlayer.call(this, arguments);
    };
    $.ipc.inheritPrototype(MjpegPluginPlayer, PluginPlayer);


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
        _self.makeAjaxRequest(args, $.xAjax.defaults.xType);
    };


    function H264PluginPlayer() {
        PluginPlayer.call(this, arguments);
    };
    $.ipc.inheritPrototype(H264PluginPlayer, PluginPlayer);

    H264PluginPlayer.prototype.feedMyArgs = function() {
        var _self = this;
        _self.playerObj.streamtype = _self.device.product.videoCodec.pluginStreamTypeCode;
        _self.playerObj.streamresolution = _self.device.currentVideoResolution.pluginStreamResCode;
        _self.playerObj.audiostreamtype = _self.device.product.audioCodec.pluginAudioTypeCode;
    };

    H264PluginPlayer.prototype.setResolution = function(val) {
        var code = this.device.currentVideoResolution.pluginStreamResCode;
        this.playerObj.ChangeStreamResolution(code);
    };


    $.ipc.PluginPlayer = PluginPlayer;
    $.ipc.H264PluginPlayer = H264PluginPlayer;
    $.ipc.MjpegPluginPlayer = MjpegPluginPlayer;
})(jQuery);