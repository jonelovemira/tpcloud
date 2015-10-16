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

    function Model () {}

    var errorCodeInfo = {
        NO_ERROR: new $.ipc.Error({code: 0, msg: "OK"}),
        DEFAULT: new $.ipc.Error({code: -1, msg: "unknow error"}),
    }

    var tmpErrorCodeCallBackMap = {}
    for (var eci in errorCodeInfo) {
        var e = errorCodeInfo[eci];
        tmpErrorCodeCallBackMap[e.code] = $.proxy(e.printMsg, e);
    };

    Model.prototype.ajaxCallbacks = {
        errorCodeCallbackMap : tmpErrorCodeCallBackMap,
        errorCallback : function(xhr){console.log("xhr error: ", xhr)},
    }

    Model.prototype.extendAjaxCallback = function(inputCallbacks) {
        if (inputCallbacks != undefined) {
            $.extend(true, this.ajaxCallbacks, { "errorCodeCallbackMap" : inputCallbacks});
        };
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
    };
    var userErrorCodeInfo = {
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
    };
    var userModel = new $.ipc.Model();
    userModel.extendAjaxCallback(userErrorCodeInfo);

    User.prototype = userModel;


    User.prototype.register = function(inputCallbacks) {
        if (undefined == this.email || undefined == this.username || undefined == this.password) {
            throw "args error in register";
            return;
        };
        
        var currentUser = this;
        currentUser.extendAjaxCallback(inputCallbacks);
        var data = JSON.stringify({
            "email": currentUser.email,
            "username": currentUser.username,
            "password": currentUser.password
        });
        $.xAjax({
            url : "/register",
            data : data,
            success : function(response){
                /* change currentUser state*/
                // none
                
                var callbackFunc = currentUser.ajaxCallbacks.errorCodeCallBackMap[response.errorCode] || currentUser.ajaxCallbacks.errorCodeCallBackMap[-1];
                callbackFunc(response);
            },
            error : function(xhr){currentUser.ajaxCallbacks.errorCallback(xhr)}
        });
    };

    User.prototype.login = function(inputCallbacks){
        /* validate needed args*/
        if (undefined == this.account || undefined == this.password) {
            throw "args error in login";
            return;
        };
        /* preserve context obj */
        var currentUser = this;
        /* ajax callbacks extend */
        currentUser.extendAjaxCallback(inputCallbacks);
        /* build ajax data*/
        var data = JSON.stringify({
            "account" : currentUser.account,
            "password" : currentUser.password
        });
        /* make ajax request*/
        $.xAjax({
            url : "/login",
            data : data,
            success : function(response){
                /* change currentUser state*/
                if (response.errorCode == User.errorCodeInfo.NO_ERROR.code) {
                    currentUser.token = response.msg.token;
                    currentUser.email = response.msg.email;
                };
                
                var callbackFunc = currentUser.ajaxCallbacks.errorCodeCallBackMap[response.errorCode] || currentUser.ajaxCallbacks.errorCodeCallBackMap[-1];
                callbackFunc(response);
            },
            error : function(xhr){currentUser.ajaxCallbacks.errorCallback(xhr)}
        });
    };

    User.prototype.getUsername = function(inputCallbacks){
        /* validate needed args*/
        if (undefined == this.email) {
            throw "error when get username due to args error";
            return;
        };
        /* preserve context obj */
        var currentUser = this;
        /* ajax callbacks extend */
        currentUser.extendAjaxCallback(inputCallbacks);
        /* build ajax data*/
        var data = {
            "REQUEST": "GETUSER",
            "DATA": {
                "account": currentUser.email
            }
        };
        /* make ajax request*/
        $.xAjax({
            url : "init3.php",
            data : data,
            contentType: "application/x-www-form-urlencoded;charset=UTF-8",
            success : function(response){
                /* change currentUser state*/
                if (response.errorCode == User.errorCodeInfo.NO_ERROR.code) {
                    currentUser.username = response.msg.username;
                };
                
                var callbackFunc = currentUser.ajaxCallbacks.errorCodeCallBackMap[response.errorCode] || currentUser.ajaxCallbacks.errorCodeCallBackMap[-1];
                callbackFunc(response);
            },
            error : function(xhr){currentUser.ajaxCallbacks.errorCallback(xhr)}
        });
    };

    User.prototype.logout = function(inputCallbacks) {
        /* validate needed args*/
        if (undefined == this.email) {
            throw "args error in logout";
            return;
        };
        /* preserve context obj */
        var currentUser = this;
        /* ajax callbacks extend */
        currentUser.extendAjaxCallback(inputCallbacks);
        /* build ajax data*/
        var data = JSON.stringify({
            "email": currentUser.email
        });
        /* make ajax request*/
        $.xAjax({
            url : "/logout",
            data : data,
            success : function(response){
                /* change currentUser state*/
                if (response.errorCode == User.errorCodeInfo.NO_ERROR.code) {
                    currentUser.token = null;
                };
                
                var callbackFunc = currentUser.ajaxCallbacks.errorCodeCallBackMap[response.errorCode] || currentUser.ajaxCallbacks.errorCodeCallBackMap[-1];
                callbackFunc(response);
            },
            error : function(xhr){currentUser.ajaxCallbacks.errorCallback(xhr)}
        });
    };

    User.prototype.sendActiveEmail = function(inputCallbacks) {
        if (undefined == this.email) {
            throw "args error in sendActiveEmail";
            return;
        };

        var currentUser = this;
        currentUser.extendAjaxCallback(inputCallbacks);
        var data = JSON.stringify({
            "email": currentUser.email
        });

        $.xAjax({
            url : "/sentactiveemail",
            data : data,
            success : function(response){
                /* change currentUser state*/
                var callbackFunc = currentUser.ajaxCallbacks.errorCodeCallBackMap[response.errorCode] || currentUser.ajaxCallbacks.errorCodeCallBackMap[-1];
                callbackFunc(response);
            },
            error : function(xhr){currentUser.ajaxCallbacks.errorCallback(xhr)}
        });
    };

    User.prototype.resetPassword = function(inputCallbacks) {
        if (undefined == this.email) {
            throw "args error in resetPassword";
            return;
        };

        
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
    deviceModel.extendAjaxCallback(deviceErrorCodeInfo);

    Device.prototype = deviceModel;

    var defaultCallbacks = $.ipc.PublicMethod.buildDefaultCallbacks(Device);

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