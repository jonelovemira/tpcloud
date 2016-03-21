/*****************************************************************************
 * Copyright© 2004-2015 TP-LINK TECHNOLOGIES CO., LTD.
 * File Name: ipc-business-libs.js
 * Author:    Jone Xu
 * Version:   1.0
 * Description:
 *     This is business libs for interact with backend from front-ends model.
 *
 * Requires:
 *     jquery-1.8.2.min.js           jquery libs 
 *     ipc-info-libs.js              ipc msg tips library   
 *     ipc-secret-libs.js            ipc encrypt, base64 encode/decode library   
 *     jquery.cookie.js              cookie management
 *
 * History:
 *     2015-10-20: Jone Xu           File created.
 *     2015-10-21: Jone Xu           Finish the methods of User
 *     2015-10-23: Jone Xu           Add validate methods to check attrs
 *****************************************************************************/

(function($) {
    "use strict";

    $.ipc = $.ipc || {};

    function Error() {
        this.code = null;
        this.msg = null;
    }

    Error.prototype.printMsg = function() {
        console.log(this.msg);
    };

    $.ipc.Error = Error;

    $.ipc.create = function(p) {
        if (p == null) {
            console.error("unknown type, cannot create");
        };

        if (Object.create) {
            return Object.create(p);
        };

        var t = typeof p;
        if (t !== "object" && t !== "function") {
            console.error("not a object or function");
        };

        function f() {};
        f.prototype = p;
        return new f();
    };
})(jQuery);

(function($) {

    "use strict";

    $.ipc = $.ipc || {};

    $.ipc.inheritPrototype = function(subType, baseType) {
        if (undefined == baseType || undefined == subType) {
            console.error("args error in inherit");
        };

        subType.prototype = $.ipc.create(baseType.prototype);
        subType.prototype.constructor = subType;
    };

    $.ipc.initClassPrototype = function(tmp, classPrototype) {
        if (undefined == tmp || undefined == classPrototype) {
            console.error("args error in initClassPrototype");
        };
        var cloneTmp = $.extend(true, {}, tmp);
        $.extend(true, classPrototype, cloneTmp);
    };
})(jQuery);

(function($) {
    "use strict";

    $.ipc = $.ipc || {};

    function Model() {};

    Model.prototype.errorCodeCallbacks = {
        errorCodeCallbackMap: {
            "0": function() {
                console.log("OK");
            },
            "-1": function() {
                console.log("unknow error");
            },
        },
        errorCallback: function(xhr) {
            console.log("xhr error: ", xhr)
        }
    };

    Model.prototype.extendErrorCodeCallback = function(inputCallbacks) {
        var tmpCallbacks = $.extend(true, {}, this.errorCodeCallbacks, inputCallbacks);
        return tmpCallbacks;
    };

    Model.prototype.makeAjaxRequest = function(inputArgs, xDomain) {

        if (undefined == inputArgs["url"] || undefined == inputArgs["data"] || undefined == inputArgs["changeState"]) {
            console.error("args error in makeAjaxRequest");
            return;
        };

        var tmpCallbacks = this.extendErrorCodeCallback(inputArgs["callbacks"]);
        var currentModel = this;

        var ajaxOptions = {
            url: inputArgs["url"],
            data: inputArgs["data"],
            success: function(response) {
                var errCodeStrIndex = inputArgs["errCodeStrIndex"] || "errorCode";
                var noErrorCode = inputArgs["noErrorCode"] || 0;
                var defaultErrorCode = inputArgs["defaultErrorCode"] || -1;

                if (response[errCodeStrIndex] == noErrorCode) {
                    var changeStateFunc = $.proxy(inputArgs["changeState"], currentModel);
                    changeStateFunc(response);
                }
                var callbackFunc = tmpCallbacks.errorCodeCallbackMap[response[errCodeStrIndex]] || tmpCallbacks.errorCodeCallbackMap[defaultErrorCode];
                callbackFunc(response);
                if (tmpCallbacks.commonCallback) {
                    tmpCallbacks.commonCallback();
                };
            },
            error: function(xhr) {
                tmpCallbacks.errorCallback(xhr);
                if (tmpCallbacks.commonCallback) {
                    tmpCallbacks.commonCallback();
                };
            }
        };

        $.extend(true, ajaxOptions, inputArgs["extendAjaxOptions"]);

        return $.xAjax(ajaxOptions, xDomain);
    };

    Model.prototype.validateAttr = function(inputArgs) {
        if (undefined == inputArgs["attr"] || undefined == inputArgs["attrEmptyMsg"] ||
            undefined == inputArgs["maxLength"] || undefined == inputArgs["minLength"] ||
            undefined == inputArgs["attrOutOfLimitMsg"] || undefined == inputArgs["pattern"] ||
            undefined == inputArgs["patternTestFailMsg"]) {
            console.error("args error in validateAttr");
            return;
        };
        var e = new $.ipc.Error();
        if (0 == inputArgs["attr"].length) {
            e.code = false;
            e.msg = inputArgs["attrEmptyMsg"];
        } else if (inputArgs["attr"].length > inputArgs["maxLength"] || inputArgs["attr"].length < inputArgs["minLength"]) {
            e.code = false;
            e.msg = inputArgs["attrOutOfLimitMsg"];
        } else if (!inputArgs["pattern"].test(inputArgs["attr"])) {
            e.code = false;
            e.msg = inputArgs["patternTestFailMsg"];
        } else {
            e.code = true;
            e.msg = "OK";
        };
        return e;
    };

    $.ipc.Model = Model;

})(jQuery);

