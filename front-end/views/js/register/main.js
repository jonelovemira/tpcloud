define(['User', 'UserController', 'UserView'], 
    function (User, UserController, UserView) {
    var u = new User();
    var uc = new UserController();
    var uv = new UserView();
    uc.model = u;
    uc.view = uv;
    uv.model = u;

    uc.initHandler();
})