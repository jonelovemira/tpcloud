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
                    currentController.view.initProductMenu();
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
            "#ipc-arrow-right": {"click": this.turnMenuRight},
            ".download-menu-cell": {"click": this.gotoFaq}
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

    function SoftwareView () {
        this.model = null;
        this.maxDisplayProductNum = 3;
        this.currentMenuPageIndex = 0;
        this.totalMenuPageCount = 0;
        this.currentDisplayProductArr = [];
        this.indexCellMap = {
            "0": ".cell-left",
            "1": ".cell-mid",
            "2": ".cell-right"
        };
    };

    SoftwareView.prototype.initProductMenu = function() {
        if (this.model.products.length == 0) {
            console.error("there is no products from server");
            return;
        };
        this.totalMenuPageCount = Math.ceil(this.model.products.length / this.maxDisplayProductNum);
        this.currentMenuPageIndex = 0;
        this.updateProductMenu();
    };

    SoftwareView.prototype.clearProductDisplayContainer = function() {
        if (this.currentDisplayProductArr.length == 0) {
            return;
        };

        for (var i = 0; i < this.currentDisplayProductArr.length; i++) {
            var p = this.currentDisplayProductArr[i];
            if (p) {
                $(this.indexCellMap[i] + " > " + ".downloadshow-img").removeClass(p.middleImgCssClass);
                $(this.indexCellMap[i] + " > " + ".downloadshow-font").text("");
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
                $(this.indexCellMap[i]).show();
                $(this.indexCellMap[i]).attr("faq-path", p.faqPath);
                $(this.indexCellMap[i] + " > " + ".downloadshow-img").addClass(p.middleImgCssClass);
                $(this.indexCellMap[i] + " > " + ".downloadshow-font").text(p.name);
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
        $("#ipc-arrow-left").toggle(currentView.currentMenuPageIndex > 0);
        $("#ipc-arrow-right").toggle(currentView.currentMenuPageIndex < currentView.totalMenuPageCount - 1);
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
    };

    var sc = new SoftwareController();
    var sv = new SoftwareView();
    var s = new $.ipc.Software();
    sc.view = sv;
    sc.model = s;
    sv.model = s;

    sc.getUpdateInfos();
    sc.initHandler();
});