(function($) {
    "use strict";

    $.ipc = $.ipc || {};

    function User() {
        $.ipc.Model.call(this, arguments);
        this.username = null;
        this.token = null;
        this.email = null;
        this.account = null;
        this.password = null;
        this.newPassword = null;
        this.rememberMe = null;
    };

    $.ipc.inheritPrototype(User, $.ipc.Model);

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
        $.cookie("rmbUser") && (this.rememberMe = true);
        $.cookie("token") && (this.token = $.cookie("token"));
        $.cookie("email") && (this.email = $.cookie("email"));

        if ($.cookie("userName")) {
            this.account = $.cookie("userName");
        } else if ($.cookie("account")) {
            this.account = $.cookie("account");
        }

        this.readCookieDataCallbacks.fire();
    };

    User.prototype.register = function(args, inputCallbacks) {
        var result = {};
        var validateResult = (!this.validateEmailFormat(args.email).code && this.validateEmailFormat(args.email)) ||
            (!this.validateUsername(args.username).code && this.validateUsername(args.username)) ||
            (!this.validatePassword(args.password).code && this.validatePassword(args.password));
        if (!validateResult.code) {
            result["validateResult"] = validateResult;
            return result;
        };

        var data = JSON.stringify({
            "email": args.email,
            "username": args.username,
            "password": args.encryptText(args.password)
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
            $.removeCookie("token");
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
            (!this.validateNewPassword(args.newPassword, args.newPasswordSecond).code && this.validateNewPassword(args.newPassword, args.newPasswordSecond));
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

    User.prototype.validateNewPassword = function(tmpNewPassword, tmpNewPasswordSecond) {
        if (undefined == tmpNewPassword || undefined == tmpNewPasswordSecond) {
            console.error("args error in validateNewPassword");
            return;
        };
        if (tmpNewPassword != tmpNewPasswordSecond) {
            var err = new $.ipc.Error();
            err.code = false;
            err.msg = tips.types.newPassword.notSame;
            return err;
        };
        return this.validatePassword(tmpNewPassword);
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

        return text;
    };

    User.prototype.setRememberMe = function(rememberMe) {
        if (undefined == rememberMe) {
            console.error("args error in rememberMe");
            return;
        };
        this.rememberMe = rememberMe;
    };

    $.ipc.User = User;

})(jQuery);

(function($) {
    "use strict";

    $.ipc = $.ipc || {};

    function Codec() {
        this.name = null;
    };

    function PCMAudioCodec() {
        Codec.call(this, arguments);
        this.name = "PCM";
    };
    $.ipc.inheritPrototype(PCMAudioCodec, Codec);

    function AACAudioCodec() {
        Codec.call(this, arguments);
        this.name = "AAC";
        this.pluginAudioTypeCode = 2;
    };
    $.ipc.inheritPrototype(AACAudioCodec, Codec);

    function MJPEGVideoCodec() {
        Codec.call(this, arguments);
        this.name = "mjpeg";
        this.mimeType = "application/x-tp-camera";
    };
    $.ipc.inheritPrototype(MJPEGVideoCodec, Codec);

    function H264VideoCodec() {
        Codec.call(this, arguments);
        this.name = "h264";
        this.mimeType = "application/x-tp-camera-h264";
        this.pluginStreamTypeCode = 2;
    };
    $.ipc.inheritPrototype(H264VideoCodec, Codec);

    $.ipc.PCMAudioCodec = PCMAudioCodec;
    $.ipc.AACAudioCodec = AACAudioCodec;
    $.ipc.MJPEGVideoCodec = MJPEGVideoCodec;
    $.ipc.H264VideoCodec = H264VideoCodec;
})(jQuery);

(function($) {
    "use strict";

    $.ipc = $.ipc || {};

    function hasNewerVersion(version) {
        if (undefined == version || undefined == this.newestVersion) {
            console.error("args error in hasNewerVersion");
        };
        var result = $.ipc.compareVersion(version, this.newestVersion);
        if (result > 0) {
            console.info("target version is bigger than newestVersion");
        };
        return result < 0;
    };

    var pluginInitPrototype = {
        supportedModels: [],
        name: null,
        downloadPath: null,
        tags: null,
        newestVersion: null,
        hasNewerVersion: hasNewerVersion
    };

    var mjpegVideoCodec = new $.ipc.MJPEGVideoCodec();
    var h264VideoCodec = new $.ipc.H264VideoCodec();

    function PLUGIN_NON_IE_X86() {};

    function PLUGIN_NON_IE_X64() {};

    function PLUGIN_IE_X86() {};

    function PLUGIN_IE_X64() {};

    function PLUGIN_MAC() {};

    function FLASH_PLAYER() {};

    function IMG_PLAYER() {};

    PLUGIN_NON_IE_X86.prototype.mimetypeCssMap = {};
    PLUGIN_NON_IE_X86.prototype.mimetypeCssMap[mjpegVideoCodec.mimeType] = "non-ie-mjpeg";
    PLUGIN_NON_IE_X86.prototype.mimetypeCssMap[h264VideoCodec.mimeType] = "non-ie-h264";

    PLUGIN_NON_IE_X64.prototype.mimetypeCssMap = {};
    PLUGIN_NON_IE_X64.prototype.mimetypeCssMap[mjpegVideoCodec.mimeType] = "non-ie-mjpeg";
    PLUGIN_NON_IE_X64.prototype.mimetypeCssMap[h264VideoCodec.mimeType] = "non-ie-h264";

    PLUGIN_IE_X86.prototype.mimetypeCssMap = {};
    PLUGIN_IE_X86.prototype.mimetypeCssMap[mjpegVideoCodec.mimeType] = "ie-mjpeg";
    PLUGIN_IE_X86.prototype.mimetypeCssMap[h264VideoCodec.mimeType] = "ie-h264";

    PLUGIN_IE_X64.prototype.mimetypeCssMap = {};
    PLUGIN_IE_X64.prototype.mimetypeCssMap[mjpegVideoCodec.mimeType] = "ie-mjpeg";
    PLUGIN_IE_X64.prototype.mimetypeCssMap[h264VideoCodec.mimeType] = "ie-h264";

    PLUGIN_MAC.prototype.mimetypeCssMap = {};
    PLUGIN_MAC.prototype.mimetypeCssMap[mjpegVideoCodec.mimeType] = "non-ie-mjpeg";
    PLUGIN_MAC.prototype.mimetypeCssMap[h264VideoCodec.mimeType] = "non-ie-h264";

    (function() {
        var tmp = [PLUGIN_NON_IE_X86, PLUGIN_NON_IE_X64, PLUGIN_IE_X86, PLUGIN_IE_X64, PLUGIN_MAC];
        for (var i = 0; i < tmp.length; i++) {
            $.ipc.initClassPrototype(pluginInitPrototype, tmp[i].prototype);
        };
    })();

    $.ipc.PLUGIN_NON_IE_X86 = PLUGIN_NON_IE_X86;
    $.ipc.PLUGIN_NON_IE_X64 = PLUGIN_NON_IE_X64;
    $.ipc.PLUGIN_IE_X86 = PLUGIN_IE_X86;
    $.ipc.PLUGIN_IE_X64 = PLUGIN_IE_X64;
    $.ipc.PLUGIN_MAC = PLUGIN_MAC;
    $.ipc.FLASH_PLAYER = FLASH_PLAYER;
    $.ipc.IMG_PLAYER = IMG_PLAYER;

})(jQuery);

(function($) {
    "use strict";
    $.ipc = $.ipc || {};

    function PlayerContainerCss() {
        this.player = {};
        this.loadingImg = {};
        this.loadingTips = {};
        this.controlBoard = {};
    };

    var vgaPlayerContainerCss = new PlayerContainerCss();
    vgaPlayerContainerCss.player = {
        width: 640,
        height: 480,
        "margin-left": "103px"
    };

    vgaPlayerContainerCss.loadingImg = {
        left: "400px",
        top: "270px"
    };
    vgaPlayerContainerCss.loadingTips = {
        "right": "4px"
    };
    vgaPlayerContainerCss.controlBoard = {
        width: vgaPlayerContainerCss.player.width
    };

    var qvgaPlayerContainerCss = new PlayerContainerCss();
    qvgaPlayerContainerCss.player = {
        width: 640,
        height: 480,
        "margin-left": "103px"
    };
    qvgaPlayerContainerCss.loadingImg = {
        left: "400px",
        top: "270px"
    };
    qvgaPlayerContainerCss.loadingTips = {
        "right": "4px"
    };
    qvgaPlayerContainerCss.controlBoard = {
        width: qvgaPlayerContainerCss.player.width
    };

    var hdPlayerContainerCss = new PlayerContainerCss();
    hdPlayerContainerCss.player = {
        width: 768,
        height: 432,
        "margin-left": "40px"
    };
    hdPlayerContainerCss.loadingImg = {
        left: "400px",
        top: "250px"
    };
    hdPlayerContainerCss.loadingTips = {
        "right": "4px"
    };
    hdPlayerContainerCss.controlBoard = {
        width: hdPlayerContainerCss.player.width
    };

    var fullhdPlayerContainerCss = new PlayerContainerCss();
    fullhdPlayerContainerCss.player = {
        width: 768,
        height: 432,
        "margin-left": "40px"
    };
    fullhdPlayerContainerCss.loadingImg = {
        left: "400px",
        top: "250px"
    };
    fullhdPlayerContainerCss.loadingTips = {
        "right": "4px"
    };
    fullhdPlayerContainerCss.controlBoard = {
        width: fullhdPlayerContainerCss.player.width
    };

    $.ipc.vgaPlayerContainerCss = vgaPlayerContainerCss;
    $.ipc.qvgaPlayerContainerCss = qvgaPlayerContainerCss;
    $.ipc.hdPlayerContainerCss = hdPlayerContainerCss;
    $.ipc.fullhdPlayerContainerCss = fullhdPlayerContainerCss;

})(jQuery);

(function($) {
    "use strict";
    $.ipc = $.ipc || {};

    function PluginPlayerObjCss() {
        this.css = null;
    };

    var qvgaPluginPlayerObjCss = new PluginPlayerObjCss();
    qvgaPluginPlayerObjCss.css = {
        width: 320,
        height: 240,
        left: 160,
        top: 120,
        position: "relative"
    };

    var vgaPluginPlayerObjCss = new PluginPlayerObjCss();
    vgaPluginPlayerObjCss.css = {
        width: 640,
        height: 480,
        left: 0,
        top: 0,
        position: "relative"
    };

    $.ipc.qvgaPluginPlayerObjCss = qvgaPluginPlayerObjCss;
    $.ipc.vgaPluginPlayerObjCss = vgaPluginPlayerObjCss;
})(jQuery);

(function($) {
    "use strict";

    $.ipc = $.ipc || {};

    function Resolution() {
        this.name = null;
        this.width = null;
        this.height = null;
        this.str = null;
        this.playerContainerCss = null;
        this.pluginStreamResCode = null;
        this.pluginPlayerObjCss = null;
    };

    var RESOLUTION_VIDEO_VGA = new Resolution();
    RESOLUTION_VIDEO_VGA.name = "VGA";
    RESOLUTION_VIDEO_VGA.width = 640;
    RESOLUTION_VIDEO_VGA.height = 480;
    RESOLUTION_VIDEO_VGA.str = RESOLUTION_VIDEO_VGA.width + "*" + RESOLUTION_VIDEO_VGA.height;
    RESOLUTION_VIDEO_VGA.playerContainerCss = $.ipc.vgaPlayerContainerCss;
    RESOLUTION_VIDEO_VGA.pluginStreamResCode = 0;
    RESOLUTION_VIDEO_VGA.pluginPlayerObjCss = $.ipc.vgaPluginPlayerObjCss;
    var RESOLUTION_VIDEO_QVGA = new Resolution();
    RESOLUTION_VIDEO_QVGA.name = "QVGA";
    RESOLUTION_VIDEO_QVGA.width = 320;
    RESOLUTION_VIDEO_QVGA.height = 240;
    RESOLUTION_VIDEO_QVGA.str = RESOLUTION_VIDEO_QVGA.width + "*" + RESOLUTION_VIDEO_QVGA.height;
    RESOLUTION_VIDEO_QVGA.playerContainerCss = $.ipc.qvgaPlayerContainerCss;
    RESOLUTION_VIDEO_QVGA.pluginStreamResCode = 1;
    RESOLUTION_VIDEO_QVGA.pluginPlayerObjCss = $.ipc.qvgaPluginPlayerObjCss;
    var RESOLUTION_VIDEO_HD = new Resolution();
    RESOLUTION_VIDEO_HD.name = "HD";
    RESOLUTION_VIDEO_HD.width = 1280;
    RESOLUTION_VIDEO_HD.height = 720;
    RESOLUTION_VIDEO_HD.str = RESOLUTION_VIDEO_HD.width + "*" + RESOLUTION_VIDEO_HD.height;
    RESOLUTION_VIDEO_HD.playerContainerCss = $.ipc.hdPlayerContainerCss;
    RESOLUTION_VIDEO_HD.pluginStreamResCode = 2;
    var RESOLUTION_VIDEO_FULLHD = new Resolution();
    RESOLUTION_VIDEO_FULLHD.name = "FullHD";
    RESOLUTION_VIDEO_FULLHD.width = 1920;
    RESOLUTION_VIDEO_FULLHD.height = 1080;
    RESOLUTION_VIDEO_FULLHD.str = RESOLUTION_VIDEO_FULLHD.width + "*" + RESOLUTION_VIDEO_FULLHD.height;
    RESOLUTION_VIDEO_FULLHD.playerContainerCss = $.ipc.fullhdPlayerContainerCss;

    $.ipc.Resolution = Resolution;
    $.ipc.RESOLUTION_VIDEO_VGA = RESOLUTION_VIDEO_VGA;
    $.ipc.RESOLUTION_VIDEO_QVGA = RESOLUTION_VIDEO_QVGA;
    $.ipc.RESOLUTION_VIDEO_HD = RESOLUTION_VIDEO_HD;
    $.ipc.RESOLUTION_VIDEO_FULLHD = RESOLUTION_VIDEO_FULLHD;

})(jQuery);

(function($) {
    "use strict";

    $.ipc = $.ipc || {};

    function Channel() {
        this.url = null;
        this.encrypt = null;
        this.videoCodec = null;
        this.audioCodec = null;
        this.name = null;
        this.port = null;
    };
    Channel.prototype.generateRelaydCommand = function(device) {
        if (undefined == device) {
            console.error("args error in generateRelaydCommand")
        };
        var localResolutionStr = this.generateLocalParam(device);
        var relayResolutionStr = this.generateRelayParam(device);
        var url = this.url;
        var type = this.name;
        return "relayd -s 'http://127.0.0.1:" + this.port + "/" + url + "?" + localResolutionStr +
            "' -d 'http://" + device.relayUrl + "/relayservice?deviceid=" +
            device.id + "&type=" + type + "&" + relayResolutionStr + "' -a 'X-token: " +
            device.owner.token + "' -t '" + device.relayVideoTime + "'";
    };

    function DevicePostChannelVideo() {
        Channel.call(this, arguments);
        this.name = 'video';
    };
    $.ipc.inheritPrototype(DevicePostChannelVideo, Channel);
    DevicePostChannelVideo.prototype.generateLocalParam = function(dev) {
        if (undefined == dev) {
            console.error("args error in gen local res str")
        };
        return $.param({
            resolution: dev.currentVideoResolution.name
        });
    };
    DevicePostChannelVideo.prototype.generateRelayParam = function(dev) {
        if (undefined == dev) {
            console.error("args error in gen local res str")
        };
        return $.param({
            resolution: dev.currentVideoResolution.name
        });
    };

    function DevicePostChannelAudio() {
        Channel.call(this, arguments);
        this.name = 'audio';
    };
    $.ipc.inheritPrototype(DevicePostChannelAudio, Channel);
    DevicePostChannelAudio.prototype.generateLocalParam = function(dev) {
        if (undefined == dev) {
            console.error("args error in gen local res str")
        };
        return $.param({
            resolution: dev.product.audioCodec.name
        });
    };
    DevicePostChannelAudio.prototype.generateRelayParam = function(dev) {
        if (undefined == dev) {
            console.error("args error in gen local res str")
        };
        return $.param({
            resolution: dev.product.audioCodec.name
        });
    };

    function DevicePostChannelMixed() {
        Channel.call(this, arguments);
        this.name = 'mixed';
    };
    $.ipc.inheritPrototype(DevicePostChannelMixed, Channel);
    DevicePostChannelMixed.prototype.generateLocalParam = function(dev) {
        if (undefined == dev) {
            console.error("args error in gen local res str")
        };
        return $.param({
            resolution: dev.currentVideoResolution.name,
            audio: dev.product.audioCodec.name,
            video: dev.product.videoCodec.name
        });
    };
    DevicePostChannelMixed.prototype.generateRelayParam = function(dev) {
        if (undefined == dev) {
            console.error("args error in gen local res str")
        };
        return $.param({
            resolution: dev.currentVideoResolution.name
        });
    };

    $.ipc.DevicePostChannelVideo = DevicePostChannelVideo;
    $.ipc.DevicePostChannelAudio = DevicePostChannelAudio;
    $.ipc.DevicePostChannelMixed = DevicePostChannelMixed;

})(jQuery);

(function($) {
    "use strict";

    $.ipc = $.ipc || {};

    function Device() {
        $.ipc.Model.call(this, arguments);
        this.owner = null;
        this.id = null;
        this.type = null;
        this.model = null;
        this.mac = null;
        this.isOnline = null;
        this.fwVer = null;
        this.appServerUrl = null;
        this.name = null;
        this.isSameRegion = null;
        this.webServerUrl = null;
        this.azIP = null;
        this.azDNS = null;
        this.systemStatus = null;
        this.needForceUpgrade = null;
        this.fwUrl = null;
        this.relayVideoTime = 600;

        this.hasGetCrossRegionInfo = false;
        this.hasUpgradOnce = null;
        this.product = null;
        this.nonPluginPlayer = null;
        this.pluginPlayer = null;

        this.currentVideoResolution = null;
        this.relayUrl = null;
        this.ELBcookie = null;
        this.resId = null;

        this.isActive = false;

        this.BACK_END_WEB_PROTOCAL = "";
    };

    var linkieDataList = {};

    $.ipc.inheritPrototype(Device, $.ipc.Model);

    var deviceErrorCodeInfo = {
        "-20501": function() {
            console.log("device id does not exists");
        },
        "-20506": function() {
            console.log("device was binded to another account");
        },
        "-20507": function() {
            console.log("device is not binded to any account");
        },
        "-20571": function() {
            console.log("device is offline now");
        },
        "-20572": function() {
            console.log("alias format is incorrect");
        },
        "-20651": function() {
            console.log("token is invalid, plz relogin");
        },
        "-20675": function() {
            console.log("account is login at another place");
        },
    };

    Device.prototype.errorCodeCallbacks = Device.prototype.extendErrorCodeCallback({
        "errorCodeCallbackMap": deviceErrorCodeInfo
    });
    Device.prototype.stateChangeCallbacks = $.Callbacks("unique stopOnFalse");

    Device.prototype.init = function(d) {
        if (undefined == d) {
            console.error("args error in init");
        };
        $.extend(true, this, d);
        var p = this.model.substring(0, 5).toUpperCase();
        var tmpProduct = new $.ipc.IpcProduct();
        $.extend(true, tmpProduct, $.ipc[p]);
        this.currentVideoResolution = tmpProduct.supportVideoResArr[0];
        this.product = tmpProduct;
    };

    Device.prototype.get = function(args, inputCallbacks, extendArgs) {
        if (this.owner == undefined) {
            console.error("owner is undefined");
        }
        var result = {};
        var validateResult = (!this.owner.validateEmailFormat(args.email).code && this.owner.validateEmailFormat(args.email)) ||
            (!this.validateIdFormat(args.id).code && this.validateIdFormat(args.id));
        if (validateResult.code == false) {
            result["validateResult"] = validateResult;
            return result;
        };

        var urlPrefix = this.BACK_END_WEB_PROTOCAL + this.webServerUrl;
        var dataRes = {
            "email": args.email,
            "id": args.id
        };
        if (extendArgs) {
            var dataRes = $.extend(true, dataRes, extendArgs.data);
        };
        var data = JSON.stringify(dataRes);

        var changeStateFunc = function(response) {
            this.init(response.msg);
            this.isSameRegion = true;
            this.hasGetCrossRegionInfo = true;
            this.stateChangeCallbacks.fire(this);
        };

        result["ajaxObj"] = this.makeAjaxRequest({
            url: urlPrefix + "/getCamera",
            data: data,
            callbacks: inputCallbacks,
            changeState: changeStateFunc,
            extendAjaxOptions: extendAjaxOptions
        }, $.xAjax.defaults.xType);
        return result;
    };
    Device.prototype.addNc200UpgradeCookie = function() {
        var device = this;
        var deviceModel = device.model;
        var fwVer = device.firmware;
        var deviceHwVer = device.hardware;
        if (deviceModel == "NC200(UN)" && fwVer == "2.1.3 Build 151125 Rel.24992" && deviceHwVer == "1.0") {
            var date = new Date();
            var minutes = 10;
            date.setTime(date.getTime() + (minutes * 60 * 1000));
            $.cookie(device.id, "upgrading", {
                expires: date
            });
        };
    };

    Device.prototype.upgrade = function(args, inputCallbacks) {
        if (undefined == this.owner || undefined == this.owner.token ||
            undefined == this.owner.email || undefined == args.fwUrl ||
            undefined == args.mac || undefined == args.azIP ||
            undefined == args.azDNS || undefined == this.webServerUrl) {
            console.error("args error in upgrade");
        }
        var result = {};
        var urlPrefix = this.BACK_END_WEB_PROTOCAL + this.webServerUrl;

        var data = {
            "REQUEST": "FIRMWAREUPGRADE",
            "DATA": {
                "account": this.owner.email,
                "User-Agent": "Web-ffx86-2.0",
                "command": "UPGRADE\n" + args.fwUrl + "\n",
                "dev_address": args.mac + "@" + args.azIP + "@" + args.azDNS,
                "token": this.owner.token,
            },
        };

        var changeStateFunc = function(response) {
            this.systemStatus = "downloading";
            this.hasUpgradOnce = true;
            this.stateChangeCallbacks.fire(this);

            this.addNc200UpgradeCookie();
        };

        var extendAjaxOptions = {
            contentType: "application/x-www-form-urlencoded;charset=utf-8"
        };

        result["ajaxObj"] = this.makeAjaxRequest({
            url: urlPrefix + "/init.php",
            data: data,
            callbacks: inputCallbacks,
            changeState: changeStateFunc,
            extendAjaxOptions: extendAjaxOptions
        }, $.xAjax.defaults.xType);

        return result;
    };

    Device.prototype.changeName = function(args, inputCallbacks) {
        if (undefined == this.owner || undefined == this.owner.token || undefined == this.appServerUrl) {
            console.error("args error in changeName")
        };
        var result = {};
        var validateResult = (!this.validateIdFormat(args.id).code && this.validateIdFormat(args.id)) ||
            (!this.validateNameFormat(args.name).code && this.validateNameFormat(args.name));
        if (validateResult.code == false) {
            result["validateResult"] = validateResult;
            return result;
        };

        var data = JSON.stringify({
            "method": "setAlias",
            "params": {
                "alias": args.name,
                "deviceId": args.id
            }
        });

        var changeStateFunc = function(response) {
            this.name = args.name;
            this.stateChangeCallbacks.fire(this);
        };

        result["ajaxObj"] = this.makeAjaxRequest({
            url: this.appServerUrl + "?token=" + this.owner.token,
            data: data,
            changeState: changeStateFunc,
            errCodeStrIndex: "error_code",
            callbacks: inputCallbacks,
        }, $.xAjax.defaults.xType);

        return result;
    };

    Device.prototype.unbind = function(args, inputCallbacks) {
        if (undefined == this.owner || undefined == this.owner.token ||
            undefined == this.appServerUrl) {
            console.error("args error in unbind");
        };
        var result = {};
        var validateResult = (!this.owner.validateAccount(args.account).code && this.owner.validateAccount(args.account)) ||
            (!this.validateIdFormat(args.id).code && this.validateIdFormat(args.id));
        if (validateResult.code == false) {
            result["validateResult"] = validateResult;
            return result;
        };

        var data = JSON.stringify({
            "method": "unbindDevice",
            "params": {
                "cloudUserName": args.account,
                "deviceId": args.id
            }
        });

        result["ajaxObj"] = this.makeAjaxRequest({
            url: this.appServerUrl + "?token=" + this.owner.token,
            data: data,
            changeState: $.noop,
            errCodeStrIndex: "error_code",
            callbacks: inputCallbacks
        }, $.xAjax.defaults.xType);
        return result;
    };

    Device.prototype.getLocalLinkieDataList = function() {
        return linkieDataList;
    };

    Device.prototype.setLocalLinkieDataList = function(data) {
        if (undefined == linkieDataList[this.model]) {
            linkieDataList[this.model] = {};
        }
        linkieDataList[this.model][this.fwVer] = data;
    };

    Device.prototype.isNeedGetLinkie = function() {
        var result = true;
        if (linkieDataList[this.model] && linkieDataList[this.model][this.fwVer]) {
            result = false;
        }
        return result;
    };

    Device.prototype.getLinkie = function(args, inputCallbacks) {
        if (undefined == args.token || undefined == args.appServerUrl) {
            console.error("args error in getLocalInfo");
        }
        var validateResult = (!this.validateIdFormat(args.id).code && this.validateIdFormat(args.id));
        if (validateResult.code == false) {
            return validateResult;
        };
        if (!this.isNeedGetLinkie()) {
            console.log("linkie data is already in cache when getLinkie. " +
                "passthrough to get linkie data anyway.");
        }

        var changeStateFunc = function(response) {
            if (response && response.result && response.result.responseData) {
                this.setLocalLinkieDataList(response.result.responseData);
            };
        };
        var _self = this;
        inputCallbacks = inputCallbacks || {};
        inputCallbacks.errorCodeCallbackMap = inputCallbacks.errorCodeCallbackMap || {};
        var tmpFunc = inputCallbacks.errorCodeCallbackMap["-51207"];
        inputCallbacks.errorCodeCallbackMap["-51207"] = function() {
            _self.setLocalLinkieDataList("-51207");
            tmpFunc && tmpFunc();
        };

        var data = JSON.stringify({
            "method": "passthrough",
            "params": {
                "requestData": {
                    "command": "LINKIE",
                    "content": {
                        "smartlife.cam.ipcamera.liveStream": {
                            "get_modules": {}
                        },
                        "smartlife.cam.ipcamera.cloud": {
                            "get_modules": {}
                        }
                    }
                },
                "deviceId": args.id
            }
        });

        return this.makeAjaxRequest({
            url: args.appServerUrl + "?token=" + args.token,
            data: data,
            changeState: changeStateFunc,
            errCodeStrIndex: "error_code",
            callbacks: inputCallbacks
        }, $.xAjax.defaults.xType);

    };

    Device.prototype.getSupportResArr = function(resDescriptionArr) {
        if (resDescriptionArr) {
            var ipcResObjMap = {
                "1920*1080": $.ipc.RESOLUTION_VIDEO_FULLHD,
                "1280*720": $.ipc.RESOLUTION_VIDEO_HD,
                "640*480": $.ipc.RESOLUTION_VIDEO_VGA,
                "320*240": $.ipc.RESOLUTION_VIDEO_QVGA
            };
            var result = [];
            for (var key in ipcResObjMap) {
                for (var i = resDescriptionArr.length - 1; i >= 0; i--) {
                    if (resDescriptionArr[i] == key) {
                        result.push(ipcResObjMap[key]);
                    };
                };
            };
            return result;
        } else {
            throw "undefined args in getSupportResArr";
        }
    };

    Device.prototype.getMixedPostDataChannel = function(supporttedMixed) {
        if (supporttedMixed) {
            var map = {};
            for (var i = supporttedMixed.length - 1; i >= 0; i--) {
                var tmp = supporttedMixed[i];
                map[tmp["video_codec"] + "_" + tmp["audio_codec"]] = tmp;
            };
            var result = {};
            var mixedChannel = new $.ipc.DevicePostChannelMixed();
            var videoCodec;
            var audioCodec;
            if (map["H.264_AAC"]) {
                videoCodec = new $.ipc.H264VideoCodec();
                audioCodec = new $.ipc.AACAudioCodec();
                mixedChannel.url = map["H.264_AAC"]["url"];
            } else if (map["MJPEG_PCM"]) {
                videoCodec = new $.ipc.MJPEGVideoCodec();
                audioCodec = new $.ipc.PCMAudioCodec();
                mixedChannel.url = map["MJPEG_PCM"]["url"];
            } else {
                throw "unknown mixed channel. neither h264acc nor mjpegpcm";
            };

            if (mixedChannel && videoCodec && audioCodec) {
                result = {
                    "postChannel": {
                        "mixed": mixedChannel
                    },
                    "videoCodec": videoCodec,
                    "audioCodec": audioCodec
                };
                return result;
            } else {
                throw "error in getMixedPostDataChannel";
            }
        } else {
            throw "undefined args in getMixedPostDataChannel";
        }
    };

    Device.prototype.getMultiPostDataChannel = function(audioArr, videoArr) {
        if (audioArr && videoArr) {
            var result = {};
            var videoCodec;
            var audioCodec;
            var videoChannel;
            var audioChannel;
            var audioCodecMap = {};
            for (var i = audioArr.length - 1; i >= 0; i--) {
                audioCodecMap[audioArr[i]["audio_codec"]] = audioArr[i];
            }
            var videoCodecMap = {};
            for (var i = videoArr.length - 1; i >= 0; i--) {
                videoCodecMap[videoArr[i]["video_codec"]] = videoArr[i];
            }

            if (audioCodecMap["AAC"]) {
                audioCodec = new $.ipc.AACAudioCodec();
                audioChannel = new $.ipc.DevicePostChannelAudio();
                audioChannel.url = audioCodecMap["AAC"].url;
            } else if (audioCodecMap["PCM"]) {
                audioCodec = new $.ipc.PCMAudioCodec();
                audioChannel = new $.ipc.DevicePostChannelAudio();
                audioChannel.url = audioCodecMap["PCM"].url;
            } else {
                throw "unknown audio codec type, neither aac nor pcm";
            }

            if (videoCodecMap["H.264"]) {
                videoCodec = new $.ipc.H264VideoCodec();
                videoChannel = new $.ipc.DevicePostChannelVideo();
                videoChannel.url = videoCodecMap["H.264"].url;
                videoChannel.encrypt = videoCodecMap["H.264"].encrypt;
            } else if (videoCodecMap["MJPEG"]) {
                videoCodec = new $.ipc.MJPEGVideoCodec();
                videoChannel = new $.ipc.DevicePostChannelVideo();
                videoChannel.url = videoCodecMap["MJPEG"].url;
                videoChannel.encrypt = videoCodecMap["MJPEG"].encrypt;
            } else {
                throw "unknown video codec type, neither h264 nor mjpeg";
            };

            if (videoChannel && audioChannel && videoCodec && audioCodec) {
                result = {
                    "postChannel": {
                        "video": videoChannel,
                        "audio": audioChannel
                    },
                    "videoCodec": videoCodec,
                    "audioCodec": audioCodec
                };
                return result;
            } else {
                throw "error in getMultiPostDataChannel";
            }
        } else {
            throw "undefined args in getMultiPostDataChannel";
        }
    };

    Device.prototype.getPlayerType = function(mt) {
        var mjpegVideoCodec = new $.ipc.MJPEGVideoCodec();
        var h264VideoCodec = new $.ipc.H264VideoCodec();
        var mimeTypesArr = [mjpegVideoCodec.mimeType, h264VideoCodec.mimeType];
        if ($.inArray(mt, mimeTypesArr) < 0) {
            throw "unknown mime types for getPlayerType";
        };
        var result = undefined;
        if (($.ipc.Browser.prototype.type == "Chrome" && parseInt($.ipc.Browser.prototype.version) >= 42) || $.ipc.Browser.prototype.type.indexOf("Edge") >= 0) {
            if (mt == mimeTypesArr[0]) {
                result = $.ipc.IMG_PLAYER;
            } else {
                result = $.ipc.FLASH_PLAYER;
            }
        } else {
            if ($.ipc.Browser.prototype.os == "MacOS") {
                result = $.ipc.PLUGIN_MAC;
            } else if ($.ipc.Browser.prototype.os == "Windows") {
                if ($.ipc.Browser.prototype.type == "MSIE") {
                    if ($.ipc.Browser.prototype.platform.indexOf("32") >= 0) {
                        result = $.ipc.PLUGIN_IE_X86;
                    } else if ($.ipc.Browser.prototype.platform.indexOf("64") >= 0) {
                        result = $.ipc.PLUGIN_IE_X64;
                    } else {
                        console.info("unknown ie platform, return by default with: PLUGIN_IE_X86");
                        result = $.ipc.PLUGIN_IE_X86;
                    }
                } else {
                    if ($.ipc.Browser.prototype.platform.indexOf("32") >= 0) {
                        result = $.ipc.PLUGIN_NON_IE_X86;
                    } else if ($.ipc.Browser.prototype.platform.indexOf("64") >= 0) {
                        result = $.ipc.PLUGIN_NON_IE_X64;
                    } else {
                        console.info("unknown browser platform, return by default with: PLUGIN_IE_X86");
                        result = $.ipc.PLUGIN_NON_IE_X86;
                    }
                }
            } else {
                throw "unsupportted operation system";
            }
        }
        return result;
    };

    Device.prototype.dynamicFixPostChannelForNC200 = function(product) {
        if (product) {
            if (product.name == "NC200") {
                if (($.ipc.Browser.prototype.type == "Chrome" && parseInt($.ipc.Browser.prototype.version) >= 42) || $.ipc.Browser.prototype.type.indexOf("Edge") >= 0) {
                    if (product["postDataChannel"]["video"] && product["postDataChannel"]["audio"]) {
                        delete product["postDataChannel"]["audio"];
                    };
                };
            };
        } else {
            throw "undefined args in dynamicFixPostChannelForNC200";
        };
    };
 
    Device.prototype.getProductFromLinkieData = function(data) {
        if (data) {
            var tmpProduct = new $.ipc.IpcProduct();
            try {
                if (data["smartlife.cam.ipcamera.liveStream"] &&
                    data["smartlife.cam.ipcamera.liveStream"]["get_modules"]) {
                    var module = data["smartlife.cam.ipcamera.liveStream"]["get_modules"];
                    var supportVideoResArr;
                    if (module["resolutions"]) {
                        supportVideoResArr = this.getSupportResArr(module["resolutions"]);
                    } else {
                        throw "no resolution data";
                    }

                    var postChannelInfo;
                    if (module["audio_video"]) {
                        postChannelInfo = this.getMixedPostDataChannel(module["audio_video"]);
                    } else if (module["audio"] && module["video"]) {
                        postChannelInfo = this.getMultiPostDataChannel(module["audio"], module["video"]);
                    } else {
                        throw "unknown post channel type";
                    };

                    if (postChannelInfo["postChannel"] && postChannelInfo["videoCodec"] && postChannelInfo["audioCodec"] && supportVideoResArr) {

                        if (module["port"]) {
                            for (var i = postChannelInfo["postChannel"].length - 1; i >= 0; i--) {
                                postChannelInfo["postChannel"][i].port = module["port"];
                            }
                        } else {
                            throw "linkie data have no port info";
                        };

                        if (undefined == postChannelInfo["videoCodec"].mimeType) {
                            throw "unknown mimeType";
                        }

                        tmpProduct.name = this.model.substring(0, 5).toUpperCase();
                        tmpProduct.supportVideoResArr = supportVideoResArr;
                        tmpProduct.mimeType = postChannelInfo["videoCodec"].mimeType;
                        tmpProduct.smallImgCssClass = tmpProduct.name + "-small-img";
                        tmpProduct.middleImgCssClass = tmpProduct.name + "-middle-img";
                        tmpProduct.playerType = this.getPlayerType(tmpProduct.mimeType);
                        tmpProduct.postDataChannel = postChannelInfo["postChannel"];
                        tmpProduct.audioCodec = postChannelInfo["audioCodec"];
                        tmpProduct.videoCodec = postChannelInfo["videoCodec"];
                        this.dynamicFixPostChannelForNC200(tmpProduct);
                        return tmpProduct;
                    }
                } else {
                    throw "unknown linkie-like data";
                }
            } catch (err) {
                throw "some error happened: " + err;
            }
        }
    };

    Device.prototype.getLocalInfo = function(args, inputCallbacks) {
        if (undefined == args.token || undefined == args.appServerUrl) {
            console.error("args error in getLocalInfo");
        }
        var result = {};
        var validateResult = (!this.validateIdFormat(args.id).code && this.validateIdFormat(args.id));
        if (validateResult.code == false) {
            result["validateResult"] = validateResult;
            return result;
        };

        var data = JSON.stringify({
            "method": "passthrough",
            "params": {
                "requestData": {
                    "command": "GET_EXTRA_INFO",
                    "content": 0
                },
                "deviceId": args.id
            }
        });
        var changeStateFunc = function(response) {
            var passthroughResult = response.result.responseData;
            if (0 == passthroughResult.errCode) {
                $.extend(true, this, passthroughResult.msg);
                this.stateChangeCallbacks.fire(this);
            };
        }

        result["ajaxObj"] = this.makeAjaxRequest({
            url: args.appServerUrl + "?token=" + args.token,
            data: data,
            changeState: changeStateFunc,
            errCodeStrIndex: "error_code",
            callbacks: inputCallbacks
        }, $.xAjax.defaults.xType);
        return result;
    };

    Device.prototype.generateRelaydCommand = function() {
        var result = {};
        for (var key in this.product.postDataChannel) {
            var c = this.product.postDataChannel[key];
            var commandStr = c.generateRelaydCommand(this);
            result[c.name] = commandStr;
        }
        return result;
    };

    Device.prototype.validateIdFormat = function(tmpId) {
        if (undefined == tmpId) {
            console.error("args error in validateIdFormat");
            return;
        };
        var e = new $.ipc.Error();
        e.code = true;
        e.msg = "OK";
        return e;
    };

    Device.prototype.validateNameFormat = function(tmpName) {
        if (undefined == tmpName) {
            console.error("args error in validateNameFormat");
            return;
        };

        var validateArgs = {
            "attr": tmpName,
            "attrEmptyMsg": tips.types.deviceName.cantBeEmpty,
            "maxLength": 31,
            "minLength": 1,
            "attrOutOfLimitMsg": tips.types.deviceName.outOfLimit,
            "pattern": /^[^\x00-\x1F\x7F{}<>'"=:&\x2f\x5c]{1,31}$/,
            "patternTestFailMsg": tips.types.deviceName.invalid,
        };
        return this.validateAttr(validateArgs);
    };

    Device.prototype.clearRubbish = function() {
        if (this.nonPluginPlayer) {
            this.nonPluginPlayer.clearRubbish();
        };
    };

    $.ipc.Device = Device;

})(jQuery);

(function($) {
    "use strict";

    $.ipc = $.ipc || {};

    function IpcProduct () {
        this.name = null;
        this.supportVideoResArr = [];
        this.mimeType = null;
        this.smallImgCssClass = null;
        this.middleImgCssClass = null;
        this.playerType = null;
        this.videoDataChannel = null;
        this.released = null;
        this.faqPath = null;
        this.pluginPlayer = null;
        this.firmwareDownloadPath = null;
        this.firmwareNewestVersion = null;
        this.audioCodec = null;
    };

    $.ipc.IpcProduct = IpcProduct;

    if ($.ipc.config && $.ipc.config.presetLinkieData) {
        var linkieData = $.ipc.config.presetLinkieData;
        for (var key in linkieData) {
            var d = new $.ipc.Device();
            d.model = key;
            $.ipc[key] = d.getProductFromLinkieData(linkieData[key]["DEFAULT"]);
        }
    }

})(jQuery);

(function($) {
    "use strict";

    $.ipc = $.ipc || {};

    function DeviceList() {

        $.ipc.Model.call(this, arguments);

        this.owner = null;
        this.url == null;
        this.upgradeList = [];
        this.devices = [];
        this.lastActiveDeviceId = null;
        this.playedDeviceChanged = false;
    };

    $.ipc.inheritPrototype(DeviceList, $.ipc.Model);

    var deviceListErrorCodeInfo = {
        100: function() {
            console.log("Session timeout or invaild");
        },
        1000: function() {
            console.log("email is needed");
        },
        1002: function() {
            console.log("email format is invalid");
        },
        1006: function() {
            console.log("account does not exist");
        },
        1007: function() {
            console.log("account has already been activated");
        },
    };

    DeviceList.prototype.errorCodeCallbacks = DeviceList.prototype.extendErrorCodeCallback({
        "errorCodeCallbackMap": deviceListErrorCodeInfo
    });

    DeviceList.prototype.clearNc200UpgradeCookie = function(response) {
        if (response && response.msg) {
            for (var i = 0; i < response.msg.length; i++) {
                if (undefined == response.msg[i].needForceUpgrade || 0 == response.msg[i].needForceUpgrade) {
                    $.removeCookie(response.msg[i].id);
                }
            };
        };
    };

    DeviceList.prototype.updateFromNc200UpgradeCookie = function(response) {
        if (response) {
            for (var i = 0; i < response.msg.length; i++) {
                if ($.cookie(response.msg[i].id)) {
                    response.msg[i].system_status = $.cookie(response.msg[i].id);
                };
            };
        };
        return response;
    };

    DeviceList.prototype.getDeviceList = function(inputCallbacks, extendArgs) {
        if (undefined == this.owner) {
            console.error("owner of device list is undefined")
        };
        var result = {};
        var data = {};
        var changeStateFunc = function(response) {
            var oldDevices = this.devices;

            this.devices = [];

            this.clearNc200UpgradeCookie(response);
            response = this.updateFromNc200UpgradeCookie(response);

            for (var i = 0; i < response.msg.length; i++) {
                var newDevice = new $.ipc.Device();
                newDevice.init(response.msg[i]);
                newDevice.owner = this.owner;
                this.devices.push(newDevice);
            };

            for (var i = 0; i < oldDevices.length; i++) {
                var tmpIndex = this.findIndexForId(oldDevices[i].id);
                if (tmpIndex >= 0 && tmpIndex < this.devices.length) {
                    $.extend(true, oldDevices[i], response.msg[tmpIndex]);
                    this.devices[tmpIndex] = oldDevices[i];
                } else {
                    oldDevices[i].clearRubbish();
                }
            };

            for (var i = 0; i < this.devices.length; i++) {
                var device = this.devices[i];
                var args = null;
                !device.isSameRegion && (args = {
                    email: this.owner.email,
                    id: device.id,
                    urlPrefix: "https://jp-alpha.tplinkcloud.com"
                }) && device.get(args, undefined, extendArgs);
            };

            var activeDeviceArr = this.findActiveDeviceArr();
            this.playedDeviceChanged = false;
            if (activeDeviceArr.length <= 0 && this.devices.length > 0) {
                this.changeActiveDevice(undefined, this.devices[0]);
            };
        };

        var extendAjaxOptions = {
            headers: {
                "X-AutoRefresh": "false"
            }
        };

        if (extendArgs && extendArgs.ajax) {
            extendAjaxOptions = $.extend(true, extendAjaxOptions, extendArgs.ajax);
        };


        result["ajaxObj"] = this.makeAjaxRequest({
            url: "/getDeviceList",
            data: data,
            callbacks: inputCallbacks,
            extendAjaxOptions: extendAjaxOptions,
            changeState: changeStateFunc
        });
        return result;
    };

    DeviceList.prototype.findActiveDeviceArr = function() {
        var result = [];
        for (var i = 0; i < this.devices.length; i++) {
            if (this.devices[i].isActive == true) {
                result.push(this.devices[i]);
            }
        };
        return result;
    };

    DeviceList.prototype.findFirstActiveDevIndex = function() {
        var index = null;
        for (var i = 0; i < this.devices.length; i++) {
            if (this.devices[i].isActive == true) {
                index = i;
                break;
            };
        };
        return index;
    };

    DeviceList.prototype.changeActiveDevice = function(srcDevice, destDevice) {
        if (undefined == destDevice) {
            console.error("args error in setActiveDevice");
        };
        if (srcDevice != undefined) {
            srcDevice.isActive = false;
        };
        destDevice.isActive = true;
        this.playedDeviceChanged = true;
    };

    DeviceList.prototype.findIdForIndex = function(devIndex) {
        if (undefined == devIndex) {
            return undefined;
        };
        if (devIndex >= this.devices.length || devIndex < 0) {
            console.error("args error in findIdForIndex");
        };
        return this.devices[devIndex].id;
    };

    DeviceList.prototype.findIndexForId = function(devId) {
        for (var i = 0; i < this.devices.length; i++) {
            if (this.devices[i].id == devId) {
                return i;
            }
        };
        return undefined;
    };

    DeviceList.prototype.getUpgradeList = function(inputCallbacks) {
        if (undefined == this.owner || undefined == this.owner.email || undefined == this.owner.token) {
            console.error("args error in getUpgradeList");
            return;
        };
        var result = {};
        var data = {
            "REQUEST": "GETUPGRADELIST",
            "DATA": {
                "email": this.owner.email,
                "token": this.owner.token
            }
        };

        var changeStateFunc = function(response) {
            this.url = response.msg.url;
            this.upgradeList = response.msg.list;
        };

        var extendAjaxOptions = {
            contentType: "application/x-www-form-urlencoded;charset=utf-8"
        };

        result["ajaxObj"] = this.makeAjaxRequest({
            url: "/init.php",
            data: data,
            callbacks: inputCallbacks,
            changeState: changeStateFunc,
            extendAjaxOptions: extendAjaxOptions
        });
        return result;
    };

    DeviceList.prototype.upgradeAll = function(inputCallbacks) {
        if (undefined == this.owner || undefined == this.owner.email || undefined == this.owner.token || undefined == this.upgradeList) {
            console.error("args error in upgradeAll");
            return;
        };
        var result = {};
        var data = {
            "REQUEST": "EXEUPGRADELIST",
            "DATA": {
                "email": this.owner.email,
                "token": this.owner.token,
                "list": JSON.stringify(this.upgradeList)
            },
        };

        var extendAjaxOptions = {
            contentType: "application/x-www-form-urlencoded;charset=utf-8"
        };

        result["ajaxObj"] = this.makeAjaxRequest({
            url: "/init.php",
            data: data,
            callbacks: inputCallbacks,
            changeState: $.noop,
            extendAjaxOptions: extendAjaxOptions
        });
        return result;
    };

    $.ipc.DeviceList = DeviceList;

})(jQuery);

(function($) {
    "use strict";

    $.ipc = $.ipc || {};

    function BaseController() {
        this.model = null;
        this.view = null;
        this.selectorHandlerMap = {};
        this.domClickCallbacks = $.Callbacks("unique stopOnFalse");
        var currentController = this;
        this.domClickCallbacks.add(function(selector, eventName, data, argumentsArr) {
            var func = function(data) {
                console.log("this element did not bind any handler: ", selector);
            };
            if (currentController.selectorHandlerMap &&
                currentController.selectorHandlerMap[selector] &&
                currentController.selectorHandlerMap[selector][eventName]) {
                func = currentController.selectorHandlerMap[selector][eventName];
            };

            var contextFunc = $.proxy(func, currentController);
            contextFunc(data, argumentsArr);
        });
    };

    BaseController.prototype.addHandler = function(inputArgs) {
        var currentController = this;
        var getMsgInformed = inputArgs["getMsgInformed"];
        var selector = inputArgs["selector"];
        var eventName = inputArgs["eventName"];

        $(document).on(eventName, selector, function() {
            var data = null;
            if (getMsgInformed) {
                data = $.proxy(getMsgInformed, this)();
            };
            var argumentsArr = arguments;
            currentController.domClickCallbacks.fire(selector, eventName, data, argumentsArr);
        });
    };

    BaseController.prototype.batchInitHandler = function(appendedSelectorHandlerMap, selectorMsgProduceFuncMap) {
        if (undefined == appendedSelectorHandlerMap ||
            undefined == selectorMsgProduceFuncMap) {
            console.error("args error in batchInitHandler");
        };

        $.extend(true, this.selectorHandlerMap, appendedSelectorHandlerMap);

        for (var selector in appendedSelectorHandlerMap) {
            var args = {};
            args["selector"] = selector;
            args["getMsgInformed"] = selectorMsgProduceFuncMap[selector];
            for (var eventName in appendedSelectorHandlerMap[selector]) {
                args["eventName"] = eventName;
                this.addHandler(args);
            };
        };
    };

    $.ipc.BaseController = BaseController;

})(jQuery);

(function($) {
    "use strict";

    $.ipc = $.ipc || {};

    function Software() {
        $.ipc.Model.call(this, arguments);
        this.products = [];
        this.plugins = [];
    }

    $.ipc.inheritPrototype(Software, $.ipc.Model);

    Software.prototype.getUpdateInfos = function(inputCallbacks) {
        var result = {};
        var changeStateFunc = function(response) {
            var productNameObjMap = {};

            for (var i = 0; i < response.msg.product.length; i++) {
                var productName = response.msg.product[i].model.toUpperCase();
                var product = $.ipc[productName] || console.error("not a supportted product");
                product.released = response.msg.product[i].released;
                product.faqPath = response.msg.product[i].href;
                this.products.push(product);
                productNameObjMap[product.name] = product;
            };

            var tagPluginMap = {
                "ff_x86": $.ipc.PLUGIN_NON_IE_X86,
                "ff_x64": $.ipc.PLUGIN_NON_IE_X64,
                "ie_x86": $.ipc.PLUGIN_IE_X86,
                "ie_x64": $.ipc.PLUGIN_IE_X64,
                "mac": $.ipc.PLUGIN_MAC
            };

            for (var i = 0; i < response.msg.software.length; i++) {
                var plugin = tagPluginMap[response.msg.software[i].tags];
                if (plugin) {
                    var supportedModelsArr = response.msg.software[i].model.split(";");
                    for (var j = 0; j < supportedModelsArr.length; j++) {
                        if (undefined == productNameObjMap[supportedModelsArr[j]]) {
                            console.error("unknown model: " + supportedModelsArr[j]);
                        } else {
                            plugin.prototype.supportedModels.push(productNameObjMap[supportedModelsArr[j]]);
                        }
                    };
                    plugin.prototype.name = response.msg.software[i].name;
                    plugin.prototype.downloadPath = response.msg.software[i].path;
                    plugin.prototype.tags = response.msg.software[i].tags;
                    plugin.prototype.newestVersion = response.msg.software[i].version;
                    this.plugins.push(plugin);
                } else if (response.msg.software[i].name == "Firmware") {
                    $.ipc[response.msg.software[i].model].firmwareDownloadPath = response.msg.software[i].path;
                    $.ipc[response.msg.software[i].model].firmwareNewestVersion = response.msg.software[i].version;
                };
            };
        };

        result["ajaxObj"] = this.makeAjaxRequest({
            url: "/updateInfos",
            data: {},
            callbacks: inputCallbacks,
            changeState: changeStateFunc
        });
        return result;
    };

    $.ipc.Software = Software;
})(jQuery);

(function($) {
    "use strict";

    $.ipc = $.ipc || {};

    function Feedback() {
        $.ipc.Model.call(this, arguments);
        this.account = null;
        this.productName = null;
        this.country = null;
        this.problemType = null;
        this.description = null;
    };

    $.ipc.inheritPrototype(Feedback, $.ipc.Model);

    var feedbackErrorCodeInfo = {
        1000: function() {
            console.log("email address cannot be empty")
        },
        1006: function() {
            console.log("account is not exist")
        },
        1011: function() {
            console.log("username cannot be empty")
        },
    };

    Feedback.prototype.errorCodeCallbacks = Feedback.prototype.extendErrorCodeCallback({
        "errorCodeCallbackMap": feedbackErrorCodeInfo
    });

    Feedback.prototype.send = function(args, inputCallbacks) {
        var result = {};
        var validateResult = (!this.validateAccount(args.account).code && this.validateAccount(args.account)) ||
            (!this.validateProductName(args.productName).code && this.validateProductName(args.productName)) ||
            (!this.validateDescription(args.description).code && this.validateDescription(args.description));
        if (validateResult.code == false) {
            result["validateResult"] = validateResult;
            return result;
        };

        if (undefined == args.problemType) {
            console.error("args error in send");
            return;
        };

        var data = {
            'REQUEST': 'EMAILSERVICE',
            'DATA': {
                "email": args.account,
                "subject": "User Feedback",
                "content": "From:" + args.account + "<br/>" +
                    "Model: " + args.productName + "<br/>" +
                    "Country: " + args.country + "<br/>" +
                    "Problem: " + args.problemType + "<br/>" +
                    "Description: " + args.description,
                "service": "Feedback"
            }
        };

        var changeStateFunc = function(response) {
            $.extend(true, this, args);
        };

        var extendAjaxOptions = {
            contentType: "application/x-www-form-urlencoded;charset=utf-8"
        };

        result["ajaxObj"] = this.makeAjaxRequest({
            url: "/init3.php",
            data: data,
            callbacks: inputCallbacks,
            changeState: changeStateFunc,
            extendAjaxOptions: extendAjaxOptions
        });
        return result;
    };

    Feedback.prototype.validateAccount = function(tmpAccount) {
        if (undefined == tmpAccount) {
            console.error("args error in validateAccount");
            return;
        };

        var validateArgs = {
            "attr": tmpAccount,
            "attrEmptyMsg": tips.types.contact.account.cantBeEmpty,
            "maxLength": 64,
            "minLength": 1,
            "attrOutOfLimitMsg": "account out of limit",
            "pattern": /^.*$/,
            "patternTestFailMsg": tips.types.account.invalid,
        };

        return this.validateAttr(validateArgs);
    };

    Feedback.prototype.validateDescription = function(tmpDescription) {
        if (undefined == tmpDescription) {
            console.error("args error in validateDescription");
        };

        var validateArgs = {
            "attr": tmpDescription,
            "attrEmptyMsg": tips.types.contact.description.cantBeEmpty,
            "maxLength": 500,
            "minLength": 1,
            "attrOutOfLimitMsg": tips.types.contact.description.outOfLimit,
            "pattern": /.*/,
            "patternTestFailMsg": tips.types.contact.description.invalid,
        };

        return this.validateAttr(validateArgs);
    };

    Feedback.prototype.validateProductName = function(productName) {
        if (undefined == productName) {
            console.error("args error in validateProductName");
        };

        var validateArgs = {
            "attr": productName,
            "attrEmptyMsg": tips.types.contact.productName.cantBeEmpty,
            "maxLength": 6,
            "minLength": 1,
            "attrOutOfLimitMsg": "product name is out of limit",
            "pattern": /.*/,
            "patternTestFailMsg": "product name is invalid",
        };

        return this.validateAttr(validateArgs);
    };

    $.ipc.Feedback = Feedback;
})(jQuery);

(function($) {
    "use strict";
    $.ipc = $.ipc || {};

    function Timer() {
        this.timeout = null;
        this.updateIntervalObj = null;
        this.currentTime = 0;
        this.intervalTime = 1000;
        this.networkFactorDelta = 20000;
        this.timeoutCallback = $.Callbacks("unique stopOnFalse");
    };

    Timer.prototype.clearRubbish = function() {
        clearInterval(this.updateIntervalObj);
        this.currentTime = 0;
    };

    Timer.prototype.start = function() {
        var _self = this;
        _self.clearRubbish();
        _self.updateIntervalObj = setInterval(function() {
            _self.currentTime += _self.intervalTime;
            if (_self.currentTime >= _self.timeout) {
                clearInterval(_self.updateIntervalObj);
                _self.timeoutCallback.fire($.ipc.stopReasonCodeMap.VIDEO_TIME_UP);
            };
        }, _self.intervalTime);
    };

    $.ipc.Timer = Timer;
})(jQuery);

(function($) {
    "use strict";
    $.ipc = $.ipc || {};

    function getUrl() {
        var analyticUrlServerTypeMap = {
            "alpha": "https://analytics-alpha.tplinkcloud.com/stat",
            "beta": "https://analytics-beta.tplinkcloud.com/stat"
        };
        var url = "https://analytics.tplinkcloud.com/stat";
        for (var type in analyticUrlServerTypeMap) {
            if (window.location.href.indexOf(type) >= 0) {
                url = analyticUrlServerTypeMap[type];
            };
        };
        return url;
    }

    function Statistics() {
        $.ipc.Model.call(this, arguments);

        this.url = getUrl();
        this.token = null;

        this.SUCCESS = 0;
        this.ERROR = 1;

        this.devID = null;
        this.clientType = $.ipc.Browser.prototype.type + ' ' + $.ipc.Browser.prototype.version;
        this.devModel = null;
        this.firmwareVersion = null;
        this.type = null;
        this.success = [];
        this.stopReason = [];
        this.watchTime = null;
    };

    $.ipc.inheritPrototype(Statistics, $.ipc.Model);

    function FlashStatistics() {
        Statistics.call(this, arguments);
    };
    $.ipc.inheritPrototype(FlashStatistics, Statistics);

    FlashStatistics.prototype.send = function(ajaxOptions) {
        var result = {};
        var _self = this;
        var data = JSON.stringify({
            "version": "0.1",
            "type": "webSession",
            "data": {
                "basic": {
                    "devID": _self.devID,
                    "clientType": _self.clientType,
                    "devModel": _self.devModel,
                    "firmwareVersion": _self.firmwareVersion
                },
                "stream": {
                    "type": _self.type,
                    "success": _self.success,
                    "stopReason": _self.stopReason,
                    "watchTime": _self.watchTime
                }
            }
        });

        var extendAjaxOptions = $.extend(true, {
            headers: {
                'X-Token': this.token
            }
        }, ajaxOptions);

        result["ajaxObj"] = _self.makeAjaxRequest({
            url: _self.url,
            data: data,
            callbacks: undefined,
            changeState: $.noop,
            errCodeStrIndex: "errorCode",
            extendAjaxOptions: extendAjaxOptions
        }, $.xAjax.defaults.xType);
        return result;
    };

    function PluginStatistics() {
        Statistics.call(this, arguments);
    }
    $.ipc.inheritPrototype(PluginStatistics, Statistics);

    PluginStatistics.prototype.send = function(ajaxOptions) {
        var result = {};
        var _self = this;
        var data = JSON.stringify({
            "version": "0.1",
            "type": "webSession",
            "data": {
                "basic": {
                    "devID": _self.devID,
                    "clientType": _self.clientType,
                    "devModel": _self.devModel,
                    "firmwareVersion": _self.firmwareVersion
                }
            }
        });

        var extendAjaxOptions = $.extend(true, {
            headers: {
                'X-Token': this.token
            }
        }, ajaxOptions);

        result["ajaxObj"] = _self.makeAjaxRequest({
            url: _self.url,
            data: data,
            callbacks: undefined,
            changeState: $.noop,
            errCodeStrIndex: "errorCode",
            extendAjaxOptions: extendAjaxOptions
        }, $.xAjax.defaults.xType);
        return result;
    };

    var stopReasonCodeMap = {
        LEAVE_PAGE: 0,
        USER_STOPPED_VIDEO: 1,
        VIDEO_TIME_UP: 2,
        DEVICE_UNBOUND: 3,
        NETWORK_ERROR: -1,
        VIEW_VIDEO_FAILED: -2,
        UNKNOWN_ERROR: -3
    };

    $.ipc.FlashStatistics = FlashStatistics;
    $.ipc.PluginStatistics = PluginStatistics;
    $.ipc.stopReasonCodeMap = stopReasonCodeMap;
})(jQuery);

(function ($) {
    "use strict";

    $.ipc = $.ipc || {};

    function MyPlayer() {
        $.ipc.Model.call(this, arguments);
        this.device = null;
        this.playerObj = null;
        this.stateChangeCallback = $.Callbacks("unique stopOnFalse");
    };

    $.ipc.inheritPrototype(MyPlayer, $.ipc.Model);

    MyPlayer.prototype.getDeviceLinkieData = function(callbacks) {
        var _self = this;
        var device = _self.device;
        if (device && device.owner.token && device.appServerUrl) {
            if (device.isNeedGetLinkie()) {
                var result = device.getLinkie({
                    "token": device.owner.token,
                    "appServerUrl": device.appServerUrl
                }, callbacks);
            }
        };
    };

    $.ipc.MyPlayer = MyPlayer;

})(jQuery);

(function($) {
    "use strict";
    $.ipc = $.ipc || {};

    var devicePlayingState = {
        IDLE: 0,
        BEGIN_PLAY: 1,
        RELAY_URL_READY: 2,
        REQUEST_RELAY_SERVICE_SUCCESS: 3,
        RELAY_READY: 4,
        RESOURCE_READY: 5,
        PLAYING: 6,
        NETWORK_ERROR: 7,
        NEED_RES_FAILED_RETRY: 8,
        NEED_RELAY_READY_FAILED_TRY: 9
    };

    function NonPluginPlayer() {
        $.ipc.MyPlayer.call(this, arguments);
        this.timer = null;
        this.statistics = null;
        this.swfPath = null;
        this.playerElementId = null;

        this.curRlyRdyFailedRtryReqRlySrvCnt = 0;
        this.maxRlyRdyFailedRtryReqRlySrvCnt = 3;

        this.queryIsRelayReadyIntervalTime = 1000;
        this.queryIsRelayReadyAjaxLimit = 6;

        this.getResIdIntervalTime = 3000;
        this.getResIdAjaxLimit = 3;

        this.currentNetErrRetryCnt = 0;
        this.maxNetErrRetryCnt = 3;

        this.rubbisAjaxArr = [];
        this.rubbisIntervalObjArr = [];

        this.state = devicePlayingState.IDLE;

        this.playerObjErrorCallbacks = $.Callbacks("unique stopOnFalse");

        this.hideCoverFunc = null;
        this.coverRenderFunc = null;
        this.playerRenderFunc = null;
        this.netErrRenderFunc = null;
    };
    $.ipc.inheritPrototype(NonPluginPlayer, $.ipc.MyPlayer);
    var playerErrorCodeInfo = {
        "-20107": function() {
            console.log("args is invalid")
        },
        "-20501": function() {
            console.log("device is not exist")
        },
        "-20571": function() {
            console.log("device is offline")
        },
        "-20651": function() {
            console.log("token is out of date")
        },
        "-20652": function() {
            console.log("token is error")
        },
        "-24002": function() {
            console.log("Relay connect not ready")
        }
    };
    NonPluginPlayer.prototype.errorCodeCallbacks = NonPluginPlayer.prototype.extendErrorCodeCallback({
        "errorCodeCallbackMap": playerErrorCodeInfo
    });

    NonPluginPlayer.prototype.clearRubbish = function() {
        this.stateChangeCallback.empty();
        this.playerObjErrorCallbacks.empty();
        this.back2Idle($.ipc.stopReasonCodeMap.DEVICE_UNBOUND);
    };

    NonPluginPlayer.prototype.clearLastStepRubbish = function() {
        for (var i = 0; i < this.rubbisAjaxArr.length; i++) {
            this.rubbisAjaxArr[i].abort();
        };
        delete this.rubbisAjaxArr;
        this.rubbisAjaxArr = [];

        for (var i = 0; i < this.rubbisIntervalObjArr.length; i++) {
            clearInterval(this.rubbisIntervalObjArr[i]);
        };
        delete this.rubbisIntervalObjArr;
        this.rubbisIntervalObjArr = [];
    };

    NonPluginPlayer.prototype.back2Idle = function(stopReasonCode) {
        this.clearLastStepRubbish();

        if (this.timer) {
            if (this.statistics) {
                this.statistics.watchTime += Math.round(this.timer.currentTime / 1000);
                Object.prototype.toString.call(this.statistics.stopReason) === '[object Array]' && this.statistics.stopReason.push(stopReasonCode);
                this.statistics.send();
                delete this.statistics;
                this.statistics = null;
            };
            this.timer.clearRubbish();
        };
        this.state = devicePlayingState.IDLE;

        this.clearPlayerElementRubbish();

        this.curRlyRdyFailedRtryReqRlySrvCnt = 0;
        this.currentNetErrRetryCnt = 0;
    };

    NonPluginPlayer.prototype.renderNetworkError = function() {
        if (this.netErrRenderFunc) {
            this.back2Idle($.ipc.stopReasonCodeMap.NETWORK_ERROR);
            this.netErrRenderFunc(this.device);
        };
    };

    NonPluginPlayer.prototype.networkErrorRetry = function() {
        var _self = this;
        _self.currentNetErrRetryCnt += 1;

        console.log("retry full nonPluginPlayer flow due to device is not reachable: " + _self.currentNetErrRetryCnt);
        if (_self.currentNetErrRetryCnt <= _self.maxNetErrRetryCnt) {
            setTimeout(function() {
                _self.changeStateTo(devicePlayingState.RELAY_URL_READY);
            }, 1000);
        } else {
            _self.renderNetworkError();
        }
    };

    NonPluginPlayer.prototype.relayReadyFailedRetryRelayService = function() {
        this.curRlyRdyFailedRtryReqRlySrvCnt += 1;
        console.log("relay ready retry: " + this.curRlyRdyFailedRtryReqRlySrvCnt);
        if (this.curRlyRdyFailedRtryReqRlySrvCnt <= this.maxRlyRdyFailedRtryReqRlySrvCnt) {
            this.changeStateTo(devicePlayingState.RELAY_URL_READY);
        } else {
            this.changeStateTo(devicePlayingState.NETWORK_ERROR);
        }
    };

    NonPluginPlayer.prototype.changeStateTo = function(toState) {
        if (toState) {
            var _self = this;
            _self.state = toState;
            _self.stateChangeCallback.fireWith(_self);
        };
    };

    NonPluginPlayer.prototype.generateAjaxUrl = function(args) {
        if (undefined == args.appServerUrl || undefined == args.token) {
            console.error("args error in generateAjaxUrl");
        };
        return args.appServerUrl + "/ipc?token=" + args.token;
    };

    NonPluginPlayer.prototype.getRelayUrl = function(args, inputCallbacks) {
        var _self = this;

        if (_self.device.relayUrl) {
            _self.changeStateTo(devicePlayingState.RELAY_URL_READY);
            return;
        };

        var data = JSON.stringify({
            "method": "requestUrl",
            "params": {
                "type": "relay"
            }
        });
        var retryCount = 0;
        var retryLimit = 3;
        var changeStateFunc = function(response) {
            _self.device.relayUrl = response.result.relayUrl;
            _self.changeStateTo(devicePlayingState.RELAY_URL_READY);
        };

        var extendAjaxOptions = {
            error: function(xhr) {
                if (xhr.statusText != "abort") {
                    if (retryCount < retryLimit) {
                        retryCount += 1;
                        var ajaxObj = _self.makeAjaxRequest(requestArgs, $.xAjax.defaults.xType);
                        _self.rubbisAjaxArr.push(ajaxObj);
                    } else {
                        _self.changeStateTo(devicePlayingState.NETWORK_ERROR);
                    }
                };
            }
        };

        var requestArgs = {
            url: _self.generateAjaxUrl({
                appServerUrl: _self.device.appServerUrl,
                token: _self.device.owner.token,
            }),
            data: data,
            callbacks: inputCallbacks,
            changeState: changeStateFunc,
            errCodeStrIndex: "error_code",
            extendAjaxOptions: extendAjaxOptions
        };

        var ajaxObj = _self.makeAjaxRequest(requestArgs, $.xAjax.defaults.xType);
        _self.rubbisAjaxArr.push(ajaxObj);
    };

    NonPluginPlayer.prototype.requestSingleRelayService = function(reachedFlag, key, command) {
        var _self = this;
        var data = JSON.stringify({
            "method": "requestRelayService",
            "params": {
                "account": _self.device.owner.account,
                "devId": _self.device.id,
                "command": command
            }
        });

        var retryCount = 0;
        var retryLimit = 3;
        var changeStateFunc = function(response) {
            reachedFlag[key] = true;
            var isAllReached = true;
            for (var r in reachedFlag) {
                if (!reachedFlag[r]) {
                    isAllReached = false;
                };
            };

            if (isAllReached) {
                _self.changeStateTo(devicePlayingState.REQUEST_RELAY_SERVICE_SUCCESS);
            };
        };

        var extendAjaxOptions = {
            error: function(xhr) {
                if (xhr.statusText != "abort") {
                    if (retryCount < retryLimit) {
                        retryCount += 1;
                        var ajaxObj = _self.makeAjaxRequest(requestArgs, $.xAjax.defaults.xType);
                        _self.rubbisAjaxArr.push(ajaxObj);
                    } else {
                        _self.changeStateTo(devicePlayingState.NETWORK_ERROR);
                    }
                }
            }
        };

        var requestArgs = {
            url: _self.generateAjaxUrl({
                appServerUrl: _self.device.appServerUrl,
                token: _self.device.owner.token,
            }),
            data: data,
            callbacks: undefined,
            changeState: changeStateFunc,
            errCodeStrIndex: "error_code",
            extendAjaxOptions: extendAjaxOptions
        };

        var ajaxObj = _self.makeAjaxRequest(requestArgs, $.xAjax.defaults.xType);
        _self.rubbisAjaxArr.push(ajaxObj);
    };

    NonPluginPlayer.prototype.requestRelayService = function() {
        var reachedFlag = {};
        var commandMap = this.device.generateRelaydCommand();
        for (var key in commandMap) {
            reachedFlag[key] = false;
        };
        for (var key in commandMap) {
            this.requestSingleRelayService(reachedFlag, key, commandMap[key]);
        };
    };

    NonPluginPlayer.prototype.isRelayReady = function() {
        var _self = this;
        var data = JSON.stringify({
            "method": "isRelayReady",
            "params": {
                "devId": _self.device.id
            }
        });

        var changeStateFunc = function(response) {
            if (response.result.realServerKey.indexOf("AWSELB") >= 0) {
                _self.device.ELBcookie = response.result.realServerKey;
                _self.changeStateTo(devicePlayingState.RELAY_READY);
            }
        };

        var requestArgs = {
            url: _self.generateAjaxUrl({
                appServerUrl: _self.device.appServerUrl,
                token: _self.device.owner.token,
            }),
            data: data,
            callbacks: undefined,
            changeState: changeStateFunc,
            errCodeStrIndex: "error_code"
        };
        var currentCount = 1;

        var ajaxObj = _self.makeAjaxRequest(requestArgs, $.xAjax.defaults.xType);
        _self.rubbisAjaxArr.push(ajaxObj);
        var intervalObj = setInterval(function() {
            ajaxObj = _self.makeAjaxRequest(requestArgs, $.xAjax.defaults.xType);
            _self.rubbisAjaxArr.push(ajaxObj);
            currentCount += 1;
            if (currentCount >= _self.queryIsRelayReadyAjaxLimit) {
                _self.changeStateTo(devicePlayingState.NEED_RELAY_READY_FAILED_TRY);
            };
        }, _self.queryIsRelayReadyIntervalTime);
        _self.rubbisIntervalObjArr.push(intervalObj);
    };

    NonPluginPlayer.prototype.createNewStatisticsObj = function() {
        this.statistics = new $.ipc.FlashStatistics();
        this.statistics.devID = this.device.id;
        this.statistics.devModel = this.device.model.substring(0, 5);
        this.statistics.firmwareVersion = this.device.fwVer;
        this.statistics.token = this.device.owner.token;
    };

    NonPluginPlayer.prototype.triggerPlay = function() {
        var _self = this;
        _self.createNewStatisticsObj();
        _self.updateStatisticsType();
        _self.coverRenderFunc(_self.device);
        _self.changeStateTo(devicePlayingState.BEGIN_PLAY);
    };

    NonPluginPlayer.prototype.play = function() {
        var _self = this;
        var playArgs = {
            resourcePath: _self.getResourcePath()
        }

        this.setupPlayer(playArgs);
    };

    function RtmpPlayer() {
        NonPluginPlayer.call(this, arguments);

        this.protocol = "rtmps://";
        this.port = 443;
        this.resourceAppName = "RtmpRelay";

        this.curResFailedRtryReqRlySrvCnt = 0;
        this.maxResFailedRtryReqRlySrvCnt = 3;
    };
    $.ipc.inheritPrototype(RtmpPlayer, NonPluginPlayer);

    RtmpPlayer.prototype.getAuthArgs = function() {
        var result = null;
        var _self = this;
        var args = {
            devId: _self.device.id,
            token: _self.device.owner.token
        };
        result = $.param(args);
        return result;
    };

    RtmpPlayer.prototype.residFailedRetryRelayService = function() {
        this.curResFailedRtryReqRlySrvCnt += 1;
        if (this.curResFailedRtryReqRlySrvCnt <= this.maxResFailedRtryReqRlySrvCnt) {
            this.changeStateTo(devicePlayingState.RELAY_URL_READY);
        } else {
            this.changeStateTo(devicePlayingState.NETWORK_ERROR);
        }
    };

    RtmpPlayer.prototype.getResourcePath = function() {
        var _self = this;
        var resourceArgs = _self.getAuthArgs();
        var str = "";
        str += _self.protocol + _self.device.relayUrl + ":" +
            _self.port + "/" + _self.resourceAppName + "/?" +
            resourceArgs + "flv:" + _self.device.resId;
        return str;
    };

    RtmpPlayer.prototype.setupPlayer = function(args) {
        var _self = this;
        _self.playerRenderFunc(_self.device);

        if (_self.playerObj) {
            _self.playerObj.remove();
        };

        var width = _self.device.currentVideoResolution.playerContainerCss.player.width;
        var height = _self.device.currentVideoResolution.playerContainerCss.player.height;

        var options = {
            width: width,
            height: height,
            playlist: [{
                sources: [{
                    file: args.resourcePath
                }]
            }],
            rtmp: {
                bufferlength: 0.1
            },
            displaytitle: false,
            mute: false,
            ph: 1,
            primary: "flash",
            repeat: false,
            stagevideo: false,
            stretching: "exactfit",
            responsive: true,
            skin: {
                name: "ipc-jwplayer-skin"
            }
        };

        var newPlayer = jwplayer(_self.playerElementId);
        newPlayer.setup(options);
        _self.playerObj = newPlayer;


        newPlayer.on('ready', function() {
            console.log("player ready");
        });

        newPlayer.on('setupError', function(e) {
            _self.playerObjErrorCallbacks.fire(e);
        });

        newPlayer.on('play', function() {
            _self.statistics && Object.prototype.toString.call(_self.statistics.stopReason) === '[object Array]' && _self.statistics.success.push(_self.statistics.SUCCESS);
            _self.hideCoverFunc();
        })

        newPlayer.on('playlist', function() {
            newPlayer.play();
        });

        newPlayer.on('idle', function() {
            _self.statistics && Object.prototype.toString.call(_self.statistics.stopReason) === '[object Array]' && _self.statistics.stopReason.push($.ipc.stopReasonCodeMap.UNKNOWN_ERROR);
        });

        newPlayer.on('pause', function() {
            _self.statistics && Object.prototype.toString.call(_self.statistics.stopReason) === '[object Array]' && _self.statistics.stopReason.push($.ipc.stopReasonCodeMap.USER_STOPPED_VIDEO);
        });

        newPlayer.on('buffer', function() {
            console.log("buffer");
        });

        newPlayer.on('bufferChange', function() {
            console.log("bufferChange");
        });

        newPlayer.on('complete', function() {
            if (_self.timer.currentTime >= _self.timer.timeout - _self.timer.networkFactorDelta) {
                _self.timer.currentTime == _self.timer.timeout;
            } else {
                _self.playerObjErrorCallbacks.fire();
            }
        });
        newPlayer.on('error', function() {
            _self.playerObjErrorCallbacks.fire();
        });

        _self.state = devicePlayingState.PLAYING;
    };

    RtmpPlayer.prototype.fireNetworkError = function() {
        this.changeStateTo(devicePlayingState.NETWORK_ERROR);
    };

    RtmpPlayer.prototype.initPlayer = function() {
        var _self = this;
        _self.stateChangeCallback.empty();
        var contextFunc = $.proxy(_self.stateChangeHandler, _self);
        _self.stateChangeCallback.add(contextFunc);

        var contextFireNetErr = $.proxy(_self.fireNetworkError, _self);
        _self.playerObjErrorCallbacks.add(contextFireNetErr);
    };

    RtmpPlayer.prototype.updateStatisticsType = function() {
        this.statistics && (this.statistics.type = "rtmp");
    };

    RtmpPlayer.prototype.stateChangeHandler = function() {
        if (this.device.isActive == false) {
            this.back2Idle($.ipc.stopReasonCodeMap.UNKNOWN_ERROR);
        } else {
            this.clearLastStepRubbish();
            var stateLogicMap = {};
            stateLogicMap[devicePlayingState.BEGIN_PLAY] = this.preparePlay;
            stateLogicMap[devicePlayingState.RELAY_URL_READY] = this.requestRelayService;
            stateLogicMap[devicePlayingState.REQUEST_RELAY_SERVICE_SUCCESS] = this.isRelayReady;
            stateLogicMap[devicePlayingState.RELAY_READY] = this.queryResid;
            stateLogicMap[devicePlayingState.RESOURCE_READY] = this.play;
            stateLogicMap[devicePlayingState.NETWORK_ERROR] = this.networkErrorRetry;
            stateLogicMap[devicePlayingState.NEED_RES_FAILED_RETRY] = this.residFailedRetryRelayService;
            stateLogicMap[devicePlayingState.NEED_RELAY_READY_FAILED_TRY] = this.relayReadyFailedRetryRelayService;

            var defaultFunc = function() {
                console.log("unkonw current state: " + currentState + ", back to idle");
                this.back2Idle($.ipc.stopReasonCodeMap.UNKNOWN_ERROR);
            };
            var currentState = this.state;
            var contextFunc = $.proxy(stateLogicMap[currentState] || defaultFunc, this);
            contextFunc();
        }
    };

    RtmpPlayer.prototype.preparePlay = function() {
        this.luckyTryForResId();
        this.getRelayUrl();
    };

    RtmpPlayer.prototype.luckyTryForResId = function() {
        var _self = this;
        if (_self.device.relayUrl && _self.device.ELBcookie) {
            var requestArgs = _self.generateQueryResidArgs({
                ELBcookie: _self.device.ELBcookie,
                relayUrl: _self.device.relayUrl
            });
            var currentCount = 1;
            var errorCallback = function() {
                if (currentCount < 3) {
                    currentCount += 1;
                    _self.makeAjaxRequest(requestArgs, $.xAjax.defaults.xType);
                };
            };

            var extendRequestArgs = {
                callbacks: {
                    "errorCodeCallbackMap": {
                        "-1": errorCallback
                    },
                    "errorCallback": errorCallback
                }
            }
            requestArgs = $.extend(true, requestArgs, extendRequestArgs);
            _self.makeAjaxRequest(requestArgs, $.xAjax.defaults.xType);
        };
    };

    RtmpPlayer.prototype.generateQueryResidArgs = function(args) {
        if (args.relayUrl && args.ELBcookie) {
            var _self = this;
            var data = {
                "REQUEST": 'RTMPOPERATE',
                "DATA": {
                    "relayUrl": args.relayUrl,
                    "Xtoken": _self.device.owner.token,
                    "devId": _self.device.id,
                    "data": {
                        "service": "getrtmp",
                        "command": {
                            "resolution": _self.device.currentVideoResolution.name
                        }
                    },
                    "token": _self.device.owner.token,
                    "AWSELB": args.ELBcookie
                }
            };

            var changeStateFunc = function(response) {
                _self.device.resId = response.msg.resourceid;
                _self.changeStateTo(devicePlayingState.RESOURCE_READY);
                _self.timer.start();
            };

            var extendAjaxOptions = {
                contentType: "application/x-www-form-urlencoded;charset=utf-8"
            };

            var urlPrefix = _self.device.BACK_END_WEB_PROTOCAL + _self.device.webServerUrl;

            var requestArgs = {
                url: urlPrefix + "/init3.php",
                data: data,
                callbacks: undefined,
                changeState: changeStateFunc,
                extendAjaxOptions: extendAjaxOptions
            };

            return requestArgs;
        } else {
            console.error("args error");
        }

    };

    RtmpPlayer.prototype.queryResid = function() {
        var _self = this;
        if (_self.device.ELBcookie && _self.device.relayUrl &&
            _self.device.ELBcookie.length > 0 && _self.device.relayUrl.length > 0) {
            var requestArgs = _self.generateQueryResidArgs({
                ELBcookie: _self.device.ELBcookie,
                relayUrl: _self.device.relayUrl
            });

            var ajaxObj = _self.makeAjaxRequest(requestArgs, $.xAjax.defaults.xType);
            var currentCount = 1;
            this.rubbisAjaxArr.push(ajaxObj);
            var intervalObj = setInterval(function() {
                ajaxObj = _self.makeAjaxRequest(requestArgs, $.xAjax.defaults.xType);
                _self.rubbisAjaxArr.push(ajaxObj);
                currentCount += 1;
                if (currentCount >= _self.getResIdAjaxLimit) {
                    _self.changeStateTo(devicePlayingState.NEED_RES_FAILED_RETRY);
                };
            }, _self.getResIdIntervalTime);
            this.rubbisIntervalObjArr.push(intervalObj);
        } else {
            _self.changeStateTo(devicePlayingState.NEED_RES_FAILED_RETRY);
        }
    };

    RtmpPlayer.prototype.clearPlayerElementRubbish = function() {
        if (this.playerObj) {
            this.playerObj.stop();
            this.playerObj.remove();
            this.playerObj = null;
        };
        this.curResFailedRtryReqRlySrvCnt = 0;
    };

    $.ipc.RtmpPlayer = RtmpPlayer;


    function ImgPlayer() {
        NonPluginPlayer.call(this, arguments);

        this.audioPlayerElementId = null;

        this.protocol = "http://";
        this.port = 80;
        this.idleLink = "//:0";
    };
    $.ipc.inheritPrototype(ImgPlayer, NonPluginPlayer);

    ImgPlayer.prototype.initPlayer = function() {
        this.stateChangeCallback.empty();
        var contextFunc = $.proxy(this.stateChangeHandler, this);
        this.stateChangeCallback.add(contextFunc);
    };

    ImgPlayer.prototype.preparePlay = function() {
        this.killAllRelayClient();
        this.getRelayUrl();
    };

    ImgPlayer.prototype.stateChangeHandler = function() {
        if (this.device.isActive == false) {
            this.back2Idle($.ipc.stopReasonCodeMap.UNKNOWN_ERROR);
        } else {
            this.clearLastStepRubbish();
            var stateLogicMap = {};
            stateLogicMap[devicePlayingState.BEGIN_PLAY] = this.preparePlay;
            stateLogicMap[devicePlayingState.RELAY_URL_READY] = this.requestRelayService;
            stateLogicMap[devicePlayingState.REQUEST_RELAY_SERVICE_SUCCESS] = this.isRelayReady;
            stateLogicMap[devicePlayingState.RELAY_READY] = this.play;
            stateLogicMap[devicePlayingState.NETWORK_ERROR] = this.networkErrorRetry;
            stateLogicMap[devicePlayingState.NEED_RELAY_READY_FAILED_TRY] = this.relayReadyFailedRetryRelayService;
            var defaultFunc = function() {
                console.log("unkonw current state: " + currentState + ", back to idle");
                this.back2Idle($.ipc.stopReasonCodeMap.UNKNOWN_ERROR);
            };
            var currentState = this.state;
            var contextFunc = $.proxy(stateLogicMap[currentState] || defaultFunc, this);
            contextFunc();
        }
    };

    ImgPlayer.prototype.getResourcePath = function(first_argument) {
        var _self = this;
        var videoUrl = _self.protocol + _self.device.relayUrl + ":" + _self.port + "/relayservice?" + $.param({
            deviceid: _self.device.id,
            type: "video",
            resolution: _self.device.currentVideoResolution.name,
            "X-token": _self.device.owner.token
        });
        var audioUrl = _self.protocol + _self.device.relayUrl + ":" + _self.port + "/relayservice?" + $.param({
            deviceid: _self.device.id,
            type: "audio",
            resolution: _self.device.product.audioCodec.name,
            "X-token": _self.device.owner.token
        });
        return {
            videoUrl: videoUrl,
            audioUrl: audioUrl
        };
    };

    ImgPlayer.prototype.setupPlayer = function(playArgs) {
        var _self = this;

        $("#" + _self.playerElementId).off();
        var width = _self.device.currentVideoResolution.playerContainerCss.player.width;
        var height = _self.device.currentVideoResolution.playerContainerCss.player.height;
        $("#" + _self.playerElementId).width(width).height(height);
        $("#" + _self.playerElementId).attr("src", playArgs.resourcePath.videoUrl);
        $("#" + _self.playerElementId).on('load', function() {
            _self.timer && _self.timer.start();
            _self.statistics && Object.prototype.toString.call(_self.statistics.stopReason) === '[object Array]' && _self.statistics.success.push(_self.statistics.SUCCESS);
            _self.playerRenderFunc(_self.device);
        }).on('error', function() {
            if ($("#" + _self.playerElementId).attr("src") != _self.idleLink) {
                _self.changeStateTo(devicePlayingState.NETWORK_ERROR);
            };
        });

    };

    ImgPlayer.prototype.updateStatisticsType = function() {
        this.statistics && (this.statistics.type = "image");
    };

    ImgPlayer.prototype.killGetImgClient = function(args) {
        var _self = this;
        var data = {
            "REQUEST": 'RTMPOPERATE',
            "DATA": {
                "relayUrl": _self.device.relayUrl,
                "Xtoken": _self.device.owner.token,
                "devId": _self.device.id,
                "data": {
                    "service": "killclient",
                    "command": {
                        "X-Client-Id": args.relaySessionId
                    }
                },
                "token": _self.device.owner.token,
                "AWSELB": args.ELBcookie
            }
        };

        var extendAjaxOptions = {
            contentType: "application/x-www-form-urlencoded;charset=utf-8"
        };

        var urlPrefix = _self.device.BACK_END_WEB_PROTOCAL + _self.device.webServerUrl;

        var requestArgs = {
            url: urlPrefix + "/init3.php",
            data: data,
            callbacks: undefined,
            changeState: $.noop,
            extendAjaxOptions: extendAjaxOptions
        };

        _self.makeAjaxRequest(requestArgs, $.xAjax.defaults.xType);
    };

    ImgPlayer.prototype.killAllRelayClient = function() {
        var _self = this;
        for (var key in $.cookie()) {
            if (key.indexOf("X-Client-Id") >= 0) {
                var args = {
                    relaySessionId: $.cookie(key),
                    ELBcookie: _self.device.ELBcookie
                }
                _self.killGetImgClient(args);
                $.removeCookie(key);
            };
        }
    };

    ImgPlayer.prototype.clearPlayerElementRubbish = function() {
        var _self = this;
        $("#" + _self.playerElementId).attr("src", _self.idleLink);
        _self.killAllRelayClient();
    };

    $.ipc.ImgPlayer = ImgPlayer;
})(jQuery);

(function($) {
    "use strict";

    $.ipc = $.ipc || {};

    var devicePlayingState = {
        IDLE: 0,
        BEGIN_PLAY: 1,
        DEVICE_LOCAL_INFO_READY: 2
    };

    function PluginPlayer() {
        $.ipc.MyPlayer.call(this, arguments);
        this.volume = 0;

        this.recordCallback = null;
        this.snapshotCallback = null;
        this.timeupCallback = null;

        this.videoLoadingRenderFunc = null;
        this.pluginPlayerRender = null;
        this.updatePlayerObjView = null;
        this.showOffline = null;

        this.state = devicePlayingState.IDLE;
        this.videoReadyCallback = $.Callbacks("unique stopOnFalse");
    };

    $.ipc.inheritPrototype(PluginPlayer, $.ipc.MyPlayer);

    PluginPlayer.prototype.triggerPlay = function() {
        if (this.playerObj) {
            this.state = devicePlayingState.BEGIN_PLAY;
            this.stateChangeCallback.fireWith(this);
            this.videoLoadingRenderFunc(this.device);
        };
    };

    PluginPlayer.prototype.initPluginPlayer = function(args) {
        args = args || {};
        this.recordCallback = args.recordCallback;
        this.snapshotCallback = args.snapshotCallback;
        this.timeupCallback = args.timeupCallback;
        this.videoLoadingRenderFunc = args.videoLoadingRenderFunc;
        this.pluginPlayerRender = args.pluginPlayerRender;
        this.updatePlayerObjView = args.updatePlayerObjView;
        this.showOffline = args.showOffline;

        var contextFunc = $.proxy(this.pluginPlayerStateChangeHandler, this);
        this.stateChangeCallback.add(contextFunc);

        this.videoReadyCallback.add(this.pluginPlayerRender);
        this.videoReadyCallback.add(this.updatePlayerObjView);
        var contextSetVolume = $.proxy(this.setVideoVolume, this);
        this.videoReadyCallback.add(contextSetVolume);
    };

    PluginPlayer.prototype.setVideoVolume = function() {
        if (this.playerObj && this.volume != undefined) {
            this.playerObj.SetAudioVolume(parseInt(this.volume));
        };
    };

    PluginPlayer.prototype.back2Idle = function() {
        this.state = devicePlayingState.IDLE;
        if (this.playerObj) {
            this.playerObj.StopVideo && this.playerObj.StopVideo();
            this.playerObj.StopAudio && this.playerObj.StopAudio();
        };
    };

    PluginPlayer.prototype.getDeviceLocalInfo = function() {
        var _self = this;
        var args = {
            appServerUrl: _self.device.appServerUrl,
            token: _self.device.owner.token,
            id: _self.device.id
        };

        var inputCallbacks = {
            "errorCodeCallbackMap": {
                0: function() {
                    _self.state = devicePlayingState.DEVICE_LOCAL_INFO_READY;
                    _self.stateChangeCallback.fireWith(_self);
                }
            }
        };

        var validateResult = _self.device.getLocalInfo(args, inputCallbacks);
        if (validateResult != undefined && !validateResult.code) {
            console.error(validateResult.msg);
        };
    };

    PluginPlayer.prototype.pluginPlayerStateChangeHandler = function() {
        if (this.device.isActive == false) {
            this.back2Idle();
        } else {
            var stateLogicMap = {};
            stateLogicMap[devicePlayingState.BEGIN_PLAY] = this.getDeviceLocalInfo;
            stateLogicMap[devicePlayingState.DEVICE_LOCAL_INFO_READY] = this.play;

            var defaultFunc = function() {
                console.log("unkonw current state: " + currentState + ", back to idle");
                this.back2Idle();
            };
            var currentState = this.state;
            var contextFunc = $.proxy(stateLogicMap[currentState] || defaultFunc, this);
            contextFunc();
        }
    };

    PluginPlayer.prototype.setVolume = function(volume) {
        if (volume < 0 || volume > 100) {
            console.error("args error in setVolume");
        };
        this.volume = volume;
        this.setVideoVolume();
    };

    PluginPlayer.prototype.updateDeviceResAtVideoReady = function(resolutionStr) {
        var device = this.device;
        var supportVideoResArr = this.device.product.supportVideoResArr;
        for (var i = 0; i < supportVideoResArr.length; i++) {
            if (supportVideoResArr[i].name == resolutionStr) {
                device.currentVideoResolution = supportVideoResArr[i];
            }
        };
    };

    PluginPlayer.prototype.detectVideoReady = function() {
        var _self = this;
        var maxTryCount = 32;
        var currentTryIndex = 0;
        var interval = setInterval(function() {
            if (_self.playerObj.resolution) {
                clearInterval(interval);
                _self.updateDeviceResAtVideoReady(_self.playerObj.resolution);
                _self.videoReadyCallback.fire(_self.device);
            } else if (currentTryIndex == maxTryCount) {
                _self.showOffline();
                _self.back2Idle();
            }

            currentTryIndex += 1;
        }, 2000);
    };

    PluginPlayer.prototype.play = function() {
        this.feedPluginArgs();
        this.playerObj.SetAudioVolume(0);
        this.playerObj.PlayVideo();
        this.playerObj.PlayAudio();
        this.detectVideoReady();

        this.gatherStatics()
    };

    PluginPlayer.prototype.feedPluginArgs = function() {
        this.feedNormalPluginArgs();
        this.feedMyArgs();
    };

    PluginPlayer.prototype.feedNormalPluginArgs = function() {
        var _self = this;
        _self.playerObj.username = _self.device["auth_name"];
        _self.playerObj.password = _self.device["password"];
        _self.playerObj.port = Number(_self.device["stream_port"]) || 8080;
        _self.playerObj.ip = _self.device["iip"];
        _self.playerObj.web_port = _self.device["web_port"];
        _self.playerObj.cloud = true;
        _self.playerObj.recordcb = _self.recordCallback;
        _self.playerObj.snapshotcb = _self.snapshotCallback;
        _self.playerObj.devname = _self.device.name;
        _self.playerObj.timeout = 2;
        _self.playerObj.cldusr = _self.device.owner.account;
        _self.playerObj.cldtoken = _self.device.owner.token;
        _self.playerObj.clddns = _self.device.appServerUrl;
        _self.playerObj.cldmac = _self.device.mac;
        _self.playerObj.cldtime = 30;
        _self.playerObj.clddevid = _self.device.id;
        if ($.ipc.Browser.prototype.type.indexOf("MSIE") >= 0) {
            _self.playerObj.recordcbinvoke(_self.recordCallback);
            _self.playerObj.overtimecallback(_self.timeupCallback);
            _self.playerObj.SetCloudDevID(_self.device.id);
        } else {
            _self.playerObj.overtimecb = _self.timeupCallback;
        }
    };

    PluginPlayer.prototype.gatherStatics = function() {
        var statistics = new $.ipc.PluginStatistics();
        statistics.devID = this.device.id;
        statistics.devModel = this.device.model.substring(0, 5);
        statistics.firmwareVersion = this.device.fwVer;
        statistics.token = this.device.owner.token;
        statistics.send();
    };

    PluginPlayer.prototype.generateAjaxUrl = function(args) {
        if (undefined == args.appServerUrl || undefined == args.token) {
            console.error("args error in generateAjaxUrl");
        };
        return args.appServerUrl + "/?token=" + args.token;
    };


    function MjpegPluginPlayer() {
        PluginPlayer.call(this, arguments);
    };
    $.ipc.inheritPrototype(MjpegPluginPlayer, PluginPlayer);


    MjpegPluginPlayer.prototype.feedMyArgs = function() {};

    MjpegPluginPlayer.prototype.setResolution = function(val) {
        var _self = this;
        var width = null;
        var height = null;
        if (_self.device.currentVideoResolution.pluginPlayerObjCss) {
            width = _self.device.currentVideoResolution.pluginPlayerObjCss.css.width;
            height = _self.device.currentVideoResolution.pluginPlayerObjCss.css.height;
        } else {
            width = _self.device.currentVideoResolution.playerContainerCss.player.width;
            height = _self.device.currentVideoResolution.playerContainerCss.player.height;
        };
        var data = JSON.stringify({
            "method": "passthrough",
            "params": {
                "requestData": {
                    "command": "SET_RESOLUTION",
                    "content": {
                        "width": width,
                        "height": height
                    }
                },
                "deviceId": _self.device.id
            }
        });

        var changeStateFunc = function(response) {
            this.playerObj.PlayVideo();
            this.playerObj.PlayAudio();
        };
        var callbacks = {
            "errorCodeCallbackMap": {
                "-1": $.proxy(changeStateFunc, _self)
            },
            "errorCallback": $.proxy(changeStateFunc, _self)
        };

        var args = {
            url: _self.generateAjaxUrl({
                appServerUrl: _self.device.appServerUrl,
                token: _self.device.owner.token,
            }),
            data: data,
            callbacks: callbacks,
            changeState: changeStateFunc
        };
        _self.makeAjaxRequest(args, $.xAjax.defaults.xType);
    };


    function H264PluginPlayer() {
        PluginPlayer.call(this, arguments);
    };
    $.ipc.inheritPrototype(H264PluginPlayer, PluginPlayer);

    H264PluginPlayer.prototype.feedMyArgs = function() {
        var _self = this;
        _self.playerObj.streamtype = _self.device.product.videoCodec.pluginStreamTypeCode;
        _self.playerObj.streamresolution = _self.device.currentVideoResolution.pluginStreamResCode;
        _self.playerObj.audiostreamtype = _self.device.product.audioCodec.pluginAudioTypeCode;
    };

    H264PluginPlayer.prototype.setResolution = function(val) {
        var code = this.device.currentVideoResolution.pluginStreamResCode;
        this.playerObj.ChangeStreamResolution(code);
    };


    $.ipc.PluginPlayer = PluginPlayer;
    $.ipc.H264PluginPlayer = H264PluginPlayer;
    $.ipc.MjpegPluginPlayer = MjpegPluginPlayer;
})(jQuery);