define(['PlayableDeviceList', 'DeviceListView', 'BaseController', 'inheritPrototype', 
    'tips', 'jquery', 'aop', 'stopReasonCodeMap', 'msg', 'PlayableDevice', 'NonPluginPlayer',
    'PluginPlayer', 'Cookies'], 
    function (PlayableDeviceList, DeviceListView, BaseController, inheritPrototype, 
        tips, $, aop, stopReasonCodeMap, msg, PlayableDevice, NonPluginPlayer,
        PluginPlayer, Cookies) {
    
    function DeviceListController() {
        BaseController.call(this, arguments);
        this.intervalUpdateDeviceListTime = 60000;
        this.intervalUpdateDeviceListObj = null;
        this.activateUserAdminCallback = $.Callbacks("unique stopOnFalse");
    }
    inheritPrototype(DeviceListController, BaseController);

    DeviceListController.prototype.initHandler = function() {
        var appendedSelectorHandlerMap = {
            "#dev-right-arrow": {
                "click": this.showNextDevicePage
            },
            "#dev-left-arrow": {
                "click": this.showPreDevicePage
            },
            "#dev-setting-save": {
                "click": this.changeDeviceName
            },
            "#dev-setting-remove": {
                "click": this.makeRemoveConfirm
            },
            "#live-view-tab": {
                "click": this.liveView
            },
            "#setting-tab": {
                "click": this.settingShow
            },
            "#reload": {
                "click": this.refreshCameraInfo
            },
            ".dev-item": {
                "click": this.changeActiveDevice
            },
            "#upgrade-device": {
                "click": this.upgradeDevice
            },
            "#volume-bar": {
                "slidestop": this.volumeChangeCallback
            },
            "#zoom-bar": {
                "slidestop": this.setZoom
            },
            "#continue": {
                "click": this.continuePlay
            },
            "#refresh": {
                "click": this.refreshCameraInfo
            },
            "#zoom-in": {
                "click": this.zoomIn
            },
            "#zoom-out": {
                "click": this.zoomOut
            },
            "#take-picture": {
                "click": this.takePicture
            },
            "#video-record-start": {
                "click": this.videoRecordStart
            },
            "#video-record-stop": {
                "click": this.videoRecordStop
            },
            ".volume-open": {
                "click": this.volumeMute
            },
            ".volume-mute": {
                "click": this.volumeOpen
            },
            "#resolution-select": {
                "beforeChange": this.beforeChangeRes,
                "change": this.setResolution
            },
            "#failed-back-button": {
                "click": this.upgradeFailedBack
            },
            "#account": {
                "click": this.accountTabClickCallback
            }
        };

        var contextBeforeLeave = $.proxy(this.beforeLeave, this);
        var contextOnLeave = $.proxy(this.onLeavePage, this);

        window.onbeforeunload = contextBeforeLeave;
        window.onunload = contextBeforeLeave;

        var selectorMsgProduceFuncMap = {
            ".dev-item": function() {
                return $(this).attr("id");
            },
            "#dev-setting-save": function() {
                return $.trim($("#device-name").val());
            }
        };

        this.batchInitHandler(appendedSelectorHandlerMap, selectorMsgProduceFuncMap);
    };

    DeviceListController.prototype.accountTabClickCallback = function() {
        if (!$("#account").hasClass("navselected")) {
            this.clearPageRubbish();
            this.activateUserAdminCallback.fire();
        };
    };

    DeviceListController.prototype.recordBreakConfirm = function() {
        var res = true;
        if (this.view.isRecording()) {
            var confirmRes = confirm(tips.actions.record.interrupt.optionTips);
            if (!confirmRes) {
                res = false;
            } else {
                this.view.recordStop();
            }
        }
        return res;
    };

    DeviceListController.prototype.beforeChangeRes = function() {
        var canChangeFlag = this.recordBreakConfirm();
        $("#resolution-select").data("canChange", canChangeFlag);
    };

    DeviceListController.prototype.onLeavePage = function() {
        this.clearPageRubbish(stopReasonCodeMap.LEAVE_PAGE);
        var device = this.model.findActiveDeviceArr()[0];
        var player = this.view.getDevicePlayer(device, 'nonPluginPlayer');
        if (player) {
            player.statistics.send();
        }
    };

    DeviceListController.prototype.beforeLeave = function() {
        if (this.view.isRecording()) {
            return tips.actions.record.interrupt.optionTips;
        };
    };

    DeviceListController.prototype.clearPageRubbish = function(stopReasonCode) {
        clearInterval(this.intervalUpdateDeviceListObj);
        var activeDevArr = this.model.findActiveDeviceArr();
        for (var i = 0; i < activeDevArr.length; i++) {
            if (activeDevArr[i]) {
                var player = this.view.getDevicePlayer(activeDevArr[i], 'nonPluginPlayer');
                if (player) {
                    player.back2Idle(stopReasonCode);
                }
            };
            activeDevArr[i].isActive = false;
        };
        this.view.clearPageRubbish();
    };

    DeviceListController.prototype.setResolution = function() {

        var val = $("#resolution-select").val();
        var device = this.model.findActiveDeviceArr()[0];
        if (device) {
            for (var i = 0; i < device.product.supportVideoResArr.length; i++) {
                if (device.product.supportVideoResArr[i].pluginStreamResCode == val) {
                    device.currentVideoResolution = device.product.supportVideoResArr[i];
                };
            };
        };

        this.view.setResolution();
    };

    DeviceListController.prototype.volumeMute = function() {
        Cookies.set("mute", true);
        this.view.volumeMute();
    };

    DeviceListController.prototype.volumeOpen = function() {
        Cookies.remove("mute");
        this.view.volumeOpen();
    };

    DeviceListController.prototype.videoRecordStart = function() {
        this.view.recordStart();
    };

    DeviceListController.prototype.takePicture = function() {
        this.view.takePicture();
    };

    DeviceListController.prototype.videoRecordStop = function() {
        this.view.recordStop();
    };

    DeviceListController.prototype.zoomIn = function() {
        var step = $("#zoom-bar").slider("option", "step");
        var val = $("#zoom-bar").slider("option", "value");
        if (val >= step) {
            val -= step;
            $("#zoom-bar").slider("option", "value", val);
            this.setZoom();
        };
    };

    DeviceListController.prototype.zoomOut = function() {
        var step = $("#zoom-bar").slider("option", "step");
        var val = $("#zoom-bar").slider("option", "value");
        var max = $("#zoom-bar").slider("option", "max");
        if ((val + step) <= max) {
            val += step;
            $("#zoom-bar").slider("option", "value", val);
            this.setZoom();
        };
    };

    DeviceListController.prototype.setZoom = function() {
        var step = $("#zoom-bar").slider("option", "step");
        var val = $("#zoom-bar").slider("option", "value");
        var times = val / step + 1;
        $("#zoom-bar .ui-slider-handle").attr("title", "X" + times);
        this.view.setZoom();
    };

    DeviceListController.prototype.volumeChangeCallback = function() {
        Cookies.remove("mute");
        var volume = $("#volume-bar").slider("option", "value");
        Cookies.set("volume", volume);
        this.view.volumeChangeCallback();
    };

    DeviceListController.prototype.upgradeFailedBack = function() {
        var activeDev = this.model.findActiveDeviceArr()[0];
        activeDev.hasUpgradOnce = false;
        this.view.clearBoardAndShow();
    };

    DeviceListController.prototype.refreshCameraInfo = function() {
        var currentController = this;
        var activeDev = this.model.findActiveDeviceArr()[0];
        if (activeDev) {
            var args = {
                email: activeDev.owner.email,
                id: activeDev.id
            };
            var errorFunc = function() {
                if (activeDev.isActive) {
                    currentController.view.showWatchHideSon();
                    currentController.view.showDeviceOffline(activeDev);
                    currentController.view.renderMsg(tips.actions.refreshCamera.failed);
                }
            }
            var inputCallbacks = {
                "errorCodeCallbackMap": {
                    0: function() {
                        if (activeDev.isActive) {
                            currentController.view.showPlaying();
                        }
                    },
                    "-1": errorFunc
                },
                "errorCallback": errorFunc
            };
            var validateResult = activeDev.get(args, inputCallbacks)["validateResult"];
            if (validateResult != undefined && !validateResult.code) {
                console.error(validateResult.msg);
            };
        };
    };

    DeviceListController.prototype.continuePlay = function() {
        var activeDev = this.model.findActiveDeviceArr()[0];
        if (activeDev) {
            this.view.showPlaying();
        };
    };

    DeviceListController.prototype.changeDeviceName = function(newName) {
        var currentController = this;
        var activeDev = this.model.findActiveDeviceArr()[0];
        if (activeDev && activeDev.isActive) {
            if (activeDev.isOnline == 1) {
                if (newName != activeDev.name) {
                    var args = {
                        id: activeDev.id,
                        name: newName
                    };
                    var errorFunc = function() {
                        if (activeDev.isActive) {
                            currentController.view.renderMsg(tips.actions.changeIpcName.failed);
                        }
                    };
                    var notLoginErrFunc = function() {
                        if (activeDev.isActive) {
                            currentController.view.renderMsg(tips.actions.deviceOperate.notLogin);
                        }
                    };
                    var offlineErrFunc = function() {
                        if (activeDev.isActive) {
                            currentController.view.renderMsg(tips.types.camera.offline);
                        }
                    };
                    var inputCallbacks = {
                        "errorCodeCallbackMap": {
                            0: function() {
                                if (activeDev.isActive) {
                                    currentController.view.renderMsg(tips.actions.changeIpcName.success);
                                }
                            },
                            "-1": errorFunc,
                            "-20571": offlineErrFunc,
                            "-20651": notLoginErrFunc
                        },
                        "errorCallback": errorFunc
                    };
                    var validateResult = activeDev.changeName(args, inputCallbacks)["validateResult"];
                    if (validateResult != undefined && !validateResult.code) {
                        currentController.view.renderMsg(validateResult.msg);
                    };
                } else {
                    console.log("new name is equal to origin name");
                }
            } else {
                currentController.view.renderMsg(tips.types.camera.offline);
            }
        };
    };

    DeviceListController.prototype.makeRemoveConfirm = function() {
        var currentController = this;
        var activeDev = this.model.findActiveDeviceArr()[0];
        if (activeDev && activeDev.isActive) {
            $("#unbind-msg-body-sample #remove-dev-name").text(activeDev.name);
            $("#unbind-msg-body-sample #remove-dev-model").text(activeDev.model);
            msg({
                type: "confirm",
                info: $("#unbind-msg-body-sample").html(),
                height: 310,
                btnConfirm: "Remove",
                confirm: $.proxy(currentController.removeDevice, currentController)
            });
        };

    };

    DeviceListController.prototype.removeDevice = function() {
        var currentController = this;
        var activeDev = this.model.findActiveDeviceArr()[0];
        if (activeDev && activeDev.isActive) {
            if (activeDev.isOnline == 1) {
                var args = {
                    id: activeDev.id,
                    account: activeDev.owner.account
                };
                var errorFunc = function() {
                    if (activeDev.isActive) {
                        currentController.view.renderMsg(tips.actions.deviceOperate.failed);
                    }
                };
                var notLoginErrFunc = function() {
                    if (activeDev.isActive) {
                        currentController.view.renderMsg(tips.actions.deviceOperate.notLogin);
                    }
                };
                var offlineErrFunc = function() {
                    if (activeDev.isActive) {
                        currentController.view.renderMsg(tips.types.camera.offline);
                    }
                };
                var inputCallbacks = {
                    "errorCodeCallbackMap": {
                        0: function() {
                            currentController.getDeviceList();
                        },
                        "-1": errorFunc,
                        "-20571": offlineErrFunc,
                        "-20651": notLoginErrFunc
                    },
                    "errorCallback": errorFunc
                };
                var validateResult = activeDev.unbind(args, inputCallbacks)["validateResult"];
                if (validateResult != undefined && !validateResult.code) {
                    currentController.view.renderMsg(validateResult.msg);
                };
            } else {
                currentController.view.renderMsg(tips.types.camera.offline);
            };

        };
    };

    DeviceListController.prototype.showNextDevicePage = function() {
        this.view.renderNextDevicePage();
    };

    DeviceListController.prototype.changeActiveDevice = function(elementId) {
        var index = elementId.replace(this.view.deviceLiDomIdPrefix, '');
        var tmpNewActiveDeviceIndex = parseInt(index);
        if (undefined == tmpNewActiveDeviceIndex) {
            console.error("can not find device index");
        };
        var lastActiveDevice = this.model.findActiveDeviceArr()[0];
        var newActiveDevice = this.model.devices[tmpNewActiveDeviceIndex];
        if (lastActiveDevice != newActiveDevice) {
            this.clearPlayerRubbish();
            this.model.changeActiveDevice(lastActiveDevice, newActiveDevice);
            this.view.updateActiveDeviceCss();
            this.view.clearBoardAndShow();
        };
    };

    DeviceListController.prototype.upgradeDevice = function() {
        var currentController = this;
        var activeDev = this.model.findActiveDeviceArr()[0];
        var mac = activeDev.mac.toLowerCase().match(/.{2}/g).join(":");
        if (activeDev) {
            if (activeDev.isOnline) {
                var args = {
                    fwUrl: activeDev.fwUrl,
                    mac: activeDev.mac,
                    azIP: activeDev.azIP,
                    azDNS: activeDev.azDNS
                }
                var inputCallbacks = {
                    "errorCodeCallbackMap": {
                        0: function() {
                            currentController.intervalUpdateDeviceList();
                        },
                        "-1": function() {
                            if (activeDev.isActive) {
                                currentController.view.renderMsg(tips.actions.deviceOperate.failed);
                            }
                        }
                    }
                };
                activeDev.upgrade(args, inputCallbacks);
            } else {
                this.view.renderMsg(tips.types.camera.offline);
            }
        };
    };

    DeviceListController.prototype.showPreDevicePage = function() {
        this.view.renderPreDevicePage();
    };

    DeviceListController.prototype.settingShow = function() {
        this.view.highlightTab($("#setting-tab"));
        this.view.clearBoardAndShow();
    };

    DeviceListController.prototype.clearPlayerRubbish = function() {
        var activeDev = this.model.findActiveDeviceArr()[0];
        if (activeDev) {
            var nonPluginPlayer = this.view.getDevicePlayer(activeDev, 'nonPluginPlayer');
            nonPluginPlayer && nonPluginPlayer.back2Idle(stopReasonCodeMap.LEAVE_PAGE);
            var pluginPlayer = this.view.getDevicePlayer(activeDev, 'pluginPlayer');
            pluginPlayer && pluginPlayer.back2Idle();
        };
        return true;
    };

    DeviceListController.prototype.liveView = function() {
        if (!$("#live-view-tab").hasClass("admin-nav-li-select")) {
            this.view.highlightTab($("#live-view-tab"));
            this.view.clearBoardAndShow();
        };
    };

    DeviceListController.prototype.getDeviceList = function(extendArgs) {
        var currentController = this;
        var inputCallbacks = {
            "errorCodeCallbackMap": {
                0: function() {
                    currentController.view.renderBoard();
                }
            }
        };
        currentController.model.getDeviceList(inputCallbacks, extendArgs);
    };

    DeviceListController.prototype.intervalUpdateDeviceList = function() {
        var _self = this;
        clearInterval(_self.intervalUpdateDeviceListObj);
        _self.intervalUpdateDeviceListObj = setInterval(function() {
            _self.getDeviceList({
                "ajax": {
                    headers: {
                        "X-AutoRefresh": "true"
                    }
                },
                "data": {
                    "DATA": {
                        "X-AutoRefresh": "true"
                    }
                }
            });
        }, _self.intervalUpdateDeviceListTime);
    }

    DeviceListController.prototype.intervalUpdateDeviceListWithInit = function() {
        this.intervalUpdateDeviceList();
        this.getDeviceList();
    };


    DeviceListController.prototype.settingShow = (DeviceListController.prototype.settingShow || function() {})
        .before(DeviceListController.prototype.clearPlayerRubbish)
        .before(DeviceListController.prototype.recordBreakConfirm);
    DeviceListController.prototype.changeActiveDevice = (DeviceListController.prototype.changeActiveDevice || function() {})
        .before(DeviceListController.prototype.recordBreakConfirm);
    DeviceListController.prototype.accountTabClickCallback = (DeviceListController.prototype.accountTabClickCallback || function() {})
        .before(DeviceListController.prototype.clearPlayerRubbish)
        .before(DeviceListController.prototype.recordBreakConfirm);

    return DeviceListController;
})