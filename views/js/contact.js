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

});