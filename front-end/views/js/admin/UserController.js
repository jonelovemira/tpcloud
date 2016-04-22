define(['UserModel', 'UserView', 'BaseController', 'inheritPrototype', 'jquery', 'tips'], 
    function (UserModel, UserView, BaseController, inheritPrototype, $, tips) {
    function UserController() {
        BaseController.call(this, arguments);
    }

    inheritPrototype(UserController, BaseController);

    UserController.prototype.initHandler = function() {
        var appendedSelectorHandlerMap = {
            "#logout": {
                "click": this.logoutUser
            },
            "#userinfo-title-changepwd": {
                "click": this.gotoChangePassword
            },
            "#backaccount": {
                "click": this.backaccountClickCallback
            },
            "#changepwd": {
                "click": this.changePassword
            },
            "#device": {
                "click": this.devTabClickCallback
            }
        };
        var selectorMsgProduceFuncMap = {};
        this.batchInitHandler(appendedSelectorHandlerMap, selectorMsgProduceFuncMap);
    };

    UserController.prototype.devTabClickCallback = function() {
        if (!$("#device").hasClass("navselected")) {
            this.view.renderDeviceAdmin();
            this.model.activateDeviceAdminCallback.fire();
        }
    };

    UserController.prototype.accountTabClickCallback = function() {
        if (!$("#account").hasClass("navselected")) {
            this.view.renderAccountAdmin();
        }
    };

    UserController.prototype.backaccountClickCallback = function() {
        this.view.renderAccountAdmin();
    };

    UserController.prototype.logoutUser = function() {
        var currentController = this;

        var args = {
            email: currentController.model.email
        };

        var errCodeTipsMap = {
            "-1": tips.actions.logout.failed
        };

        var inputCallbacks = {
            "errorCodeCallbackMap": {
                0: function() {
                    currentController.gotoPage("/");
                },
                "-1": function() {
                    currentController.view.renderError(errCodeTipsMap["-1"]);
                }
            },
            "errorCallback": function() {
                currentController.view.renderError(errCodeTipsMap["-1"]);
            }
        };

        var validateResult = currentController.model.logout(args, inputCallbacks)["validateResult"];
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
                "-1": function() {
                    currentController.view.renderError(errCodeTipsMap["-1"]);
                },
                "1023": function() {
                    currentController.view.renderError(errCodeTipsMap["1023"]);
                },
                "1024": function() {
                    currentController.view.renderError(errCodeTipsMap["1024"]);
                }
            },
            "errorCallback": function() {
                currentController.view.renderError(errCodeTipsMap["-1"]);
            }
        };
        var validateResult = currentController.model.modifyPassword(args, inputCallbacks)["validateResult"];
        if (validateResult != undefined && !validateResult.code) {
            currentController.view.renderError(validateResult.msg);
        };

    };

    UserController.prototype.changePasswordSuccess = function() {
        var currentController = this;
        var alertOptions = {
            "info": tips.actions.changePassword.success,
            ok: function() {
                currentController.gotoPage("/");
            },
            cancel: function() {
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

    return UserController;
})