(function($) {
    "use strict";

    $.ipc = $.ipc || {};

    function BaseController() {
        this.model = null;
        this.view = null;
        this.selectorHandlerMap = {};
        this.domClickCallbacks = $.Callbacks("unique stopOnFalse");
        var currentController = this;
        this.domClickCallbacks.add(function(selector, eventName, data, argumentsArr) {
            var func = function(data) {
                console.log("this element did not bind any handler: ", selector);
            };
            if (currentController.selectorHandlerMap &&
                currentController.selectorHandlerMap[selector] &&
                currentController.selectorHandlerMap[selector][eventName]) {
                func = currentController.selectorHandlerMap[selector][eventName];
            };

            var contextFunc = $.proxy(func, currentController);
            contextFunc(data, argumentsArr);
        });
    };

    BaseController.prototype.addHandler = function(inputArgs) {
        var currentController = this;
        var getMsgInformed = inputArgs["getMsgInformed"];
        var selector = inputArgs["selector"];
        var eventName = inputArgs["eventName"];

        $(document).on(eventName, selector, function() {
            var data = null;
            if (getMsgInformed) {
                data = $.proxy(getMsgInformed, this)();
            };
            var argumentsArr = arguments;
            currentController.domClickCallbacks.fire(selector, eventName, data, argumentsArr);
        });
    };

    BaseController.prototype.batchInitHandler = function(appendedSelectorHandlerMap, selectorMsgProduceFuncMap) {
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