define(['PlayableDeviceList', 'jwplayer', 'tips', 'jquery', 'PlayableDevice', 'msg', 
    'browser', 'compareVersion', 'MjpegPluginPlayer', 'H264PluginPlayer', 
    'RtmpPlayer', 'Timer', 'ImgPlayer', 'globalPlayerTypes', 'Cookies', 'jquery.select', 'jquery-ui'], 
    function (PlayableDeviceList, jwplayer, tips, $, PlayableDevice, msg, 
        browser, compareVersion, MjpegPluginPlayer, H264PluginPlayer, 
        RtmpPlayer, Timer, ImgPlayer, globalPlayerTypes, Cookies) {
    
    function DeviceListView() {
        this.model = null;
        this.maxDisplayNameLength = 16;
        this.pageCapacity = 5;
        this.curPageIndex = null;
        this.maxPageIndex = null;
        this.stateTipsMap = {
            "normal": tips.types.upgrade.required,
            "downloading": tips.types.upgrade.downloading,
            "upgrading": tips.types.upgrade.upgrading
        };
        this.menuContainer = $("#accordion");
        this.viewDOM = $("#watch");
        this.settingDOM = $("#setting");
        this.commonTipsDOM = $("#common-tips");
        this.deviceLiDomIdPrefix = "dev-";
        this.player = null;
        this.isNeedFeedPluginDownloadLink = false;
        this.hasShownPluginUpdateConfirm = false;
        this.devicePlayerMap = {}
    }
    DeviceListView.prototype.constructor = DeviceListView;
    DeviceListView.prototype.renderBoard = function() {
        this.renderLeftListMenu();
        this.clearBoardAndShow();
    };

    DeviceListView.prototype.getDevicePlayer = function(device, type) {
        if (device && type) {
            var id = device.id;
            if (this.devicePlayerMap[id]) {
                return this.devicePlayerMap[id][type];
            }
        } else {
            console.error("args error in getDevicePlayer");
        }
    };

    DeviceListView.prototype.clearPageRubbish = function() {
        $(".admin-nav-li-select").removeClass("admin-nav-li-select");
        $("#live-view-tab").addClass("admin-nav-li-select");
        this.hideSettingChild();
    };

    DeviceListView.prototype.getDeviceDisplayName = function(device) {
        if (undefined == device.name) {
            console.error("args error in getDeviceDisplayName")
        };
        var dot = device.name.length > this.maxDisplayNameLength ? "..." : "";
        return device.name.substring(0, this.maxDisplayNameLength - 2) + dot;
    };

    DeviceListView.prototype.updateDeviceLi = function(device) {
        if (undefined == device) {
            console.error("device args error in showDeviceLi");
        };
        var deviceIndex = this.model.findIndexForId(device.id);
        var deviceLi = $("#" + this.getDeviceLiDOMId(deviceIndex));
        var imgCssClass = device.product.smallImgCssClass;
        var displayName = this.getDeviceDisplayName(device);
        var state = device.needForceUpgrade == 1 ? (this.stateTipsMap[device.systemStatus] || "") : "";
        var currentPageCssClass = this.getDevicePageCssClass(this.getDevicePageIndex(deviceIndex));

        deviceLi.attr("title", device.name);
        deviceLi.addClass(currentPageCssClass);
        deviceLi.find(".usable-cover").first().toggleClass("dev-unusable", device.isOnline == 0);
        deviceLi.find("span").first().addClass(imgCssClass);
        deviceLi.find(".dev-name").first().text(displayName);
        deviceLi.find(".system-status").first().text(state);
    };

    DeviceListView.prototype.appendDeviceLi = function(device) {
        if (undefined == device) {
            console.error("args error in appendDeviceLi");
        };
        var index = this.model.findIndexForId(device.id);
        var deviceLi = $("#device-li-sample").clone();
        deviceLi.attr("id", this.getDeviceLiDOMId(index));
        this.menuContainer.append(deviceLi);
        this.updateDeviceLi(device);
    };

    DeviceListView.prototype.getDevicePageCssClass = function(pageIndex) {
        if (undefined == pageIndex || pageIndex < 0 || pageIndex > this.maxPageIndex) {
            console.error("args error in getDevicePageCssClass");
        };
        return "dev-page-" + pageIndex;
    };

    DeviceListView.prototype.getDeviceLiDOMId = function(devIndex) {
        if (undefined == devIndex || devIndex < 0 || devIndex > this.model.devices.length - 1) {
            console.error("args error in getDevicePageIndex");
        };
        return this.deviceLiDomIdPrefix + devIndex;
    };

    DeviceListView.prototype.getDevicePageIndex = function(devIndex) {
        if (undefined == devIndex || devIndex < 0 || devIndex > this.model.devices.length - 1) {
            console.error("args error in getDevicePageIndex");
        };
        return Math.floor(devIndex / this.pageCapacity);
    };

    DeviceListView.prototype.updateActiveDeviceCss = function() {
        $(".dev-item").removeClass("dev-selected");
        var activeDeviceIndex = this.model.findFirstActiveDevIndex();
        if (undefined == activeDeviceIndex) {
            console.error("args error in updateActiveDeviceCss");
        } else {
            $("#" + this.getDeviceLiDOMId(activeDeviceIndex)).addClass("dev-selected");
        };
    };

    DeviceListView.prototype.renderLeftListMenu = function() {
        this.menuContainer.empty();
        var activeDeviceIndex = this.model.findFirstActiveDevIndex();
        if (activeDeviceIndex != undefined) {
            this.maxPageIndex = this.getDevicePageIndex(this.model.devices.length - 1);
            this.curPageIndex = this.getDevicePageIndex(activeDeviceIndex);

            for (var i = 0; i < this.model.devices.length; i++) {
                this.appendDeviceLi(this.model.devices[i], i);
            };

            this.updateActiveDeviceCss();
            this.renderDeviceListPagination();
        };
    };

    DeviceListView.prototype.renderDeviceListPagination = function() {
        if (undefined == this.curPageIndex) {
            console.error("args error in renderDeviceListPagination");
        };
        this.menuContainer.children().hide();
        var activePageCssClass = this.getDevicePageCssClass(this.curPageIndex);
        $("." + activePageCssClass).show();

        $("#dev-left-arrow").toggle(this.curPageIndex > 0);
        $("#dev-right-arrow").toggle(this.curPageIndex < this.maxPageIndex);
    };

    DeviceListView.prototype.renderNextDevicePage = function() {
        if (this.curPageIndex >= this.maxPageIndex) {
            console.error("args error in renderNextDevicePage");
        };
        this.curPageIndex += 1;
        this.renderDeviceListPagination();
    };

    DeviceListView.prototype.renderPreDevicePage = function() {
        if (this.curPageIndex <= 0) {
            console.error("args error in renderPreDevicePage");
        };
        this.curPageIndex -= 1;
        this.renderDeviceListPagination();
    };

    DeviceListView.prototype.hideSettingChild = function() {
        this.settingDOM.children().hide();
    };

    DeviceListView.prototype.hideCommonTipsChild = function() {
        this.commonTipsDOM.children().hide();
    };

    DeviceListView.prototype.hideViewSettingContent = function() {
        this.viewDOM.hide();
        this.settingDOM.hide();
        this.commonTipsDOM.hide();
    };

    DeviceListView.prototype.findActiveNavTab = function() {
        var tabName = $(".admin-nav-li-select > span").text();
        return tabName;
    };

    DeviceListView.prototype.clearBoardAndShow = function() {
        if (this.model.devices.length > 0) {
            var activeDev = this.model.findActiveDeviceArr()[0];
            if (activeDev) {
                if (activeDev.isSameRegion || activeDev.hasGetCrossRegionInfo) {
                    if (activeDev.isSameRegion) {
                        if (activeDev.needForceUpgrade == 1) {
                            this.commonTipsManageBoard();
                            this.showUpgradeState(activeDev);
                        } else {
                            var activeTab = this.findActiveNavTab();
                            if (activeTab == "Settings") {
                                this.settingManageBoard();
                                this.showSetting();
                            } else {
                                this.showLiveView();
                            }
                        }
                    };
                } else {
                    this.commonTipsManageBoard();
                    this.showCrossRegionTip(activeDev);
                }
            } else {
                console.log("args error in clearBoardAndShow");
            }
        } else {
            this.commonTipsManageBoard();
            this.showNoDeviceTips();
        }
    };

    DeviceListView.prototype.highlightTab = function(tabObj) {
        if (tabObj != undefined) {
            $(".admin-nav-li").removeClass("admin-nav-li-select");
            tabObj.addClass("admin-nav-li-select");
        };
    };

    DeviceListView.prototype.isShowing = function(obj) {
        if (obj) {
            return obj.length > 0 && !obj.is(":hidden");
        };
        return false;
    };

    DeviceListView.prototype.renderMsg = function(tmpMsg) {
        if (undefined == tmpMsg) {
            console.error("args error in renderMsg");
        };
        msg({
            type: "alert",
            info: tmpMsg
        });
    };

    DeviceListView.prototype.hideViewChild = function() {
        this.viewDOM.children().hide();
    };

    DeviceListView.prototype.liveViewManageBoard = function() {
        this.viewDOM.show();
        this.hideViewChild();
    };

    DeviceListView.prototype.playerManageBoard = function(container, subjectPlayer) {
        if (undefined == container || undefined == subjectPlayer) {
            console.error("args error in playerManageBoard");
        };
        container.show();
        container.children().hide();
        subjectPlayer.show();
    };

    DeviceListView.prototype.showPlayer = function(playerType) {
        var currentView = this;
        var tmp = {
            container: null,
            subjectPlayer: null
        }
        var playerTypeContainerSelectorMap = {
            "flash-player": "#flash-player-container",
            "ie-mjpeg": "#plugin-player-container",
            "ie-h264": "#plugin-player-container",
            "non-ie-mjpeg": "#plugin-player-container",
            "non-ie-h264": "#plugin-player-container",
            "img": "#img-tag-player-container"
        };
        var playerTypePlayerElementSelectorMap = {
            "flash-player": "#flash-player",
            "ie-mjpeg": "#ie-mjpeg",
            "ie-h264": "#ie-h264",
            "non-ie-mjpeg": "#non-ie-mjpeg",
            "non-ie-h264": "#non-ie-h264",
            "img": "#img-player"
        };
        if (undefined == playerTypeContainerSelectorMap[playerType] ||
            undefined == playerTypePlayerElementSelectorMap[playerType]) {
            console.error("unsupport playerType");
        };
        this.playerManageBoard($(playerTypeContainerSelectorMap[playerType]),
            $(playerTypePlayerElementSelectorMap[playerType]));
    };

    DeviceListView.prototype.getPluginPlayerElement = function(dev) {
        if (undefined == dev) {
            console.error("args error in getPluginPlayerElement")
        };
        var player = null;
        if (dev.product.liveStreamConf.playerType) {
            var mimeType = dev.product.liveStreamConf.mimeType;
            var playerElementId = dev.product.liveStreamConf.playerType.mimetypeCssMap[mimeType] || undefined;
            player = document.getElementById(playerElementId);
        } else {
            console.error("current environment do not support plugin play");
        }
        return player;
    };

    DeviceListView.prototype.isEnvSupportPluginPlay = function(dev) {
        if (undefined == dev) {
            console.error("args error in isEnvSupportPluginPlay")
        };
        var result = false;
        var browserType = browser.type;
        var mt = dev.product.liveStreamConf.mimeType;
        var player = this.getPluginPlayerElement(dev);
        if (player) {
            if (browserType == "MSIE") {
                if (typeof player.PlayVideo == "unknown") {
                    result = true;
                } else {
                    result = false;
                }
            } else {
                var mime = navigator.mimeTypes[mt];
                if (mime) {
                    var plugin = mime.enabledPlugin;
                    if (plugin) {
                        result = true;
                    }
                }
            };
        };
        return result;
    };

    DeviceListView.prototype.isPluginNeedUpgrade = function(dev) {
        if (undefined == dev) {
            console.error("args error in isPluginNeedUpgrade")
        };
        var result = false;
        var player = this.getPluginPlayerElement(dev);
        if (player) {
            var browserType = browser.type;
            if (browserType == "MSIE") {
                var version = player.iepluginversion;
                result = compareVersion(version, "1.20") < 0;
            } else {
                var version = player.version;
                if (navigator.userAgent.indexOf("Mac", 0) >= 0) {
                    result = compareVersion(version, "2.8") < 0;
                } else {
                    result = compareVersion(version, "2.7") < 0;
                }
            }
            return result;
        } else {
            console.error("there is no plug-in player");
        }
    };

    DeviceListView.prototype.feedPluginDownloadLink = function(dev) {
        if (undefined != dev && this.isPluginPlayer(dev.product.liveStreamConf.playerType)) {
            var playerType = dev.product.liveStreamConf.playerType;
            var downloadLink = playerType.downloadPath;
            if (downloadLink) {
                $(".plugin-download-link").attr("href", downloadLink);
            } else {
                this.isNeedFeedPluginDownloadLink = true;
            }
        } else {
            console.error("args error in feedPluginDownloadLink");
        }
    };

    DeviceListView.prototype.showPluginNeed = function(dev) {
        $("#plugin-needed").show();
        this.feedPluginDownloadLink(dev);
    };

    DeviceListView.prototype.showPluginUpdateNeeded = function(dev) {
        $("#plugin-update-needed").show();
        this.feedPluginDownloadLink(dev);
    };

    DeviceListView.prototype.volumeMute = function() {
        this.volumeViewChange();
        this.volumeChange();
    };

    DeviceListView.prototype.volumeViewChange = function() {
        var mute = Cookies.get("mute") || false;
        if (mute) {
            $(".volume-open").hide();
            $(".volume-mute").show();
            $("#volume-bar").slider("value", 0);
        } else {
            $(".volume-open").show();
            $(".volume-mute").hide();
            var volume = Cookies.get("volume") || 0;
            $("#volume-bar").slider("option", "value", volume);
        }
    };

    DeviceListView.prototype.volumeOpen = function() {
        this.volumeViewChange();
        this.volumeChange();
    };

    DeviceListView.prototype.volumeChangeCallback = function() {
        this.volumeViewChange();
        this.volumeChange();
    };

    DeviceListView.prototype.volumeChange = function() {
        var volume = $("#volume-bar").slider("option", "value");
        var activeDev = this.model.findActiveDeviceArr()[0];
        if (activeDev.pluginPlayer) {
            activeDev.pluginPlayer.setVolume(volume);
        };
    };

    DeviceListView.prototype.updatePluginPlayerView = function(dev) {
        if (dev) {
            $("#plugin-player-set").css(dev.currentVideoResolution.playerContainerCss.player);
            $("#loading-img-container").css(dev.currentVideoResolution.playerContainerCss.loadingImg);
            $("#loading-tips-text").css(dev.currentVideoResolution.playerContainerCss.loadingTips);
            $(".control-board").css(dev.currentVideoResolution.playerContainerCss.controlBoard);
            $("#disable-control-cover").show();
            this.volumeViewChange();
        };
    };

    DeviceListView.prototype.updatePlayerObjView = function(dev) {
        if (dev && dev.isActive) {
            var tmpFunc = $.proxy(function() {
                this.normalizePluginPlayerObj();
                $("#disable-control-cover").hide();
                var code = dev.currentVideoResolution.pluginStreamResCode;
                $("#resolution-select").val(code);
                this.updateSelectWidget("#resolution-select");
            }, this);
            if (!this.hasShownPluginUpdateConfirm && dev.product.liveStreamConf.playerType.newestVersion) {
                var pluginPlayerElementId = dev.product.liveStreamConf.playerType.mimetypeCssMap[dev.product.liveStreamConf.mimeType];
                var playerObj = document.getElementById(pluginPlayerElementId);
                if (this.pluginHasUpdate(dev, playerObj)) {
                    this.hasShownPluginUpdateConfirm = true;
                    this.showPluginUpdateConfirm(dev, tmpFunc);
                } else {
                    tmpFunc();
                }
            } else {
                tmpFunc();
            }
        };
    };

    DeviceListView.prototype.updateSelectWidget = function(elementId) {
        $(elementId).Select({
            slideOptionHeight: 16
        });
    };

    DeviceListView.prototype.updateResolutionSelect = function(dev) {
        if (dev) {
            $("#resolution-select").empty();
            var resArr = dev.product.liveStreamConf.supportVideoResArr;
            for (var i = 0; i < resArr.length; i++) {
                $("#resolution-select").append("<option name=" + resArr[i].name + " value=" + resArr[i].pluginStreamResCode + ">" + resArr[i].str + "</option>");
            };
            $("#resolution-select option:first-child").attr("selected", true);
            this.updateSelectWidget("#resolution-select");
        };
    };

    DeviceListView.prototype.minimizePluginPlayerObj = function() {
        var dev = this.model.findActiveDeviceArr()[0];
        if (dev) {
            var playerType = dev.product.liveStreamConf.playerType;
            var id = playerType.mimetypeCssMap[dev.product.liveStreamConf.mimeType];
            var ele = $("#" + id);
            if (this.isShowing(ele)) {
                ele.css("width", 1);
                ele.css("height", 1);
            }
        };
    };

    DeviceListView.prototype.normalizePluginPlayerObj = function() {
        var dev = this.model.findActiveDeviceArr()[0];
        if (dev) {
            var playerType = dev.product.liveStreamConf.playerType;
            var id = playerType.mimetypeCssMap[dev.product.liveStreamConf.mimeType];
            var ele = $("#" + id);
            if (this.isShowing(ele)) {
                if (dev.currentVideoResolution.pluginPlayerObjCss) {
                    $("#" + id).css(dev.currentVideoResolution.pluginPlayerObjCss.css);
                } else {
                    $("#" + id).css("width", dev.currentVideoResolution.playerContainerCss.player.width);
                    $("#" + id).css("height", dev.currentVideoResolution.playerContainerCss.player.height);
                }
            };
        };
    };

    DeviceListView.prototype.renderPluginVideoLoading = function(dev) {
        if (dev && dev.isActive) {
            this.minimizePluginPlayerObj();
            $("#plugin-player-set").show();
            $("#loading-img-container").show();
        };
    };

    DeviceListView.prototype.renderPluginPlayer = function() {
        $("#plugin-player-set").show();
        $("#plugin-player-container").show();
        $("#loading-img-container").hide();
    };

    DeviceListView.prototype.hidePluginPlayers = function(device) {
        if (device && device.isActive) {
            var playerType = device.product.liveStreamConf.playerType;
            var id = playerType.mimetypeCssMap[device.product.liveStreamConf.mimeType];
            $("#" + id).hide();
            $("#plugin-player-set").hide();
        };
    };

    DeviceListView.prototype.recordStart = function() {
        var device = this.model.findActiveDeviceArr()[0];
        if (device) {
            var ieRecordMask = device.pluginPlayer.playerObj.Record();
            if (browser.type.indexOf("MSIE") >= 0 && ieRecordMask) {
                this.showRecordStart();
            };
        };
    };

    DeviceListView.prototype.showRecordStart = function() {
        $("#video-record-start").hide();
        $("#video-record-stop").show();
    };

    DeviceListView.prototype.recordStop = function() {
        $("#video-record-start").show();
        $("#video-record-stop").hide();
        var device = this.model.findActiveDeviceArr()[0];
        if (device) {
            device.pluginPlayer.playerObj.StopRecord();
        };
    };

    DeviceListView.prototype.recordCallback = function(record) {
        var contextMinimize = $.proxy(this.minimizePluginPlayerObj, this);
        var contextNormalize = $.proxy(this.normalizePluginPlayerObj, this);
        if (record == 0) {
            this.showRecordStart();
        } else if (record == 1) {
            this.recordStop();
        } else if (record == 2) {
            this.recordStop();
            msg({
                type: "alert",
                info: tips.actions.record.interrupt.networkError,
                beforeInit: contextMinimize,
                afterClose: contextNormalize
            });
        } else if (record == 3) {
            this.minimizePluginPlayerObj();
            this.recordStop();
            msg({
                type: "alert",
                info: tips.actions.record.interrupt.diskFull,
                beforeInit: contextMinimize,
                afterClose: contextNormalize
            });
        } else if (record == 4) {
            this.minimizePluginPlayerObj();
            this.recordStop();
            msg({
                type: "alert",
                info: tips.actions.record.interrupt.timeup,
                beforeInit: contextMinimize,
                afterClose: contextNormalize
            });
        }
    };

    DeviceListView.prototype.snapshotCallback = function(shoot) {
        var contextMinimize = $.proxy(this.minimizePluginPlayerObj, this);
        var contextNormalize = $.proxy(this.normalizePluginPlayerObj, this);
        if (shoot == 3) {
            msg({
                type: "alert",
                info: tips.actions.snapshot.diskFull,
                beforeInit: contextMinimize,
                afterClose: contextNormalize
            });
        };
    };

    DeviceListView.prototype.showWatchHideSon = function() {
        $("#watch").show();
        $("#watch").children().hide();
    };

    DeviceListView.prototype.showReloadTips = function() {
        this.showWatchHideSon();
        $("#reloadtips").show();
    };

    DeviceListView.prototype.timeupCallback = function(code) {
        if (code == 0) {
            this.showTimeout();
        }
        if (code == 1) {
            this.showReloadTips();
        };

        if (this.isShowing($("#video-record-start"))) {
            this.recordStop();
        };
    };

    DeviceListView.prototype.isRecording = function() {
        return this.isShowing($("#video-record-stop"));
    };

    DeviceListView.prototype.takePicture = function() {
        var device = this.model.findActiveDeviceArr()[0];
        if (device) {
            device.pluginPlayer.playerObj.Snapshot("snapshot");
        };
    };

    DeviceListView.prototype.setZoom = function() {
        var device = this.model.findActiveDeviceArr()[0];
        if (device) {
            var step = $("#zoom-bar").slider("option", "step");
            var val = $("#zoom-bar").slider("option", "value");
            var times = val / step + 1;
            device.pluginPlayer.playerObj.SetVideoZoom(parseInt(times));
        };
    };

    DeviceListView.prototype.setResolution = function() {
        var val = $("#resolution-select").val();
        var device = this.model.findActiveDeviceArr()[0];
        if (device && device.pluginPlayer) {
            device.pluginPlayer.setResolution(val);
            this.updatePlayerObjView(device);
        };
    };

    DeviceListView.prototype.pluginHasUpdate = function(dev, playerObj) {
        var result = false;
        if (dev && playerObj) {
            var currentVersion;
            if (browser.type.indexOf("MSIE") >= 0) {
                currentVersion = playerObj.iepluginversion;
            } else {
                currentVersion = playerObj.version;
            };
            var newestVersion = dev.product.liveStreamConf.playerType.newestVersion;
            result = compareVersion(currentVersion, newestVersion) < 0;
        };
        return result;
    };

    DeviceListView.prototype.showPluginUpdateConfirm = function(dev, continueFunc) {
        if (dev && continueFunc) {
            msg({
                type: "confirm",
                info: tips.types.plugin.update,
                btnConfirm: "Download",
                confirm: function() {
                    window.location.href = dev.product.liveStreamConf.playerType.downloadPath;
                    continueFunc();
                },
                cancel: continueFunc
            })
        };
    };

    DeviceListView.prototype.showOfflineCallback = function() {
        var dev = this.model.findActiveDeviceArr()[0];
        if (dev) {
            this.showWatchHideSon();
            this.showDeviceOffline(dev);
        };
    };

    DeviceListView.prototype.pluginPlayVideo = function(dev) {
        if (dev && dev.isActive) {
            var playerType = dev.product.liveStreamConf.playerType;
            this.pluginPlayerManageBoard();
            var id = playerType.mimetypeCssMap[dev.product.liveStreamConf.mimeType];
            $("#" + id).show();
            if (this.isEnvSupportPluginPlay(dev)) {
                if (this.isPluginNeedUpgrade(dev)) {
                    this.hidePluginPlayers(dev);
                    this.showPluginUpdateNeeded(dev);
                } else {
                    if (undefined == dev.pluginPlayer) {
                        var tmpPlayer = null;
                        var videoCodecPlayerMap = {
                            "mjpeg": MjpegPluginPlayer,
                            "h264": H264PluginPlayer
                        };
                        var codecName = dev.product.liveStreamConf.videoCodec.name;
                        tmpPlayer = new(videoCodecPlayerMap[codecName])();

                        tmpPlayer.playerObj = document.getElementById(id);
                        tmpPlayer.device = dev;
                        dev.pluginPlayer = tmpPlayer;

                        var contextPluginVideoLoadingRenderFunc = $.proxy(this.renderPluginVideoLoading, this);
                        var contextPluginPlayerRender = $.proxy(this.renderPluginPlayer, this);
                        var contextUpdatePlayerObjView = $.proxy(this.updatePlayerObjView, this);
                        var contextShowOffline = $.proxy(this.showOfflineCallback, this);
                        var args = {
                            recordCallback: $.proxy(this.recordCallback, this),
                            snapshotCallback: $.proxy(this.snapshotCallback, this),
                            timeupCallback: $.proxy(this.timeupCallback, this),
                            videoLoadingRenderFunc: contextPluginVideoLoadingRenderFunc,
                            pluginPlayerRender: contextPluginPlayerRender,
                            updatePlayerObjView: contextUpdatePlayerObjView,
                            showOffline: contextShowOffline
                        };

                        dev.pluginPlayer.initPluginPlayer(args);
                    };
                    this.updatePluginPlayerView(dev);
                    dev.pluginPlayer.volume = $("#volume-bar").slider("option", "value");
                    this.updateResolutionSelect(dev);
                    this.model.playedDeviceChanged = false;
                    dev.pluginPlayer.triggerPlay();
                }
            } else {
                this.hidePluginPlayers(dev);
                this.showPluginNeed(dev);
            }
        };
    };

    DeviceListView.prototype.flashManageBoard = function() {
        $("#flash-player-container").show();
        $("#flash-player-container").children().hide();
    };

    DeviceListView.prototype.renderFlashCover = function(device) {
        if (device && device.isActive) {
            this.flashManageBoard();
            var width = device.currentVideoResolution.playerContainerCss.player.width;
            var height = device.currentVideoResolution.playerContainerCss.player.height;
            $("#flash-player-cover").width(width).height(height);
            $("#flash-player-cover").show();
            $("#flash-player-cover").children().hide();
            $("#flash-player-cover .loading-tips").css({
                "display": "table-cell"
            });
        };
    };

    DeviceListView.prototype.renderFlashPlayer = function(device) {
        if (device && device.isActive) {
            $("#flash-player").show();
        };
    };

    DeviceListView.prototype.hideFlashCover = function() {
        $("#flash-player-cover").hide();
    };

    DeviceListView.prototype.renderFlashNetError = function(device) {
        if (device && device.isActive) {
            this.flashManageBoard();
            var width = device.currentVideoResolution.playerContainerCss.player.width;
            var height = device.currentVideoResolution.playerContainerCss.player.height;
            $("#flash-player-cover").width(width).height(height);
            $("#flash-player-cover").show();
            $("#flash-player-cover").children().hide();
            $("#flash-player-cover .network-tips").css({
                "display": "table-cell"
            });
        };
    };

    

    DeviceListView.prototype.flashPlayVideo = function(dev) {
        if (dev && dev.isActive) {
            this.flashManageBoard();
            if (undefined == dev.nonPluginPlayer) {
                var tmpPlayer = new RtmpPlayer();
                tmpPlayer.playerElementId = "flash-player";
                tmpPlayer.device = dev;

                var tmpTimer = new Timer();
                tmpTimer.timeout = dev.relayVideoTime * 1000;
                var contextShowFunc = $.proxy(this.showTimeout, this);
                tmpTimer.timeoutCallback.add(contextShowFunc);
                var contextFunc = $.proxy(tmpPlayer.back2Idle, tmpPlayer);
                tmpTimer.timeoutCallback.add(contextFunc);
                tmpPlayer.timer = tmpTimer;

                var contextCoverFunc = $.proxy(this.renderFlashCover, this);
                var contextHideCoverFunc = $.proxy(this.hideFlashCover, this);
                var contextFlashFunc = $.proxy(this.renderFlashPlayer, this);
                var contextFlashNetErr = $.proxy(this.renderFlashNetError, this);

                tmpPlayer.coverRenderFunc = contextCoverFunc;
                tmpPlayer.playerRenderFunc = contextFlashFunc;
                tmpPlayer.netErrRenderFunc = contextFlashNetErr;
                tmpPlayer.hideCoverFunc = contextHideCoverFunc;

                dev.nonPluginPlayer = tmpPlayer;
                dev.nonPluginPlayer.initPlayer();
            };
            this.model.playedDeviceChanged = false;
            dev.nonPluginPlayer.triggerPlay();
        };
    };

    DeviceListView.prototype.showTimeout = function() {
        this.hideViewSettingContent();
        this.liveViewManageBoard();
        var device = this.model.findActiveDeviceArr()[0];
        if (device) {
            this.showWatchHideSon();
            $("#continuetips").show();
            var maxVideoTime = "10 minutes";
            var currentDeviceTimeUpLength = device.relayVideoTime;
            if (currentDeviceTimeUpLength < 3600) {
                maxVideoTime = (currentDeviceTimeUpLength / 60).toFixed(0) + " minute(s)";
            } else if (currentDeviceTimeUpLength < 86400) {
                maxVideoTime = (currentDeviceTimeUpLength / 3600).toFixed(0) + " hour(s)";
            } else {
                maxVideoTime = (currentDeviceTimeUpLength / 86400).toFixed(0) + " day(s)";
            }
            $("#max-relay-video-time").text(maxVideoTime);
        };
    };

    DeviceListView.prototype.imgPlayerManageBoard = function() {
        $("#img-tag-player-container").show();
        $("#img-tag-player-container").children().hide();
    };

    DeviceListView.prototype.renderImgCover = function(device) {
        if (device && device.isActive) {
            this.imgPlayerManageBoard();
            var width = device.currentVideoResolution.playerContainerCss.player.width;
            var height = device.currentVideoResolution.playerContainerCss.player.height;
            $("#img-player-cover").width(width).height(height);
            $("#img-player-cover").show();
            $("#img-player-cover").children().hide();
            $("#img-player-cover .loading-tips").css({
                "display": "table-cell"
            });
        };
    };

    DeviceListView.prototype.renderImgNetError = function(device) {
        if (device && device.isActive) {
            this.imgPlayerManageBoard();
            var width = device.currentVideoResolution.playerContainerCss.player.width;
            var height = device.currentVideoResolution.playerContainerCss.player.height;
            $("#img-player-cover").width(width).height(height);
            $("#img-player-cover").show();
            $("#img-player-cover").children().hide();
            $("#img-player-cover .network-tips").css({
                "display": "table-cell"
            });
        };
    };


    DeviceListView.prototype.renderImgPlayer = function(device) {
        if (device && device.isActive) {
            this.imgPlayerManageBoard();
            $("#img-player").show();
            $("#audio-player").show();
        };
    };

    DeviceListView.prototype.imgPlayVideo = function(dev) {
        if (dev && dev.isActive) {
            this.imgPlayerManageBoard();
            if (undefined == dev.nonPluginPlayer) {
                var tmpPlayer = new ImgPlayer();
                tmpPlayer.playerElementId = "img-player";
                tmpPlayer.audioPlayerElementId = "audio-player";
                tmpPlayer.device = dev;

                var tmpTimer = new Timer();
                tmpTimer.timeout = dev.relayVideoTime * 1000;
                var contextShowFunc = $.proxy(this.showTimeout, this);
                tmpTimer.timeoutCallback.add(contextShowFunc);
                var contextFunc = $.proxy(tmpPlayer.back2Idle, tmpPlayer);
                tmpTimer.timeoutCallback.add(contextFunc);
                tmpPlayer.timer = tmpTimer;

                var contextCoverFunc = $.proxy(this.renderImgCover, this);
                var contextPlayerFunc = $.proxy(this.renderImgPlayer, this);
                var contextNetErr = $.proxy(this.renderImgNetError, this);

                tmpPlayer.coverRenderFunc = contextCoverFunc;
                tmpPlayer.playerRenderFunc = contextPlayerFunc;
                tmpPlayer.netErrRenderFunc = contextNetErr;

                dev.nonPluginPlayer = tmpPlayer;
                dev.nonPluginPlayer.initPlayer();
            };
            this.model.playedDeviceChanged = false;
            dev.nonPluginPlayer.triggerPlay();
        };
    };
    
    DeviceListView.prototype.isPluginPlayer = function(playerType) {
        if (undefined == playerType) {
            console.error("args error in isPluginPlayer")
        };
        var pluginPlayers = [globalPlayerTypes.PLUGIN_NON_IE_X86, globalPlayerTypes.PLUGIN_NON_IE_X64, 
        globalPlayerTypes.PLUGIN_IE_X86, globalPlayerTypes.PLUGIN_IE_X64, globalPlayerTypes.PLUGIN_MAC];
        return $.inArray(playerType, pluginPlayers) >= 0;
    };

    DeviceListView.prototype.showDeviceOffline = function(dev) {
        if (dev != undefined) {
            var displayName = dev.name || "Baby Cam";
            $(".dev-setting-name").text(displayName);
            $("#refreshtips").show();
        } else {
            console.log("args error in showDeviceOffline");
        }
    };

    DeviceListView.prototype.pluginPlayerManageBoard = function() {
        $("#plugin-player-set").show();
        $("#plugin-player-container").show();
        $("#plugin-player-container").children().hide();
    };

    DeviceListView.prototype.playVideo = function(dev) {
        if (undefined == dev) {
            console.error("args error in playVideo")
        };
        var playerType = dev.product.liveStreamConf.playerType;
        if (dev.isOnline == 1) {
            if (this.isPluginPlayer(playerType)) {
                this.pluginPlayVideo(dev);
            } else if (playerType == globalPlayerTypes.FLASH_PLAYER) {
                this.flashPlayVideo(dev);
            } else if (playerType == globalPlayerTypes.IMG_PLAYER) {
                this.imgPlayVideo(dev);
            } else {
                console.info("can not play without player object");
            }
        } else {
            this.showDeviceOffline(dev);
        }
    };

    DeviceListView.prototype.showPlaying = function() {
        var activeDev = this.model.findActiveDeviceArr()[0];
        this.hideViewSettingContent();
        this.liveViewManageBoard();
        this.playVideo(activeDev);
    };

    DeviceListView.prototype.showLiveView = function() {
        if (this.isNeedRefreshPlaying()) {
            this.showPlaying();
        };
    };

    DeviceListView.prototype.findWatchShowingElement = function() {
        var showingElements = [];
        var currentView = this;
        $("#watch").children().each(function(i, d) {
            if (currentView.isShowing($(this))) {
                showingElements.push($(this).attr("id"));
            };
        });
        return showingElements;
    };

    DeviceListView.prototype.isNeedRefreshPlaying = function() {
        var result = true;
        if (this.model.playedDeviceChanged == true) {
            result = true;
        } else {
            var elementIdFlagMap = {
                "plugin-player-set": false,
                "flash-player-container": false,
                "img-tag-player-container": false,
                "refreshtips": false,
                "reloadtips": false,
                "continuetips": false
            };
            var res = this.findWatchShowingElement();
            if (res.length > 1 || res.length <= 0) {
                result = true;
            };
            result = elementIdFlagMap[res[0]] == undefined ? true : elementIdFlagMap[res[0]];
        }
        return result;
    };

    DeviceListView.prototype.showUnsupporttedBrowserTips = function() {
        $("#plugin-unusable").show();
    };

    /***************************Common tips********************************/
    DeviceListView.prototype.showNoDeviceTips = function() {
        $("#no-camera").show();
    };

    DeviceListView.prototype.showCrossRegionTip = function() {
        $("#device-cross-region").show();
    };

    DeviceListView.prototype.commonTipsManageBoard = function() {
        this.hideViewSettingContent();
        this.commonTipsDOM.show();
        this.hideCommonTipsChild();
    };

    DeviceListView.prototype.showNeedOrFailedUpgrade = function(device) {
        if (device.hasUpgradOnce) {
            this.showFirmwareUpgradeFailed();
        } else {
            this.showFirmwareUpgradeNeeded();
        }
    };

    DeviceListView.prototype.showFirmwareUpgradeNeeded = function() {
        $("#firmware-need-upgrade").show();
    };

    DeviceListView.prototype.showFirmwareUpgradeFailed = function() {
        $("#upgrade-failed").show();
    };

    DeviceListView.prototype.showFirmwareDownloading = function() {
        $("#downloading").show();
    };

    DeviceListView.prototype.showFirmwareUpgrading = function() {
        $("#upgrading").show();
    };

    DeviceListView.prototype.showUpgradeState = function(device) {
        if (undefined == device) {
            console.error("args error in showUpgradeState");
        };

        if (device.isActive) {
            var statusFuncMap = {
                "normal": this.showNeedOrFailedUpgrade,
                "downloading": this.showFirmwareDownloading,
                "upgrading": this.showFirmwareUpgrading
            };
            var func = statusFuncMap[device.systemStatus] || $.noop;
            var contextFunc = $.proxy(func, this);
            contextFunc(device);
        };
    };

    /***************************setting********************************/
    DeviceListView.prototype.settingManageBoard = function() {
        this.hideViewSettingContent();
        this.settingDOM.show();
        this.hideSettingChild();
    };

    DeviceListView.prototype.showDeviceSetting = function(device) {
        if (undefined == device) {
            console.error("args error in showDeviceSetting");
        };
        var deviceName = device.name || "-";
        var deviceType = device.model || "-";
        var deviceMac = device.mac || "-";
        var localIp = device.iip || "-";
        $("#device-name").val(deviceName);
        $(".dev-setting-name").text(deviceName);
        $("#dev-setting-model").text(deviceType);
        $("#dev-setting-mac").text(deviceMac);
        $("#dev-setting-ip").text(localIp);
    };

    DeviceListView.prototype.showSetting = function() {
        var activeDev = this.model.findActiveDeviceArr()[0];
        if (activeDev) {
            $("#setting .setting-content").show();
            this.showDeviceSetting(activeDev);

            if (activeDev.iip == undefined) {
                var args = {
                    id: activeDev.id,
                    token: activeDev.owner.token,
                    appServerUrl: activeDev.appServerUrl
                };
                activeDev.getLocalInfo(args);
            };
        } else {
            console.error("args error in showSetting");
        }
    };

    DeviceListView.prototype.updateDeviceInfo = function(device) {
        if (undefined == device) {
            console.error("args error in updateDeviceInfo");
        };

        this.updateDeviceLi(device);

        if (device.isActive) {
            this.clearBoardAndShow();
        };
    };

    DeviceListView.prototype.init = function() {
        $("select.select").Select();

        $("#volume-bar").slider({
            range: "min",
            value: 100,
            min: 0,
            max: 100
        });
        $("#zoom-bar").slider({
            range: "min",
            value: 0,
            min: 0,
            step: 30,
            max: 90
        });
        $("#zoom-bar .ui-slider-handle").attr("title", "X1");
        window.jwplayer = jwplayer;
        jwplayer.key="Q7prBpNAUq59WydJuuhAu5iB6IhW8cfa1zgHDg==";
    };

    return DeviceListView;
    
});