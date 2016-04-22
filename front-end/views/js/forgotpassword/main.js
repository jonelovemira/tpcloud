define(['UserController', 'User', 'UserView'], function (UserController, User, UserView) {
    var uc = new UserController();
    var u = new User();
    var uv = new UserView();

    uc.model = u;
    uv.model = u;
    uc.view = uv;

    uc.initHandler();
});