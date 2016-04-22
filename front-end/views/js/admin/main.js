define(['UserModel', 'UserView', 'UserController', 'jquery', 'PlayableDeviceList', 
    'DeviceListController', 'DeviceListView', 'Device', 'Software', 'SoftwareController'], 
    function (UserModel, UserView, UserController, $, PlayableDeviceList, 
        DeviceListController, DeviceListView, Device, Software, SoftwareController) {
    
    var u = new UserModel();
    var uv = new UserView();
    var uc = new UserController();
    uc.view = uv;
    uc.model = u;
    uv.model = u;

    var contextRenderUserFunc = $.proxy(uv.renderUserInfo, uv);
    UserModel.prototype.readCookieDataCallbacks.add(contextRenderUserFunc);

    uc.initHandler();
    u.readDataFromCookie();

    var dl = new PlayableDeviceList();
    var dlc = new DeviceListController();
    var dlv = new DeviceListView();
    dlc.model = dl;
    dlc.view = dlv;
    dlv.model = dl;
    dl.owner = u;

    dlv.init();
    dlc.initHandler();

    var contextRenderDeviceInfo = $.proxy(dlv.updateDeviceInfo, dlv);
    Device.prototype.stateChangeCallbacks.add(contextRenderDeviceInfo);

    dlc.intervalUpdateDeviceListWithInit();

    var contextRenderUserAdmin = $.proxy(uc.accountTabClickCallback, uc);
    dlc.activateUserAdminCallback.add(contextRenderUserAdmin);
    var contextIntervalUpdateDeviceList = $.proxy(dlc.intervalUpdateDeviceListWithInit, dlc);
    u.activateDeviceAdminCallback.add(contextIntervalUpdateDeviceList);

    var s = new Software();
    var sc = new SoftwareController();
    sc.model = s;

    sc.getUpdateInfos(dl, dlv);

    // window.dlc = dlc;
})