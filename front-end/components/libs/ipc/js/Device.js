define(["User", "Model", "inheritPrototype", "jquery", "globalIpcProduct", "presetLinkieData", "IpcProduct", "LiveStreamConf",
    "MixedPostChannel", "AudioPostChannel", "VideoPostChannel", "H264VideoCodec", "AACAudioCodec", "globalResolutions", "MJPEGVideoCodec"
    "PCMAudioCodec", "browser", "globalPlayerTypes", "Cookies", "Error", "tips", "NonPluginPlayer", "PluginPlayer"], 
    function (User, Model, inheritPrototype, $, globalIpcProduct, presetLinkieData, IpcProduct, LiveStreamConf,
        MixedPostChannel, AudioPostChannel, VideoPostChannel, H264VideoCodec, AACAudioCodec, globalResolutions, MJPEGVideoCodec
        PCMAudioCodec, browser, globalPlayerTypes, Cookies, Error, tips, NonPluginPlayer, PluginPlayer) {

    function Device() {
        Model.call(this, arguments);
        this.owner = null;
        this.id = null;
        this.type = null;
        this.model = null;
        this.mac = null;
        this.isOnline = null;
        this.fwVer = null;
        this.appServerUrl = null;
        this.name = null;
        this.isSameRegion = null;
        this.webServerUrl = null;
        this.azIP = null;
        this.azDNS = null;
        this.systemStatus = null;
        this.needForceUpgrade = null;
        this.fwUrl = null;
        this.relayVideoTime = 600;

        this.hasGetCrossRegionInfo = false;
        this.hasUpgradOnce = null;
        this.product = null;
        this.nonPluginPlayer = null;
        this.pluginPlayer = null;

        this.currentVideoResolution = null;
        this.relayUrl = null;
        this.ELBcookie = null;
        this.resId = null;

        this.isActive = false;

        this.BACK_END_WEB_PROTOCAL = "";
    };

    inheritPrototype(Device, Model);

    var deviceErrorCodeInfo = {
        "-20501": function() {
            console.log("device id does not exists");
        },
        "-20506": function() {
            console.log("device was binded to another account");
        },
        "-20507": function() {
            console.log("device is not binded to any account");
        },
        "-20571": function() {
            console.log("device is offline now");
        },
        "-20572": function() {
            console.log("alias format is incorrect");
        },
        "-20651": function() {
            console.log("token is invalid, plz relogin");
        },
        "-20675": function() {
            console.log("account is login at another place");
        },
    };

    Device.prototype.errorCodeCallbacks = Device.prototype.extendErrorCodeCallback({
        "errorCodeCallbackMap": deviceErrorCodeInfo
    }); 
    Device.prototype.stateChangeCallbacks = $.Callbacks("unique stopOnFalse");
    Device.prototype.init = function(d) {
        if (undefined == d) {
            console.error("args error in init");
        };
        $.extend(true, this, d);
        var p = this.model.substring(0, 5).toUpperCase();
        var tmpProduct = new IpcProduct();
        if (null == globalIpcProduct[p].liveStreamConf) {
            globalIpcProduct[p].liveStreamConf = this.getLiveStreamConfFromLinkieData(presetLinkieData[p]);
        }
        $.extend(true, tmpProduct, globalIpcProduct[p]);
        this.currentVideoResolution = tmpProduct.liveStreamConf.supportVideoResArr[0];
        this.product = tmpProduct;
    };
    Device.prototype.get = function(args, inputCallbacks, extendArgs) {
        if (this.owner == undefined) {
            console.error("owner is undefined");
        }
        var result = {};
        var validateResult = (!this.owner.validateEmailFormat(args.email).code && this.owner.validateEmailFormat(args.email)) ||
            (!this.validateIdFormat(args.id).code && this.validateIdFormat(args.id));
        if (validateResult.code == false) {
            result["validateResult"] = validateResult;
            return result;
        };

        var urlPrefix = this.BACK_END_WEB_PROTOCAL + this.webServerUrl;
        var dataRes = {
            "email": args.email,
            "id": args.id
        };
        if (extendArgs) {
            var dataRes = $.extend(true, dataRes, extendArgs.data);
        };
        var data = JSON.stringify(dataRes);

        var changeStateFunc = function(response) {
            this.init(response.msg);
            this.isSameRegion = true;
            this.hasGetCrossRegionInfo = true;
            this.stateChangeCallbacks.fire(this);
        };

        result["ajaxObj"] = this.makeAjaxRequest({
            url: urlPrefix + "/getCamera",
            data: data,
            callbacks: inputCallbacks,
            changeState: changeStateFunc,
            extendAjaxOptions: extendAjaxOptions
        }, "xDomain");
        return result;
    };

    Device.prototype.addNc200UpgradeCookie = function() {
        var device = this;
        var deviceModel = device.model;
        var fwVer = device.firmware;
        var deviceHwVer = device.hardware;
        if (deviceModel == "NC200(UN)" && fwVer == "2.1.3 Build 151125 Rel.24992" && deviceHwVer == "1.0") {
            var date = new Date();
            var minutes = 10;
            date.setTime(date.getTime() + (minutes * 60 * 1000));
            Cookies.set(device.id, "upgrading", {
                expires: date
            });
        };
    };

    Device.prototype.upgrade = function(args, inputCallbacks) {
        if (undefined == this.owner || undefined == this.owner.token ||
            undefined == this.owner.email || undefined == args.fwUrl ||
            undefined == args.mac || undefined == args.azIP ||
            undefined == args.azDNS || undefined == this.webServerUrl) {
            console.error("args error in upgrade");
        }
        var result = {};
        var urlPrefix = this.BACK_END_WEB_PROTOCAL + this.webServerUrl;

        var data = {
            "REQUEST": "FIRMWAREUPGRADE",
            "DATA": {
                "account": this.owner.email,
                "User-Agent": "Web-ffx86-2.0",
                "command": "UPGRADE\n" + args.fwUrl + "\n",
                "dev_address": args.mac + "@" + args.azIP + "@" + args.azDNS,
                "token": this.owner.token,
            },
        };

        var changeStateFunc = function(response) {
            this.systemStatus = "downloading";
            this.hasUpgradOnce = true;
            this.stateChangeCallbacks.fire(this);

            this.addNc200UpgradeCookie();
        };

        var extendAjaxOptions = {
            contentType: "application/x-www-form-urlencoded;charset=utf-8"
        };

        result["ajaxObj"] = this.makeAjaxRequest({
            url: urlPrefix + "/init.php",
            data: data,
            callbacks: inputCallbacks,
            changeState: changeStateFunc,
            extendAjaxOptions: extendAjaxOptions
        }, "xDomain");

        return result;
    };

    Device.prototype.changeName = function(args, inputCallbacks) {
        if (undefined == this.owner || undefined == this.owner.token || undefined == this.appServerUrl) {
            console.error("args error in changeName")
        };
        var result = {};
        var validateResult = (!this.validateIdFormat(args.id).code && this.validateIdFormat(args.id)) ||
            (!this.validateNameFormat(args.name).code && this.validateNameFormat(args.name));
        if (validateResult.code == false) {
            result["validateResult"] = validateResult;
            return result;
        };

        var data = JSON.stringify({
            "method": "setAlias",
            "params": {
                "alias": args.name,
                "deviceId": args.id
            }
        });

        var changeStateFunc = function(response) {
            this.name = args.name;
            this.stateChangeCallbacks.fire(this);
        };

        result["ajaxObj"] = this.makeAjaxRequest({
            url: this.appServerUrl + "?token=" + this.owner.token,
            data: data,
            changeState: changeStateFunc,
            errCodeStrIndex: "error_code",
            callbacks: inputCallbacks,
        }, "xDomain");

        return result;
    };

    Device.prototype.unbind = function(args, inputCallbacks) {
        if (undefined == this.owner || undefined == this.owner.token ||
            undefined == this.appServerUrl) {
            console.error("args error in unbind");
        };
        var result = {};
        var validateResult = (!this.owner.validateAccount(args.account).code && this.owner.validateAccount(args.account)) ||
            (!this.validateIdFormat(args.id).code && this.validateIdFormat(args.id));
        if (validateResult.code == false) {
            result["validateResult"] = validateResult;
            return result;
        };

        var data = JSON.stringify({
            "method": "unbindDevice",
            "params": {
                "cloudUserName": args.account,
                "deviceId": args.id
            }
        });

        result["ajaxObj"] = this.makeAjaxRequest({
            url: this.appServerUrl + "?token=" + this.owner.token,
            data: data,
            changeState: $.noop,
            errCodeStrIndex: "error_code",
            callbacks: inputCallbacks
        }, "xDomain");
        return result;
    };

    Device.prototype.getLocalLinkieData = function() {
        var key = this.model.substring(0, 5).toUpperCase();
        var result;
        if (presetLinkieData[key]) {
            result = presetLinkieData[key][this.fwVer];
        }
        return result;
    };

    Device.prototype.updateLocalLinkieDataList = function(data) {
        var key = this.model.substring(0, 5).toUpperCase();
        if (undefined == presetLinkieData[key]) {
            presetLinkieData[key] = {};
        }
        presetLinkieData[key][this.fwVer] = data;
    };

    Device.prototype.isNeedGetLinkie = function() {
        var result = true;
        var key = this.model.substring(0, 5).toUpperCase();
        if (presetLinkieData[key] && presetLinkieData[key][this.fwVer]) {
            result = false;
        }
        return result;
    };

    Device.prototype.getLinkie = function(args, inputCallbacks) {
        if (undefined == args.token || undefined == args.appServerUrl) {
            console.error("args error in getLocalInfo");
        };
        var result = {};
        var validateResult = (!this.validateIdFormat(args.id).code && this.validateIdFormat(args.id));
        if (validateResult.code == false) {
            result["validateResult"] = validateResult;
            return result;
        };
        if (!this.isNeedGetLinkie()) {
            console.log("linkie data is already in cache when getLinkie. " +
                "passthrough to get linkie data anyway.");
        }

        var changeStateFunc = function(response) {
            if (response && response.result && response.result.responseData) {
                this.updateLocalLinkieDataList(response.result.responseData);
            };
        };
        var _self = this;
        inputCallbacks = inputCallbacks || {};
        inputCallbacks.errorCodeCallbackMap = inputCallbacks.errorCodeCallbackMap || {};
        var tmpFunc = inputCallbacks.errorCodeCallbackMap["-51207"];
        inputCallbacks.errorCodeCallbackMap["-51207"] = function() {
            _self.updateLocalLinkieDataList("-51207");
            tmpFunc && tmpFunc();
        };

        var data = JSON.stringify({
            "method": "passthrough",
            "params": {
                "requestData": {
                    "command": "LINKIE",
                    "content": {
                        "smartlife.cam.ipcamera.liveStream": {
                            "get_modules": {}
                        }
                    }
                },
                "deviceId": args.id
            }
        });

        result["ajaxObj"] = this.makeAjaxRequest({
            url: args.appServerUrl + "?token=" + args.token,
            data: data,
            changeState: changeStateFunc,
            errCodeStrIndex: "error_code",
            callbacks: inputCallbacks
        }, "xDomain");
        return result;
    };

    Device.prototype.updateProductLiveStreamConf = function(liveStreamConf) {
        if (this.product) {
            var tmpProduct = this.product;
            delete tmpProduct.liveStreamConf;
            tmpProduct.liveStreamConf = liveStreamConf;
        }
    };

    Device.prototype.getLocalInfo = function(args, inputCallbacks) {
        if (undefined == args.token || undefined == args.appServerUrl) {
            console.error("args error in getLocalInfo");
        }
        var result = {};
        var validateResult = (!this.validateIdFormat(args.id).code && this.validateIdFormat(args.id));
        if (validateResult.code == false) {
            result["validateResult"] = validateResult;
            return result;
        };

        var data = JSON.stringify({
            "method": "passthrough",
            "params": {
                "requestData": {
                    "command": "GET_EXTRA_INFO",
                    "content": 0
                },
                "deviceId": args.id
            }
        });
        var changeStateFunc = function(response) {
            var passthroughResult = response.result.responseData;
            if (0 == passthroughResult.errCode) {
                $.extend(true, this, passthroughResult.msg);
                this.stateChangeCallbacks.fire(this);
            };
        }

        result["ajaxObj"] = this.makeAjaxRequest({
            url: args.appServerUrl + "?token=" + args.token,
            data: data,
            changeState: changeStateFunc,
            errCodeStrIndex: "error_code",
            callbacks: inputCallbacks
        }, "xDomain");
        return result;
    };

    Device.prototype.generateRelaydCommand = function() {
        var result = {};
        var args = {
            relayUrl: this.relayUrl,
            deviceId: this.id,
            token: this.owner.token,
            relayVideoTime: this.relayVideoTime,
            audioCodecName: this.product.liveStreamConf.audioCodec.name,
            currentVideoResolutionName: this.currentVideoResolution.name,
            videoCodecName: this.product.liveStreamConf.videoCodec.name
        }
        for (var key in this.product.liveStreamConf.postDataChannel) {
            var c = this.product.liveStreamConf.postDataChannel[key];
            var commandStr = c.generateRelaydCommand(args);
            result[c.name] = commandStr;
        }
        return result;
    };

    Device.prototype.validateIdFormat = function(tmpId) {
        if (undefined == tmpId) {
            console.error("args error in validateIdFormat");
            return;
        };
        var e = new Error();
        e.code = true;
        e.msg = "OK";
        return e;
    };

    Device.prototype.validateNameFormat = function(tmpName) {
        if (undefined == tmpName) {
            console.error("args error in validateNameFormat");
            return;
        };

        var validateArgs = {
            "attr": tmpName,
            "attrEmptyMsg": tips.types.deviceName.cantBeEmpty,
            "maxLength": 31,
            "minLength": 1,
            "attrOutOfLimitMsg": tips.types.deviceName.outOfLimit,
            "pattern": /^[^\x00-\x1F\x7F{}<>'"=:&\x2f\x5c]{1,31}$/,
            "patternTestFailMsg": tips.types.deviceName.invalid,
        };
        return this.validateAttr(validateArgs);
    };

    Device.prototype.clearRubbish = function() {
        if (this.nonPluginPlayer) {
            this.nonPluginPlayer.clearRubbish();
        };
    };

    Device.prototype.getSupportResArr = function(resDescriptionArr) {
        if (resDescriptionArr) {
            var ipcResObjMap = {
                "1920*1080": globalResolutions["fullhd"],
                "1280*720": globalResolutions["hd"],
                "640*480": globalResolutions["vga"],
                "320*240": globalResolutions["qvga"]
            };
            var result = [];
            for (var key in ipcResObjMap) {
                for (var i = resDescriptionArr.length - 1; i >= 0; i--) {
                    if (resDescriptionArr[i] == key) {
                        result.push(ipcResObjMap[key]);
                    };
                };
            };
            return result;
        } else {
            throw "undefined args in getSupportResArr";
        }
    };
    Device.prototype.getMixedPostDataChannel = function(supporttedMixed) {
        if (supporttedMixed) {
            var map = {};
            for (var i = supporttedMixed.length - 1; i >= 0; i--) {
                var tmp = supporttedMixed[i];
                map[tmp["video_codec"] + "_" + tmp["audio_codec"]] = tmp;
            };
            var result = {};
            var mixedChannel = new MixedPostChannel();
            var videoCodec;
            var audioCodec;
            var supportVideoResArr;
            if (map["H.264_AAC"]) {
                videoCodec = new H264VideoCodec();
                audioCodec = new AACAudioCodec();
                mixedChannel.url = map["H.264_AAC"]["url"];
                supportVideoResArr = this.getSupportResArr(map["H.264_AAC"]["resolutions"]);
            } else if (map["MJPEG_PCM"]) {
                videoCodec = new MJPEGVideoCodec();
                audioCodec = new PCMAudioCodec();
                mixedChannel.url = map["MJPEG_PCM"]["url"];
                supportVideoResArr = this.getSupportResArr(map["MJPEG_PCM"]["resolutions"]);
            } else {
                throw "unknown mixed channel. neither h264acc nor mjpegpcm";
            };

            if (mixedChannel && videoCodec && audioCodec) {
                result = {
                    "postChannel": {
                        "mixed": mixedChannel
                    },
                    "videoCodec": videoCodec,
                    "audioCodec": audioCodec,
                    "supportVideoResArr": supportVideoResArr
                };
                return result;
            } else {
                throw "error in getMixedPostDataChannel";
            }
        } else {
            throw "undefined args in getMixedPostDataChannel";
        }
    };

    Device.prototype.getMultiPostDataChannel = function(audioArr, videoArr) {
        if (audioArr && videoArr) {
            var result = {};
            var videoCodec;
            var audioCodec;
            var videoChannel;
            var audioChannel;
            var audioCodecMap = {};
            var supportVideoResArr;
            for (var i = audioArr.length - 1; i >= 0; i--) {
                audioCodecMap[audioArr[i]["audio_codec"]] = audioArr[i];
            }
            var videoCodecMap = {};
            for (var i = videoArr.length - 1; i >= 0; i--) {
                videoCodecMap[videoArr[i]["video_codec"]] = videoArr[i];
            }

            if (audioCodecMap["AAC"]) {
                audioCodec = new AACAudioCodec();
                audioChannel = new AudioPostChannel();
                audioChannel.url = audioCodecMap["AAC"].url;
            } else if (audioCodecMap["PCM"]) {
                audioCodec = new PCMAudioCodec();
                audioChannel = new AudioPostChannel();
                audioChannel.url = audioCodecMap["PCM"].url;
            } else {
                throw "unknown audio codec type, neither aac nor pcm";
            }

            if (videoCodecMap["H.264"]) {
                videoCodec = new H264VideoCodec();
                videoChannel = new VideoPostChannel();
                videoChannel.url = videoCodecMap["H.264"].url;
                videoChannel.encrypt = videoCodecMap["H.264"].encrypt;
                supportVideoResArr = this.getSupportResArr(videoCodecMap["H.264"]["resolutions"]);
            } else if (videoCodecMap["MJPEG"]) {
                videoCodec = new MJPEGVideoCodec();
                videoChannel = new VideoPostChannel();
                videoChannel.url = videoCodecMap["MJPEG"].url;
                videoChannel.encrypt = videoCodecMap["MJPEG"].encrypt;
                supportVideoResArr = this.getSupportResArr(videoCodecMap["MJPEG"]["resolutions"]);
            } else {
                throw "unknown video codec type, neither h264 nor mjpeg";
            };

            if (videoChannel && audioChannel && videoCodec && audioCodec) {
                result = {
                    "postChannel": {
                        "video": videoChannel,
                        "audio": audioChannel
                    },
                    "videoCodec": videoCodec,
                    "audioCodec": audioCodec,
                    "supportVideoResArr": supportVideoResArr
                };
                return result;
            } else {
                throw "error in getMultiPostDataChannel";
            }
        } else {
            throw "undefined args in getMultiPostDataChannel";
        }
    };

    Device.prototype.getOrderedPlayerTypeArr = function(mt) {
        var mjpegVideoCodec = new MJPEGVideoCodec();
        var h264VideoCodec = new H264VideoCodec();
        var mimeTypesArr = [mjpegVideoCodec.mimeType, h264VideoCodec.mimeType];
        if ($.inArray(mt, mimeTypesArr) < 0) {
            throw "unknown mime types for getOrderedPlayerTypeArr";
        };
        var result = undefined;
        if ((browser.type == "Chrome" && parseInt(browser.version) >= 42) || browser.type.indexOf("Edge") >= 0) {
            if (mt == mimeTypesArr[0]) {
                result = [globalPlayerTypes.IMG_PLAYER];
            } else {
                result = [globalPlayerTypes.FLASH_PLAYER];
            }
        } else {
            if (browser.os == "MacOS") {
                result = [globalPlayerTypes.PLUGIN_MAC, globalPlayerTypes.FLASH_PLAYER];
            } else if (browser.os == "Windows") {
                if (browser.type == "MSIE") {
                    if (browser.userAgent.indexOf("x64") != -1) {
                        result = [globalPlayerTypes.PLUGIN_IE_X64, globalPlayerTypes.FLASH_PLAYER];
                    } else {
                        result = [globalPlayerTypes.PLUGIN_IE_X86, globalPlayerTypes.FLASH_PLAYER];
                    };
                } else {
                    if (browser.userAgent.indexOf("x64") != -1) {
                        result = [globalPlayerTypes.PLUGIN_NON_IE_X64, globalPlayerTypes.FLASH_PLAYER];
                    } else {
                        result = [globalPlayerTypes.PLUGIN_NON_IE_X86, globalPlayerTypes.FLASH_PLAYER];
                    };
                }
            } else {
                throw "unsupportted operation system";
            }
        }
        return result;
    };

    Device.prototype.getPlayerTypeAndPostChannel = function(orderedPlayerTypeArr, postChannelMap) {
        if (orderedPlayerTypeArr && postChannelMap && orderedPlayerTypeArr.length > 0) {
            var result = {};
            var pluginPlayers = [globalPlayerTypes.PLUGIN_NON_IE_X86, globalPlayerTypes.PLUGIN_NON_IE_X64, globalPlayerTypes.PLUGIN_IE_X86, globalPlayerTypes.PLUGIN_IE_X64, globalPlayerTypes.PLUGIN_MAC];
            if (orderedPlayerTypeArr[0] == globalPlayerTypes.FLASH_PLAYER) {
                result["playerType"] = orderedPlayerTypeArr[0];
                result["postChannel"] = postChannelMap["mixed"] || postChannelMap["multi"];
            } else if ($.inArray(orderedPlayerTypeArr[0], pluginPlayers) >= 0) {
                if (postChannelMap["multi"]) {
                    result["playerType"] = orderedPlayerTypeArr[0];
                    result["postChannel"] = postChannelMap["multi"];
                } else {
                    if (orderedPlayerTypeArr.length > 1 && orderedPlayerTypeArr[1] == globalPlayerTypes.FLASH_PLAYER) {
                        result["playerType"] = orderedPlayerTypeArr[1];
                        result["postChannel"] = postChannelMap["mixed"];
                    }
                }
            } else {
                if (postChannelMap["multi"]) {
                    result["playerType"] = orderedPlayerTypeArr[0];
                    result["postChannel"] = postChannelMap["multi"];
                }
            }
            return result;
        } else {
            throw "undefined args in getPlayerTypeAndPostChannel";
        }
    };

    Device.prototype.dynamicFixPostChannelForMjpeg = function(liveStream) {
        if (liveStream) {
            if (liveStream.mimeType == (new MJPEGVideoCodec()).mimeType) {
                if ((browser.prototype.type == "Chrome" && parseInt(browser.prototype.version) >= 42) || browser.prototype.type.indexOf("Edge") >= 0) {
                    if (liveStream["postDataChannel"]["video"] && liveStream["postDataChannel"]["audio"]) {
                        delete liveStream["postDataChannel"]["audio"];
                    };
                };
            };
        } else {
            throw "undefined args in dynamicFixPostChannelForMjpeg";
        };
    };

    Device.prototype.getLiveStreamConfFromLinkieData = function(data) {
        if (data) {
            var liveStreamConf = new LiveStreamConf();
            try {
                if (data["smartlife.cam.ipcamera.liveStream"] &&
                    data["smartlife.cam.ipcamera.liveStream"]["get_modules"]) {
                    var module = data["smartlife.cam.ipcamera.liveStream"]["get_modules"];

                    var postChannelInfoMap = {};
                    if (module["audio_video"]) {
                        postChannelInfoMap["mixed"] = this.getMixedPostDataChannel(module["audio_video"]);
                    };
                    if (module["audio"] && module["video"]) {
                        postChannelInfoMap["multi"] = this.getMultiPostDataChannel(module["audio"], module["video"]);
                    };

                    if ((postChannelInfoMap["mixed"] || postChannelInfoMap["multi"])) {
                        var mimeType;
                        if (module["port"]) {
                            for (var type in postChannelInfoMap) {
                                mimeType = postChannelInfoMap[type]["videoCodec"].mimeType;
                                for (var channelIt in postChannelInfoMap[type]["postChannel"]) {
                                    postChannelInfoMap[type]["postChannel"][channelIt].port = module["port"];
                                };
                                if (undefined == postChannelInfoMap[type]["videoCodec"].mimeType) {
                                    throw "unknown mimeType";
                                };
                            }
                        } else {
                            throw "linkie data have no port info";
                        };

                        var name = this.model.substring(0, 5).toUpperCase();
                        liveStreamConf.mimeType = mimeType;
                        liveStreamConf.orderedPlayerTypeArr = this.getOrderedPlayerTypeArr(liveStreamConf.mimeType);
                        var playerTypeAndPostChannel = this.getPlayerTypeAndPostChannel(liveStreamConf.orderedPlayerTypeArr, postChannelInfoMap);
                        liveStreamConf.playerType = playerTypeAndPostChannel["playerType"];
                        liveStreamConf.supportVideoResArr = playerTypeAndPostChannel["postChannel"]["supportVideoResArr"];
                        liveStreamConf.smallImgCssClass = name + "-small-img";
                        liveStreamConf.middleImgCssClass = name + "-middle-img";
                        liveStreamConf.postDataChannel = playerTypeAndPostChannel["postChannel"]["postChannel"];
                        liveStreamConf.audioCodec = playerTypeAndPostChannel["postChannel"]["audioCodec"];
                        liveStreamConf.videoCodec = playerTypeAndPostChannel["postChannel"]["videoCodec"];
                        this.dynamicFixPostChannelForMjpeg(liveStreamConf);
                        return liveStreamConf;
                    }
                } else {
                    throw "unknown linkie-like data";
                }
            } catch (err) {
                throw "some error happened: " + err;
            }
        }
    };

    return Device;
    
});