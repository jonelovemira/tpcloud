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
            "#dev-setting-delipc": {"click": this.removeDeviceMsg},
            "#live-view-tab": {"click": this.liveView},
            "#setting-tab": {"click": this.settingShow},
            "#reload": {"click": this.updateDeviceInfo},
            ".ipcclick": {"click": this.changeActiveDevice} 
        };

        var selectorMsgProduceFuncMap = {};

        this.batchInitHandler(appendedSelectorHandlerMap, selectorMsgProduceFuncMap);
    };

    DeviceListController.prototype.showNextDevicePage = function() {
        this.view.renderNextDevicePage();
    };

    DeviceListController.prototype.showPreDevicePage = function() {
        this.view.renderPreDevicePage();
    };

    DeviceListController.prototype.settingShow = function() {
        this.view.renderSetting();
    };

    DeviceListController.prototype.liveView = function() {
        this.view.renderLiveView();
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
    }

    DeviceListView.prototype.renderBoard = function() {
        this.renderLeftListMenu();
        this.renderRightViewSetting();
    };

    DeviceListView.prototype.getDeviceDisplayName = function(device) {
        if (undefined == device.name) {console.error("args error in getDeviceDisplayName")};
        var dot = device.name.length > this.maxDisplayNameLength ? "..." : "";
        return device.name.substring(0, this.maxDisplayNameLength - 2) + dot;
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
        return "dev-" + devIndex;
    };

    DeviceListView.prototype.getDevicePageIndex = function(devIndex) {
        if (undefined == devIndex || devIndex < 0 
            || devIndex > this.model.devices.length - 1) {
            console.error("args error in getDevicePageIndex");
        };
        return Math.floor(devIndex / this.pageCapacity);
    };

    DeviceListView.prototype.renderLeftListMenu = function() {
        this.menuContainer.empty();
        if (this.model.activeDeviceIndex >= 0) {
            this.maxPageIndex = this.getDevicePageIndex(this.model.devices.length - 1);
            this.curPageIndex = this.getDevicePageIndex(this.model.activeDeviceIndex);

            for (var i = 0; i < this.model.devices.length; i++) {
                this.appendDeviceLi(this.model.devices[i], i); 
            };
            $("#" + this.getDeviceLiDOMId(this.model.activeDeviceIndex)).addClass("dev-selected");
            
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

    DeviceListView.prototype.showNoDeviceTips = function() {
        this.hideViewSettingContent();
        this.commonTipsDOM.show();
        this.hideCommonTipsChild();
        $("#no-camera").show();
    };

    DeviceListView.prototype.renderRightViewSetting = function() {
        if (this.model.devices.length > 0) {
            var activeTab = this.findActiveNavTab();
            if (activeTab == "Settings") {
                this.renderSetting();
            } else {
                this.renderLiveView();
            }
        } else {
            this.showNoDeviceTips();
        }
    };

    DeviceListView.prototype.renderUnsupporttedBrowserTips = function() {
        this.renderViewWithElement($("#plugin-unusable"));
    };

    DeviceListView.prototype.renderNeedOrFailedUpgrade = function(device) {
        if (device.hasUpgradOnce) {
            this.renderFirmwareUpgradeFailed(device);
        } else {
            this.renderFirmwareUpgradeNeeded(device);
        }
    };

    DeviceListView.prototype.renderFirmwareUpgradeNeeded = function(device) {
        if (undefined == device) {console.error("args error in renderFirmwareUpgradeNeeded")};

        if (this.model.findIndexForId(device.id) == this.model.activeDeviceIndex) {
            this.renderViewWithElement($("#firmware-need-upgrade"));
        };
    };

    DeviceListView.prototype.renderViewWithElement = function(dom) {
        if (undefined == dom) {console.error("args error in renderViewWithElement")};
        this.hideViewSettingContent();
        this.viewDOM.show();
        this.hideViewChild();
        dom.show();
    };

    DeviceListView.prototype.renderFirmwareUpgradeFailed = function(device) {
        if (undefined == device) {
            console.error("args error in renderFirmwareUpgradeFailed");
        };

        if (this.model.findIndexForId(device.id) == this.model.activeDeviceIndex) {
            this.renderViewWithElement($("#upgrade-failed"));
        };
    };

    DeviceListView.prototype.renderFirmwareDownloading = function(device) {
        if (undefined == device) {
            console.error("args error in renderFirmwareDownloading");
        };

        if (this.model.findIndexForId(device.id) == this.model.activeDeviceIndex) {
            this.renderViewWithElement($("#downloading"));
        };
    };

    DeviceListView.prototype.renderFirmwareUpgrading = function(device) {
        if (undefined == device) {
            console.error("args error in renderFirmwareUpgrading");
        };

        if (this.model.findIndexForId(device.id) == this.model.activeDeviceIndex) {
            this.renderViewWithElement($("#upgrading"));
        };
    };

    DeviceListView.prototype.renderUpgradeState = function(device) {
        if (undefined == device) {
            console.error("args error in renderUpgradeState");
        };

        if (this.model.findIndexForId(device.id) == this.model.activeDeviceIndex) {
            var statusFuncMap = {
                "normal": this.renderNeedOrFailedUpgrade,
                "downloading": this.renderFirmwareDownloading,
                "upgrading": this.renderFirmwareUpgrading
            };
            var func = statusFuncMap[device.systemStatus] || $.noop;
            var contextFunc = $.proxy(func, this);
            contextFunc(device);
        };
    };

    DeviceListView.prototype.renderLiveView = function() {
        $(".admin-nav-li").removeClass("admin-nav-li-select");
        $("#live-view-tab").addClass("admin-nav-li-select");
        var device = this.model.devices[this.model.activeDeviceIndex];
        this.updateDeviceView(device);
    };

    DeviceListView.prototype.updateDeviceView = function(device) {
        if (undefined == device) {console.error("args error in updateDeviceView")};
        if (device.isSameRegion) {
            if (device.needForceUpgrade == 1) {
                this.renderUpgradeState(device)
            } else {
                var browser = $.BrowserTypeVersion.split(" ");
                if ((browser[0] == "Chrome" && parseInt(browser[1]) >= 42) || browser[0].indexOf("Edge") >= 0) {
                    this.renderUnsupporttedBrowserTips();
                } else {
                    this.renderVideoPlaying();
                }
            }
        } else {
            this.renderCrossRegionTip(device);
        }
    };

    DeviceListView.prototype.renderCrossRegionTip = function(device) {
        if (undefined == device) {
            console.error("args error in renderCrossRegionTip");
        };
        if (this.model.findIndexForId(device.id) == this.model.activeDeviceIndex) {
            this.renderViewWithElement($("#device-cross-region"));
        };
    };

    DeviceListView.prototype.updateDeviceLi = function(device) {
        if (undefined == device) {
            console.error("device args error in updateDeviceLi");
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

    DeviceListView.prototype.updateDeviceSetting = function(device) {
        if (undefined == device) {
            console.error("args error in updateDeviceSetting");
        };
        if (device.id == this.model.devices[this.model.activeDeviceIndex].id) {
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
    };

    DeviceListView.prototype.updateDeviceInfo = function(device) {
        if (undefined == device) {
            console.error("args error in updateDeviceInfo");
        };

        this.updateDeviceLi(device);

        var activeTab = this.findActiveNavTab();
        if (activeTab == "Settings") {
            this.updateDeviceSetting(device);
        } else {
            this.updateDeviceView(device);
        }
    };

    DeviceListView.prototype.renderSetting = function() {
        
        var activeDev = this.model.devices[this.model.activeDeviceIndex];
        if (activeDev) {
            this.hideViewSettingContent();
            this.settingDOM.show();
            this.hideSettingChild();

            $(".admin-nav-li").removeClass("admin-nav-li-select");
            $("#setting-tab").addClass("admin-nav-li-select");

            $("#setting .setting-content").show();
            this.updateDeviceInfo(activeDev);
            if (activeDev.iip == undefined) {
                var args = {id: activeDev.id, token: activeDev.owner.token, appServerUrl: activeDev.appServerUrl};
                activeDev.getLocalInfo(args);
            };
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
    dlc.getDeviceList();

    var contextRenderDeviceInfo = $.proxy(dlv.updateDeviceInfo, dlv);
    $.ipc.Device.prototype.stateChangeCallbacks.add(contextRenderDeviceInfo);

});