define(["devicePlayingState", "Player", "jquery", "inheritPrototype", "browser", "PluginPlayerStatistics"], 
    function (devicePlayingState, Player, $, inheritPrototype, browser, PluginPlayerStatistics) {
    function PluginPlayer() {
        Player.call(this, arguments);
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

    inheritPrototype(PluginPlayer, Player);

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
        if (this.playerObj && browser.type.indexOf("MSIE") >= 0) {
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
            var liveStreamConf;
            try {
                var linkieData = _self.device.getLocalLinkieData();
                liveStreamConf = _self.device.getLiveStreamConfFromLinkieData(linkieData);
            } catch (err) {
                console.error(err);
            };
            if (liveStreamConf) {
                _self.device.updateProductLiveStreamConf(liveStreamConf);
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
        var supportVideoResArr = this.device.product.liveStreamConf.supportVideoResArr;
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
        if (browser.type.indexOf("MSIE") >= 0) {
            _self.playerObj.recordcbinvoke(_self.recordCallback);
            _self.playerObj.overtimecallback(_self.timeupCallback);
            _self.playerObj.SetCloudDevID(_self.device.id);
        } else {
            _self.playerObj.overtimecb = _self.timeupCallback;
        }
    };

    PluginPlayer.prototype.gatherStatics = function() {
        var statistics = new PluginPlayerStatistics();
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

    return PluginPlayer;
})