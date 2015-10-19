(function($){
    $.ipc = $.ipc || {};

    function Error(initArgs){
        if (undefined == initArgs["code"] || undefined == initArgs["msg"]) {
            throw "error when construct error code";
        };
        this.code = initArgs["code"];
        this.msg = initArgs["msg"];
    }

    Error.prototype.printMsg = function() {
        console.log(this.msg);
    };

    $.ipc.Error = Error;

    function Model () {
        var errorCodeInfo = {
            NO_ERROR: new $.ipc.Error({code: 0, msg: "OK"}),
            DEFAULT: new $.ipc.Error({code: -1, msg: "unknow error"}),
        }

        var tmpErrorCodeCallBackMap = {}
        for (var eci in errorCodeInfo) {
            var e = errorCodeInfo[eci];
            tmpErrorCodeCallBackMap[e.code] = $.proxy(e.printMsg, e);
        };

        this.ajaxCallbacks = {
            errorCodeCallbackMap : tmpErrorCodeCallBackMap,
            errorCallback : function(xhr){console.log("xhr error: ", xhr)},
        }
    }

    Model.prototype.extendAjaxCallback = function(inputCallbacks) {
        var tmpCallbacks =  $.extend(true, {}, this.ajaxCallbacks, inputCallbacks);
        return tmpCallbacks;
    };

    Mode.prototype.makeAjaxRequest = function(inputArgs) {

        if (undefined == inputArgs["url"] || undefined == inputArgs["data"] || undefined == inputArgs["changeState"]) {
            throw "args error in makeAjaxRequest";
            return;
        };

        var tmpCallbacks = this.extendAjaxCallback(inputArgs["callbacks"]);
        var currentModel = this;

        $.xAjax({
            url : inputArgs["url"],
            data : inputArgs["data"],
            success : function(response){
                /* change currentUser state*/
                if (response.errorCode == User.errorCodeInfo.NO_ERROR.code) {
                    var changeStateFunc = $.proxy(initArgs["changeState"], currentModel);
                    changeStateFunc(response);
                }
                
                var callbackFunc = tmpCallbacks.errorCodeCallBackMap[response.errorCode] || tmpCallbacks.errorCodeCallBackMap[-1];
                callbackFunc(response);
            },
            error : function(xhr){tmpCallbacks.errorCallback(xhr)}
        });
    };

    $.ipc.Model = Model;

})(jQuery);

