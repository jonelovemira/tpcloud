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

(function($){
    "use strict";

    $.ipc = $.ipc || {};

    function Error(){
        this.code = null;
        this.msg = null;
    }

    Error.prototype.printMsg = function() {
        console.log(this.msg);
    };

    $.ipc.Error = Error;

    $.ipc.create = function (p) {
        if (p == null) {
            console.error("unknown type, cannot create");
        };

        if (Object.create) {
            return Object.create(p);
        };

        var t = typeof p;
        if (t !== "object" && t !== "function" ) {
            console.error("not a object or function");
        };

        function f() {};
        f.prototype = p;
        return new f();
    };
})(jQuery);

(function ($) {
    "use strict";

    $.ipc = $.ipc || {};

    function Model () {
    };

    Model.prototype.errorCodeCallbacks = {
        errorCodeCallbackMap : {
            "0": function(){console.log("OK");},
            "-1": function(){console.log("unknow error");},
        },
        errorCallback : function(xhr){console.log("xhr error: ", xhr)},
    };

    Model.prototype.extendErrorCodeCallback = function(inputCallbacks) {
        var tmpCallbacks =  $.extend(true, {}, this.errorCodeCallbacks, inputCallbacks);
        return tmpCallbacks;
    };

    Model.prototype.makeAjaxRequest = function(inputArgs, xDomain) {

        if (undefined == inputArgs["url"] || undefined == inputArgs["data"] || undefined == inputArgs["changeState"]) {
            console.error( "args error in makeAjaxRequest");
            return;
        };

        var tmpCallbacks = this.extendErrorCodeCallback(inputArgs["callbacks"]);
        var currentModel = this;

        var ajaxOptions = {
            url : inputArgs["url"],
            data : inputArgs["data"],
            success : function(response){
                var errCodeStrIndex = inputArgs["errCodeStrIndex"] || "errorCode";
                var noErrorCode = inputArgs["noErrorCode"] || 0;
                var defaultErrorCode = inputArgs["defaultErrorCode"] || -1;

                if (response[errCodeStrIndex] == noErrorCode) {
                    var changeStateFunc = $.proxy(inputArgs["changeState"], currentModel);
                    changeStateFunc(response);
                }
                var callbackFunc = tmpCallbacks.errorCodeCallbackMap[response[errCodeStrIndex]] || tmpCallbacks.errorCodeCallbackMap[defaultErrorCode];
                callbackFunc(response);
            },
            error : function(xhr){tmpCallbacks.errorCallback(xhr)}
        };

        $.extend(true, ajaxOptions, inputArgs["extendAjaxOptions"]);

        return $.xAjax(ajaxOptions, xDomain);
    };

    Model.prototype.validateAttr = function (inputArgs) {
        if(undefined == inputArgs["attr"] || undefined == inputArgs["attrEmptyMsg"] || 
            undefined == inputArgs["maxLength"] || undefined == inputArgs["minLength"] ||
            undefined == inputArgs["attrOutOfLimitMsg"] || undefined == inputArgs["pattern"] ||
            undefined == inputArgs["patternTestFailMsg"]) {
            console.error( "args error in validateAttr");
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

(function ($) {
    "use strict";

    $.ipc = $.ipc || {};   

    function User(){
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
        100: function(){console.log("token is invalid, plz relogin");},
        1000: function(){console.log("email is needed");},
        1002: function(){console.log("email format is invalid");},
        1005: function(){console.log("account is needed");},
        1006: function(){console.log("account does not exist");},
        1007: function(){console.log("account has already been activated");},
        1008: function(){console.log("email have been used");},
        1009: function(){console.log("account is not activated");},
        1011: function(){console.log("username is needed");},
        1012: function(){console.log("username can not contain any illegal char")},
        1013: function(){console.log("username have been used");},
        1015: function(){console.log("password format is invalid");},
        1020: function(){console.log("password is needed");},
        1022: function(){console.log("password length is invalid");},
        1023: function(){console.log("decrypt password failed");},
        1024: function(){console.log("account and password is not match");},
        1025: function(){console.log("new password is needed");},
        1029: function(){console.log("account was locked");},
    };

    User.prototype.errorCodeCallbacks = User.prototype.extendErrorCodeCallback({"errorCodeCallbackMap": userErrorCodeInfo});
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

        var validateResult = (!this.validateEmailFormat(args.email).code && this.validateEmailFormat(args.email)) ||
            (!this.validateUsername(args.username).code && this.validateUsername(args.username)) ||
            (!this.validatePassword(args.password).code && this.validatePassword(args.password));
        if (!validateResult.code) {return validateResult;};
        
        var data = JSON.stringify({
            "email": args.email,
            "username": args.username,
            "password": args.encryptText(args.password)
        });

        this.makeAjaxRequest({url: "/register", data: data, callbacks: inputCallbacks, changeState: $.noop});
    };

    User.prototype.login = function(args, inputCallbacks){
        
        var validateResult = (!this.validateAccount(args.account).code && this.validateAccount(args.account)) ||
        (!this.validatePassword(args.password).code 
            && this.validatePassword(args.password, {"patternTestFailMsg": tips.types.password.invalidShort}));
        if (validateResult.code == false) {return validateResult;};
        
        var data = JSON.stringify({
            "account" : args.account,
            "password" : this.encryptText(args.password)
        });

        var changeStateFunc = function(response){
            this.account = args.account;
            this.token = response.msg.token;
            this.email = response.msg.email;
        }

        this.makeAjaxRequest({url: "/login", data: data, callbacks: inputCallbacks, changeState: changeStateFunc});
    };

    User.prototype.logout = function(args, inputCallbacks) {
        var validateResult = (!this.validateEmailFormat(args.email).code && this.validateEmailFormat(args.email));
        if (validateResult.code == false) {return validateResult;};

        var data = JSON.stringify({
            "email": args.email
        });

        var changeStateFunc = function(response){
            this.token = null;
            $.removeCookie("token");
        }

        this.makeAjaxRequest({url: "/logout", data: data, callbacks: inputCallbacks, changeState: changeStateFunc});
    };

    User.prototype.sendActiveEmail = function(args, inputCallbacks) {
        var validateResult = (!this.validateEmailFormat(args.email).code && this.validateEmailFormat(args.email));
        if (validateResult.code == false) {return validateResult;};

        var data = JSON.stringify({
            "email": args.email
        });

        this.makeAjaxRequest({url: "/sendActiveEmail", data: data, callbacks: inputCallbacks, changeState: $.noop});
    };

    User.prototype.resetPassword = function(args, inputCallbacks) {
        var validateResult = (!this.validateEmailFormat(args.email).code && this.validateEmailFormat(args.email));
        if (validateResult.code == false) {return validateResult;};
        
        var data = JSON.stringify({
            "email": args.email
        });

        var changeStateFunc = function(response){
            this.password = null;
        };

        this.makeAjaxRequest({url: "/forgetPassword", data: data, callbacks: inputCallbacks, changeState: changeStateFunc});
    };

    User.prototype.modifyPassword = function(args, inputCallbacks) {
        var validateResult = (!this.validateAccount(args.account).code && this.validateAccount(args.account)) ||
                            (!this.validatePassword(args.password).code && this.validatePassword(args.password)) ||
                            (!this.validateNewPassword(args.newPassword, args.newPasswordSecond).code && this.validateNewPassword(args.newPassword, args.newPasswordSecond));
        if (validateResult.code == false) {return validateResult;};
        if (undefined == this.account) {
            console.error("args error in modifyPassword");
        };

        var data = JSON.stringify({
            "account": this.account,
            "oldPassword": this.encryptText(args.password),
            "password": this.encryptText(args.newPassword),
        });

        var changeStateFunc = function(response){
            this.token = null;
            this.password = null;
        };

        this.makeAjaxRequest({url: "/modifyPassword", data: data, callbacks: inputCallbacks, changeState: changeStateFunc});
    };

    User.prototype.forgotPassword = function(args, inputCallbacks) {
        var validateResult = (!this.validateEmailFormat(args.email).code && this.validateEmailFormat(args.email));
        if (validateResult.code == false) {return validateResult;};

        var data = JSON.stringify({
            "email": args.email
        });

        this.makeAjaxRequest({url: "/forgetPassword", data: data, callbacks: inputCallbacks, changeState: $.noop});
    };

    User.prototype.getUser = function(args, inputCallbacks){
        var validateResult = (!this.validateEmailFormat(args.email).code && this.validateEmailFormat(args.email));
        if (validateResult.code == false) {return validateResult;};

        var data = JSON.stringify({
            "email": args.email  
        });

        var changeStateFunc = function(response){
            this.username = response.msg.username;
        };
        
        this.makeAjaxRequest({url: "/getUser", data: data, callbacks: inputCallbacks, changeState: changeStateFunc});
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
        var defaultMsg = {"attrEmptyMsg": tips.types.password.cantBeEmpty,
                        "attrOutOfLimitMsg": tips.types.password.outOfLimit,
                        "patternTestFailMsg": tips.types.password.invalidLong};

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

(function ($) {
    "use strict";

    $.ipc = $.ipc || {};

    function hasNewerVersion (version) {
        if (undefined == version || undefined == this.newestVersion) {
            console.error("args error in hasNewerVersion");
        };
        var result = $.ipc.compareVersion(version, this.newestVersion);
        if (result > 0 ) {
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

    function PLUGIN_NON_IE_X86(){};
    function PLUGIN_NON_IE_X64(){};
    function PLUGIN_IE_X86(){};
    function PLUGIN_IE_X64(){};
    function PLUGIN_MAC(){};
    function FLASH_PLAYER(){};
    function IMG_PLAYER(){}

    PLUGIN_NON_IE_X86.prototype.mimetypeCssMap = {
        "application/x-tp-camera": "non-ie-mjpeg",
        "application/x-tp-camera-h264": "non-ie-h264"
    };

    PLUGIN_NON_IE_X64.prototype.mimetypeCssMap = {
        "application/x-tp-camera": "non-ie-mjpeg",
        "application/x-tp-camera-h264": "non-ie-h264"
    };

    PLUGIN_IE_X86.prototype.mimetypeCssMap = {
        "application/x-tp-camera": "ie-mjpeg",
        "application/x-tp-camera-h264": "ie-h264"
    };

    PLUGIN_IE_X64.prototype.mimetypeCssMap = {
        "application/x-tp-camera": "ie-mjpeg",
        "application/x-tp-camera-h264": "ie-h264"
    };

    PLUGIN_MAC.prototype.mimetypeCssMap = {
        "application/x-tp-camera": "non-ie-mjpeg",
        "application/x-tp-camera-h264": "non-ie-h264"
    };


    (function () {
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

(function ($) {
    "use strict";

    $.ipc = $.ipc || {};

    function Resolution(){
        this.name = null;
        this.width = null;
        this.height = null;
        this.str = null;
    };

    var RESOLUTION_VIDEO_VGA = new Resolution();
    RESOLUTION_VIDEO_VGA.name = "VGA";
    RESOLUTION_VIDEO_VGA.width = 640;
    RESOLUTION_VIDEO_VGA.height = 480;
    RESOLUTION_VIDEO_VGA.str = RESOLUTION_VIDEO_VGA.width + "*" + RESOLUTION_VIDEO_VGA.height;
    var RESOLUTION_VIDEO_QVGA = new Resolution();
    RESOLUTION_VIDEO_QVGA.name = "QVGA";
    RESOLUTION_VIDEO_QVGA.width = 320;
    RESOLUTION_VIDEO_QVGA.height = 240;
    RESOLUTION_VIDEO_QVGA.str = RESOLUTION_VIDEO_QVGA.width + "*" + RESOLUTION_VIDEO_QVGA.height;
    var RESOLUTION_VIDEO_HD = new Resolution();
    RESOLUTION_VIDEO_HD.name = "HD";
    RESOLUTION_VIDEO_HD.width = 1280;
    RESOLUTION_VIDEO_HD.height = 720;
    RESOLUTION_VIDEO_HD.str = RESOLUTION_VIDEO_HD.width + "*" + RESOLUTION_VIDEO_HD.height;
    var RESOLUTION_VIDEO_FULLHD = new Resolution();
    RESOLUTION_VIDEO_FULLHD.name = "FullHD";
    RESOLUTION_VIDEO_FULLHD.width = 1920;
    RESOLUTION_VIDEO_FULLHD.height = 1080;
    RESOLUTION_VIDEO_FULLHD.str = RESOLUTION_VIDEO_FULLHD.width + "*" + RESOLUTION_VIDEO_FULLHD.height;

    $.ipc.Resolution = Resolution;
    $.ipc.RESOLUTION_VIDEO_VGA = RESOLUTION_VIDEO_VGA;
    $.ipc.RESOLUTION_VIDEO_QVGA = RESOLUTION_VIDEO_QVGA;
    $.ipc.RESOLUTION_VIDEO_HD = RESOLUTION_VIDEO_HD;
    $.ipc.RESOLUTION_VIDEO_FULLHD = RESOLUTION_VIDEO_FULLHD;

})(jQuery);

(function ($) {
    "use strict";

    $.ipc = $.ipc || {};

    function Channel() {
        this.url = null;
        this.encrypt = null;
        this.videoCodec = null;
        this.audioCodec = null;
        this.name = null;
    };
    Channel.prototype.generateRelaydCommand = function(device) {
        if (undefined == device) {console.error("args error in generateRelaydCommand")};
        var localResolutionStr = this.generateLocalResolutionStr(device);
        var relayResolutionStr = this.generateRelayResolutionStr(device);
        var url = this.url;
        var type = this.name;
        return "relayd -s 'http://127.0.0.1:8080" + url + "?" + localResolutionStr +
        "' -d 'http://" + device.relayUrl + "/relayservice?deviceid=" + 
        device.id + "&type=" + type + "&" + relayResolutionStr + "' -a 'X-token: " +
        device.owner.token + "' -t '" + device.relayVideoTime + "'"; 
    };

    function DevicePostChannelVideo(){
        Channel.call(this, arguments);
        this.name = 'video';
    };
    $.ipc.inheritPrototype(DevicePostChannelVideo, Channel);
    DevicePostChannelVideo.prototype.generateLocalResolutionStr = function(dev){
        if (undefined == dev) {console.error("args error in gen local res str")};
        return "resolution=" + dev.currentVideoResolution.name;
    };
    DevicePostChannelVideo.prototype.generateRelayResolutionStr = function(dev){
        if (undefined == dev) {console.error("args error in gen local res str")};
        return "resolution=" + dev.currentVideoResolution.name;
    };

    function DevicePostChannelAudio(){
        Channel.call(this, arguments);
        this.name = 'audio';
    };
    $.ipc.inheritPrototype(DevicePostChannelAudio, Channel);
    DevicePostChannelAudio.prototype.generateLocalResolutionStr = function(dev){
        if (undefined == dev) {console.error("args error in gen local res str")};
        return "resolution=" + dev.product.audioCodec.name;
    };
    DevicePostChannelAudio.prototype.generateRelayResolutionStr = function(dev){
        if (undefined == dev) {console.error("args error in gen local res str")};
        return "resolution=" + dev.product.audioCodec.name;
    };

    function DevicePostChannelMixed(){
        Channel.call(this, arguments);
        this.name = 'mixed';
    };
    $.ipc.inheritPrototype(DevicePostChannelMixed, Channel);
    DevicePostChannelMixed.prototype.generateLocalResolutionStr = function(dev){
        if (undefined == dev) {console.error("args error in gen local res str")};
        return "resolution=" + dev.currentVideoResolution.name + "&audio=" +
                dev.product.audioCodec.name;
    };
    DevicePostChannelMixed.prototype.generateRelayResolutionStr = function(dev){
        if (undefined == dev) {console.error("args error in gen local res str")};
        return "resolution=" + dev.currentVideoResolution.name;
    };

    $.ipc.DevicePostChannelVideo = DevicePostChannelVideo;
    $.ipc.DevicePostChannelAudio = DevicePostChannelAudio;
    $.ipc.DevicePostChannelMixed = DevicePostChannelMixed;

})(jQuery);

(function ($) {
    "use strict";

    $.ipc = $.ipc || {};

    function Codec() {
        this.name = null;
    };

    $.ipc.Codec = Codec;
})(jQuery);

(function ($) {
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

    IpcProduct.prototype.getPlayerType = function(mt) {
        if (mt in mimeTypesArr) {console.error("mime types error in getPlayerType")};
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
                console.info("unsupportted operation system");
                result = undefined;
            }
        }
        return result;
    };

    var mimeTypesArr = ["application/x-tp-camera", "application/x-tp-camera-h264"];

    var videoChannel = new $.ipc.DevicePostChannelVideo();
    videoChannel.url = '/stream/getvideo';
    var audioChannel = new $.ipc.DevicePostChannelAudio();
    audioChannel.url = '/stream/getaudioblock';
    var mixedChannel = new $.ipc.DevicePostChannelMixed();
    mixedChannel.url = '/stream/mixed';

    var pcmAudioCodec = new $.ipc.Codec();
    pcmAudioCodec.name = "pcm";
    var aacAudioCodec = new $.ipc.Codec();
    aacAudioCodec.name = "aac";

    var NC200 = new IpcProduct();
    NC200.name = "NC200";
    NC200.supportVideoResArr = [$.ipc.RESOLUTION_VIDEO_VGA, $.ipc.RESOLUTION_VIDEO_QVGA];
    NC200.mimeType = mimeTypesArr[0];
    NC200.smallImgCssClass = "NC200-small-img";
    NC200.middleImgCssClass = "NC200-middle-img";
    NC200.playerType = NC200.getPlayerType(NC200.mimeType);
    NC200.postDataChannel = [videoChannel, audioChannel];
    NC200.audioCodec = pcmAudioCodec;
    
    var NC210 = new IpcProduct();
    NC210.name = "NC210";
    NC210.supportVideoResArr = [$.ipc.RESOLUTION_VIDEO_HD];
    NC210.mimeType = mimeTypesArr[1];
    NC210.smallImgCssClass = "NC210-small-img";
    NC210.middleImgCssClass = "NC210-middle-img";
    NC210.playerType = NC210.getPlayerType(NC210.mimeType);
    NC210.postDataChannel = [mixedChannel];
    NC210.audioCodec = aacAudioCodec;

    var NC220 = new IpcProduct();
    NC220.name = "NC220";
    NC220.supportVideoResArr = [$.ipc.RESOLUTION_VIDEO_VGA, $.ipc.RESOLUTION_VIDEO_QVGA];
    NC220.mimeType = mimeTypesArr[1];
    NC220.smallImgCssClass = "NC220-small-img";
    NC220.middleImgCssClass = "NC220-middle-img";
    NC220.playerType = NC220.getPlayerType(NC220.mimeType);
    NC220.postDataChannel = [videoChannel, audioChannel];
    NC220.audioCodec = aacAudioCodec;

    var NC230 = new IpcProduct();
    NC230.name = "NC230";
    NC230.supportVideoResArr = [$.ipc.RESOLUTION_VIDEO_HD];
    NC230.mimeType = mimeTypesArr[1];
    NC230.smallImgCssClass = "NC230-small-img";
    NC230.middleImgCssClass = "NC230-middle-img";
    NC230.playerType = NC230.getPlayerType(NC230.mimeType);
    NC230.postDataChannel = [mixedChannel];
    NC230.audioCodec = aacAudioCodec;
    
    var NC250 = new IpcProduct();
    NC250.name = "NC250";
    NC250.supportVideoResArr = [$.ipc.RESOLUTION_VIDEO_HD];
    NC250.mimeType = mimeTypesArr[1];
    NC250.smallImgCssClass = "NC250-small-img";
    NC250.middleImgCssClass = "NC250-middle-img";
    NC250.playerType = NC250.getPlayerType(NC250.mimeType);
    NC250.postDataChannel = [mixedChannel];
    NC250.audioCodec = aacAudioCodec;

    var NC350 = new IpcProduct();
    NC350.name = "NC350";
    NC350.supportVideoResArr = [$.ipc.RESOLUTION_VIDEO_HD];
    NC350.mimeType = mimeTypesArr[1];
    NC350.smallImgCssClass = "NC350-small-img";
    NC350.middleImgCssClass = "NC350-middle-img";
    NC350.playerType = NC350.getPlayerType(NC350.mimeType);
    NC350.postDataChannel = [mixedChannel];
    NC350.audioCodec = aacAudioCodec;

    var NC450 = new IpcProduct();
    NC450.name = "NC450";
    NC450.supportVideoResArr = [$.ipc.RESOLUTION_VIDEO_HD];
    NC450.mimeType = mimeTypesArr[1];
    NC450.smallImgCssClass = "NC450-small-img";
    NC450.middleImgCssClass = "NC450-middle-img";
    NC450.playerType = NC450.getPlayerType(NC450.mimeType);
    NC450.postDataChannel = [mixedChannel];
    NC450.audioCodec = aacAudioCodec;

    $.ipc.NC200 = NC200;
    $.ipc.NC210 = NC210;
    $.ipc.NC220 = NC220;
    $.ipc.NC230 = NC230;
    $.ipc.NC250 = NC250;
    $.ipc.NC350 = NC350;
    $.ipc.NC450 = NC450;

    $.ipc.IpcProduct = IpcProduct;

})(jQuery);

(function ($){
    "use strict";

    $.ipc = $.ipc || {};

    function Device() {
        $.ipc.Model.call(this, arguments);
        this.owner = null;
        this.id = null;
        this.type = null;
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

        this.hasUpgradOnce = null;
        this.product = null;
        this.nonPluginPlayer = null;

        this.currentVideoResolution = null;
        this.currentAudioCodec = null;
        this.relayUrl = null;
        this.ELBcookie = null;
        this.resId = null;

        this.isActive = false;
    };

    $.ipc.inheritPrototype(Device, $.ipc.Model);

    var deviceErrorCodeInfo = {
        "-20501": function(){console.log("device id does not exists");},
        "-20506": function(){console.log("device was binded to another account");},
        "-20507": function(){console.log("device is not binded to any account");},
        "-20571": function(){console.log("device is offline now");},
        "-20572": function(){console.log("alias format is incorrect");},
        "-20651": function(){console.log("token is invalid, plz relogin");},
        "-20675": function(){console.log("account is login at another place");},
    };

    Device.prototype.errorCodeCallbacks = Device.prototype.extendErrorCodeCallback({"errorCodeCallbackMap": deviceErrorCodeInfo});
    Device.prototype.stateChangeCallbacks = $.Callbacks("unique stopOnFalse");

    Device.prototype.init = function(d) {
        if (undefined == d) {console.error("args error in init");};
        $.extend(true, this, d);
        var p = this.model.substring(0,5).toUpperCase();
        var tmpProduct = new $.ipc.IpcProduct();
        $.extend(true, tmpProduct, $.ipc[p]);
        this.currentVideoResolution = tmpProduct.supportVideoResArr[0];
        this.product = tmpProduct;
    };

    Device.prototype.get = function(args, inputCallbacks) {
        if (this.owner == undefined) {console.error("owner is undefined");}
        var validateResult = (!this.owner.validateEmailFormat(args.email).code && this.owner.validateEmailFormat(args.email)) ||
                            (!this.validateIdFormat(args.id).code && this.validateIdFormat(args.id));
        if (validateResult.code == false) {return validateResult;};

        var data = JSON.stringify({
            "email": args.email,
            "id": args.id
        });

        var changeStateFunc = function(response) {
            this.init(response.msg);
            this.isSameRegion = true;
            this.stateChangeCallbacks.fire(this);
        };

        this.makeAjaxRequest({url: "/getCamera", data: data, callbacks: inputCallbacks, changeState: changeStateFunc}, $.xAjax.defaults.xType);
    };

    Device.prototype.upgrade = function(args, inputCallbacks) {
        if (undefined ==  this.owner || undefined == this.owner.token ||
            undefined == this.owner.email || undefined == args.fwUrl || 
            undefined == args.mac || undefined == args.azIP ||
            undefined == args.azDNS || undefined == this.webServerUrl) {
            console.error("args error in upgrade");
        }

        var urlPrefix = args.urlPrefix || this.webServerUrl;

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
        };

        var extendAjaxOptions = {
            contentType: "application/x-www-form-urlencoded;charset=utf-8"
        };

        this.makeAjaxRequest({url: urlPrefix + "/init3.php", data: data, callbacks: inputCallbacks, changeState: changeStateFunc, extendAjaxOptions: extendAjaxOptions}, $.xAjax.defaults.xType);
    };

    Device.prototype.changeName = function(args, inputCallbacks) {
        if (undefined == this.owner || undefined == this.owner.token || undefined == this.appServerUrl) {console.error("args error in changeName")};
        var validateResult = (!this.validateIdFormat(args.id).code && this.validateIdFormat(args.id)) ||
                            (!this.validateNameFormat(args.name).code && this.validateNameFormat(args.name));
        if (validateResult.code == false) {return validateResult;};
        
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

        this.makeAjaxRequest({
            url: this.appServerUrl + "?token=" + this.owner.token,
            data: data,
            changeState: changeStateFunc,
            errCodeStrIndex: "error_code",
            callbacks: inputCallbacks,
        }, $.xAjax.defaults.xType);
    };

    Device.prototype.unbind = function(args, inputCallbacks) {
        if (undefined == this.owner || undefined == this.owner.token ||
            undefined == this.appServerUrl) {
            console.error("args error in unbind");
        }
        var validateResult = (!this.owner.validateAccount(args.account).code && this.owner.validateAccount(args.account)) ||
                            (!this.validateIdFormat(args.id).code && this.validateIdFormat(args.id));
        if (validateResult.code == false) {return validateResult;};

        var data = JSON.stringify({
            "method": "unbindDevice",
            "params": {
                "cloudUserName": args.account,
                "deviceId": args.id
            }
        });

        this.makeAjaxRequest({
            url: this.appServerUrl + "?token=" + this.owner.token,
            data: data,
            changeState: $.noop,
            errCodeStrIndex: "error_code",
            callbacks: inputCallbacks,
        }, $.xAjax.defaults.xType);
    };

    Device.prototype.getLocalInfo = function(args, inputCallbacks) {
        if (undefined == args.token || undefined == args.appServerUrl) {console.error("args error in getLocalInfo");}
        var validateResult = (!this.validateIdFormat(args.id).code && this.validateIdFormat(args.id));
        if (validateResult.code == false) {return validateResult;};

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
        var changeStateFunc = function (response) {
            var passthroughResult = response.result.responseData;
            if (0 == passthroughResult.errCode) {
                $.extend(true, this, passthroughResult.msg);
                this.stateChangeCallbacks.fire(this);
            };
        }

        this.makeAjaxRequest({
            url: args.appServerUrl + "?token=" + args.token,
            data: data,
            changeState: changeStateFunc,
            errCodeStrIndex: "error_code",
        }, $.xAjax.defaults.xType);
    };

    Device.prototype.generateRelaydCommand = function() {
        var result = {};
        for (var i = 0; i < this.product.postDataChannel.length; i++) {
            var c = this.product.postDataChannel[i];
            var commandStr = c.generateRelaydCommand(this);
            result[c.name] = commandStr;
        };
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

(function ($){
    "use strict";

    $.ipc = $.ipc || {};

    function DeviceList () {
        
        $.ipc.Model.call(this, arguments);

        this.owner = null;
        this.url == null;
        this.upgradeList = [];
        this.devices = [];
        this.lastActiveDeviceId = null;
    };

    $.ipc.inheritPrototype(DeviceList, $.ipc.Model);

    var deviceListErrorCodeInfo = {
        100: function(){console.log("Session timeout or invaild");},
        1000: function(){console.log("email is needed");},
        1002: function(){console.log("email format is invalid");},
        1006: function(){console.log("account does not exist");},
        1007: function(){console.log("account has already been activated");},
    };

    DeviceList.prototype.errorCodeCallbacks = DeviceList.prototype.extendErrorCodeCallback({"errorCodeCallbackMap": deviceListErrorCodeInfo});

    DeviceList.prototype.getDeviceList = function(inputCallbacks) {
        if (undefined == this.owner) {console.error("owner of device list is undefined")};
        var data = {};

        var changeStateFunc = function(response){
            var oldDevices = this.devices;
            
            this.devices = [];
            for (var i = 0; i < response.msg.length; i++) {
                var newDevice = new $.ipc.Device();
                newDevice.init(response.msg[i]);
                newDevice.owner = this.owner;
                this.devices.push(newDevice);
            };

            for (var i = 0; i < oldDevices.length; i++) {
                var tmpIndex = this.findIndexForId(oldDevices[i].id);
                if (tmpIndex >= 0 && tmpIndex < this.devices.length) {
                    var tmpD = this.devices[tmpIndex];
                    $.extend(true, oldDevices[i], tmpD);
                    this.devices[tmpIndex] = oldDevices[i];
                } else {
                    oldDevices[i].clearRubbish();
                }
            };

            for (var i = 0; i < this.devices.length; i++) {
                var device = this.devices[i];
                var args = null;
                !device.isSameRegion && (args = {email: this.owner.email, id: device.id, urlPrefix: "https://jp-alpha.tplinkcloud.com"}) && device.get(args);
            };

            var activeDeviceArr = this.findActiveDeviceArr();
            if (activeDeviceArr.length <= 0 && this.devices.length > 0) {
                this.changeActiveDevice(undefined, this.devices[0]);
            };
        };
        
        this.makeAjaxRequest({url: "/getDeviceList", data: data, callbacks: inputCallbacks, changeState: changeStateFunc});
    };

    DeviceList.prototype.findActiveDeviceArr = function() {
        var result = [];
        for (var i = 0; i < this.devices.length; i++) {
            if(this.devices[i].isActive == true) {
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
            if (srcDevice.nonPluginPlayer) {
                srcDevice.nonPluginPlayer.back2Idle();
            };
            srcDevice.isActive = false;
        };
        destDevice.isActive = true;
        this.activeDeviceChanged = true;
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
            if(this.devices[i].id == devId) {
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

        var data = {
            "REQUEST": "GETUPGRADELIST",
            "DATA": {
                "email": this.owner.email,
                "token": this.owner.token
            }
        };

        var changeStateFunc = function(response){
            this.url = response.msg.url;
            this.upgradeList = response.msg.list;
        };

        var extendAjaxOptions = {
            contentType: "application/x-www-form-urlencoded;charset=utf-8"
        };

        this.makeAjaxRequest({url: "/init.php", data: data, callbacks: inputCallbacks, changeState: changeStateFunc, extendAjaxOptions: extendAjaxOptions});

    };

    DeviceList.prototype.upgradeAll = function(inputCallbacks) {
        if (undefined == this.owner || undefined == this.owner.email || undefined == this.owner.token || undefined == this.upgradeList) {
            console.error("args error in upgradeAll");
            return;
        };
    
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

        this.makeAjaxRequest({url: "/init.php", data: data, callbacks: inputCallbacks, changeState: $.noop, extendAjaxOptions: extendAjaxOptions});
    };
    
    $.ipc.DeviceList = DeviceList;

})(jQuery);

(function ($) {
    "use strict";

    $.ipc = $.ipc || {};

    function BaseController () {
        this.model = null;
        this.view = null;
        this.selectorHandlerMap = {};
        this.domClickCallbacks = $.Callbacks("unique stopOnFalse");
        var currentController = this;
        this.domClickCallbacks.add(function(selector, eventName, data, event){
            var func = function(data){console.log("this element did not bind any handler: ", selector);};
            if (currentController.selectorHandlerMap && 
                currentController.selectorHandlerMap[selector] && 
                currentController.selectorHandlerMap[selector][eventName]) {
                func = currentController.selectorHandlerMap[selector][eventName];
            };

            var contextFunc = $.proxy(func, currentController);
            contextFunc(data, event);
        });
    };

    BaseController.prototype.addHandler = function(inputArgs) {
        var currentController = this;
        var getMsgInformed = inputArgs["getMsgInformed"];
        var selector = inputArgs["selector"];
        var eventName = inputArgs["eventName"];
    
        $(document).on(eventName, selector, function(event){
            var data = null;
            if (getMsgInformed) {
                data = $.proxy(getMsgInformed, this)();
            };
            currentController.domClickCallbacks.fire(selector, eventName, data, event);
        });
    };

    BaseController.prototype.batchInitHandler = function(appendedSelectorHandlerMap, selectorMsgProduceFuncMap){
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

(function ($) {
    "use strict";

    $.ipc = $.ipc || {};

    function Software () {
        $.ipc.Model.call(this, arguments);
        this.products = [];
        this.plugins = [];
    }

    $.ipc.inheritPrototype(Software, $.ipc.Model);
    
    Software.prototype.getUpdateInfos = function(inputCallbacks) {
        
        var changeStateFunc = function(response){
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

        this.makeAjaxRequest({url: "/updateInfos", data: {}, callbacks: inputCallbacks, changeState: changeStateFunc});
    };

    $.ipc.Software = Software;
})(jQuery);

(function ($) {
    "use strict";

    $.ipc = $.ipc || {};

    function Feedback () {
        $.ipc.Model.call(this, arguments);
        this.account = null;
        this.product = null;
        this.country = null;
        this.problemType = null;
        this.description = null;
    };

    $.ipc.inheritPrototype(Feedback, $.ipc.Model);

    var feedbackErrorCodeInfo = {
        1000: function(){console.log("email address cannot be empty")},
        1006: function(){console.log("account is not exist")},
        1011: function(){console.log("username cannot be empty")},
    };

    Feedback.prototype.errorCodeCallbacks = Feedback.prototype.extendErrorCodeCallback({"errorCodeCallbackMap": feedbackErrorCodeInfo});

    Feedback.prototype.send = function(args, inputCallbacks) {
        var validateResult = (!this.validateAccount(args.account).code && this.validateAccount(args.account)) ||
            (!this.validateProduct(args.product).code && this.validateProduct(args.product)) ||
            (!this.validateDescription(args.description).code && this.validateDescription(args.description));
        if (validateResult.code == false) {return validateResult;}; 

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
                            "Model: " + args.product +  "<br/>" +
                            "Country: " + args.country + "<br/>" +
                            "Problem: " + args.problemType + "<br/>" +
                            "Description: " + args.description,
                "service": "Feedback"
            }
        };

        var changeStateFunc = function(response){
            $.extend(true, this, args);
        };

        var extendAjaxOptions = {
            contentType: "application/x-www-form-urlencoded;charset=utf-8"
        };

        this.makeAjaxRequest({url: "/init3.php", data: data, callbacks: inputCallbacks, changeState: changeStateFunc, extendAjaxOptions: extendAjaxOptions});
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

    Feedback.prototype.validateProduct = function(product) {
        if (undefined == product) {
            console.error("args error in validateProduct");
        };

        var validateArgs = {
            "attr": product,
            "attrEmptyMsg": tips.types.contact.product.cantBeEmpty,
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

(function ($) {
    "use strict";
    $.ipc = $.ipc || {};

    function Timer () {
        this.timeout = null;
        this.updateIntervalObj = null;
        this.currentTime = 0;
        this.intervalTime = 1000;
        this.timeoutCallback = $.Callbacks("unique stopOnFalse");
    };

    Timer.prototype.clearRubbish = function() {
        clearInterval(this.updateIntervalObj);
        this.currentTime = 0;
    };

    Timer.prototype.start = function() {
        var _self = this;
        _self.updateIntervalObj = setInterval(function() {
            _self.currentTime += _self.intervalTime;
            if (_self.currentTime >= _self.timeout) {
                clearInterval(_self.updateIntervalObj);
                _self.timeoutCallback.fire();
            };
        }, _self.intervalTime);
    };

    $.ipc.Timer = Timer;
})(jQuery);

(function ($) {
    "use strict";
    $.ipc = $.ipc || {};

    var devicePlayingState = {
        IDLE : 0,
        BEGIN_PLAY : 1,
        RELAY_URL_READY : 2,
        REQUEST_RELAY_SERVICE_SUCCESS: 3,
        RELAY_READY: 4,
        RESOURCE_READY: 5,
        PLAYING: 6
    };

    function Player(){
        $.ipc.Model.call(this, arguments);
        this.timer = null;
        this.device = null;
        this.swfPath = null;
        this.playerElementId = null;

        this.queryIsRelayReadyIntervalObj = null;
        this.queryIsRelayReadyAjaxArr = [];
        this.queryIsRelayReadyIntervalTime = 3000;

        this.getResIdIntervalObj = null;
        this.getResIdReadyAjaxArr = [];
        this.getResIdIntervalTime = 3000;

        this.state = devicePlayingState.IDLE;
        this.stateChangeCallback = $.Callbacks("unique stopOnFalse");

        this.playerObjErrorCallbacks = $.Callbacks("unique stopOnFalse");
    };
    $.ipc.inheritPrototype(Player, $.ipc.Model);
    var playerErrorCodeInfo = {
        "-20107": function(){console.log("args is invalid")},
        "-20501": function(){console.log("device is not exist")},
        "-20571": function(){console.log("device is offline")},
        "-20651": function(){console.log("token is out of date")},
        "-20652": function(){console.log("token is error")}
    };
    Player.prototype.errorCodeCallbacks = Player.prototype.extendErrorCodeCallback({"errorCodeCallbackMap": playerErrorCodeInfo});

    Player.prototype.playerObj = null;
    Player.prototype.clearAjaxArr = function(args) {
        clearInterval(args.obj);
        for (var i = 0; i < args.arr.length; i++) {
            args.arr[i].abort();
        };
        delete args.arr;
        args.arr = [];
    };

    Player.prototype.clearRubbish = function() {
        this.stateChangeCallback.empty();
        this.playerObjErrorCallbacks.empty();
        this.back2Idle();
    };

    Player.prototype.back2Idle = function() {
        this.clearAjaxArr({
            obj: this.queryIsRelayReadyIntervalObj,
            arr: this.queryIsRelayReadyAjaxArr
        });

        this.clearAjaxArr({
            obj: this.getResIdIntervalObj,
            arr: this.getResIdReadyAjaxArr
        });
        if (this.timer) {
            this.timer.clearRubbish();
        };
        this.state = devicePlayingState.IDLE;

        if (this.playerObj) {
            this.playerObj.stop();
        };
    };

    Player.prototype.flashPlayerStateChangeHandler = function() {
        if (this.device.isActive == false) {
            this.back2Idle();
        } else {
            var stateLogicMap = {};
            stateLogicMap[devicePlayingState.BEGIN_PLAY] = this.getRelayUrl;
            stateLogicMap[devicePlayingState.RELAY_URL_READY] = this.requestRelayService;
            stateLogicMap[devicePlayingState.REQUEST_RELAY_SERVICE_SUCCESS] = this.isRelayReady;
            stateLogicMap[devicePlayingState.RELAY_READY] = this.queryResid;
            stateLogicMap[devicePlayingState.RESOURCE_READY] = this.play;

            var defaultFunc = function() {
                console.log("unkonw current state: " + currentState + ", back to idle");
                this.back2Idle();
            };
            var currentState = this.state;
            var contextFunc = $.proxy(stateLogicMap[currentState] || defaultFunc, this);
            contextFunc();
        }
    };

    Player.prototype.initFlashPlayer = function() {
        this.stateChangeCallback.empty();
        var contextFunc = $.proxy(this.flashPlayerStateChangeHandler, this);
        this.stateChangeCallback.add(contextFunc);
    };

    Player.prototype.generateAjaxUrl = function(args) {
        if (undefined == args.appServerUrl || undefined == args.token) {
            console.error("args error in generateAjaxUrl");
        };
        return args.appServerUrl + "/ipc?token=" + args.token;
    };

    Player.prototype.getRelayUrl = function(args, inputCallbacks) {
        var _self = this;
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
            _self.state = devicePlayingState.RELAY_URL_READY;
            _self.stateChangeCallback.fireWith(_self);
        };

        var extendAjaxOptions = {
            error: function(xhr) {
                retryCount += 1;
                if (retryCount < retryLimit) {
                    _self.makeAjaxRequest(requestArgs, $.xAjax.defaults.xType);
                } else {
                    console.log("xhr error: ", xhr);
                }
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

        _self.makeAjaxRequest(requestArgs, $.xAjax.defaults.xType);
    };

    Player.prototype.requestSingleRelayService = function(reachedFlag, key, command) {
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
                _self.state = devicePlayingState.REQUEST_RELAY_SERVICE_SUCCESS;
                _self.stateChangeCallback.fireWith(_self);
            };
        };

        var extendAjaxOptions = {
            error: function(xhr) {
                retryCount += 1;
                if (retryCount < retryLimit) {
                    _self.makeAjaxRequest(requestArgs, $.xAjax.defaults.xType);
                } else {
                    console.log("xhr error: ", xhr);
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

        _self.makeAjaxRequest(requestArgs, $.xAjax.defaults.xType);
    };

    Player.prototype.requestRelayService = function() {
        var reachedFlag = {};
        var commandMap = this.device.generateRelaydCommand();
        for (var key in commandMap) {
            reachedFlag[key] = false;
        };
        for (var key in commandMap) {
            this.requestSingleRelayService(reachedFlag, key, commandMap[key]);
        };
    };

    Player.prototype.isRelayReady = function() {
        var _self = this;
        var data = JSON.stringify({
            "method": "isRelayReady",
            "params": {
                "devId": _self.device.id
            }
        });

        var changeStateFunc = function(response) {
            if (response.result.realServerKey.indexOf("AWSELB") >= 0) {
                clearInterval(_self.queryIsRelayReadyIntervalObj);
                for (var i = 0; i < _self.queryIsRelayReadyAjaxArr.length; i++) {
                    _self.queryIsRelayReadyAjaxArr[i].abort();
                };

                _self.device.ELBcookie = response.result.realServerKey;
                var cookieKey = _self.device.ELBcookie.split("=")[0];
                var cookieValue = _self.device.ELBcookie.split("=")[1];
                document.cookie = cookieKey + "=" + cookieValue + "; domain=.tplinkcloud.com";

                _self.state = devicePlayingState.RELAY_READY;
                _self.stateChangeCallback.fireWith(_self);
            };
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

        clearInterval(_self.queryIsRelayReadyIntervalObj);
        _self.queryIsRelayReadyIntervalObj = setInterval(function() {
            var ajaxObj = _self.makeAjaxRequest(requestArgs, $.xAjax.defaults.xType); 
            _self.queryIsRelayReadyAjaxArr.push(ajaxObj);
        }, _self.queryIsRelayReadyIntervalTime);

    };

    Player.prototype.queryResid = function() {
        var _self = this;
        /*var data = {
            "REQUEST": 'RTMPOPERATE',
            "DATA": {
                "relayUrl": 'http://' + _self.device.relayUrl,
                "Xtoken": _self.device.owner.token,
                "devId": _self.device.id,
                "data": {
                    "service": "getrtmp",
                    "command": {
                        "resolution": _self.device.product.supportVideoResArr[0].name
                    }
                },
                "AWSELB": _self.device.ELBcookie
            }
        };

        var changeStateFunc = function (response) {
            clearInterval(_self.getResIdIntervalObj);
            for (var i = 0; i < _self.getResIdReadyAjaxArr.length; i++) {
                _self.getResIdReadyAjaxArr[i].abort();
            };
            _self.device.resId = response.msg.resourceid;

            _self.state = devicePlayingState.RESOURCE_READY;
            _self.stateChangeCallback.fireWith(_self);
        };

        var requestArgs = {
            url: "init3.php", 
            data: data, 
            callbacks: undefined, 
            changeState: changeStateFunc
        };

        clearInterval(_self.getResIdIntervalObj);
        _self.getResIdIntervalObj = setInterval(function() {
            var ajaxObj = _self.makeAjaxRequest(requestArgs);
            _self.getResIdReadyAjaxArr.push(ajaxObj);
        }, _self.getResIdIntervalTime);*/

        setTimeout(function() {
            _self.device.resId = _self.device.id + "2in1" + 
                _self.device.product.supportVideoResArr[0].name;
            _self.timer.start();
            _self.state = devicePlayingState.RESOURCE_READY;
            _self.stateChangeCallback.fireWith(_self);
        }, 6000);
    };

    Player.prototype.play = function() {
        var _self = this;
        var playArgs = {
            resourcePath: _self.getResourcePath()
        }
        if (undefined == this.playerObj) {
            this.setupPlayer(playArgs);
        } else {
            this.changePlayerSource(playArgs);
        }
    };

    function RtmpPalyer() {
        Player.call(this, arguments);

        this.protocol = "rtmps://";
        this.port = 8082;
        this.resourceFolder = "RtmpRelay";
    };
    $.ipc.inheritPrototype(RtmpPalyer, Player);

    RtmpPalyer.prototype.getAuthArgs = function() {
        var result = null;
        var _self = this;
        var args = {
            devId: _self.device.id,
            token: _self.device.owner.token
        };
        result = $.param(args);
        return result;
    };

    RtmpPalyer.prototype.getResourcePath = function() {
        var _self = this;
        var resourceArgs = _self.getAuthArgs();
        var str = "";
        str += _self.protocol + _self.device.relayUrl + ":" + 
                _self.port + "/" + _self.resourceFolder + "/?" +
                resourceArgs + "flv:" + _self.device.resId;
        return str;
    };

    RtmpPalyer.prototype.setupPlayer = function(args) {
        var _self = this;
        var options = {
            width : 640,
            height : 480,
            autostart: true,
            playlist: [{
                sources: [{
                    file: args.resourcePath
                }]
            }],
            rtmp: { bufferlength: 0.1},
            displaytitle: false,
            mute: false,
            ph: 1,
            primary: "flash",
            repeat: false,
            stagevideo: false,
            stretching: "uniform",
        };
        var newPlayer = jwplayer(_self.playerElementId);
        newPlayer.setup(options);
        RtmpPalyer.prototype.playerObj = newPlayer;

        newPlayer.onSetupError(function(e){
            _self.playerObjErrorCallbacks.fire(e);
        });

        _self.state = devicePlayingState.PLAYING;
    };

    RtmpPalyer.prototype.changePlayerSource = function(args) {
        this.playerObj.load([{
            file: args.resourcePath
        }]);
        this.playerObj.play(); 
    };

    
    $.ipc.RtmpPalyer = RtmpPalyer;
    $.ipc.devicePlayingState = devicePlayingState;
})(jQuery);