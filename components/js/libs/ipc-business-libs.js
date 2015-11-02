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
*     
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

    $.ipc.create = function(p) {
        if (p == null) {
            throw "unknown type, cannot create";
        };

        if (Object.create) {
            return Object.create(p);
        };

        var t = typeof p;
        if (t !== "object" && t !== "function" ) {
            throw "not a object or function";
        };

        function f() {};
        f.prototype = p;
        return new f();
    };

    function Model () {
        this.errorCodeCallbacks = {
            errorCodeCallbackMap : {
                "0": function(){console.log("OK");},
                "-1": function(){console.log("unknow error");},
            },
            errorCallback : function(xhr){console.log("xhr error: ", xhr)},
        };
    };

    Model.prototype.extendErrorCodeCallback = function(inputCallbacks) {
        var tmpCallbacks =  $.extend({}, this.errorCodeCallbacks, inputCallbacks);
        return tmpCallbacks;
    };

    Model.prototype.makeAjaxRequest = function(inputArgs) {

        if (undefined == inputArgs["url"] || undefined == inputArgs["data"] || undefined == inputArgs["changeState"]) {
            throw "args error in makeAjaxRequest";
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

        $.extend(ajaxOptions, inputArgs["extendAjaxOptions"]);

        $.xAjax(ajaxOptions);
    };

    Model.prototype.validateAttr = function (inputArgs) {
        if(undefined == inputArgs["attr"] || undefined == inputArgs["attrEmptyMsg"] || 
            undefined == inputArgs["maxLength"] || undefined == inputArgs["minLength"] ||
            undefined == inputArgs["attrOutOfLimitMsg"] || undefined == inputArgs["pattern"] ||
            undefined == inputArgs["patternTestFailMsg"]) {
            throw "args error in validateAttr";
            return;
        };
        var e = new $.ipc.Error();
        if (0 == inputArgs["attr"].length) {
            e.code = -1;
            e.msg = inputArgs["attrEmptyMsg"];
        } else if (inputArgs["attr"].length > inputArgs["maxLength"] || inputArgs["attr"].length < inputArgs["minLength"]) {
            e.code = -1;
            e.msg = inputArgs["attrOutOfLimitMsg"];
        } else if (!inputArgs["pattern"].test(inputArgs["attr"])) {
            e.code = -1;
            e.msg = inputArgs["patternTestFailMsg"];
        } else {
            e.code = 0;
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
        this.oldpassword = null;
    };
    
    User.prototype = $.ipc.create($.ipc.Model.prototype);
    User.prototype.constructor = User;

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
        1015: function(){console.log("username format is invalid");},
        1020: function(){console.log("password is needed");},
        1022: function(){console.log("password length is invalid");},
        1023: function(){console.log("decrypt password failed");},
        1024: function(){console.log("account and password is not match");},
        1025: function(){console.log("new password is needed");},
        1029: function(){console.log("account was locked");},
    };

    User.prototype.errorCodeCallbacks = User.prototype.extendErrorCodeCallback({"errorCodeCallbackMap": userErrorCodeInfo});

    User.prototype.register = function(inputCallbacks) {
        if (undefined == this.email || undefined == this.username || undefined == this.password) {
            throw "args error in register";
            return;
        };
        
        var data = JSON.stringify({
            "email": this.email,
            "username": this.username,
            "password": this.encryptText(this.password)
        });

        this.makeAjaxRequest({url: "/register", data: data, callbacks: inputCallbacks, changeState: $.noop});
    };

    User.prototype.login = function(inputCallbacks){
        if (undefined == this.account || undefined == this.password) {
            throw "args error in login";
            return;
        };
        
        var data = JSON.stringify({
            "username" : this.account,
            "password" : this.encryptText(this.password)
        });

        var changeStateFunc = function(response){
            this.token = response.msg.token;
            this.email = response.msg.email;
        }

        this.makeAjaxRequest({url: "/login", data: data, callbacks: inputCallbacks, changeState: changeStateFunc});
    };

    User.prototype.logout = function(inputCallbacks) {
        if (undefined == this.email) {
            throw "args error in logout";
            return;
        };

        var data = JSON.stringify({
            "email": this.email
        });

        var changeStateFunc = function(response){
            this.token = null;
        }

        this.makeAjaxRequest({url: "/logout", data: data, callbacks: inputCallbacks, changeState: changeStateFunc});
    };

    User.prototype.sendActiveEmail = function(inputCallbacks) {
        if (undefined == this.email) {
            throw "args error in sendActiveEmail";
            return;
        };

        var data = JSON.stringify({
            "email": this.email
        });

        this.makeAjaxRequest({url: "/sendActiveEmail", data: data, callbacks: inputCallbacks, changeState: $.noop});
    };

    User.prototype.resetPassword = function(inputCallbacks) {
        if (undefined == this.email) {
            throw "args error in resetPassword";
            return;
        };
        
        var data = JSON.stringify({
            "email": this.email
        });

        var changeStateFunc = function(response){
            this.password = null;
        };

        this.makeAjaxRequest({url: "/forgetPassword", data: data, callbacks: inputCallbacks, changeState: changeStateFunc});
    };

    User.prototype.modifyPassword = function(inputCallbacks) {
        if (undefined == this.email || undefined == this.oldpassword 
            || undefined == this.password || undefined == this.token) {
            throw "args error in modifyPassword";
            return;
        };
        
        var data = JSON.stringify({
            "email": this.email,
            "oldpassword": this.encryptText(this.oldpassword),
            "password": this.encryptText(this.password),
            "token": this.token
        });

        var changeStateFunc = function(response){
            this.token = null;
            this.password = null;
        };

        this.makeAjaxRequest({url: "/modifyPassword", data: data, callbacks: inputCallbacks, changeState: changeStateFunc});
    };

    User.prototype.getUser = function(inputCallbacks){
        if (undefined == this.email) {
            throw "error when get username due to args error";
            return;
        };

        var data = JSON.stringify({
            "email": this.email  
        });

        var changeStateFunc = function(response){
            this.username = response.msg.username;
        };
        
        this.makeAjaxRequest({url: "/getUser", data: data, callbacks: inputCallbacks, changeState: changeStateFunc});
    };

    User.prototype.validateUsernameFormat = function() {
        if (undefined == this.username) {
            throw "args error in validateUsernameFormat";
            return;
        };

        var validateArgs = {
            "attr": this.username,
            "attrEmptyMsg": tips.types.username.cantBeEmpty,
            "maxLength": 32,
            "minLength": 1,
            "attrOutOfLimitMsg": tips.types.username.outOfLimit,
            "pattern": /^[0-9A-Za-z-_.]{1,32}$/,
            "patternTestFailMsg": tips.types.username.invalid, 
        };

        return this.validateAttr(validateArgs);
    };

    User.prototype.validatePasswordFormat = function() {
        if (undefined == this.password) {
            throw "args error in validatePasswordFormat";
            return;
        };
        
        var validateArgs = {
            "attr": this.password,
            "attrEmptyMsg": tips.types.password.cantBeEmpty,
            "maxLength": 32,
            "minLength": 6,
            "attrOutOfLimitMsg": tips.types.password.outOfLimit,
            "pattern": /^[\x21-\x7e]{6,32}$/,
            "patternTestFailMsg": tips.types.password.invalid, 
        };
        return this.validateAttr(validateArgs);
    };

    User.prototype.validateEmailFormat = function() {
        if (undefined == this.email) {
            throw "args error in validateEmailFormat";
            return;
        };
        
        var validateArgs = {
            "attr": this.email,
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
            throw "error in encryptText";
            return;
        };
        
        return text;
        // return $.ipc.Secret.rsaEncrypt(text);
    }

    $.ipc.User = User;

})(jQuery);

