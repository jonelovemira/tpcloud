define(['UserModel', 'UserController', 'UserView', 'DeviceListModel', 'DeviceListView', 'DeviceListController'], 
    function (UserModel, UserController, UserView, DeviceListModel, DeviceListView, DeviceListController) {
    var u = new UserModel();
    var uc = new UserController();
    var uv = new UserView();
    uc.model = u;
    uc.view = uv;
    uv.model = u;
    uv.init();
    uc.initHandler();

    var dl = new DeviceListModel();
    var dlc = new DeviceListController();
    var dlv = new DeviceListView();
    dl.owner = u;
    dlc.model = dl;
    dlc.view = dlv;
    dlv.model = dl;

    var contextRememberUserFunc = $.proxy(uv.renderInitRememberMe, uv);
    UserModel.prototype.readCookieDataCallbacks.add(contextRememberUserFunc);

    var contextGetUpgradeList = $.proxy(dlc.getUpgradeList, dlc);
    UserModel.prototype.successLoginCallbacks.add(contextGetUpgradeList);

    u.readDataFromCookie();
});