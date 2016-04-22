define(['Software', 'SoftwareView', 'BaseController', 'inheritPrototype', 'jquery'], 
    function (Software, SoftwareView, BaseController, inheritPrototype, $) {
    function SoftwareController() {
        BaseController.call(this, arguments);
    }

    inheritPrototype(SoftwareController, BaseController);

    SoftwareController.prototype.getUpdateInfos = function() {
        var currentController = this;
        var inputCallbacks = {
            "errorCodeCallbackMap": {
                0: function() {
                    currentController.view.initProductMenu();
                }
            },
            "errorCallback": function() {}
        };

        this.model.getUpdateInfos(inputCallbacks);
    };

    SoftwareController.prototype.initHandler = function() {
        var appendedSelectorHandlerMap = {
            "#ipc-arrow-left": {
                "click": this.turnMenuLeft
            },
            "#ipc-arrow-right": {
                "click": this.turnMenuRight
            },
            ".download-menu-cell": {
                "click": this.gotoFaq
            }
        };

        var selectorMsgProduceFuncMap = {
            ".download-menu-cell": function() {
                return $(this).attr("faq-path");
            }
        };
        this.batchInitHandler(appendedSelectorHandlerMap, selectorMsgProduceFuncMap);
    };

    SoftwareController.prototype.gotoFaq = function(faqPath) {
        if (undefined == faqPath) {
            console.error("faqPath is empty");
            return;
        };
        window.open(faqPath, "_blank");
    };

    SoftwareController.prototype.turnMenuLeft = function() {
        this.view.turnMenuLeft();
    };

    SoftwareController.prototype.turnMenuRight = function() {
        this.view.turnMenuRight();
    };

    return SoftwareController;
})