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
                console.log("default msg for success processed response");
            },
            "-1": function() {
                console.log("uncatched response code from backend server");
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