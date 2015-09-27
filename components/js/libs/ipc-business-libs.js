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

    $.ipc.PublicMethod = function(){};
    $.ipc.PublicMethod.extendDefaultCallbacksForModel = function(model, inputCallbacks){
        if (undefined == model) {
            throw "error in extendDefaultCallbacksForModel";
            return;
        };
        var callbacks = model.defaultCallbacks;
        if (inputCallbacks != undefined) {
            callbacks = $.extend(true, {}, model.defaultCallbacks, { "errorCodeCallBackMap" : inputCallbacks});
        };
        return callbacks;
    }
    $.ipc.PublicMethod.buildDefaultCallbacks = function(model){
        if (undefined == model || undefined == model.errorCodeInfo) {
            throw "error in buildDefaultCallbacks";
            return;
        };
        var tmpErrorCodeCallBackMap = {}
        for (var eci in model.errorCodeInfo) {
            var e = model.errorCodeInfo[eci];
            tmpErrorCodeCallBackMap[e.code] = $.proxy(e.printMsg, e);
        };

        var defaultCallbacks = {
            errorCodeCallBackMap : tmpErrorCodeCallBackMap,
            errorCallback : function(xhr){console.log("xhr error: ", xhr)},
        };

        return defaultCallbacks;
    }    
})(jQuery)
(function ($) {
    "use strict";

    $.ipc = $.ipc || {};

    function User(){
        this.username = null;
        this.token = null;
        this.email = null;
        this.account = null;
    };

    User.errorCodeInfo = {
        NO_ERROR: new $.ipc.Error({code: 0, msg: "OK"}),
        SESSION_TIMEOUT: new $.ipc.Error({code: 100, msg: "session is timeout"}),
        CROSS_REGION: new $.ipc.Error({code: 302, msg: "user logined cross region"}),
        ACCOUNT_IS_EMPTY: new $.ipc.Error({code: 1005, msg: "input an empty account"}),
        ACCOUNT_ALREADY_EXIST: new $.ipc.Error({code: 1006, msg: "input account already exist"}),
        ACCOUNT_NOT_ACTIVATED: new $.ipc.Error({code: 1009, msg: "account is not activated"}),
        PASSWORD_EMPTY: new $.ipc.Error({code: 1020, msg: "input password is empty"}),
        PASSWORD_FORMAT_INVALID: new $.ipc.Error({code: 1023, msg: "input password has an invalid format"}),
        ACCOUNT_PASSWORD_NOT_MATCH: new $.ipc.Error({code: 1024, msg: "input account doesn't match the password"}),
        DEFAULT: new$.ipc.Error({code: -1, msg: "unknow error"}),
    };

    var defaultCallbacks = $.ipc.PublicMethod.buildDefaultCallbacks(User);

    User.prototype.defaultCallbacks = defaultCallbacks;

    User.prototype.login = function(inputCallbacks){
        /* validate needed args*/
        if (undefined == this.email || undefined == this.password) {
            throw "error when login due to args error";
            return;
        };
        /* preserve context obj */
        var currentUser = this;
        /* ajax callbacks extend */
        var callbacks = $.ipc.PublicMethod.extendDefaultCallbacksForModel(currentUser, inputCallbacks);
        /* build ajax data*/
        var data = JSON.stringify({
            "account" : currentUser.email,
            "password" : currentUser.password
        });
        /* make ajax request*/
        $.xAjax({
            url : "/login",
            data : data,
            success : function(response){
                /* change currentUser state*/
                // none
                
                var callbackFunc = callbacks.errorCodeCallBackMap[response.errorCode] || callbacks.errorCodeCallBackMap[-1];
                callbackFunc(response);
            },
            error : function(xhr){callbacks.errorCallback(xhr)}
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
        var callbacks = $.ipc.PublicMethod.extendDefaultCallbacksForModel(currentUser, inputCallbacks);
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
                
                var callbackFunc = callbacks.errorCodeCallBackMap[response.errorCode] || callbacks.errorCodeCallBackMap[-1];
                callbackFunc(response);
            },
            error : function(xhr){callbacks.errorCallback(xhr)}
        });
    };

    User.prototype.logout = function(inputCallbacks) {
        /* validate needed args*/
        if (undefined == this.email) {
            throw "error when logout due to args error";
            return;
        };
        /* preserve context obj */
        var currentUser = this;
        /* ajax callbacks extend */
        var callbacks = $.ipc.PublicMethod.extendDefaultCallbacksForModel(currentUser, inputCallbacks);
        /* build ajax data*/
        var data = {
            "REQUEST": "LOGOUT",
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
                    currentUser.token = null;
                };
                
                var callbackFunc = callbacks.errorCodeCallBackMap[response.errorCode] || callbacks.errorCodeCallBackMap[-1];
                callbackFunc(response);
            },
            error : function(xhr){callbacks.errorCallback(xhr)}
        });
    };

    $.ipc.User = User;

})(jQuery);

(function ($){
    "use strict";

    $.ipc = $.ipc || {};

    function Device(){}
    Device.errorCodeInfo = {
        NO_ERROR: new $.ipc.Error({code: 0, msg: "OK"}),
        OWNER_NOT_LOGIN : new $.ipc.Error({code:-20651, msg: "owner doesn't logged in"}),
        BELONG_TO_ANOTHER_USER: new $.ipc.Error({code: -20506, msg: "this device belong to another user"}),
        NO_OWNER: new Error({code: -20507, msg: "this device is not binded to any user"}),
        DEVICE_OFFLINE: new Error({code: -20571, msg: "this device is offline"}),
        ALIAS_FORMAT_ERROR: new Error({code: -20572, msg: "device alias format error"}),
        DEFAULT: new$.ipc.Error({code: -1, msg: "unknow error"}),
    };

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