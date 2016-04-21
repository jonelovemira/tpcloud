define(["Player", "inheritPrototype", "jquery", "stopReasonCodeMap", "Statistics", "devicePlayingState"], 
    function (Player, inheritPrototype, $, stopReasonCodeMap, Statistics, devicePlayingState) {

    function NonPluginPlayer() {
        Player.call(this, arguments);

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
    inheritPrototype(NonPluginPlayer, Player);

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
        this.back2Idle(stopReasonCodeMap.DEVICE_UNBOUND);
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
            this.back2Idle(stopReasonCodeMap.NETWORK_ERROR);
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

        var ajaxObj = _self.makeAjaxRequest(requestArgs, "xDomain");
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
                        var ajaxObj = _self.makeAjaxRequest(requestArgs, "xDomain");
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

        var ajaxObj = _self.makeAjaxRequest(requestArgs, "xDomain");
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

        var ajaxObj = _self.makeAjaxRequest(requestArgs, "xDomain");
        _self.rubbishAjaxArr.push(ajaxObj);
        var intervalObj = setInterval(function() {
            ajaxObj = _self.makeAjaxRequest(requestArgs, "xDomain");
            _self.rubbishAjaxArr.push(ajaxObj);
            currentCount += 1;
            if (currentCount >= _self.queryIsRelayReadyAjaxLimit) {
                _self.changeStateTo(devicePlayingState.NEED_RELAY_READY_FAILED_TRY);
            };
        }, _self.queryIsRelayReadyIntervalTime);
        _self.rubbisIntervalObjArr.push(intervalObj);
    };

    NonPluginPlayer.prototype.createNewStatisticsObj = function() {
        this.statistics = new FlashStatistics();
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

    return NonPluginPlayer;
})