/*(function ($){
    "use strict";

    $.ipc = $.ipc || {};

    function Device(){
        this.owner = null;
        this.id = null;
        this.type = null;
        this.mac = null;
        this.isOnline = null;
        this.fwVer = null;
        this.appServerUrl = null;
        this.name = null;
        this.isSameRegion = null;
        this.azIP = null;
        this.azDNS = null;
        this.systemStatus = null;
        this.needForceUpgrade = null;
        this.fwUrl = null;
    }

    Device.prototype = $.ipc.create($.ipc.Model.prototype);
    Device.prototype.constructor = Device;

    var deviceErrorCodeInfo = {
        ""
        OWNER_NOT_LOGIN : new $.ipc.Error({code:-20651, msg: "owner doesn't logged in"}),
        BELONG_TO_ANOTHER_USER: new $.ipc.Error({code: -20506, msg: "this device belong to another user"}),
        NO_OWNER: new Error({code: -20507, msg: "this device is not binded to any user"}),
        DEVICE_OFFLINE: new Error({code: -20571, msg: "this device is offline"}),
        ALIAS_FORMAT_ERROR: new Error({code: -20572, msg: "device alias format error"}),
    };

    var deviceModel = new $.ipc.Model();
    deviceModel.extendErrorCodeCallback({"errorCodeCallbackMap": deviceErrorCodeInfo});

    Device.prototype = deviceModel;

    Device.prototype.getCamera = function(inputCallbacks) {
        if (undefined == this.owner || undefined == this.owner.email || undefined == this.id) {
            throw "args error in getcamera";
            return;
        };

        var data = JSON.stringify({
            "email": this.owner.email,
            "Id": this.id  
        });

        var changeStateFunc = function(response){
            this.username = response.msg.username;
            $.extend(true, this, response.msg);
        };
        
        this.makeAjaxRequest({url: "/getCamera", data: data, callbacks: inputCallbacks, changeState: changeStateFunc});
    };

    Device.prototype.changeName = function(newName, inputCallbacks) {
        if (undefined == newName || undefined == this.id
            || undefined == this.appServerUrl || undefined == this.owner
            || undefined == this.owner.token) {
            throw "error when change device name due to args error";
            return;
        };
        var currentDevice = this;
        var callbacks = $.ipc.PublicMethod.extendDefaultCallbacksForModel(currentDevice, inputCallbacks);
        var data = JSON.stringify({
            "method": "setAlias",
            "params": {
                "alias": newName,
                "deviceId": currentDevice.id
            }
        });
        $.xAjax({
            url : currentDevice.appServerUrl + "?token=" + currentDevice.owner.token,
            data : data,
            context: {newName: newName},
            success : function(response){
                if (response.errorCode == Device.errorCodeInfo.NO_ERROR.code) {
                    currentDevice.name = this.newName;
                };
                
                var callbackFunc = callbacks.errorCodeCallBackMap[response.errorCode] || callbacks.errorCodeCallBackMap[-1];
                callbackFunc(response);
            },
            error : function(xhr){callbacks.errorCallback(xhr)}
        });
    };

    $.ipc.Device = Device;

    
})(jQuery);*/

