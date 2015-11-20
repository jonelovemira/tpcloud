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
            "#backaccount": {"click": this.gotoAdminInfo},
            "#changepwd": {"click": this.changePassword}
        };
        var selectorMsgProduceFuncMap = {};
        this.batchInitHandler(appendedSelectorHandlerMap, selectorMsgProduceFuncMap);
    };

    UserController.prototype.logoutUser = function() {
        var currentController = this;

        var errCodeTipsMap = {
            "-1": tips.actions.logout.failed
        };

        var inputCallbacks = {
            "errorCodeCallbackMap": {
                0: function() {
                    // var indexPage = __uri("../pages/index.html");
                    var indexPage = "/index.html";
                    currentController.gotoPage(indexPage);
                },
                "-1" : function() {
                    currentController.view.renderError(errCodeTipsMap["-1"]);
                }
            },
            "errorCallback" : function() {
                currentController.view.renderError(errCodeTipsMap["-1"]);
            }
        };

        currentController.model.logout(inputCallbacks);
    };

    UserController.prototype.changePassword = function() {
        var password = $('#oldpwd').val();
        var newPassword = $('#newpwd').val();
        var confirmPassword = $("#cfpwd").val();
        var args = {password: password, newPassword: newPassword, confirmPassword: confirmPassword};

        var passwordValidateArgs = {
            "attrEmptyMsg": tips.types.password.cantBeEmpty,
            "attrOutOfLimitMsg": tips.types.password.outOfLimit,
            "patternTestFailMsg": tips.types.password.invalidLong, 
        };

        var curPwdValidRslt = this.model.validatePasswordFormat(password, passwordValidateArgs);
        var e = new $.ipc.Error();
        e.code = true;
        e.msg = "ok";
        if (!curPwdValidRslt.code) {
            e = curPwdValidRslt;
        } else {
            var newPwdValidRslt = this.model.validatePasswordFormat(newPassword, passwordValidateArgs);
            if (!newPwdValidRslt.code) {
                e = newPwdValidRslt;
            } else {
                if (confirmPassword != newPassword) {
                    e.code = false;
                    e.msg = tips.actions.confirmNewPassword.failed;
                };
            }
        }

        if (!e.code) {
            this.view.renderError(e.msg);
        } else {

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
            this.model.modifyPassword(args, inputCallbacks);
        }
    
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

    UserController.prototype.gotoAdminInfo = function() {
        this.view.renderAdminInfo();
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

    UserView.prototype.showWelcomeInfo = function() {
        if(undefined == this.model.email) {
            console.error("args error in showWelcomeInfo");
            return;
        };

        var a = "";
        a += "<div id='welcomeinfo'>",
        a += "<span class='logoutcontain welcomeinfo-cell'>",
        a += "<a href='#' id ='logout'title='End tpCamera journey?' class='lang'>",
        a += "Logout",
        a += "</a>",
        a += "</span>",
        a += "<span id='welcome_username' class='welcomeinfo-cell'>",
        a += this.model.email;
        a += "</span>",
        a += "<span id='wn' class='welcomeinfo-cell'>",
        a += "Welcome,&nbsp;",
        a += "</span>",
        a += "</div>";
        $("#toplink").after(a);
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

    UserView.prototype.hideMainBoardSon = function() {
        $("#maincontent").children().hide();
    };

    UserView.prototype.renderAdminInfo = function() {
        this.hideMainBoardSon();
        $("#maincontent > .account-information").show();
    }

    UserView.prototype.renderChangePasswod = function() {
        this.hideMainBoardSon();
        $("#maincontent > .change-password-form").show();
    };

    var u = new User();
    var uv = new UserView();
    var uc = new UserController();
    uc.view = uv;
    uc.model = u;
    uv.model = u;

    var contextRememberUserFunc = $.proxy(uv.showWelcomeInfo, uv);
    User.prototype.readCookieDataCallbacks.add(contextRememberUserFunc);

    uc.initHandler();
    u.readDataFromCookie();

});