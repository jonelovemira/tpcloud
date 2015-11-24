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

    Model.prototype.makeAjaxRequest = function(inputArgs) {

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

        $.xAjax(ajaxOptions);
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
        1015: function(){console.log("username format is invalid");},
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
            (!this.validateUsernameFormat(args.email).code && this.validateUsernameFormat(args.email)) ||
            (!this.validateUsernameFormat(args.email).code && this.validateUsernameFormat(args.email));

        if (undefined == args.email || undefined == args.username || undefined == args.password) {
            console.error( "args error in register");
            return;
        };
        
        var data = JSON.stringify({
            "email": args.email,
            "username": args.username,
            "password": args.encryptText(args.password)
        });

        this.makeAjaxRequest({url: "/register", data: data, callbacks: inputCallbacks, changeState: $.noop});
    };

    User.prototype.login = function(args, inputCallbacks){
        if (undefined == args.account || undefined == args.password) {
            console.error( "args error in login");
            return;
        };
        
        var data = JSON.stringify({
            "username" : args.account,
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
        if (undefined == args.email) {
            console.error( "args error in logout");
            return;
        };

        var data = JSON.stringify({
            "email": args.email
        });

        var changeStateFunc = function(response){
            this.token = null;
        }

        this.makeAjaxRequest({url: "/logout", data: data, callbacks: inputCallbacks, changeState: changeStateFunc});
    };

    User.prototype.sendActiveEmail = function(args, inputCallbacks) {
        if (undefined == args.email) {
            console.error( "args error in sendActiveEmail");
            return;
        };

        var data = JSON.stringify({
            "email": args.email
        });

        this.makeAjaxRequest({url: "/sendActiveEmail", data: data, callbacks: inputCallbacks, changeState: $.noop});
    };

    User.prototype.resetPassword = function(args, inputCallbacks) {
        if (undefined == args.email) {
            console.error( "args error in resetPassword");
            return;
        };
        
        var data = JSON.stringify({
            "email": args.email
        });

        var changeStateFunc = function(response){
            this.password = null;
        };

        this.makeAjaxRequest({url: "/forgetPassword", data: data, callbacks: inputCallbacks, changeState: changeStateFunc});
    };

    User.prototype.modifyPassword = function(args, inputCallbacks) {
        if (undefined == args.email || undefined == args.newPassword 
            || undefined == args.password || undefined == this.token) {
            console.error("args error in modifyPassword");
            return;
        };
        
        var data = JSON.stringify({
            "email": args.email,
            "oldpassword": this.encryptText(args.password),
            "password": this.encryptText(args.newPassword),
            "token": this.token
        });

        var changeStateFunc = function(response){
            this.token = null;
            this.password = null;
        };

        this.makeAjaxRequest({url: "/modifyPassword", data: data, callbacks: inputCallbacks, changeState: changeStateFunc});
    };

    User.prototype.getUser = function(args, inputCallbacks){
        if (undefined == args.email) {
            console.error("error when get username due to args error");
            return;
        };

        var data = JSON.stringify({
            "email": args.email  
        });

        var changeStateFunc = function(response){
            this.username = response.msg.username;
        };
        
        this.makeAjaxRequest({url: "/getUser", data: data, callbacks: inputCallbacks, changeState: changeStateFunc});
    };

    User.prototype.validateUsernameFormat = function(tmpUsername) {
        if (undefined == tmpUsername) {
            console.error("args error in validateUsernameFormat");
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

    User.prototype.validatePasswordFormat = function(tmpPassword, msg) {
        if (undefined == tmpPassword) {
            console.error("args error in validatePasswordFormat");
            return;
        };
        var extendMsg = msg || {"attrEmptyMsg": tips.types.password.cantBeEmpty,
                                "attrOutOfLimitMsg": tips.types.password.outOfLimit,
                                "patternTestFailMsg": tips.types.password.invalidLong}
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
        return this.validatePasswordFormat(tmpNewPassword);
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
            this.rememberMe = rememberMe;
        };
    };

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
            console.error("args error in getcamera");
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
            console.error("error when change device name due to args error");
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
        var data = {};

        var changeStateFunc = function(response){
            this.devices = response.msg;
        };
        
        this.makeAjaxRequest({url: "/getDeviceList", data: data, callbacks: inputCallbacks, changeState: changeStateFunc});
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

    function Plugin () {
        $.ipc.Model.call(this, arguments);
        this.OS = null;
        this.version = null;
        this.name = null;
        this.supportedModels = [];
        this.downloadPath = null;
    };

    $.ipc.inheritPrototype(Plugin, $.ipc.Model);

    var pluginErrorCodeInfo = {
        10000: function(){console.log("No update for the application you want");}
    };

    Plugin.prototype.errorCodeCallbacks = Plugin.prototype.extendErrorCodeCallback({"errorCodeCallbackMap": pluginErrorCodeInfo});

    Plugin.prototype.checkUpdate = function(args, inputCallbacks) {
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

    $.ipc.Plugin = Plugin;

    function Product () {
        this.released = null;
        this.name = null;
        this.faqPath = null;
    }

    $.ipc.Product = Product;

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
                var newProduct = new $.ipc.Product();
                newProduct.released = response.msg.product[i].released;
                newProduct.name = response.msg.product[i].model;
                newProduct.faqPath = response.msg.product[i].href;
                this.products.push(newProduct);
                if (productNameObjMap[newProduct.name]) {
                    console.error("duplicate product");
                } else {
                    productNameObjMap[newProduct.name] = this.products[i];
                }
            };

            for (var i = 0; i < response.msg.software.length; i++) {
                var newPlugin = new $.ipc.Plugin();
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
        this.subject = null;
        this.description = null;
    };

    $.ipc.inheritPrototype(Plugin, $.ipc.Model);

    var feedbackErrorCodeInfo = {
        1000: function(){console.log("account cannot be empty")},
        1003: function(){console.log("email address is invalid")},
        1006: function(){console.log("email address is not exist")}
        1011: function(){console.log("email address is empty")},
    };

    Feedback.prototype.errorCodeCallbacks = Feedback.prototype.extendErrorCodeCallback({"errorCodeCallbackMap": feedbackErrorCodeInfo});

    Feedback.prototype.send = function(args, inputCallbacks) {
        if (undefined == args.account || undefined == args.product || 
            undefined == args.country || undefined == args.subject || 
            undefined == args.description) {
            console.error("error in args of Feedback.send");
        };

        var data = JSON.stringify({
            'REQUEST': 'EMAILSERVICE',
            'DATA': {
                "email": args.account,
                "subject": "User Feedback",
                "content": "From:" + args.account + "<br/>" +
                            "Model: " + args.product +  "<br/>" +
                            "Country: " + args.country + "<br/>" +
                            "Problem: " + args.subject + "<br/>" +
                            "Description: " + args.description,
                "service": "Feedback"
            }
        });

        var changeStateFunc = function(response){
            $.extend(true, this, args);
        }

        this.makeAjaxRequest({url: "/updateInfos", data: data, callbacks: inputCallbacks, changeState: changeStateFunc});
    };

    Feedback.prototype.validateAccount = function(tmpAccount) {
        if (undefined == tmpAccount) {
            console.error("args error in validateAccount");
            return;
        };

        var validateArgs = {
            "attr": tmpAccount,
            "attrEmptyMsg": tips.types.account.cantBeEmpty,
            "maxLength": 32,
            "minLength": 1,
            "attrOutOfLimitMsg": tips.types.account.outOfLimit,
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
            "maxLength": 32,
            "minLength": 1,
            "attrOutOfLimitMsg": tips.types.contact.description.outOfLimit,
            "pattern": /.*/,
            "patternTestFailMsg": tips.types.contact.description.invalid, 
        };

        return this.validateAttr(validateArgs);
    };

})(jQuery);