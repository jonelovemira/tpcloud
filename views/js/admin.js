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
        var args = {password: password, newPassword: newPassword, newPasswordSecond: newPasswordSecond};

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

/*----------------------------device part----------------------------*/
    
    function Device() {
        $.ipc.Device.call(this, arguments);
    }

    $.ipc.inheritPrototype(Device, $.ipc.Device);

    function DeviceListController() {
        $.ipc.BaseController.call(this, arguments);
    }
    $.ipc.inheritPrototype(DeviceListController, $.ipc.BaseController);

    DeviceController.prototype.initHandler = function() {
        var appendedSelectorHandlerMap = {
            "#ipcpagnext": {"click": this.nextIpcPage},
            "#ipcpagpre": {"click": this.preIpcPage},
            "#ipcsetting-save": {"click": this.changeDeviceName},
            "#ipcsetting-delipc": {"click": this.removeDeviceMsg},
            "#liveviewshow": {"click": this.liveView},
            "#settingshow": {"click": this.settingShow},
            "#reload" : {"click": this.updateDeviceInfo}
        };

        var selectorMsgProduceFuncMap = {};

        this.batchInitHandler(appendedSelectorHandlerMap, selectorMsgProduceFuncMap);
    };

    DeviceController.prototype.getDeviceList = function() {
        var currentController = this;
        var inputCallbacks = {
            "errorCodeCallbackMap": {
                0: function() {
                    
                }
            }
        };
        currentController.model.getDeviceList(inputCallbacks);
    };

    function DeviceListView() {
        this.model = null;
    }


});