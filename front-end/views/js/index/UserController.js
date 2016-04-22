define(['BaseController', 'jquery', 'inheritPrototype', 'tips', 'UserModel', 'UserView', 'Cookies'], 
    function (BaseController, $, inheritPrototype, tips, UserModel, UserView, Cookies) {
    function UserController() {
        BaseController.call(this, arguments);
    };

    inheritPrototype(UserController, BaseController);

    UserController.prototype.initHandler = function() {
        var appendedSelectorHandlerMap = {
            "#submit_btn": {
                "click": this.loginUser
            },
            "#Password": {
                "keydown": this.passwordInputKeyDown
            },
            ".product_information_btn_download": {
                "click": this.locationToDownload
            },
            ".product_information_btn_learnmore": {
                "click": this.locationToLearnMore
            },
            "input.checkbox[name=remember]": {
                "keydown": this.rememberCheckboxKeyDown
            },
            ".closetips": {
                "click": this.hideErrorTips
            }
        };

        var selectorMsgProduceFuncMap = {};

        this.batchInitHandler(appendedSelectorHandlerMap, selectorMsgProduceFuncMap);
    };

    UserController.prototype.loginUser = function() {

        this.rememberUserLogic();
        var account = $("#Account").val();

        var args = {
            account: $("#Account").val(),
            password: $("#Password").val()
        };

        var currentController = this;

        var errCodeTipsMap = {
            1006: tips.types.account.notExist,
            1009: tips.types.account.notActivated,
            1023: tips.types.account.invalidShort,
            1024: tips.types.password.notMatch,
            1029: tips.types.account.wasLocked,
            "-1": tips.actions.login.failed
        }

        var inputCallbacks = {
            "errorCodeCallbackMap": {
                0: function(response) {
                    var result = response.msg;
                    // document.cookie = "email=" + result.email + "; domain=.tplinkcloud.com";
                    // document.cookie = "token=" + result.token + "; domain=.tplinkcloud.com";
                    // document.cookie = "account=" + account + "; domain=.tplinkcloud.com";
                    Cookies.set("email", result.email);
                    Cookies.set("token", result.token);
                    Cookies.set("account", account);

                    currentController.model.successLoginCallbacks.fire();
                },
                1006: function() {
                    currentController.view.renderLoginError(errCodeTipsMap[1006]);
                },
                1009: function() {
                    currentController.view.renderLoginError(errCodeTipsMap[1009]);
                },
                1023: function() {
                    currentController.view.renderLoginError(errCodeTipsMap[1023]);
                },
                1024: function() {
                    currentController.view.renderLoginError(errCodeTipsMap[1024]);
                },
                1029: function() {
                    currentController.view.renderLoginError(errCodeTipsMap[1029]);
                },
                "-1": function() {
                    currentController.view.renderLoginError(errCodeTipsMap["-1"]);
                }
            },
            "errorCallback": function() {
                currentController.view.renderLoginError(errCodeTipsMap["-1"]);
            }
        };

        var validateResult = currentController.model.login(args, inputCallbacks)["validateResult"];
        if (validateResult != undefined && !validateResult.code) {
            this.view.showTips(validateResult.msg);
        };

    };

    UserController.prototype.passwordInputKeyDown = function(data, callbackArgsArr) {
        if (callbackArgsArr[0].keyCode == "13") {
            this.loginUser();
        } else if (callbackArgsArr[0].keyCode == "27") {
            this.loginUser();
        };
    };

    UserController.prototype.rememberUserLogic = function() {
        this.model.setRememberMe($("input.checkbox[name=remember]").is(":checked"));
        if (this.model.rememberMe) {
            var userName = $("#Account").val();
            userName && Cookies.set("rmbUser", "true", {
                expires: 7
            }) && Cookies.set("userName", userName, {
                expires: 7
            });
        } else {
            Cookies.set("rmbUser", "", {
                expires: -1
            }) && Cookies.set("userName", '', {
                expires: -1
            });
        };
    };

    UserController.prototype.rememberCheckboxKeyDown = function(data, callbackArgsArr) {
        if (callbackArgsArr[0].keyCode == "32") {
            $("input.checkbox[name=remember]").click();
        } else if (callbackArgsArr[0].keyCode == "13") {
            this.loginUser();
        };
    };

    UserController.prototype.hideErrorTips = function() {
        this.view.hideTips();
    };

    UserController.prototype.locateTo = function(dst) {
        if (undefined == dst) {
            console.error("args error in locateTo");
            return;
        };

        window.location.href = dst;
    };

    UserController.prototype.locationToDownload = function() {
        var dst = __uri("../../pages/download.html");
        this.locateTo(dst);
    };

    UserController.prototype.locationToLearnMore = function() {
        window.open("http://www.tp-link.com/en/products/details/?categoryid=&model=NC200", "_blank");
    };

    return UserController;
})