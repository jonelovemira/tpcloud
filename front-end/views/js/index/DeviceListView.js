define(['DeviceListModel', 'jquery', 'msg'], function (DeviceListModel, $, msg) {
    function DeviceListView() {
        this.model = null;
    };

    DeviceListView.prototype = {
        constructor: DeviceListView,
        showUpgradeOptions: function(options) {
            if (options && options["confirm"] && options["cancel"]) {
                var tipInfo = tips.types.firmware.needUpgrade;
                var displayOptions = {
                    "type": "confirm",
                    "info": tipInfo,
                    "width": 408,
                    "btnConfirm": "Update",
                    "btnCancel": "Later"
                };
                $.extend(true, options, displayOptions);
                msg(options);
            } else {
                console.error("args error in showUpgradeOptions");
            };
        }
    };

    return DeviceListView;
})