define(["Model", "inheritPrototype", "Cookies", "jquery", "tips", "Error", "encrypt"], 
    function (Model, inheritPrototype, Cookies, $, tips, Error, encrypt) {
    function User() {
        Model.call(this, arguments);
        this.username = null;
        this.token = null;
        this.email = null;
        this.account = null;
        this.password = null;
        this.newPassword = null;
        this.rememberMe = null;
    };

    inheritPrototype(User, Model);

    var userErrorCodeInfo = {
        100: function() {
            console.log("token is invalid, plz relogin");
        },
        1000: function() {
            console.log("email is needed");
        },
        1002: function() {
            console.log("email format is invalid");
        },
        1005: function() {
            console.log("account is needed");
        },
        1006: function() {
            console.log("account does not exist");
        },
        1007: function() {
            console.log("account has already been activated");
        },
        1008: function() {
            console.log("email have been used");
        },
        1009: function() {
            console.log("account is not activated");
        },
        1011: function() {
            console.log("username is needed");
        },
        1012: function() {
            console.log("username can not contain any illegal char")
        },
        1013: function() {
            console.log("username have been used");
        },
        1015: function() {
            console.log("password format is invalid");
        },
        1020: function() {
            console.log("password is needed");
        },
        1022: function() {
            console.log("password length is invalid");
        },
        1023: function() {
            console.log("decrypt password failed");
        },
        1024: function() {
            console.log("account and password is not match");
        },
        1025: function() {
            console.log("new password is needed");
        },
        1029: function() {
            console.log("account was locked");
        },
    };

    User.prototype.errorCodeCallbacks = User.prototype.extendErrorCodeCallback({
        "errorCodeCallbackMap": userErrorCodeInfo
    });
    User.prototype.readCookieDataCallbacks = $.Callbacks("unique stopOnFalse");

    User.prototype.readDataFromCookie = function(callbacks) {
        Cookies.get("rmbUser") && (this.rememberMe = true);
        Cookies.get("token") && (this.token = Cookies.get("token"));
        Cookies.get("email") && (this.email = Cookies.get("email"));

        if (Cookies.get("userName")) {
            this.account = Cookies.get("userName");
        } else if (Cookies.get("account")) {
            this.account = Cookies.get("account");
        }

        this.readCookieDataCallbacks.fire();
    };

    User.prototype.register = function(args, inputCallbacks) {
        var result = {};
        var validateResult = (!this.validateEmailFormat(args.email).code && this.validateEmailFormat(args.email)) ||
            (!this.validateTwoPassword(args.password, args.passwordConfirm).code && this.validateTwoPassword(args.password, args.passwordConfirm));
        if (validateResult.code == false) {
            result["validateResult"] = validateResult;
            return result;
        };

        var data = JSON.stringify({
            "email": args.email,
            "password": this.encryptText(args.password)
        });

        result["ajaxObj"] = this.makeAjaxRequest({
            url: "/register",
            data: data,
            callbacks: inputCallbacks,
            changeState: $.noop
        });
        return result;
    };

    User.prototype.login = function(args, inputCallbacks) {
        var result = {};
        var validateResult = (!this.validateAccount(args.account).code && this.validateAccount(args.account)) ||
            (!this.validatePassword(args.password).code && this.validatePassword(args.password, {
                "patternTestFailMsg": tips.types.password.invalidShort
            }));
        if (validateResult.code == false) {
            result["validateResult"] = validateResult;
            return result;
        };

        var data = JSON.stringify({
            "account": args.account,
            "password": this.encryptText(args.password)
        });

        var changeStateFunc = function(response) {
            this.account = args.account;
            this.token = response.msg.token;
            this.email = response.msg.email;
        }

        result["ajaxObj"] = this.makeAjaxRequest({
            url: "/login",
            data: data,
            callbacks: inputCallbacks,
            changeState: changeStateFunc
        });
        return result;
    };

    User.prototype.logout = function(args, inputCallbacks) {
        var result = {};
        var validateResult = (!this.validateEmailFormat(args.email).code && this.validateEmailFormat(args.email));
        if (validateResult.code == false) {
            result["validateResult"] = validateResult;
            return result;
        };

        var data = JSON.stringify({
            "email": args.email
        });

        var changeStateFunc = function(response) {
            this.token = null;
            Cookies.remove("token");
        }

        result["ajaxObj"] = this.makeAjaxRequest({
            url: "/logout",
            data: data,
            callbacks: inputCallbacks,
            changeState: changeStateFunc
        });
        return result;
    };

    User.prototype.sendActiveEmail = function(args, inputCallbacks) {
        var result = {};
        var validateResult = (!this.validateEmailFormat(args.email).code && this.validateEmailFormat(args.email));
        if (validateResult.code == false) {
            result["validateResult"] = validateResult;
            return result;
        };

        var data = JSON.stringify({
            "email": args.email
        });

        result["ajaxObj"] = this.makeAjaxRequest({
            url: "/sendActiveEmail",
            data: data,
            callbacks: inputCallbacks,
            changeState: $.noop
        });
        return result;
    };

    User.prototype.resetPassword = function(args, inputCallbacks) {
        var result = {};
        var validateResult = (!this.validateEmailFormat(args.email).code && this.validateEmailFormat(args.email));
        if (validateResult.code == false) {
            result["validateResult"] = validateResult;
            return result;
        };

        var data = JSON.stringify({
            "email": args.email
        });

        var changeStateFunc = function(response) {
            this.password = null;
        };

        result["ajaxObj"] = this.makeAjaxRequest({
            url: "/forgetPassword",
            data: data,
            callbacks: inputCallbacks,
            changeState: changeStateFunc
        });
        return result;
    };

    User.prototype.modifyPassword = function(args, inputCallbacks) {
        var result = {};
        var validateResult = (!this.validateAccount(args.account).code && this.validateAccount(args.account)) ||
            (!this.validatePassword(args.password).code && this.validatePassword(args.password)) ||
            (!this.validateTwoPassword(args.newPassword, args.newPasswordSecond).code && this.validateTwoPassword(args.newPassword, args.newPasswordSecond));
        if (validateResult.code == false) {
            result["validateResult"] = validateResult;
            return result;
        };
        if (undefined == this.account) {
            console.error("args error in modifyPassword");
        };

        var data = JSON.stringify({
            "account": this.account,
            "oldPassword": this.encryptText(args.password),
            "password": this.encryptText(args.newPassword),
        });

        var changeStateFunc = function(response) {
            this.token = null;
            this.password = null;
        };

        result["ajaxObj"] = this.makeAjaxRequest({
            url: "/modifyPassword",
            data: data,
            callbacks: inputCallbacks,
            changeState: changeStateFunc
        });
        return result;
    };

    User.prototype.forgotPassword = function(args, inputCallbacks) {
        var result = {};
        var validateResult = (!this.validateEmailFormat(args.email).code && this.validateEmailFormat(args.email));
        if (validateResult.code == false) {
            result["validateResult"] = validateResult;
            return result;
        };

        var data = JSON.stringify({
            "email": args.email
        });

        result["ajaxObj"] = this.makeAjaxRequest({
            url: "/forgetPassword",
            data: data,
            callbacks: inputCallbacks,
            changeState: $.noop
        });
        return result;
    };

    User.prototype.getUser = function(args, inputCallbacks) {
        var result = {};
        var validateResult = (!this.validateEmailFormat(args.email).code && this.validateEmailFormat(args.email));
        if (validateResult.code == false) {
            result["validateResult"] = validateResult;
            return result;
        };

        var data = JSON.stringify({
            "email": args.email
        });

        var changeStateFunc = function(response) {
            this.username = response.msg.username;
        };

        result["ajaxObj"] = this.makeAjaxRequest({
            url: "/getUser",
            data: data,
            callbacks: inputCallbacks,
            changeState: changeStateFunc
        });
        return result;
    };

    User.prototype.validateAccount = function(tmpAccount) {
        if (undefined == tmpAccount) {
            console.error("args error in validateAccount");
            return;
        };

        var validateArgs = {
            "attr": tmpAccount,
            "attrEmptyMsg": tips.types.account.cantBeEmpty,
            "maxLength": 64,
            "minLength": 1,
            "attrOutOfLimitMsg": "account out of limit",
            "pattern": /^.*$/,
            "patternTestFailMsg": tips.types.account.invalid,
        };

        return this.validateAttr(validateArgs);
    };

    User.prototype.validateUsername = function(tmpUsername) {
        if (undefined == tmpUsername) {
            console.error("args error in validateUsername");
            return;
        };

        var validateArgs = {
            "attr": tmpUsername,
            "attrEmptyMsg": tips.types.username.cantBeEmpty,
            "maxLength": 32,
            "minLength": 1,
            "attrOutOfLimitMsg": tips.types.username.outOfLimit,
            "pattern": /^[0-9A-Za-z-_.]{1,32}$/,
            "patternTestFailMsg": tips.types.username.invalid,
        };

        return this.validateAttr(validateArgs);
    };

    User.prototype.validatePassword = function(tmpPassword, msg) {
        if (undefined == tmpPassword) {
            console.error("args error in validatePassword");
            return;
        };
        var defaultMsg = {
            "attrEmptyMsg": tips.types.password.cantBeEmpty,
            "attrOutOfLimitMsg": tips.types.password.outOfLimit,
            "patternTestFailMsg": tips.types.password.invalidLong
        };

        var extendMsg = $.extend(true, defaultMsg, msg);
        var validateArgs = {
            "attr": tmpPassword,
            "maxLength": 32,
            "minLength": 6,
            "pattern": /^[\x21-\x7e]{6,32}$/
        };

        $.extend(true, validateArgs, extendMsg);
        return this.validateAttr(validateArgs);
    };

    User.prototype.validateTwoPassword = function(password, passwordTwo) {
        if (undefined == password || undefined == passwordTwo) {
            console.error("args error in validateTwoPassword");
            return;
        };
        if (password != passwordTwo) {
            var err = new Error();
            err.code = false;
            err.msg = tips.types.confirmPassword.notSame;
            return err;
        };
        return this.validatePassword(password);
    };

    User.prototype.validateEmailFormat = function(tmpEmail) {
        if (undefined == tmpEmail) {
            console.error("args error in validateEmailFormat");
            return;
        };

        var validateArgs = {
            "attr": tmpEmail,
            "attrEmptyMsg": tips.types.email.cantBeEmpty,
            "maxLength": 64,
            "minLength": 1,
            "attrOutOfLimitMsg": tips.types.email.outOfLimit,
            "pattern": /^[_A-Za-z0-9-]+(\.[_A-Za-z0-9-]+)*@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)*(\.[A-Za-z]{2,6})$/,
            "patternTestFailMsg": tips.types.email.invalid,
        };
        return this.validateAttr(validateArgs);
    };

    User.prototype.encryptText = function(text) {
        if (text == undefined) {
            console.error("error in encryptText");
            return;
        };
        // return encrypt.rsa_encrypt(text);
        return text;
    };

    User.prototype.setRememberMe = function(rememberMe) {
        if (undefined == rememberMe) {
            console.error("args error in rememberMe");
            return;
        };
        this.rememberMe = rememberMe;
    };

    return User;
})