define(['DeviceListModel', 'BaseController', 'jquery', 'inheritPrototype', 'DeviceListView'], 
    function (DeviceListModel, BaseController, jquery, inheritPrototype, DeviceListView) {
    function DeviceListController() {
        BaseController.call(this, arguments);
    };

    inheritPrototype(DeviceListController, BaseController);

    DeviceListController.prototype.getUpgradeList = function() {

        var currentController = this;

        var inputCallbacks = {
            "errorCodeCallbackMap": {
                0: function(response) {
                    if (currentController.model.upgradeList &&
                        currentController.model.upgradeList.length > 0) {
                        var contextUpgradeAll = $.proxy(currentController.upgradeSomeDevice, currentController);
                        var options = {
                            "confirm": contextUpgradeAll,
                            "cancel": currentController.gotoAdmin
                        };
                        currentController.view.showUpgradeOptions(options);
                    } else {
                        currentController.gotoAdmin();
                    }
                }
            },
            "errorCallback": function() {
                currentController.gotoAdmin();
            }
        };

        currentController.model.getUpgradeList(inputCallbacks);
    };

    DeviceListController.prototype.gotoAdmin = function() {
        var adminPage = __uri("../../pages/admin.html");
        window.location.href = adminPage;
    };

    DeviceListController.prototype.upgradeSomeDevice = function() {
        var currentController = this;

        var inputCallbacks = {
            "errorCodeCallbackMap": {
                0: function(response) {
                    currentController.gotoAdmin();
                }
            }
        };

        currentController.model.upgradeAll(inputCallbacks);
    };

    return DeviceListController;
})