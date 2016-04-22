define(['DeviceList', 'inheritPrototype'], function (DeviceList, inheritPrototype) {
    function DeviceListModel() {
        DeviceList.call(this, arguments);
    };

    inheritPrototype(DeviceListModel, DeviceList);
    return DeviceListModel;
})