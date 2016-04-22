define(["DeviceWithLinkie","jquery", "globalIpcProduct", "IpcProduct", "LiveStreamConf", 
    "MixedPostChannel", "AudioPostChannel", "VideoPostChannel", "H264VideoCodec", "AACAudioCodec", "globalResolutions", "MJPEGVideoCodec",
    "PCMAudioCodec", "browser", "globalPlayerTypes"], 
    function (DeviceWithLinkie, $, globalIpcProduct, IpcProduct, LiveStreamConf,
        MixedPostChannel, AudioPostChannel, VideoPostChannel, H264VideoCodec, AACAudioCodec, globalResolutions, MJPEGVideoCodec,
        PCMAudioCodec, browser, globalPlayerTypes) {

    function PlayableDevice() {
        DeviceWithLinkie.call(this, arguments);

        this.currentVideoResolution = null;
        this.relayUrl = null;
        this.ELBcookie = null;
        this.resId = null;

        this.isActive = false;

        this.BACK_END_WEB_PROTOCAL = "";
    };

    inheritPrototype(PlayableDevice, DeviceWithLinkie);
    PlayableDevice.prototype.init = function(d) {
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

    PlayableDevice.prototype.updateProductLiveStreamConf = function(liveStreamConf) {
        if (this.product) {
            var tmpProduct = this.product;
            delete tmpProduct.liveStreamConf;
            tmpProduct.liveStreamConf = liveStreamConf;
        }
    };

    PlayableDevice.prototype.generateRelaydCommand = function() {
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

    PlayableDevice.prototype.getSupportResArr = function(resDescriptionArr) {
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
    PlayableDevice.prototype.getMixedPostDataChannel = function(supporttedMixed) {
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

    PlayableDevice.prototype.getMultiPostDataChannel = function(audioArr, videoArr) {
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

    PlayableDevice.prototype.getOrderedPlayerTypeArr = function(mt) {
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

    PlayableDevice.prototype.getPlayerTypeAndPostChannel = function(orderedPlayerTypeArr, postChannelMap) {
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

    PlayableDevice.prototype.dynamicFixPostChannelForMjpeg = function(liveStream) {
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

    PlayableDevice.prototype.getLiveStreamConfFromLinkieData = function(data) {
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

    return PlayableDevice;
});