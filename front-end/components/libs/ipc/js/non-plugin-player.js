(function($) {
    "use strict";
    $.ipc = $.ipc || {};

    var devicePlayingState = {
        IDLE: 0,
        BEGIN_PLAY: 1,
        RELAY_URL_READY: 2,
        REQUEST_RELAY_SERVICE_SUCCESS: 3,
        RELAY_READY: 4,
        RESOURCE_READY: 5,
        PLAYING: 6,
        NETWORK_ERROR: 7,
        NEED_RES_FAILED_RETRY: 8,
        NEED_RELAY_READY_FAILED_TRY: 9
    };

    function NonPluginPlayer() {
        $.ipc.MyPlayer.call(this, arguments);
        this.timer = null;
        this.statistics = null;
        this.swfPath = null;
        this.playerElementId = null;

        this.curRlyRdyFailedRtryReqRlySrvCnt = 0;
        this.maxRlyRdyFailedRtryReqRlySrvCnt = 3;

        this.queryIsRelayReadyIntervalTime = 1000;
        this.queryIsRelayReadyAjaxLimit = 6;

        this.getResIdIntervalTime = 3000;
        this.getResIdAjaxLimit = 3;

        this.currentNetErrRetryCnt = 0;
        this.maxNetErrRetryCnt = 3;

        this.rubbishAjaxArr = [];
        this.rubbisIntervalObjArr = [];

        this.state = devicePlayingState.IDLE;

        this.playerObjErrorCallbacks = $.Callbacks("unique stopOnFalse");

        this.hideCoverFunc = null;
        this.coverRenderFunc = null;
        this.playerRenderFunc = null;
        this.netErrRenderFunc = null;
    };
    $.ipc.inheritPrototype(NonPluginPlayer, $.ipc.MyPlayer);
    var playerErrorCodeInfo = {
        "-20107": function() {
            console.log("args is invalid")
        },
        "-20501": function() {
            console.log("device is not exist")
        },
        "-20571": function() {
            console.log("device is offline")
        },
        "-20651": function() {
            console.log("token is out of date")
        },
        "-20652": function() {
            console.log("token is error")
        },
        "-24002": function() {
            console.log("Relay connect not ready")
        }
    };
    NonPluginPlayer.prototype.errorCodeCallbacks = NonPluginPlayer.prototype.extendErrorCodeCallback({
        "errorCodeCallbackMap": playerErrorCodeInfo
    });

    NonPluginPlayer.prototype.clearRubbish = function() {
        this.stateChangeCallback.empty();
        this.playerObjErrorCallbacks.empty();
        this.back2Idle($.ipc.stopReasonCodeMap.DEVICE_UNBOUND);
    };

    NonPluginPlayer.prototype.clearLastStepRubbish = function() {
        for (var i = 0; i < this.rubbishAjaxArr.length; i++) {
            this.rubbishAjaxArr[i] && this.rubbishAjaxArr[i].abort();
        };
        delete this.rubbishAjaxArr;
        this.rubbishAjaxArr = [];

        for (var i = 0; i < this.rubbisIntervalObjArr.length; i++) {
            clearInterval(this.rubbisIntervalObjArr[i]);
        };
        delete this.rubbisIntervalObjArr;
        this.rubbisIntervalObjArr = [];
    };

    NonPluginPlayer.prototype.back2Idle = function(stopReasonCode) {
        this.clearLastStepRubbish();

        if (this.timer) {
            if (this.statistics) {
                this.statistics.watchTime += Math.round(this.timer.currentTime / 1000);
                Object.prototype.toString.call(this.statistics.stopReason) === '[object Array]' && this.statistics.stopReason.push(stopReasonCode);
                this.statistics.send();
                delete this.statistics;
                this.statistics = null;
            };
            this.timer.clearRubbish();
        };
        this.state = devicePlayingState.IDLE;

        this.clearPlayerElementRubbish();

        this.curRlyRdyFailedRtryReqRlySrvCnt = 0;
        this.currentNetErrRetryCnt = 0;
    };

    NonPluginPlayer.prototype.renderNetworkError = function() {
        if (this.netErrRenderFunc) {
            this.back2Idle($.ipc.stopReasonCodeMap.NETWORK_ERROR);
            this.netErrRenderFunc(this.device);
        };
    };

    NonPluginPlayer.prototype.networkErrorRetry = function() {
        var _self = this;
        _self.currentNetErrRetryCnt += 1;

        console.log("retry full nonPluginPlayer flow due to device is not reachable: " + _self.currentNetErrRetryCnt);
        if (_self.currentNetErrRetryCnt <= _self.maxNetErrRetryCnt) {
            setTimeout(function() {
                _self.changeStateTo(devicePlayingState.BEGIN_PLAY);
            }, 1000);
        } else {
            _self.renderNetworkError();
        }
    };

    NonPluginPlayer.prototype.relayReadyFailedRetryRelayService = function() {
        this.curRlyRdyFailedRtryReqRlySrvCnt += 1;
        console.log("relay ready retry: " + this.curRlyRdyFailedRtryReqRlySrvCnt);
        if (this.curRlyRdyFailedRtryReqRlySrvCnt <= this.maxRlyRdyFailedRtryReqRlySrvCnt) {
            this.changeStateTo(devicePlayingState.RELAY_URL_READY);
        } else {
            this.changeStateTo(devicePlayingState.NETWORK_ERROR);
        }
    };

    NonPluginPlayer.prototype.changeStateTo = function(toState) {
        if (toState) {
            var _self = this;
            _self.state = toState;
            _self.stateChangeCallback.fireWith(_self);
        };
    };

    NonPluginPlayer.prototype.generateAjaxUrl = function(args) {
        if (undefined == args.appServerUrl || undefined == args.token) {
            console.error("args error in generateAjaxUrl");
        };
        return args.appServerUrl + "/ipc?token=" + args.token;
    };

    NonPluginPlayer.prototype.getUrlAndLinkie = function(currentTryIndex) {
        var _self = this;
        var currentTry = currentTryIndex || 0;
        if (currentTry >= 3) {
            _self.changeStateTo(devicePlayingState.NETWORK_ERROR);
            return;
        }
        var getUrlAjaxObj = _self.getRelayUrl();
        var getLinkieAjaxObj = _self.getDeviceLinkieData();
        _self.rubbishAjaxArr.push(getUrlAjaxObj);
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
            if (_self.device.relayUrl) {
                _self.changeStateTo(devicePlayingState.RELAY_URL_READY);
            } else {
                _self.getUrlAndLinkie(currentTry)
            }
        };
        var failFunc = function() {
            if (getUrlAjaxObj.status != 200 && getUrlAjaxObj.statusText != "abort") {
                _self.getUrlAndLinkie(currentTry)
            };
        };
        var alwaysFunc = function() {
            currentTry += 1;
        }
        _self.multiAsyncRequest({
            success: successFunc,
            fail: failFunc,
            ajaxArr: [getUrlAjaxObj, getLinkieAjaxObj],
            always: alwaysFunc
        });
    };

    NonPluginPlayer.prototype.getRelayUrl = function(args, inputCallbacks) {
        var _self = this;

        if (_self.device.relayUrl) {
            _self.changeStateTo(devicePlayingState.RELAY_URL_READY);
            return;
        };

        var data = JSON.stringify({
            "method": "requestUrl",
            "params": {
                "type": "relay"
            }
        });

        var changeStateFunc = function(response) {
            _self.device.relayUrl = response.result.relayUrl.replace(/^.*:\/\//, "");
        };

        var requestArgs = {
            url: _self.generateAjaxUrl({
                appServerUrl: _self.device.appServerUrl,
                token: _self.device.owner.token,
            }),
            data: data,
            callbacks: inputCallbacks,
            changeState: changeStateFunc,
            errCodeStrIndex: "error_code"
        };

        var ajaxObj = _self.makeAjaxRequest(requestArgs, $.xAjax.defaults.xType);
        _self.rubbishAjaxArr.push(ajaxObj);
        return ajaxObj;
    };

    NonPluginPlayer.prototype.requestSingleRelayService = function(reachedFlag, key, command) {
        var _self = this;
        var data = JSON.stringify({
            "method": "requestRelayService",
            "params": {
                "account": _self.device.owner.account,
                "devId": _self.device.id,
                "command": command
            }
        });

        var retryCount = 0;
        var retryLimit = 3;
        var changeStateFunc = function(response) {
            reachedFlag[key] = true;
            var isAllReached = true;
            for (var r in reachedFlag) {
                if (!reachedFlag[r]) {
                    isAllReached = false;
                };
            };

            if (isAllReached) {
                _self.changeStateTo(devicePlayingState.REQUEST_RELAY_SERVICE_SUCCESS);
            };
        };

        var extendAjaxOptions = {
            error: function(xhr) {
                if (xhr.statusText != "abort") {
                    if (retryCount < retryLimit) {
                        retryCount += 1;
                        var ajaxObj = _self.makeAjaxRequest(requestArgs, $.xAjax.defaults.xType);
                        _self.rubbishAjaxArr.push(ajaxObj);
                    } else {
                        _self.changeStateTo(devicePlayingState.NETWORK_ERROR);
                    }
                }
            }
        };

        var requestArgs = {
            url: _self.generateAjaxUrl({
                appServerUrl: _self.device.appServerUrl,
                token: _self.device.owner.token,
            }),
            data: data,
            callbacks: undefined,
            changeState: changeStateFunc,
            errCodeStrIndex: "error_code",
            extendAjaxOptions: extendAjaxOptions
        };

        var ajaxObj = _self.makeAjaxRequest(requestArgs, $.xAjax.defaults.xType);
        _self.rubbishAjaxArr.push(ajaxObj);
    };

    NonPluginPlayer.prototype.requestRelayService = function() {
        var reachedFlag = {};
        var commandMap = this.device.generateRelaydCommand();
        for (var key in commandMap) {
            reachedFlag[key] = false;
        };
        for (var key in commandMap) {
            this.requestSingleRelayService(reachedFlag, key, commandMap[key]);
        };
    };

    NonPluginPlayer.prototype.isRelayReady = function() {
        var _self = this;
        var data = JSON.stringify({
            "method": "isRelayReady",
            "params": {
                "devId": _self.device.id
            }
        });

        var changeStateFunc = function(response) {
            if (response.result.realServerKey.indexOf("AWSELB") >= 0) {
                _self.device.ELBcookie = response.result.realServerKey;
                _self.changeStateTo(devicePlayingState.RELAY_READY);
            }
        };

        var requestArgs = {
            url: _self.generateAjaxUrl({
                appServerUrl: _self.device.appServerUrl,
                token: _self.device.owner.token,
            }),
            data: data,
            callbacks: undefined,
            changeState: changeStateFunc,
            errCodeStrIndex: "error_code"
        };
        var currentCount = 1;

        var ajaxObj = _self.makeAjaxRequest(requestArgs, $.xAjax.defaults.xType);
        _self.rubbishAjaxArr.push(ajaxObj);
        var intervalObj = setInterval(function() {
            ajaxObj = _self.makeAjaxRequest(requestArgs, $.xAjax.defaults.xType);
            _self.rubbishAjaxArr.push(ajaxObj);
            currentCount += 1;
            if (currentCount >= _self.queryIsRelayReadyAjaxLimit) {
                _self.changeStateTo(devicePlayingState.NEED_RELAY_READY_FAILED_TRY);
            };
        }, _self.queryIsRelayReadyIntervalTime);
        _self.rubbisIntervalObjArr.push(intervalObj);
    };

    NonPluginPlayer.prototype.createNewStatisticsObj = function() {
        this.statistics = new $.ipc.FlashStatistics();
        this.statistics.devID = this.device.id;
        this.statistics.devModel = this.device.model.substring(0, 5);
        this.statistics.firmwareVersion = this.device.fwVer;
        this.statistics.token = this.device.owner.token;
    };

    NonPluginPlayer.prototype.triggerPlay = function() {
        var _self = this;
        _self.createNewStatisticsObj();
        _self.updateStatisticsType();
        _self.coverRenderFunc(_self.device);
        _self.changeStateTo(devicePlayingState.BEGIN_PLAY);
    };

    NonPluginPlayer.prototype.play = function() {
        var _self = this;
        var playArgs = {
            resourcePath: _self.getResourcePath()
        }

        this.setupPlayer(playArgs);
    };

    function RtmpPlayer() {
        NonPluginPlayer.call(this, arguments);

        this.protocol = "rtmps://";
        this.port = 443;
        this.resourceAppName = "RtmpRelay";

        this.curResFailedRtryReqRlySrvCnt = 0;
        this.maxResFailedRtryReqRlySrvCnt = 3;
    };
    $.ipc.inheritPrototype(RtmpPlayer, NonPluginPlayer);

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
            _self.statistics && Object.prototype.toString.call(_self.statistics.stopReason) === '[object Array]' && _self.statistics.stopReason.push($.ipc.stopReasonCodeMap.UNKNOWN_ERROR);
        });

        newPlayer.on('pause', function() {
            _self.statistics && Object.prototype.toString.call(_self.statistics.stopReason) === '[object Array]' && _self.statistics.stopReason.push($.ipc.stopReasonCodeMap.USER_STOPPED_VIDEO);
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
            this.back2Idle($.ipc.stopReasonCodeMap.UNKNOWN_ERROR);
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
                this.back2Idle($.ipc.stopReasonCodeMap.UNKNOWN_ERROR);
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
                    _self.makeAjaxRequest(requestArgs, $.xAjax.defaults.xType);
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
            _self.makeAjaxRequest(requestArgs, $.xAjax.defaults.xType);
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

            var ajaxObj = _self.makeAjaxRequest(requestArgs, $.xAjax.defaults.xType);
            var currentCount = 1;
            this.rubbishAjaxArr.push(ajaxObj);
            var intervalObj = setInterval(function() {
                ajaxObj = _self.makeAjaxRequest(requestArgs, $.xAjax.defaults.xType);
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

    $.ipc.RtmpPlayer = RtmpPlayer;


    function ImgPlayer() {
        NonPluginPlayer.call(this, arguments);

        this.audioPlayerElementId = null;

        this.protocol = "http://";
        this.port = 80;
        this.idleLink = "//:0";
    };
    $.ipc.inheritPrototype(ImgPlayer, NonPluginPlayer);

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
            this.back2Idle($.ipc.stopReasonCodeMap.UNKNOWN_ERROR);
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
                this.back2Idle($.ipc.stopReasonCodeMap.UNKNOWN_ERROR);
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

        _self.makeAjaxRequest(requestArgs, $.xAjax.defaults.xType);
    };

    ImgPlayer.prototype.killAllRelayClient = function() {
        var _self = this;
        for (var key in $.cookie()) {
            if (key.indexOf("X-Client-Id") >= 0) {
                var args = {
                    relaySessionId: $.cookie(key),
                    ELBcookie: _self.device.ELBcookie
                }
                _self.killGetImgClient(args);
                $.removeCookie(key);
            };
        }
    };

    ImgPlayer.prototype.clearPlayerElementRubbish = function() {
        var _self = this;
        $("#" + _self.playerElementId).attr("src", _self.idleLink);
        _self.killAllRelayClient();
    };

    $.ipc.ImgPlayer = ImgPlayer;
})(jQuery);