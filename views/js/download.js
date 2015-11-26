$(function (){
    function SoftwareController () {
        $.ipc.BaseController.call(this, arguments);
    }

    $.ipc.inheritPrototype(SoftwareController, $.ipc.BaseController);

    SoftwareController.prototype.getUpdateInfos = function() {
        var currentController = this;
        var inputCallbacks = {
            "errorCodeCallbackMap": {
                0: function() {
                    this.view.initProductMenu();
                }
            },
            "errorCallback": function() {
            }
        };

        this.model.getUpdateInfos(inputCallbacks);
    };

    SoftwareController.prototype.initHandler = function() {
        var appendedSelectorHandlerMap = {
            "#ipc-arrow-left": {"click": this.turnMenuLeft},
            "#ipc-arrow-right": {"click": this.turnMenuRight}
        };

        var selectorMsgProduceFuncMap = {};
        this.batchInitHandler(appendedSelectorHandlerMap, selectorMsgProduceFuncMap);
    };

    SoftwareController.prototype.turnMenuLeft = function() {
        this.view.turnMenuLeft();
    };

    SoftwareController.prototype.turnMenuRight = function() {
        this.view.turnMenuRight();
    };

    function SoftwareView () {
        this.model = null;
        this.maxDisplayProductNum = 3;
        this.currentMenuPageIndex = 0;
        this.totalMenuPageCount = 0;
        this.currentDisplayProductArr = [];
        this.indexImgContainerMap = {
            "0": "#nc-img-left",
            "1": "#nc-img-mid",
            "2": "#nc-img-right"
        };
    };

    SoftwareView.prototype.initProductMenu = function() {
        if (this.model.products.length == 0) {
            console.error("there is no products from server");
            return;
        };
        this.totalMenuPageCount = Math.ceil(this.model.products / this.maxDisplayProductNum);
        this.currentMenuPageIndex = 0;
        this.updateProductMenu();
    };

    SoftwareView.prototype.productToCssClass = function(product) {
        if (undefined == product) {
            console.error("args error in productToCssClass");
            return;
        };
        return "img-" + product.name;
    };

    SoftwareView.prototype.clearProductDisplayContainer = function() {
        if (this.currentDisplayProductArr.length == 0) {
            return;
        };

        for (var i = 0; i < this.currentDisplayProductArr.length; i++) {
            var p = this.currentDisplayProductArr[i];
            if (p) {
                $(this.indexImgContainerMap[i]).removeClass(this.productToCssClass(p));
            };
        };
    };

    SoftwareView.prototype.feedProductDisplayContainer = function() {
        if (this.currentDisplayProductArr.length <= 0) {
            console.error("no products to be displayed");
            return;
        };

        for (var i = 0; i < this.currentDisplayProductArr.length; i++) {
            var p = this.currentDisplayProductArr[i];
            if (p) {
                $(this.indexImgContainerMap[i]).addClass(this.productToCssClass(p));
            };
        };
    };

    SoftwareView.prototype.updateProductMenu = function() {
        if (this.model.products.length == 0) {
            console.error("there is no products from server");
            return;
        };
        this.clearProductDisplayContainer();
        var firstDisplayProductIndex = this.currentMenuPageIndex*this.maxDisplayProductNum;
        this.currentDisplayProductArr = this.model.products.slice(firstDisplayProductIndex, 
                    firstDisplayProductIndex + this.maxDisplayProductNum);
        this.feedProductDisplayContainer();
        this.udpateArrow(); 
    };

    SoftwareView.prototype.udpateArrow = function() {
        if (this.currentMenuPageIndex < 0 || this.totalMenuPageCount < 1) {
            console.error("args error in udpateArrow");
            return;
        };
        var currentView = this;
        $("#img-arrow-left").toggle(currentView.currentMenuPageIndex > 0);
        $("#img-arrow-right").toggle(currentView.currentMenuPageIndex < currentView.totalMenuPageCount - 1);
    };

    SoftwareView.prototype.turnMenuLeft = function() {
        if (this.currentMenuPageIndex <= 0) {
            console.error(" no left menu");
            return;
        };
        this.currentMenuPageIndex -= 1;
        this.updateProductMenu();
    };

    SoftwareView.prototype.turnMenuRight = function() {
        if (this.currentMenuPageIndex >= this.totalMenuPageCount-1) {
            console.error("no right menu");
            return;
        };
        this.currentMenuPageIndex += 1;
        this.updateProductMenu();
    }
});