(function ($){
    "use strict";

    $.ipc = $.ipc || {};

    function DeviceList () {
        
        $.ipc.Model.call(this, arguments);

        this.owner = null;
        this.url == null;
        this.upgradeList = [];
        this.devices = [];
    };

    DeviceList.prototype = $.ipc.create($.ipc.Model.prototype);
    DeviceList.prototype.constructor = DeviceList;

    var deviceListErrorCodeInfo = {
        100: function(){console.log("Session timeout or invaild");},
        1000: function(){console.log("email is needed");},
        1002: function(){console.log("email format is invalid");},
        1006: function(){console.log("account does not exist");},
        1007: function(){console.log("account has already been activated");},
    };

    DeviceList.prototype.errorCodeCallbacks = DeviceList.prototype.extendErrorCodeCallback({"errorCodeCallbackMap": deviceListErrorCodeInfo});

    DeviceList.prototype.getDeviceList = function(inputCallbacks) {
        var data = {};

        var changeStateFunc = function(response){
            this.devices = response.msg;
        };
        
        this.makeAjaxRequest({url: "/getDeviceList", data: data, callbacks: inputCallbacks, changeState: changeStateFunc});
    };

    DeviceList.prototype.getUpgradeList = function(inputCallbacks) {
        if (undefined == this.owner || undefined == this.owner.email || undefined == this.owner.token) {
            throw "args error in getUpgradeList";
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
            throw "args error in upgradeAll";
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