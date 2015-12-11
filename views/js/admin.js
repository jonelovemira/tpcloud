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
        this.activeDeviceIndex = null;
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
            "#ipcsetting-save": {"click": this.changeDeviceName},
            "#ipcsetting-delipc": {"click": this.removeDeviceMsg},
            "#liveviewshow": {"click": this.liveView},
            "#settingshow": {"click": this.settingShow},
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

    DeviceListController.prototype.getDeviceList = function(reload) {
        var currentController = this;
        var inputCallbacks = {
            "errorCodeCallbackMap": {
                0: function() {
                    currentController.model.activeDeviceIndex = currentController.model.devices.length - 1;
                    currentController.view.renderBoard(reload);
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
    }

    DeviceListView.prototype.renderBoard = function(reload) {
        reload = reload || false;
        this.renderLeftListMenu();
        this.renderRightViewSetting(reload);
    };

    DeviceListView.prototype.renderDeviceLi = function(device , index) {
        if (undefined == device || undefined == index || index < 0) {
            console.error("args error in renderDeviceLi");
        };
        var deviceLi = $("#device-li-sample").clone();
        var imgCssClass = device.product.prototype.smallImgCssClass;
        var dot = device.name.length > this.maxDisplayNameLength ? "..." : "";
        var displayName = device.name.substring(0, this.maxDisplayNameLength - 2);
        var state = device.needForceUpgrade == 1 ? (stateTipsMap[admin.ipcList[targetIpcIndex]["system_status"]] || "") : "";
        var currentPageCssClass = this.getDevicePageCssClass(this.getDevicePageIndex(index));

        deviceLi.attr("id", this.getDeviceLiId(index));
        deviceLi.attr("title", device.name);
        deviceLi.addClass(currentPageCssClass);
        deviceLi.find(".ipcclick").first().toggleClass("ipcunusable", device.isOnline == 0);
        deviceLi.find("span").first().addClass(imgCssClass);
        deviceLi.find(".ipcname").first().text(displayName);
        deviceLi.find(".system-status").first().text(state);
        this.menuContainer.append(deviceLi);
    };

    DeviceListView.prototype.getDevicePageCssClass = function(pageIndex) {
        if (undefined == pageIndex || pageIndex < 0 
            || pageIndex > this.maxPageIndex) {
            console.error("args error in getDevicePageCssClass");
        };
        return "dev-page-" + pageIndex;
    };

    DeviceListView.prototype.getDeviceLiId = function(devIndex) {
        if (undefined == devIndex || devIndex < 0 
            || devIndex > this.model.devices.length - 1) {
            console.error("args error in getDevicePageIndex");
        };
        return "ipc-" + devIndex;
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
                this.renderDeviceLi(this.model.devices[i], i); 
            };
            $("#" + this.getDeviceLiId(this.model.activeDeviceIndex)).addClass("ipcselected");
            
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


    var dl = new DeviceList();
    var dlc = new DeviceListController();
    var dlv = new DeviceListView();
    dlc.model = dl;
    dlc.view = dlv;
    dlv.model = dl;

    dlc.initHandler();
    dlc.getDeviceList();

});