(function ($) {
    "use strict";

    $.ipc = $.ipc || {};   

    function User(){
        this.username = null;
        this.token = null;
        this.email = null;
        this.account = null;
        this.password = null;
        this.oldpassword = null;
    };
    var userErrorCodeInfo = {
        TOKEN_INVALID: new new $.ipc.Error({code: 100, msg: "token is invalid, plz relogin"}),
        EMAIL_NEEDED: new $.ipc.Error({code: 1000, msg: "email is needed"}),
        EMAIL_FORMAT_ERROR: new $.ipc.Error({code: 1002, msg: "email format is invalid"}),
        ACCOUNT_IS_NEEDED: new $.ipc.Error({code: 1005, msg: "account is needed"}),
        ACCOUNT_NOT_EXIST: new $.ipc.Error({code: 1006, msg: "account does not exist"}),
        ACCOUNT_ALREADY_ACTIVATED: new $.ipc.Error({code: 1007, msg: "account has already been activated"}),
        EMAIL_HAVE_BEEN_USED: new $.ipc.Error({code: 1008, msg: "email have been used"}),
        ACCOUNT_NOT_ACTIVE: new $.ipc.Error({code: 1009, msg: "account is not activated"}),
        USERNAME_NEEDED: new $.ipc.Error({code: 1011, msg: "username is needed"}),
        USERNAME_HAVE_BEED_USED: new $.ipc.Error({code: 1013, msg: "username have been used"}),
        USERNAME_FORMAT_ERROR: new $.ipc.Error({code: 1015, msg: "username format is invalid"}),
        PASSWORD_NEEDED: new $.ipc.Error({code:1020, msg: "password is needed"}),
        PASSWORD_LENGTH_ERROR: new $.ipc.Error({code: 1022, msg: "password length is invalid"}),
        DECRYPT_PASSWORD_FAILED: new $.ipc.Error({code: 1023, msg: "decrypt password failed"}),
        ACCOUNT_PASSWORD_NOT_MATCH: new $.ipc.Error({code: 1024, msg: "account and password is not match"}),
        NEW_PASSWORD_NEEDED: new $.ipc.Error({code: 1025, msg: "new password is needed"}),
    };
    var userModel = new $.ipc.Model();
    userModel.ajaxCallbacks = userModel.extendAjaxCallback({"errorCodeCallbackMap": userErrorCodeInfo});

    User.prototype = userModel;

    User.prototype.register = function(inputCallbacks) {
        if (undefined == this.email || undefined == this.username || undefined == this.password) {
            throw "args error in register";
            return;
        };
        
        var data = JSON.stringify({
            "email": this.email,
            "username": this.username,
            "password": this.password
        });

        this.makeAjaxRequest({url: "/register", data: data, callbacks: inputCallbacks, changeState: $.noop});
    };

    User.prototype.login = function(inputCallbacks){
        if (undefined == this.account || undefined == this.password) {
            throw "args error in login";
            return;
        };
        
        var data = JSON.stringify({
            "account" : this.account,
            "password" : this.password
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

        this.makeAjaxRequest({url: "/sentactiveemail", data: data, callbacks: inputCallbacks, changeState: $.noop});
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

        this.makeAjaxRequest({url: "/forgetpassword", data: data, callbacks: inputCallbacks, changeState: changeStateFunc});
    };

    User.prototype.modifyPassword = function(inputCallbacks) {
        if (undefined == this.email || undefined == this.oldpassword 
            || undefined == this.password || undefined == this.token) {
            throw "args error in modifyPassword";
            return;
        };
        
        var data = JSON.stringify({
            "email": this.email,
            "oldpassword": this.oldpassword,
            "password": this.password,
            "token": this.token
        });

        var changeStateFunc = function(response){
            this.token = null;
            this.password = null;
        };

        this.makeAjaxRequest({url: "/modifypassword", data: data, callbacks: inputCallbacks, changeState: changeStateFunc});
    };

    User.prototype.getUsername = function(inputCallbacks){
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
        
        this.makeAjaxRequest({url: "/getuser", data: data, callbacks: inputCallbacks, changeState: changeStateFunc});
    };

    $.ipc.User = User;

})(jQuery);

(function ($){
    "use strict";

    $.ipc = $.ipc || {};

    function Device(){}

    var deviceErrorCodeInfo = {
        OWNER_NOT_LOGIN : new $.ipc.Error({code:-20651, msg: "owner doesn't logged in"}),
        BELONG_TO_ANOTHER_USER: new $.ipc.Error({code: -20506, msg: "this device belong to another user"}),
        NO_OWNER: new Error({code: -20507, msg: "this device is not binded to any user"}),
        DEVICE_OFFLINE: new Error({code: -20571, msg: "this device is offline"}),
        ALIAS_FORMAT_ERROR: new Error({code: -20572, msg: "device alias format error"}),
    };

    var deviceModel = new $.ipc.Model();
    deviceModel.extendAjaxCallback({"errorCodeCallbackMap": deviceErrorCodeInfo});

    Device.prototype = deviceModel;

    Device.prototype.changeName = function(newName, inputCallbacks) {
        /* validate needed args*/
        if (undefined == newName || undefined == this.id
            || undefined == this.appServerUrl || undefined == this.owner
            || undefined == this.owner.token) {
            throw "error when change device name due to args error";
            return;
        };
        /* preserve context obj */
        var currentDevice = this;
        /* ajax callbacks extend */
        var callbacks = $.ipc.PublicMethod.extendDefaultCallbacksForModel(currentDevice, inputCallbacks);
        /* build ajax data*/
        var data = JSON.stringify({
            "method": "setAlias",
            "params": {
                "alias": newName,
                "deviceId": currentDevice.id
            }
        });
        /* make ajax request*/
        $.xAjax({
            url : currentDevice.appServerUrl + "?token=" + currentDevice.owner.token,
            data : data,
            context: {newName: newName},
            success : function(response){
                /* change currentDevice state*/
                if (response.errorCode == Device.errorCodeInfo.NO_ERROR.code) {
                    currentDevice.name = this.newName;
                };
                
                var callbackFunc = callbacks.errorCodeCallBackMap[response.errorCode] || callbacks.errorCodeCallBackMap[-1];
                callbackFunc(response);
            },
            error : function(xhr){callbacks.errorCallback(xhr)}
        });
    };

    
})(jQuery)