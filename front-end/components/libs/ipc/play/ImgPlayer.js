define(["NonPluginPlayer", "inheritPrototype", "jquery", "stopReasonCodeMap", "Cookies"], 
    function (NonPluginPlayer, inheritPrototype, $, stopReasonCodeMap, Cookies) {
    function ImgPlayer() {
        NonPluginPlayer.call(this, arguments);

        this.audioPlayerElementId = null;

        this.protocol = "http://";
        this.port = 80;
        this.idleLink = "//:0";
    };
    inheritPrototype(ImgPlayer, NonPluginPlayer);

    ImgPlayer.prototype.initPlayer = function() {
        this.stateChangeCallback.empty();
        var contextFunc = $.proxy(this.stateChangeHandler, this);
        this.stateChangeCallback.add(contextFunc);
    };

    ImgPlayer.prototype.preparePlay = function() {
        this.killAllRelayClient();
        this.getUrlAndLinkie();
    };

    ImgPlayer.prototype.stateChangeHandler = function() {
        if (this.device.isActive == false) {
            this.back2Idle(stopReasonCodeMap.UNKNOWN_ERROR);
        } else {
            this.clearLastStepRubbish();
            var stateLogicMap = {};
            stateLogicMap[devicePlayingState.BEGIN_PLAY] = this.preparePlay;
            stateLogicMap[devicePlayingState.RELAY_URL_READY] = this.requestRelayService;
            stateLogicMap[devicePlayingState.REQUEST_RELAY_SERVICE_SUCCESS] = this.isRelayReady;
            stateLogicMap[devicePlayingState.RELAY_READY] = this.play;
            stateLogicMap[devicePlayingState.NETWORK_ERROR] = this.networkErrorRetry;
            stateLogicMap[devicePlayingState.NEED_RELAY_READY_FAILED_TRY] = this.relayReadyFailedRetryRelayService;
            var defaultFunc = function() {
                console.log("unkonw current state: " + currentState + ", back to idle");
                this.back2Idle(stopReasonCodeMap.UNKNOWN_ERROR);
            };
            var currentState = this.state;
            var contextFunc = $.proxy(stateLogicMap[currentState] || defaultFunc, this);
            contextFunc();
        }
    };

    ImgPlayer.prototype.getResourcePath = function(first_argument) {
        var _self = this;
        var videoUrl = _self.protocol + _self.device.relayUrl + ":" + _self.port + "/relayservice?" + $.param({
            deviceid: _self.device.id,
            type: "video",
            resolution: _self.device.currentVideoResolution.name,
            "X-token": _self.device.owner.token
        });
        var audioUrl = _self.protocol + _self.device.relayUrl + ":" + _self.port + "/relayservice?" + $.param({
            deviceid: _self.device.id,
            type: "audio",
            resolution: _self.device.product.audioCodec.name,
            "X-token": _self.device.owner.token
        });
        return {
            videoUrl: videoUrl,
            audioUrl: audioUrl
        };
    };

    ImgPlayer.prototype.setupPlayer = function(playArgs) {
        var _self = this;

        $("#" + _self.playerElementId).off();
        var width = _self.device.currentVideoResolution.playerContainerCss.player.width;
        var height = _self.device.currentVideoResolution.playerContainerCss.player.height;
        $("#" + _self.playerElementId).width(width).height(height);
        $("#" + _self.playerElementId).attr("src", playArgs.resourcePath.videoUrl);
        $("#" + _self.playerElementId).on('load', function() {
            _self.timer && _self.timer.start();
            _self.statistics && Object.prototype.toString.call(_self.statistics.stopReason) === '[object Array]' && _self.statistics.success.push(_self.statistics.SUCCESS);
            _self.playerRenderFunc(_self.device);
        }).on('error', function() {
            if ($("#" + _self.playerElementId).attr("src") != _self.idleLink) {
                _self.changeStateTo(devicePlayingState.NETWORK_ERROR);
            };
        });

    };

    ImgPlayer.prototype.updateStatisticsType = function() {
        this.statistics && (this.statistics.type = "image");
    };

    ImgPlayer.prototype.killGetImgClient = function(args) {
        var _self = this;
        var data = {
            "REQUEST": 'RTMPOPERATE',
            "DATA": {
                "relayUrl": _self.device.relayUrl,
                "Xtoken": _self.device.owner.token,
                "devId": _self.device.id,
                "data": {
                    "service": "killclient",
                    "command": {
                        "X-Client-Id": args.relaySessionId
                    }
                },
                "token": _self.device.owner.token,
                "AWSELB": args.ELBcookie
            }
        };

        var extendAjaxOptions = {
            contentType: "application/x-www-form-urlencoded;charset=utf-8"
        };

        var urlPrefix = _self.device.BACK_END_WEB_PROTOCAL + _self.device.webServerUrl;

        var requestArgs = {
            url: urlPrefix + "/init3.php",
            data: data,
            callbacks: undefined,
            changeState: $.noop,
            extendAjaxOptions: extendAjaxOptions
        };

        _self.makeAjaxRequest(requestArgs, "xDomain");
    };

    ImgPlayer.prototype.killAllRelayClient = function() {
        var _self = this;
        for (var key in Cookies.get()) {
            if (key.indexOf("X-Client-Id") >= 0) {
                var args = {
                    relaySessionId: Cookies.get(key),
                    ELBcookie: _self.device.ELBcookie
                }
                _self.killGetImgClient(args);
                Cookies.remove(key);
            };
        }
    };

    ImgPlayer.prototype.clearPlayerElementRubbish = function() {
        var _self = this;
        $("#" + _self.playerElementId).attr("src", _self.idleLink);
        _self.killAllRelayClient();
    };

    return ImgPlayer;
})