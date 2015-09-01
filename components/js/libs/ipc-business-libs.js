(function ($) {
    $.ipc = $.ipc || {};

    var argumentsCheck = function(){
        for (var i = 0; i < arguments.length; i++) {
            if (arguments[i] == undefined) {
                throw "args error in calling function";
                return;
            };
        };
    }

    var login = function(user, inputCallbacks){

        argumentsCheck(user, callbacks);

        var data = JSON.stringify({
            "account" : user.email,
            "password" : user.password
        });

        var tmpErrorCodeCallBackMap = {
            0 : function(){console.log("login success");},
            302 : function(){console.log("user logined cross region");},
            1005 : function(){console.log(lang.valid.login.emailempty);},
            1006 : function(){console.log(lang.valid.login.emailexist);},
            1009 : function(){console.log("account is not activated");},
            1020 : function(){console.log(lang.valid.login.pwdempty);},
            1023 : function(){console.log(lang.valid.login.pwdinvalid);},
            1024 : function(){console.log(lang.valid.login.pwderror);}
        };

        var defaultCallbacks = {
            onSuccessFirst : function(){},
            errorCodeCallBackMap : tmpErrorCodeCallBackMap,
            errorCallback : function(xhr){console.log("xhr error in login: ", xhr)},
        };

        var callbacks = $.extend(true, {}, defaultCallbacks, inputCallbacks);

        var undefinedErrorCodeCallBack = function(){console.log(lang.valid.login.failed);}

        var url = "/login";

        $.xAjax({
            url : url,
            data : data,
            success : function(response, currentAjaxOptions){
                callbacks.onSuccessFirst(response, currentAjaxOptions);
                var failedMsg = lang.valid.login.failed;
                var errorCode = parseInt(response.errorCode);
                var callbackFunc = callbacks.errorCodeCallBackMap[errorCode] || undefinedErrorCodeCallBack;
                callbackFunc();
            },
            error : defaultCallbacks.errorCallback
        });
    };

    $.ipc.User = function(user){}
    $.ipc.User.login = login;

})(jQuery)