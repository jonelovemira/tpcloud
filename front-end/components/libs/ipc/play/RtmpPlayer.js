define(["NonPluginPlayer", "inheritPrototype", "devicePlayingState", "jwplayer", "stopReasonCodeMap", "jquery"], 
    function (NonPluginPlayer, inheritPrototype, devicePlayingState, jwplayer, stopReasonCodeMap, $) {
    function RtmpPlayer() {
        NonPluginPlayer.call(this, arguments);

        this.protocol = "rtmps://";
        this.port = 443;
        this.resourceAppName = "RtmpRelay";

        this.curResFailedRtryReqRlySrvCnt = 0;
        this.maxResFailedRtryReqRlySrvCnt = 3;
    };
    inheritPrototype(RtmpPlayer, NonPluginPlayer);

    RtmpPlayer.prototype.getAuthArgs = function() {
        var result = null;
        var _self = this;
        var args = {
            devId: _self.device.id,
            token: _self.device.owner.token
        };
        result = $.param(args);
        return result;
    };

    RtmpPlayer.prototype.residFailedRetryRelayService = function() {
        this.curResFailedRtryReqRlySrvCnt += 1;
        if (this.curResFailedRtryReqRlySrvCnt <= this.maxResFailedRtryReqRlySrvCnt) {
            this.changeStateTo(devicePlayingState.RELAY_URL_READY);
        } else {
            this.changeStateTo(devicePlayingState.NETWORK_ERROR);
        }
    };

    RtmpPlayer.prototype.getResourcePath = function() {
        var _self = this;
        var resourceArgs = _self.getAuthArgs();
        var str = "";
        str += _self.protocol + _self.device.relayUrl + ":" +
            _self.port + "/" + _self.resourceAppName + "/?" +
            resourceArgs + "flv:" + _self.device.resId;
        return str;
    };

    RtmpPlayer.prototype.setupPlayer = function(args) {
        var _self = this;
        _self.playerRenderFunc(_self.device);

        if (_self.playerObj) {
            _self.playerObj.remove();
        };

        var width = _self.device.currentVideoResolution.playerContainerCss.player.width;
        var height = _self.device.currentVideoResolution.playerContainerCss.player.height;

        var options = {
            width: width,
            height: height,
            playlist: [{
                sources: [{
                    file: args.resourcePath
                }]
            }],
            rtmp: {
                bufferlength: 0.1
            },
            displaytitle: false,
            mute: false,
            ph: 1,
            primary: "flash",
            repeat: false,
            stagevideo: false,
            stretching: "exactfit",
            responsive: true,
            skin: {
                name: "ipc-jwplayer-skin"
            }
        };

        var newPlayer = jwplayer(_self.playerElementId);
        newPlayer.setup(options);
        _self.playerObj = newPlayer;


        newPlayer.on('ready', function() {
            console.log("player ready");
        });

        newPlayer.on('setupError', function(e) {
            _self.playerObjErrorCallbacks.fire(e);
        });

        newPlayer.on('play', function() {
            _self.statistics && Object.prototype.toString.call(_self.statistics.stopReason) === '[object Array]' && _self.statistics.success.push(_self.statistics.SUCCESS);
            _self.hideCoverFunc();
        })

        newPlayer.on('playlist', function() {
            newPlayer.play();
        });

        newPlayer.on('idle', function() {
            _self.statistics && Object.prototype.toString.call(_self.statistics.stopReason) === '[object Array]' && _self.statistics.stopReason.push(stopReasonCodeMap.UNKNOWN_ERROR);
        });

        newPlayer.on('pause', function() {
            _self.statistics && Object.prototype.toString.call(_self.statistics.stopReason) === '[object Array]' && _self.statistics.stopReason.push(stopReasonCodeMap.USER_STOPPED_VIDEO);
        });

        newPlayer.on('buffer', function() {
            console.log("buffer");
        });

        newPlayer.on('bufferChange', function() {
            console.log("bufferChange");
        });

        newPlayer.on('complete', function() {
            if (_self.timer.currentTime >= _self.timer.timeout - _self.timer.networkFactorDelta) {
                _self.timer.currentTime == _self.timer.timeout;
            } else {
                _self.playerObjErrorCallbacks.fire();
            }
        });
        newPlayer.on('error', function() {
            _self.playerObjErrorCallbacks.fire();
        });

        _self.state = devicePlayingState.PLAYING;
    };

    RtmpPlayer.prototype.fireNetworkError = function() {
        this.changeStateTo(devicePlayingState.NETWORK_ERROR);
    };

    RtmpPlayer.prototype.initPlayer = function() {
        var _self = this;
        _self.stateChangeCallback.empty();
        var contextFunc = $.proxy(_self.stateChangeHandler, _self);
        _self.stateChangeCallback.add(contextFunc);

        var contextFireNetErr = $.proxy(_self.fireNetworkError, _self);
        _self.playerObjErrorCallbacks.add(contextFireNetErr);
    };

    RtmpPlayer.prototype.updateStatisticsType = function() {
        this.statistics && (this.statistics.type = "rtmp");
    };

    RtmpPlayer.prototype.stateChangeHandler = function() {
        if (this.device.isActive == false) {
            this.back2Idle(stopReasonCodeMap.UNKNOWN_ERROR);
        } else {
            this.clearLastStepRubbish();
            var stateLogicMap = {};
            stateLogicMap[devicePlayingState.BEGIN_PLAY] = this.preparePlay;
            stateLogicMap[devicePlayingState.RELAY_URL_READY] = this.requestRelayService;
            stateLogicMap[devicePlayingState.REQUEST_RELAY_SERVICE_SUCCESS] = this.isRelayReady;
            stateLogicMap[devicePlayingState.RELAY_READY] = this.queryResid;
            stateLogicMap[devicePlayingState.RESOURCE_READY] = this.play;
            stateLogicMap[devicePlayingState.NETWORK_ERROR] = this.networkErrorRetry;
            stateLogicMap[devicePlayingState.NEED_RES_FAILED_RETRY] = this.residFailedRetryRelayService;
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

    RtmpPlayer.prototype.preparePlay = function() {
        this.luckyTryForResId();
        this.getUrlAndLinkie();
    };

    RtmpPlayer.prototype.luckyTryForResId = function() {
        var _self = this;
        if (_self.device.relayUrl && _self.device.ELBcookie) {
            var requestArgs = _self.generateQueryResidArgs({
                ELBcookie: _self.device.ELBcookie,
                relayUrl: _self.device.relayUrl
            });
            var currentCount = 1;
            var errorCallback = function() {
                if (currentCount < 3) {
                    currentCount += 1;
                    _self.makeAjaxRequest(requestArgs, "xDomain");
                };
            };

            var extendRequestArgs = {
                callbacks: {
                    "errorCodeCallbackMap": {
                        "-1": errorCallback
                    },
                    "errorCallback": errorCallback
                }
            }
            requestArgs = $.extend(true, requestArgs, extendRequestArgs);
            _self.makeAjaxRequest(requestArgs, "xDomain");
        };
    };

    RtmpPlayer.prototype.generateQueryResidArgs = function(args) {
        if (args.relayUrl && args.ELBcookie) {
            var _self = this;
            var data = {
                "REQUEST": 'RTMPOPERATE',
                "DATA": {
                    "relayUrl": args.relayUrl,
                    "Xtoken": _self.device.owner.token,
                    "devId": _self.device.id,
                    "data": {
                        "service": "getrtmp",
                        "command": {
                            "resolution": _self.device.currentVideoResolution.name
                        }
                    },
                    "token": _self.device.owner.token,
                    "AWSELB": args.ELBcookie
                }
            };

            var changeStateFunc = function(response) {
                _self.device.resId = response.msg.resourceid;
                _self.changeStateTo(devicePlayingState.RESOURCE_READY);
                _self.timer.start();
            };

            var extendAjaxOptions = {
                contentType: "application/x-www-form-urlencoded;charset=utf-8"
            };

            var urlPrefix = _self.device.BACK_END_WEB_PROTOCAL + _self.device.webServerUrl;

            var requestArgs = {
                url: urlPrefix + "/init3.php",
                data: data,
                callbacks: undefined,
                changeState: changeStateFunc,
                extendAjaxOptions: extendAjaxOptions
            };

            return requestArgs;
        } else {
            console.error("args error");
        }

    };

    RtmpPlayer.prototype.queryResid = function() {
        var _self = this;
        if (_self.device.ELBcookie && _self.device.relayUrl &&
            _self.device.ELBcookie.length > 0 && _self.device.relayUrl.length > 0) {
            var requestArgs = _self.generateQueryResidArgs({
                ELBcookie: _self.device.ELBcookie,
                relayUrl: _self.device.relayUrl
            });

            var ajaxObj = _self.makeAjaxRequest(requestArgs, "xDomain");
            var currentCount = 1;
            this.rubbishAjaxArr.push(ajaxObj);
            var intervalObj = setInterval(function() {
                ajaxObj = _self.makeAjaxRequest(requestArgs, "xDomain");
                _self.rubbishAjaxArr.push(ajaxObj);
                currentCount += 1;
                if (currentCount >= _self.getResIdAjaxLimit) {
                    _self.changeStateTo(devicePlayingState.NEED_RES_FAILED_RETRY);
                };
            }, _self.getResIdIntervalTime);
            this.rubbisIntervalObjArr.push(intervalObj);
        } else {
            _self.changeStateTo(devicePlayingState.NEED_RES_FAILED_RETRY);
        }
    };

    RtmpPlayer.prototype.clearPlayerElementRubbish = function() {
        if (this.playerObj) {
            this.playerObj.stop();
            this.playerObj.remove();
            this.playerObj = null;
        };
        this.curResFailedRtryReqRlySrvCnt = 0;
    };

    return RtmpPlayer;
});