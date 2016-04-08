$(function () {
    function User() {
        $.ipc.User.call(this, arguments);
        this.activateDeviceAdminCallback = $.Callbacks("unique stopOnFalse");
    };

    $.ipc.inheritPrototype(User, $.ipc.User);

    function UserController() {
        $.ipc.BaseController.call(this, arguments);
    }

    $.ipc.inheritPrototype(UserController, $.ipc.BaseController);

    UserController.prototype.initHandler = function() {
        var appendedSelectorHandlerMap = {
            "#submit": {
                "click": this.registerOrActivate
            },
            "#goto-activate": {
                "click": this.showActivate
            },
            "#goto-register": {
                "click": this.showRegister
            }
        };
        var selectorMsgProduceFuncMap = {};
        this.batchInitHandler(appendedSelectorHandlerMap, selectorMsgProduceFuncMap);
    };

    UserController.prototype.registerOrActivate = function() {
        var title = $(".accountinnertext").text();
        if (title) {
            if (title.match(/activate/i)) {
                this.activate();
            } else {
                this.register();
            }
        };
    };

    UserController.prototype.showActivate = function() {
        this.view.showActivate();
    };

    UserController.prototype.showRegister = function() {
        this.view.showRegister();
    };

    UserController.prototype.activate = function() {
        var _self = this;
        var email = $("#email").val();
        var args = {
            email: email
        };

        var errCodeTipsMap = {
            "-1": tips.actions.register.failed,
            "1006": tips.types.email.notRegistered,
            "1007": tips.types.activate.alreadyActivated
        };

        var inputCallbacks = {
            "errorCodeCallbackMap": {
                0: function() {
                    _self.activateSuccess();
                },
                "-1": function() {
                    _self.view.renderError(errCodeTipsMap["-1"]);
                },
                "1008": function() {
                    _self.view.renderError(errCodeTipsMap["1006"]);
                }
            },
            "errorCallback": function() {
                _self.view.renderError(errCodeTipsMap["-1"]);
            }
        };
        var validateResult = _self.model.sendActiveEmail(args, inputCallbacks)["validateResult"];
        if (validateResult != undefined && !validateResult.code) {
            _self.view.renderError(validateResult.msg);
        };
    };

    UserController.prototype.register = function() {
        var _self = this;
        var email = $("#email").val();
        var password = $("#password").val();
        var passwordConfirm = $("#password-confirm").val();

        var args = {
            email: email,
            password: password,
            passwordConfirm: passwordConfirm
        };

        var errCodeTipsMap = {
            "-1": tips.actions.register.failed,
            "1008": tips.types.register.emailAlreadyRegistered,
        };

        var inputCallbacks = {
            "errorCodeCallbackMap": {
                0: function() {
                    _self.registerSuccess();
                },
                "-1": function() {
                    _self.view.renderError(errCodeTipsMap["-1"]);
                },
                "1008": function() {
                    _self.view.renderError(errCodeTipsMap["1008"]);
                }
            },
            "errorCallback": function() {
                _self.view.renderError(errCodeTipsMap["-1"]);
            }
        };
        var validateResult = _self.model.register(args, inputCallbacks)["validateResult"];
        if (validateResult != undefined && !validateResult.code) {
            _self.view.renderError(validateResult.msg);
        };
    };

    function UserView() {
        this.model = null;
        this.registerTitle = "Create Account";
        this.activateTitle = "Activate Account";
    }

    UserView.prototype.renderError = function(msg) {
        if (msg) {
            $.ipc.Msg({
                "type": "alert",
                "info": msg
            });
        } else {
            console.error("args error in renderError");
        }
    };

    UserView.prototype.hideAllTips = function() {
        $(".account-ctrl").hide();
    };

    UserView.prototype.showActivate = function() {
        this.hideAllTips();
        $("#goto-register").show();
        $("#password").attr("value","");
        $("#password-confirm").attr("value","");
        $("#password").closest("div").hide();
        $("#password-confirm").closest("div").hide();

        $("span.accountinnertext").text(this.activateTitle);
    };

    UserView.prototype.showRegister = function() {
        this.hideAllTips();
        $("#goto-activate").show();
        $("#password").closest("div").show();
        $("#password-confirm").closest("div").show();

        $("span.accountinnertext").text(this.registerTitle);
    };

    var u = new User();
    var uc = new UserController();
    var uv = new UserView();
    uc.model = u;
    uc.view = uv;
    uv.model = u;

    uc.initHandler();
});