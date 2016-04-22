define(['Software', 'BaseController', 'inheritPrototype', 'DeviceList', 'DeviceListView'], 
    function (Software, BaseController, inheritPrototype) {
    function SoftwareController() {
        BaseController.call(this, arguments);
    };
    inheritPrototype(SoftwareController, BaseController);

    SoftwareController.prototype.getUpdateInfos = function(dl, dlv) {
        var inputCallbacks = {
            "errorCodeCallbackMap": {
                0: function() {
                    var device = dl.findActiveDeviceArr()[0];
                    device && dlv.isNeedFeedPluginDownloadLink && dlv.feedPluginDownloadLink(device);
                }
            }
        };
        this.model.getUpdateInfos(inputCallbacks);
    };
    return SoftwareController;
})