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

    $.ipc.inheritPrototype = function (subType, baseType) {
        if (undefined == baseType || undefined == subType) {
            console.error( "args error in inherit");
        };

        subType.prototype = $.ipc.create(baseType.prototype);
        subType.prototype.constructor = subType;
    }

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

        $.xAjax(ajaxOptions, xDomain);
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

        this.hasUpgradOnce = null;
        this.product = null;
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
        this.product = $.ipc[p];
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
        if (this.owner == undefined) {console.error("owner is undefined");}
        var validateResult = (!this.owner.validateEmailFormat(args.email).code && this.owner.validateEmailFormat(args.email));
        if (validateResult.code == false) {return validateResult;};

        var urlPrefix = args.urlPrefix || "";

        var data = {
            "REQUEST": "FIRMWAREUPGRADE",
            "DATA": {
                "account": args.email,
                "User-Agent": "Web-ffx86-2.0",
                "command": "UPGRADE\n" + args.downloadUrl + "\n",
                "dev_address": args.mac + "@" + args.azIp + "@" + args.azDns,
                "token": this.owner.token,
            },
        };

        var changeStateFunc = function(response) {
            this.systemStatus = "downloading";
            this.hasUpgradOnce = true;
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
            this.stateChangeCallbacks.fire();
        };

        this.makeAjaxRequest({
            url: this.appServerUrl + "?token=" + this.owner.token,
            data: data,
            changeState: changeStateFunc,
            errCodeStrIndex: "error_code",
        }, $.xAjax.defaults.xType);
    };

    Device.prototype.unbind = function(args, inputCallbacks) {
        if (undefined == this.owner || undefined == this.owner.token || undefined == this.appServerUrl) {console.error("args error in unbind");}
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
                this.stateChangeCallbacks.fire();
            };
        }

        this.makeAjaxRequest({
            url: args.appServerUrl + "?token=" + args.token,
            data: data,
            changeState: changeStateFunc,
            errCodeStrIndex: "error_code",
        }, $.xAjax.defaults.xType);
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
        this.activeDeviceIndex = null;
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
            var lastActiveDeviceId = this.findIdForIndex(this.activeDeviceIndex);
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
                    var tmpDevice = this.devices[tmpIndex];
                    this.devices[tmpIndex] = oldDevices[i];
                };
            };

            for (var i = 0; i < this.devices.length; i++) {
                var device = this.devices[i];
                var args = null;
                !device.isSameRegion && (args = {email: this.owner.email, id: device.id, urlPrefix: "https://jp-alpha.tplinkcloud.com"}) && device.get(args);
            };

            if (lastActiveDeviceId != undefined) {
                this.activeDeviceIndex = this.findIndexForId(lastActiveDeviceId);
            } else {
                if (this.devices.length == 0) {
                    this.activeDeviceIndex = null;
                } else {
                    this.activeDeviceIndex = 0;
                }
            }

            
            this.activeDeviceIndex = lastActiveDeviceId == undefined ? 0 : this.findIndexForId(lastActiveDeviceId);
        };
        
        this.makeAjaxRequest({url: "/getDeviceList", data: data, callbacks: inputCallbacks, changeState: changeStateFunc});
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
        if (undefined == devId) {
            console.error("args error in findIndexForId");
        };
        for (var i = 0; i < this.devices.length; i++) {
            if(this.devices[i].id == devId) {
                return i;
            }
        };
        return this.devices.length > 0 ? 0 : undefined;
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

    DeviceList.prototype.isActiveDevice = function(device) {
        if (undefined == device || !(device instanceof $.ipc.Device)) {
            console.error("args error in isActiveDevice");
        };

        return this.findIndexForId(device.id) == this.activeDeviceIndex;
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

    function IpcPlugin () {
        $.ipc.Model.call(this, arguments);
        this.OS = null;
        this.version = null;
        this.name = null;
        this.supportedModels = [];
        this.downloadPath = null;
    };

    $.ipc.inheritPrototype(IpcPlugin, $.ipc.Model);

    var ipcPluginErrorCodeInfo = {
        10000: function(){console.log("No update for the application you want");}
    };

    IpcPlugin.prototype.errorCodeCallbacks = IpcPlugin.prototype.extendErrorCodeCallback({"errorCodeCallbackMap": ipcPluginErrorCodeInfo});

    IpcPlugin.prototype.checkUpdate = function(args, inputCallbacks) {
        if (undefined == args.OS || undefined == args.version ||
            undefined == args.name) {
            console.error("args error when checkUpdate");
        } else {
            var data = JSON.stringify({
                "OS": args.OS,
                "Version": args.version,
                "Model": args.name
            });

            var changeStateFunc = function(response){
                $.extend(true, this, args);
                this.downloadPath = response.msg;
            }

            this.makeAjaxRequest({url: "/pluginUpdate", data: data, callbacks: inputCallbacks, changeState: changeStateFunc});
        }
    };

    $.ipc.IpcPlugin = IpcPlugin;

    var resolution = {
        VGA: "640*480",
        QVGA: "320*240",
        HD: "1280*720",
        FullHD: "1920*1080"
    };
    var mimeTypes = {
        MJPEG: "application/x-tp-camera",
        H264: "application/x-tp-camera-h264"
    };

    function NC200() {};
    NC200.prototype.released = null;
    NC200.prototype.faqPath = null;
    NC200.prototype.name = "NC200";
    NC200.prototype.availableResolutionVals = [resolution.VGA, resolution.QVGA];
    NC200.prototype.mimeType = mimeTypes.MJPEG;
    NC200.prototype.smallImgCssClass = "NC200-small-img";
    NC200.prototype.middleImgCssClass = "NC200-middle-img";

    function NC210() {};
    NC210.prototype.released = null;
    NC210.prototype.faqPath = null;
    NC210.prototype.name = "NC210";
    NC210.prototype.availableResolutionVals = [resolution.HD];
    NC210.prototype.mimeType = mimeTypes.H264;
    NC210.prototype.smallImgCssClass = "NC210-small-img";
    NC210.prototype.middleImgCssClass = "NC210-middle-img";

    function NC220() {};
    NC220.prototype.released = null;
    NC220.prototype.faqPath = null;
    NC220.prototype.name = "NC220";
    NC220.prototype.availableResolutionVals = [resolution.VGA, resolution.QVGA];
    NC220.prototype.mimeType = mimeTypes.H264;
    NC220.prototype.smallImgCssClass = "NC220-small-img";
    NC220.prototype.middleImgCssClass = "NC220-middle-img";

    function NC230() {};
    NC230.prototype.released = null;
    NC230.prototype.faqPath = null;
    NC230.prototype.name = "NC230";
    NC230.prototype.availableResolutionVals = [resolution.HD];
    NC230.prototype.mimeType = mimeTypes.H264;
    NC230.prototype.smallImgCssClass = "NC230-small-img";
    NC230.prototype.middleImgCssClass = "NC230-middle-img";

    function NC250() {};
    NC250.prototype.released = null;
    NC250.prototype.faqPath = null;
    NC250.prototype.name = "NC250";
    NC250.prototype.availableResolutionVals = [resolution.HD];
    NC250.prototype.mimeType = mimeTypes.H264;
    NC250.prototype.smallImgCssClass = "NC250-small-img";
    NC250.prototype.middleImgCssClass = "NC250-middle-img";

    function NC350() {};
    NC350.prototype.released = null;
    NC350.prototype.faqPath = null;
    NC350.prototype.name = "NC350";
    NC350.prototype.availableResolutionVals = [resolution.HD];
    NC350.prototype.mimeType = mimeTypes.H264;
    NC350.prototype.smallImgCssClass = "NC350-small-img";
    NC350.prototype.middleImgCssClass = "NC350-middle-img";

    function NC450() {};
    NC450.prototype.released = null;
    NC450.prototype.faqPath = null;
    NC450.prototype.name = "NC450";
    NC450.prototype.availableResolutionVals = [resolution.HD];
    NC450.prototype.mimeType = mimeTypes.H264;
    NC450.prototype.smallImgCssClass = "NC450-small-img";
    NC450.prototype.middleImgCssClass = "NC450-middle-img";

    $.ipc.NC200 = NC200;
    $.ipc.NC210 = NC210;
    $.ipc.NC220 = NC220;
    $.ipc.NC230 = NC230;
    $.ipc.NC250 = NC250;
    $.ipc.NC350 = NC350;
    $.ipc.NC450 = NC450;

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
                product.prototype.released = response.msg.product[i].released;
                product.prototype.faqPath = response.msg.product[i].href;
                this.products.push(product);
                productNameObjMap[product.prototype.name] = product;
            };

            for (var i = 0; i < response.msg.software.length; i++) {
                var newPlugin = new $.ipc.IpcPlugin();
                newPlugin.OS = response.msg.software[i].tags;
                newPlugin.version = response.msg.software[i].version;
                newPlugin.name = response.msg.software[i].name;

                var supportedModelsArr = response.msg.software[i].model.split(";");
                for (var j = 0; j < supportedModelsArr.length; j++) {
                    if (undefined == productNameObjMap[supportedModelsArr[j]]) {
                        console.error("unknown model: " + supportedModelsArr[j]);
                    } else {
                        newPlugin.supportedModels.push(productNameObjMap[supportedModelsArr[j]]); 
                    }
                };
                
                newPlugin.downloadPath = response.msg.software[i].path;
                this.plugins.push(newPlugin);
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