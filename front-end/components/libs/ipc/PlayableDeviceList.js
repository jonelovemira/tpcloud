define(['DeviceList', 'inheritPrototype', 'PlayableDevice'], 
    function (DeviceList, inheritPrototype, PlayableDevice) {
    function PlayableDeviceList() {
        DeviceList.call(this, arguments);
        this.deviceCreator = PlayableDevice;
    };
    inheritPrototype(PlayableDeviceList, DeviceList);
    return PlayableDeviceList;
})