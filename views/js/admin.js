$(function () {

    function User () {
        $.ipc.User.call(this, arguments);
        this.activateDeviceAdminCallback = $.Callbacks("unique stopOnFalse");
    };

    $.ipc.inheritPrototype(User, $.ipc.User);

    function UserController () {
        $.ipc.BaseController.call(this, arguments);
    }

    $.ipc.inheritPrototype(UserController, $.ipc.BaseController);

    UserController.prototype.initHandler = function() {
        var appendedSelectorHandlerMap = {
            "#logout": {"click": this.logoutUser},
            "#userinfo-title-changepwd": {"click": this.gotoChangePassword},
            "#backaccount": {"click": this.backaccountClickCallback},
            "#changepwd": {"click": this.changePassword},
            "#device": {"click": this.devTabClickCallback}
        };
        var selectorMsgProduceFuncMap = {};
        this.batchInitHandler(appendedSelectorHandlerMap, selectorMsgProduceFuncMap);
    };

    UserController.prototype.devTabClickCallback = function() {
        if(!$("#device").hasClass("navselected")) {
            this.view.renderDeviceAdmin();
            this.model.activateDeviceAdminCallback.fire();
        }
    };

    UserController.prototype.accountTabClickCallback = function() {
        if(!$("#account").hasClass("navselected")) {
            this.view.renderAccountAdmin();
        }
    };

    UserController.prototype.backaccountClickCallback = function() {
        this.view.renderAccountAdmin();
    };

    UserController.prototype.logoutUser = function() {
        var currentController = this;

        var args = {email: currentController.model.email};

        var errCodeTipsMap = {
            "-1": tips.actions.logout.failed
        };

        var inputCallbacks = {
            "errorCodeCallbackMap": {
                0: function() {
                    currentController.gotoPage("/");
                },
                "-1" : function() {
                    currentController.view.renderError(errCodeTipsMap["-1"]);
                }
            },
            "errorCallback" : function() {
                currentController.view.renderError(errCodeTipsMap["-1"]);
            }
        };

        var validateResult = currentController.model.logout(args, inputCallbacks);
        if (validateResult != undefined && !validateResult.code) {
            console.error(validateResult.msg);
        };
    };

    UserController.prototype.changePassword = function() {
        var currentController = this;
        var email = currentController.model.email;
        var password = $('#oldpwd').val();
        var newPassword = $('#newpwd').val();
        var newPasswordSecond = $("#cfpwd").val();
        var args = {
            account: currentController.model.account, 
            password: password, 
            newPassword: newPassword, 
            newPasswordSecond: newPasswordSecond
        };

        var errCodeTipsMap = {
            "-1": tips.actions.changePassword.failed,
            "1023": tips.types.password.wrongForChange,
            "1024": tips.types.password.wrongForChange
        };

        var inputCallbacks = {
            "errorCodeCallbackMap": {
                0: function() {
                    currentController.changePasswordSuccess();
                },
                "-1" : function() {
                    currentController.view.renderError(errCodeTipsMap["-1"]);
                },
                "1023": function() {
                    currentController.view.renderError(errCodeTipsMap["1023"]);
                },
                "1024": function() {
                    currentController.view.renderError(errCodeTipsMap["1024"]);
                }
            },
            "errorCallback" : function() {
                currentController.view.renderError(errCodeTipsMap["-1"]);
            }
        };
        var validateResult = currentController.model.modifyPassword(args, inputCallbacks);
        if (validateResult != undefined && !validateResult.code) {
            currentController.view.renderError(validateResult.msg);
        };
    
    };

    UserController.prototype.changePasswordSuccess = function() {
        var currentController = this;
        var alertOptions = {
            "info": tips.actions.changePassword.success,
            ok : function(){
                currentController.gotoPage("/");
            },
            cancel : function(){
                currentController.gotoPage("/");
            }
        };
        this.view.renderAlert(alertOptions);
    };

    UserController.prototype.gotoChangePassword = function() {
        this.view.renderChangePasswod();
    };

    UserController.prototype.gotoPage = function(page) {
        if (undefined == page) {
            console.error("error in gotoPage");
        };
        window.location.href = page;
    };


    function UserView () {
        this.model = null;
    }

    UserView.prototype.renderUserInfo = function() {
        if(undefined == this.model.email) {
            console.error("args error in showWelcomeInfo");
            return;
        };
        $("#welcomeinfo").show();
        $("#welcome_username").text(this.model.email);
        $('#userinfo-email').text(this.model.email);
    };

    UserView.prototype.renderError = function(errorMsg) {
        if (undefined == errorMsg) {
            console.error("args error in renderError");
        };

        this.renderAlert({"info": errorMsg});
    };

    UserView.prototype.renderAlert = function(options) {
        if (undefined == options) {
            console.error("args error in renderAlert");
        };

        var alertOptions = {
            "type": "alert"
        };
        $.extend(true, alertOptions, options);
        $.ipc.Msg(alertOptions);
    };

    UserView.prototype.hideAccountMainBoardSon = function() {
        $(".account-content").children().hide();
    };

    UserView.prototype.hideAdmin = function() {
        $(".main-content").hide();
    };

    UserView.prototype.showAccountAdmin = function() {
        $(".account-content").show();
    };

    UserView.prototype.showDeviceAdmin = function() {
        $(".device-content").show();
    };

    UserView.prototype.hideDeviceWatchSon = function() {
        $("#watch").children().hide();
    };

    UserView.prototype.mainBoardPaddingTop = function(val) {
        val != undefined && $("#display-main-board").css("padding-top", val);
    };

    UserView.prototype.cssToggle = function(element) {
        var currentView = this;
        var elementChangeMap = {
            "#device": function() {
                currentView.activateNav("#device");
                $("#display-main-board").css("padding-top", "12px");
                $("#display-main-board").css("height", "712px");
                $(".main-content").css("width", "100%");
            },
            "#account": function() {
                currentView.activateNav("#account");
                $("#display-main-board").css("padding-top", "25px");
                $("#display-main-board").css("height", "inherit");
                $(".main-content").css("width", "1000px");
            }
        };

        var changeFunc = elementChangeMap[element] || $.noop;
        changeFunc();
    };

    UserView.prototype.renderDeviceAdmin = function() {
        this.hideAdmin();
        this.cssToggle("#device");
        this.showDeviceAdmin()
        this.hideDeviceWatchSon();
        $("#watch > #flash-player-container").show();
    };

    UserView.prototype.activateNav = function(elementSelector) {
        elementSelector != undefined && 
        $(".navstitle-title").removeClass("navselected") &&
        $(elementSelector).addClass("navselected");
    };

    UserView.prototype.renderAccountAdmin = function() {
        this.hideAdmin();
        this.cssToggle("#account");
        this.showAccountAdmin();
        this.hideAccountMainBoardSon();
        $(".account-content > .account-information").show();
    }

    UserView.prototype.renderChangePasswod = function() {
        this.showAccountAdmin()
        this.hideAccountMainBoardSon();
        $(".account-content > .change-password-form").show();
    };

    var u = new User();
    var uv = new UserView();
    var uc = new UserController();
    uc.view = uv;
    uc.model = u;
    uv.model = u;

    var contextRenderUserFunc = $.proxy(uv.renderUserInfo, uv);
    User.prototype.readCookieDataCallbacks.add(contextRenderUserFunc);

    uc.initHandler();
    u.readDataFromCookie();

    function DeviceList() {
        $.ipc.DeviceList.call(this, arguments);
    };
    $.ipc.inheritPrototype(DeviceList, $.ipc.DeviceList);

    function DeviceListController() {
        $.ipc.BaseController.call(this, arguments);
        this.intervalUpdateDeviceListTime = 60000;
        this.intervalUpdateDeviceListObj = null;
        this.activateUserAdminCallback = $.Callbacks("unique stopOnFalse");
    }
    $.ipc.inheritPrototype(DeviceListController, $.ipc.BaseController);

    DeviceListController.prototype.initHandler = function() {
        var appendedSelectorHandlerMap = {
            "#dev-right-arrow": {"click": this.showNextDevicePage},
            "#dev-left-arrow": {"click": this.showPreDevicePage},
            "#dev-setting-save": {"click": this.changeDeviceName},
            "#dev-setting-remove": {"click": this.makeRemoveConfirm},
            "#live-view-tab": {"click": this.liveView},
            "#setting-tab": {"click": this.settingShow},
            "#reload": {"click": this.updateDeviceInfo},
            ".dev-item": {"click": this.changeActiveDevice},
            "#upgrade-device": {"click": this.upgradeDevice},
            "#volume-bar": {"slidestop": this.volumeChangeCallback},
            "#zoom-bar": {"slidestop": this.setZoom},
            "#continue": {"click": this.continuePlay},
            "#refresh": {"click": this.refreshCameraInfo},
            "#zoom-in": {"click": this.zoomIn},
            "#zoom-out": {"click": this.zoomOut},
            "#take-picture": {"click": this.takePicture},
            "#video-record-start": {"click": this.videoRecordStart},
            "#video-record-stop": {"click": this.videoRecordStop},
            ".volume-open": {"click": this.volumeMute},
            ".volume-mute": {"click": this.volumeOpen},
            "#resolution-select": {"beforeChange": this.beforeChangeRes, "change": this.setResolution},
            "#failed-back-button": {"click": this.upgradeFailedBack},
            "#account": {"click": this.accountTabClickCallback}
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
        this.clearPageRubbish();
        this.activateUserAdminCallback.fire();
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
        this.clearPageRubbish($.ipc.stopReasonCodeMap.LEAVE_PAGE);
        var device = this.model.findActiveDeviceArr()[0];
        if (device && device.nonPluginPlayer && device.nonPluginPlayer.statistics) {
            device.nonPluginPlayer.statistics.send();
        };
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
            if (activeDevArr[i] && activeDevArr[i].nonPluginPlayer) {
                activeDevArr[i].nonPluginPlayer.back2Idle(stopReasonCode);
            };
            activeDevArr[i].isActive = false;
        };
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
        $.cookie("mute", true);
        this.view.volumeMute();
    };

    DeviceListController.prototype.volumeOpen = function() {
        $.removeCookie("mute");
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
        var times = val/step + 1;
        $("#zoom-bar .ui-slider-handle").attr("title", "X" + times);
        this.view.setZoom();
    };

    

    DeviceListController.prototype.volumeChangeCallback = function() {
        $.removeCookie("mute");
        var volume = $("#volume-bar").slider("option", "value");
        $.cookie("volume", volume);
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
                if(activeDev.isActive){
                    currentController.view.showDeviceOffline(activeDev);
                    currentController.view.renderMsg(tips.actions.refreshCamera.failed);
                }
            }
            var inputCallbacks = {
                "errorCodeCallbackMap": {
                    0: function() {
                        if(activeDev.isActive){
                            currentController.view.showPlaying();
                        }
                    },
                    "-1": errorFunc
                },
                "errorCallback": errorFunc
            };
            var validateResult = activeDev.get(args, inputCallbacks);
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
                        if(activeDev.isActive){
                            currentController.view.renderMsg(tips.actions.changeIpcName.failed);
                        }
                    };
                    var notLoginErrFunc = function() {
                        if(activeDev.isActive){
                            currentController.view.renderMsg(tips.actions.deviceOperate.notLogin);
                        }
                    };
                    var offlineErrFunc = function() {
                        if(activeDev.isActive){
                            currentController.view.renderMsg(tips.types.camera.offline);
                        }
                    };
                    var inputCallbacks = {
                        "errorCodeCallbackMap": {
                            0: function() {
                                if(activeDev.isActive){
                                    currentController.view.renderMsg(tips.actions.changeIpcName.success);
                                }
                            },
                            "-1": errorFunc,
                            "-20571": offlineErrFunc,
                            "-20651": notLoginErrFunc
                        },
                        "errorCallback": errorFunc
                    };
                    var validateResult = activeDev.changeName(args, inputCallbacks);
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
            $.ipc.Msg({
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
                    if(activeDev.isActive){
                        currentController.view.renderMsg(tips.actions.deviceOperate.failed);
                    }
                };
                var notLoginErrFunc = function() {
                    if(activeDev.isActive){
                        currentController.view.renderMsg(tips.actions.deviceOperate.notLogin);
                    }
                };
                var offlineErrFunc = function() {
                    if(activeDev.isActive){
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
                var validateResult = activeDev.unbind(args, inputCallbacks);
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
                            if(activeDev.isActive){
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

        var activeDev = this.model.findActiveDeviceArr()[0];
        if (activeDev && activeDev.nonPluginPlayer) {
            activeDev.nonPluginPlayer.back2Idle($.ipc.stopReasonCodeMap.LEAVE_PAGE);
        };
    };

    DeviceListController.prototype.liveView = function() {
        this.view.highlightTab($("#live-view-tab"));
        this.view.clearBoardAndShow();
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
        _self.intervalUpdateDeviceListObj = setInterval(function () {
            _self.getDeviceList({
                "ajax": {
                    headers: {"X-AutoRefresh": "true"}
                }
            });
        }, _self.intervalUpdateDeviceListTime);
    }

    DeviceListController.prototype.intervalUpdateDeviceListWithInit = function() {
        this.intervalUpdateDeviceList();
        this.getDeviceList();
    };

    
    DeviceListController.prototype.settingShow = (DeviceListController.prototype.settingShow || function(){}).before(DeviceListController.prototype.recordBreakConfirm);
    DeviceListController.prototype.changeActiveDevice = (DeviceListController.prototype.changeActiveDevice || function(){}).before(DeviceListController.prototype.recordBreakConfirm);
    DeviceListController.prototype.accountTabClickCallback = (DeviceListController.prototype.accountTabClickCallback || function(){}).before(DeviceListController.prototype.recordBreakConfirm);

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
    }

    DeviceListView.prototype.renderBoard = function() {
        this.renderLeftListMenu();
        this.clearBoardAndShow();
    };

    DeviceListView.prototype.getDeviceDisplayName = function(device) {
        if (undefined == device.name) {console.error("args error in getDeviceDisplayName")};
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
        if (undefined == pageIndex || pageIndex < 0 
            || pageIndex > this.maxPageIndex) {
            console.error("args error in getDevicePageCssClass");
        };
        return "dev-page-" + pageIndex;
    };

    DeviceListView.prototype.getDeviceLiDOMId = function(devIndex) {
        if (undefined == devIndex || devIndex < 0 
            || devIndex > this.model.devices.length - 1) {
            console.error("args error in getDevicePageIndex");
        };
        return this.deviceLiDomIdPrefix + devIndex;
    };

    DeviceListView.prototype.getDevicePageIndex = function(devIndex) {
        if (undefined == devIndex || devIndex < 0 
            || devIndex > this.model.devices.length - 1) {
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
        if (undefined == activeDeviceIndex) {
            console.error("args error in renderLeftListMenu");
        } else {
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

    /**************************** functions ***********************************/

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

    DeviceListView.prototype.renderMsg = function(msg) {
        if (undefined == msg) {
            console.error("args error in renderMsg");
        };
        $.ipc.Msg({
            type: "alert",
            info: msg
        });
    };

    /*****************************live view**********************************/
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
        var tmp = {container: null, subjectPlayer: null}
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
        if (undefined == dev) {console.error("args error in getPluginPlayerElement")};
        var player = null;
        if (dev.product.playerType) {
            var mimeType = dev.product.mimeType;
            var playerElementId = dev.product.playerType.prototype.mimetypeCssMap[mimeType] || undefined;
            player = document.getElementById(playerElementId);
        } else {
            console.error("current environment do not support plugin play");
        }
        return player;
    };

    DeviceListView.prototype.isEnvSupportPluginPlay = function(dev) {
        if (undefined == dev) {console.error("args error in isEnvSupportPluginPlay")};
        var result = false;
        var browserType = $.ipc.Browser.prototype.type;
        var mt = dev.product.mimeType;
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
        if (undefined == dev) {console.error("args error in isPluginNeedUpgrade")};
        var result = false;
        var player = this.getPluginPlayerElement(dev);
        if (player) {
            var browserType = $.ipc.Browser.prototype.type;
            if (browserType == "MSIE") {
                var version = player.iepluginversion;
                result = $.ipc.compareVersion(version, "1.20") < 0;
            } else {
                var version = player.version;
                if (navigator.userAgent.indexOf("Mac", 0) >= 0) {
                    result = $.ipc.compareVersion(version, "2.8") < 0;
                } else {
                    result = $.ipc.compareVersion(version, "2.7") < 0;
                }
            }
            return result;
        } else {
            console.error("there is no plug-in player");
        }
    };

    DeviceListView.prototype.feedPluginDownloadLink = function(dev) {
        if (undefined != dev && this.isPluginPlayer(dev.product.playerType)) {
            var playerType = dev.product.playerType;
            var downloadLink = playerType.prototype.downloadPath;
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
        var mute = $.cookie("mute") || false;
        if (mute) {
            $(".volume-open").hide();
            $(".volume-mute").show();
            $("#volume-bar").slider("value", 0);
        } else {
            $(".volume-open").show();
            $(".volume-mute").hide();
            var volume = $.cookie("volume") || 0;
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
            var tmpFunc = $.proxy(function(){
                var playerType = dev.product.playerType;
                var id = playerType.prototype.mimetypeCssMap[dev.product.mimeType];
                if (dev.currentVideoResolution.pluginPlayerObjCss) {
                    $("#" + id).css(dev.currentVideoResolution.pluginPlayerObjCss.css);
                } else {
                    $("#" + id).css("width", dev.currentVideoResolution.playerContainerCss.player.width);
                    $("#" + id).css("height", dev.currentVideoResolution.playerContainerCss.player.height);
                }
                $("#disable-control-cover").hide();
                var code = dev.currentVideoResolution.pluginStreamResCode;
                $("#resolution-select").val(code);
                this.updateSelectWidget("#resolution-select");
            }, this);
            if (!this.hasShownPluginUpdateConfirm && dev.product.playerType.prototype.newestVersion) {
                var pluginPlayerElementId = dev.product.playerType.prototype.mimetypeCssMap[dev.product.mimeType];
                var playerObj = document.getElementById(pluginPlayerElementId);
                if (this.pluginHasUpdate(dev, playerObj)) {
                    this.hasShownPluginUpdateConfirm = true;
                    this.showPluginUpdateConfrim(dev, tmpFunc);
                } else {
                    tmpFunc();
                }
            } else {
                tmpFunc();
            }
        };
    };

    DeviceListView.prototype.updateSelectWidget = function(elementId) {
        $(elementId).Select({slideOptionHeight: 16});
    };

    DeviceListView.prototype.updateResolutionSelect = function(dev) {
        if (dev) {
            $("#resolution-select").empty();
            var resArr = dev.product.supportVideoResArr;
            for (var i = 0; i < resArr.length; i++) {
                $("#resolution-select").append("<option name=" + resArr[i].name + " value=" + resArr[i].pluginStreamResCode + ">" + resArr[i].str + "</option>");
            };
            $("#resolution-select option:first-child").attr("selected", true);
            this.updateSelectWidget("#resolution-select");
        };
    };

    DeviceListView.prototype.renderPluginVideoLoading = function(dev) {
        if (dev && dev.isActive) {
            var playerType = dev.product.playerType;
            var id = playerType.prototype.mimetypeCssMap[dev.product.mimeType];
            $("#" + id).css("width", 1);
            $("#" + id).css("height", 1);
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
            var playerType = device.product.playerType;
            var id = playerType.prototype.mimetypeCssMap[device.product.mimeType];
            $("#" + id).hide();
            $("#plugin-player-set").hide();
        };
    };

    DeviceListView.prototype.recordStart = function() {
        var device = this.model.findActiveDeviceArr()[0];
        if (device) {
            var ieRecordMask = device.pluginPlayer.playerObj.Record();
            if ($.ipc.Browser.prototype.type.indexOf("MSIE") >= 0 && ieRecordMask) {
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
        if (record == 0) {
            this.showRecordStart();
        } else if (record == 1) {
            this.recordStop();
        } else if (record == 2) {
            this.recordStop();
            $.ipc.Msg({
                type: "alert",
                info: tips.actions.record.interrupt.networkError
            });
        } else if (record == 3) {
            this.recordStop();
            $.ipc.Msg({
                type: "alert",
                info: tips.actions.record.interrupt.diskFull
            });
        } else if (record == 4) {
            this.recordStop();
            $.ipc.Msg({
                type: "alert",
                info: tips.actions.record.interrupt.timeup
            });
        }
    };

    DeviceListView.prototype.snapshotCallback = function(shoot) {
        if (shoot == 3) {
            $.ipc.Msg({
                type: "alert",
                info: tips.actions.snapshot.diskFull
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
        if (code == 0){
            this.showTimeout();
        }
        if (code == 1){
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
            var times = val/step + 1;
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
            if ($.ipc.Browser.prototype.type.indexOf("MSIE") >= 0) {
                currentVersion = playerObj.iepluginversion;
            } else {
                currentVersion = playerObj.version;
            };
            var newestVersion = dev.product.playerType.prototype.newestVersion;
            result = $.ipc.compareVersion(currentVersion, newestVersion) < 0;
        };
        return result;
    };

    DeviceListView.prototype.showPluginUpdateConfrim = function(dev, continueFunc) {
        if (dev && continueFunc) {
            $.ipc.Msg({
                type: "confirm",
                info: tips.types.plugin.update,
                btnConfirm: "Download",
                confirm: function () {
                    window.location.href = dev.product.playerType.prototype.downloadPath;
                    continueFunc();
                },
                cancel: continueFunc
            })
        };
    };

    DeviceListView.prototype.pluginPlayVideo = function(dev) {
        if (dev && dev.isActive) {
            var playerType = dev.product.playerType;
            this.pluginPlayerManageBoard();
            var id = playerType.prototype.mimetypeCssMap[dev.product.mimeType];
            $("#" + id).show();
            if (this.isEnvSupportPluginPlay(dev)) {
                if (this.isPluginNeedUpgrade(dev)) {
                    this.hidePluginPlayers(dev);
                    this.showPluginUpdateNeeded(dev);
                } else {
                    if (undefined == dev.pluginPlayer) {
                        var tmpPlayer = null;
                        var videoCodecPlayerMap = {
                            "mjpeg": $.ipc.MjpegPluginPlayer,
                            "h264": $.ipc.H264PluginPlayer
                        };
                        var codecName = dev.product.videoCodec.name;
                        tmpPlayer = new (videoCodecPlayerMap[codecName])(); 
                        
                        tmpPlayer.playerObj = document.getElementById(id);
                        tmpPlayer.device = dev;
                        dev.pluginPlayer = tmpPlayer;

                        var contextPluginVideoLoadingRenderFunc = $.proxy(this.renderPluginVideoLoading, this);
                        var contextPluginPlayerRender = $.proxy(this.renderPluginPlayer, this);
                        var contextUpdatePlayerObjView = $.proxy(this.updatePlayerObjView, this);
                        var args = {
                            recordCallback: $.proxy(this.recordCallback, this),
                            snapshotCallback: $.proxy(this.snapshotCallback, this),
                            timeupCallback: $.proxy(this.timeupCallback, this),
                            videoLoadingRenderFunc: contextPluginVideoLoadingRenderFunc,
                            pluginPlayerRender: contextPluginPlayerRender,
                            updatePlayerObjView: contextUpdatePlayerObjView
                        }

                        dev.pluginPlayer.initPluginPlayer(args);
                    };
                    this.updatePluginPlayerView(dev);
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
            $("#flash-player-cover .loading-tips").css({"display": "table-cell"});
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
            $("#flash-player-cover .network-tips").css({"display": "table-cell"});
        };
    };

    DeviceListView.prototype.flashPlayVideo = function(dev) {
        if (dev && dev.isActive) {
            this.flashManageBoard();
            if (undefined == dev.nonPluginPlayer) {
                var tmpPlayer = new $.ipc.RtmpPlayer();
                tmpPlayer.playerElementId = "flash-player";
                tmpPlayer.device = dev;

                var tmpTimer = new $.ipc.Timer();
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
            $("#img-player-cover .loading-tips").css({"display": "table-cell"});
        };
    };

    DeviceListView.prototype.renderImgNetError = function(device) {
        if (device && device.isActive) {
            this.flashManageBoard();
            var width = device.currentVideoResolution.playerContainerCss.player.width;
            var height = device.currentVideoResolution.playerContainerCss.player.height;
            $("#img-player-cover").width(width).height(height);
            $("#img-player-cover").show();
            $("#img-player-cover").children().hide();
            $("#img-player-cover .network-tips").css({"display": "table-cell"});
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
                var tmpPlayer = new $.ipc.ImgPlayer();
                tmpPlayer.playerElementId = "img-player";
                tmpPlayer.audioPlayerElementId = "audio-player";
                tmpPlayer.device = dev;

                var tmpTimer = new $.ipc.Timer();
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
        if (undefined == playerType) {console.error("args error in isPluginPlayer")};
        var pluginPlayers = [$.ipc.PLUGIN_NON_IE_X86, $.ipc.PLUGIN_NON_IE_X64, $.ipc.PLUGIN_IE_X86, $.ipc.PLUGIN_IE_X64, $.ipc.PLUGIN_MAC];
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
        if (undefined == dev) {console.error("args error in playVideo")};
        var playerType = dev.product.playerType;
        if (dev.isOnline == 1) {
            if (this.isPluginPlayer(playerType)) {
                this.pluginPlayVideo(dev);
            } else if (playerType == $.ipc.FLASH_PLAYER) {
                this.flashPlayVideo(dev);
            } else if (playerType == $.ipc.IMG_PLAYER){
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
                var args = {id: activeDev.id, token: activeDev.owner.token, appServerUrl: activeDev.appServerUrl};
                activeDev.getLocalInfo(args);
            };
        } else {
            console.error("args error in showSetting");
        }
    };

    /***************************update callback *************************/
    DeviceListView.prototype.updateDeviceInfo = function(device) {
        if (undefined == device) {
            console.error("args error in updateDeviceInfo");
        };

        this.updateDeviceLi(device);

        if (device.isActive) {
            this.clearBoardAndShow();
        };
    };


    var dl = new DeviceList();
    var dlc = new DeviceListController();
    var dlv = new DeviceListView();
    dlc.model = dl;
    dlc.view = dlv;
    dlv.model = dl;
    dl.owner = u;

    dlc.initHandler();

    var contextRenderDeviceInfo = $.proxy(dlv.updateDeviceInfo, dlv);
    $.ipc.Device.prototype.stateChangeCallbacks.add(contextRenderDeviceInfo);
    
    dlc.intervalUpdateDeviceListWithInit();
    
    var contextRenderUserAdmin = $.proxy(uc.accountTabClickCallback, uc);
    dlc.activateUserAdminCallback.add(contextRenderUserAdmin);
    var contextIntervalUpdateDeviceList = $.proxy(dlc.intervalUpdateDeviceListWithInit, dlc);
    u.activateDeviceAdminCallback.add(contextIntervalUpdateDeviceList)

    /******************************* software *******************************/
    function SoftwareController() {
        $.ipc.BaseController.call(this, arguments); 
    };
    $.ipc.inheritPrototype(SoftwareController, $.ipc.BaseController);
    
    SoftwareController.prototype.getUpdateInfos = function() {
        var inputCallbacks = {
            "errorCodeCallbackMap": {
                0: function() {
                    var device = dlc.model.findActiveDeviceArr()[0];
                    device && dlv.isNeedFeedPluginDownloadLink && dlv.feedPluginDownloadLink(device);
                }
            }
        };
        this.model.getUpdateInfos(inputCallbacks);
    };

    var s = new $.ipc.Software();
    var sc = new SoftwareController();
    sc.model = s;

    sc.getUpdateInfos();

    window.dlc = dlc;
});