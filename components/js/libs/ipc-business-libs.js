(function ($) {
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
        DEFAULT: new$.ipc.Error({code: -1, msg: "unknow error"})
    };

    var tmpErrorCodeCallBackMap = {}
    for (var eci in User.errorCodeInfo) {
        var e = User.errorCodeInfo[eci];
        tmpErrorCodeCallBackMap[e.code] = $.proxy(e.printMsg, e);
    };

    var defaultCallbacks = {
        errorCodeCallBackMap : tmpErrorCodeCallBackMap,
        errorCallback : function(xhr){console.log("xhr error: ", xhr)},
    };

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
        var callbacks = $.ipc.PublicMethod.buildDefaultCallbacksForModel(currentUser, inputCallbacks);
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
                callbackFunc();
            },
            error : callbacks.errorCallback
        });
    };

    User.prototype.getUsername = function(inputCallbacks){
        /* validate needed args*/
        if (undefined == this.email) {
            throw "error when login due to args error";
            return;
        };
        /* preserve context obj */
        var currentUser = this;
        /* ajax callbacks extend */
        var callbacks = $.ipc.PublicMethod.buildDefaultCallbacksForModel(currentUser, inputCallbacks);
        /* build ajax data*/
        var data = {
            "REQUEST": "GETUSER",
            "DATA": {
                "account": currentUser.email
            }
        };
        /* make ajax request*/
        $.xAjax({
            url : "/login",
            data : data,
            contentType: "application/x-www-form-urlencoded;charset=UTF-8",
            success : function(response){
                /* change currentUser state*/
                // none
                
                var callbackFunc = callbacks.errorCodeCallBackMap[response.errorCode] || callbacks.errorCodeCallBackMap[-1];
                callbackFunc();
            },
            error : callbacks.errorCallback
        });
    }





    // User.prototype.getUsername = function(inputCallbacks) {

    //     var currentUser = this;
        
    //     if (undefined == currentUser.email) {
    //         throw "email is empty when getUsername";
    //         return;
    //     };


        
    //     var args = {
    //         url: "init3.php",
    //         type: 'post',
    //         dataType: 'json',
    //         data: {
    //             "REQUEST": "GETUSER",
    //             "DATA": {
    //                 "account": currentUser.email
    //             }
    //         },
    //         contentType: "application/x-www-form-urlencoded;charset=UTF-8",
    //         success: function( response) {

    //             var defaultFunc = function(){console.log("unkown error in get username");};
    //             var noError = function () {
    //                 currentUser.username = response.msg.username;
    //                 currentUser.getUsernameCallback.fire();
    //             };
    //             var sessionTimeout = function(){console.log("session is out of date");};
    //             var accountEmpty = function(){console.log("account can not be empty");};
    //             var accountNotExist = function(){console.log("account does not exist");};

    //             var errorCodeFuncMap = {
    //                 0: noError,
    //                 100: sessionTimeout,
    //                 1005: accountEmpty,
    //                 1006: accountNotExist
    //             };

    //             var func = errorCodeFuncMap[response.errorCode] || defaultFunc;
    //             func();
    //         },
    //         error: function(xhr) {
    //         }
    //     }
    //     $.xAjax(args);
    // };

    // User.prototype.logout = function() {
    //     var currentUser = this;
    //     var args = {
    //         url: "init3.php",
    //         type: 'post',
    //         dataType: 'json',
    //         data: {
    //             "REQUEST": "LOGOUT",
    //             "DATA": {
    //                 "email": currentUser.email
    //             }
    //         },
    //         contentType: "application/x-www-form-urlencoded;charset=UTF-8",
    //         success: function(response) {
    //             var defaultFunc = function(){
    //                 plug.windowEx.alert({
    //                     "info": lang.logout.failed
    //                 });
    //             };
    //             var noError = function () {
    //                 currentUser.logoutCallback.fire();
    //             };
    //             var sessionTimeout = function(){console.log("session is out of date");};
    //             var accountEmpty = function(){console.log("account can not be empty");};

    //             var errorCodeFuncMap = {
    //                 0: noError,
    //                 100: sessionTimeout,
    //                 1000: accountEmpty
    //             };

    //             var func = errorCodeFuncMap[response.errorCode] || defaultFunc;
    //             func();
    //         },
    //         error: function(xhr) {
    //             alert(xhr.responseText);
    //         }
    //     }
    //     $.xAjax(args);
    // };

    

    // $.ipc.User = function(user){}
    // $.ipc.User.prototype.login = login;

})(jQuery)