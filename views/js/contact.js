$(function(){
    
    function SoftwareController () {
        $.ipc.BaseController.call(this, arguments);
    }

    $.ipc.inheritPrototype(SoftwareController, $.ipc.BaseController);

    SoftwareController.prototype.getUpdateInfos = function() {
        var currentController = this;
        var inputCallbacks = {
            0: function() {
                this.view.feedModelSelect();
            }
        };

        this.model.getUpdateInfos(inputCallbacks);
    };

    SoftwareController.prototype.initHandler = function() {
        var appendedSelectorHandlerMap = {
            "#submit": {"click": this.sendFeedBack},
        };

        var selectorMsgProduceFuncMap = {};

        this.batchInitHandler(appendedSelectorHandlerMap, selectorMsgProduceFuncMap);
    };

    SoftwareController.prototype.sendFeedBack = function() {
        
    };

    function SoftwareView () {
        this.model = null;
    };

    SoftwareView.prototype.feedModelSelect = function () {
        var addedOptions = {};
        for (var i = 0; i < this.model.products.length; i++) {
            addedOptions[this.model.products[i].name] = {};
        };
        $("#model_select").Select({addedOptions: addedOptions});
    };

    var sc = new SoftwareController();
    var s = new $.ipc.Software();
    var sv = new SoftwareView();
    sc.model = s;
    sc.view = sv;
    sv.model = s;

    sc.getUpdateInfos();
});