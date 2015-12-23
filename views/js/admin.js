$(function () {

    function User () {
        $.ipc.User.call(this, arguments);
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
            "#backaccount": {"click": this.gotoAccountAdmin},
            "#changepwd": {"click": this.changePassword},
            "#device": {"click": this.gotoDeviceAdmin},
            "#account": {"click": this.gotoAccountAdmin}
        };
        var selectorMsgProduceFuncMap = {};
        this.batchInitHandler(appendedSelectorHandlerMap, selectorMsgProduceFuncMap);
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
        var args = {account: currentController.model.account, password: password, newPassword: newPassword, newPasswordSecond: newPasswordSecond};

        var errCodeTipsMap = {
            "-1": tips.actions.changePassword.failed
        };

        var inputCallbacks = {
            "errorCodeCallbackMap": {
                0: function() {
                    currentController.changePasswordSuccess();
                },
                "-1" : function() {
                    currentController.view.renderError(errCodeTipsMap["-1"]);
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

    UserController.prototype.gotoDeviceAdmin = function() {
        this.view.renderDeviceAdmin();
    };

    UserController.prototype.gotoChangePassword = function() {
        this.view.renderChangePasswod();
    };

    UserController.prototype.gotoAccountAdmin = function() {
        this.view.renderAccountAdmin();
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
        $(".maincontent").hide();
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
                $(".maincontent").css("width", "100%");
            },
            "#account": function() {
                currentView.activateNav("#account");
                $("#display-main-board").css("padding-top", "25px");
                $("#display-main-board").css("height", "inherit");
                $(".maincontent").css("width", "1000px");
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

/*----------------------------device part-------------------------------------*/
    
    function Device() {
        $.ipc.Device.call(this, arguments);
    };
    $.ipc.inheritPrototype(Device, $.ipc.Device);

    function DeviceList() {
        $.ipc.DeviceList.call(this, arguments);
    };
    $.ipc.inheritPrototype(DeviceList, $.ipc.DeviceList);

    function DeviceListController() {
        $.ipc.BaseController.call(this, arguments);
    }
    $.ipc.inheritPrototype(DeviceListController, $.ipc.BaseController);

    DeviceListController.prototype.initHandler = function() {
        var appendedSelectorHandlerMap = {
            "#dev-right-arrow": {"click": this.showNextDevicePage},
            "#dev-left-arrow": {"click": this.showPreDevicePage},
            "#dev-setting-save": {"click": this.changeDeviceName},
            "#dev-setting-remove": {"click": this.removeDevice},
            "#live-view-tab": {"click": this.liveView},
            "#setting-tab": {"click": this.settingShow},
            "#reload": {"click": this.updateDeviceInfo},
            ".dev-item": {"click": this.changeActiveDevice},
            "#upgrade-device": {"click": this.upgradeDevice}
        };

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

    DeviceListController.prototype.changeDeviceName = function(newName) {
        var currentController = this;
        var activeDev = this.model.devices[this.model.activeDeviceIndex];
        if (activeDev) {
            if (newName != activeDev.name) {
                var args = {
                    id: activeDev.id,
                    name: newName
                }
                var inputCallbacks = {
                    "errorCodeCallbackMap": {
                        0: function() {
                            if(currentController.model.isActiveDevice(activeDev)){
                                currentController.view.renderMsg(tips.actions.changeIpcName.success);
                            }
                        },
                        "-1": function() {
                            if(currentController.model.isActiveDevice(activeDev)){
                                currentController.view.renderMsg(tips.actions.changeIpcName.failed);
                            }
                        }
                    }
                };
                var validateResult = activeDev.changeName(args, inputCallbacks);
                if (validateResult != undefined && !validateResult.code) {
                    currentController.view.renderMsg(validateResult.msg);
                };
            } else {
                console.log("new name is equal to origin name");
            }
        };
    };

    DeviceListController.prototype.removeDevice = function() {
        var currentController = this;
        var activeDev = this.model.devices[this.model.activeDeviceIndex];
        if (activeDev) {
            var args = {
                id: activeDev.id,
                account: activeDev.owner.account
            }
            var inputCallbacks = {
                "errorCodeCallbackMap": {
                    0: function() {
                        currentController.getDeviceList();
                    },
                    "-1": function() {
                        if(currentController.model.isActiveDevice(activeDev)){
                            currentController.view.renderMsg(tips.actions.deviceOperate.failed);
                        }
                    }
                }
            };
            var validateResult = activeDev.unbind(args, inputCallbacks);
            if (validateResult != undefined && !validateResult.code) {
                currentController.view.renderMsg(validateResult.msg);
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
        if (tmpNewActiveDeviceIndex != this.model.activeDeviceIndex) {
            this.model.setActiveDeviceIndex(tmpNewActiveDeviceIndex);
            this.view.updateActiveDeviceCss();
            this.view.clearBoardAndShow();
        };
    };

    DeviceListController.prototype.upgradeDevice = function() {
        var currentController = this;
        var activeDev = this.model.devices[this.model.activeDeviceIndex];
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
                        "-1": function() {
                            if(currentController.model.isActiveDevice(activeDev)){
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

    DeviceListController.prototype.liveView = function() {
        this.view.highlightTab($("#live-view-tab"));
        this.view.clearBoardAndShow();
    };

    DeviceListController.prototype.getDeviceList = function() {
        var currentController = this;
        var inputCallbacks = {
            "errorCodeCallbackMap": {
                0: function() {
                    currentController.view.renderBoard();
                }
            }
        };
        currentController.model.getDeviceList(inputCallbacks);
    };

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
        var imgCssClass = device.product.prototype.smallImgCssClass;
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
        $("#" + this.getDeviceLiDOMId(this.model.activeDeviceIndex)).addClass("dev-selected");
    };

    DeviceListView.prototype.renderLeftListMenu = function() {
        this.menuContainer.empty();
        if (this.model.activeDeviceIndex >= 0) {
            this.maxPageIndex = this.getDevicePageIndex(this.model.devices.length - 1);
            this.curPageIndex = this.getDevicePageIndex(this.model.activeDeviceIndex);

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
    DeviceListView.prototype.hideViewChild = function() {
        this.viewDOM.children().hide();
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
            var activeDev = this.model.devices[this.model.activeDeviceIndex];
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
            } else {
                this.commonTipsManageBoard();
                this.showCrossRegionTip(activeDev);
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

    DeviceListView.prototype.isSupportPlay = function(dev) {
        if (undefined == dev) {console.error("args error in isSupportPlay")};
    };

    DeviceListView.prototype.showLiveView = function() {
        if (this.isNeedRefreshPlaying()) {
            var activeDev = this.model.devices[this.model.activeDeviceIndex];
            this.hideViewSettingContent();
            this.liveViewManageBoard();
            var playerType = activeDev.product.prototype.playerType;
            if (this.isSupportPlay(activeDev)) {
                this.showPlayer(playerType);
            };
        };
    };

    DeviceListView.prototype.findWatchShowingElement = function() {
        var showingElements = [];
        var currentView = this;
        $("#watch").children.each(function(i, d) {
            if (currentView.isShowing($(this))) {
                showingElements.push($(this).attr("id"));
            };
        });
        return showingElements;
    };

    DeviceListView.prototype.isNeedRefreshPlaying = function() {
        var elementIdFlagMap = {
            "objouter": false,
            "flash-player-container": false,
            "refreshtips": false,
            "reloadtips": false,
            "continuetips": false 
        };
        var res = this.findWatchShowingElement();
        if (res.length > 1 || res.length <= 0) {
            return true;
        };
        return elementIdFlagMap[res[0]] || true;
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

        if (this.model.isActiveDevice(device)) {
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
        var activeDev = this.model.devices[this.model.activeDeviceIndex];
        if (activeDev) {
            $("#setting .setting-content").show();
            this.showDeviceSetting(activeDev);

            if (activeDev.iip == undefined) {
                var args = {id: activeDev.id, token: activeDev.owner.token, appServerUrl: activeDev.appServerUrl};
                activeDev.getLocalInfo(args);
            };
        };
    };

    /***************************update callback *************************/
    DeviceListView.prototype.updateDeviceInfo = function(device) {
        if (undefined == device) {
            console.error("args error in updateDeviceInfo");
        };

        this.updateDeviceLi(device);

        if (this.model.isActiveDevice(device)) {
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

    var contextGetDeviceList = $.proxy(dlc.getDeviceList, dlc);

    contextGetDeviceList();

    setInterval(contextGetDeviceList, 60000);
    
});