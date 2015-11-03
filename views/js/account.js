$(function () {
    function User () {
        $.ipc.User.call(this, arguments);
    };

    $.ipc.inheritPrototype(User, $.ipc.User);

    function UserController () {
        $.ipc.BaseController.call(this, arguments);
    }

    $.ipc.inheritPrototype(UserController, $.ipc.BaseController);

    UserController.prototype.initHandler = function() {
        var appendedSelectorHandlerMap = {
            "#logout": {"click": this.logoutUser},
            "#userinfo-title-changepwd": {"click": this.gotoChangePassword},
            "#backaccount": {"click": this.gotoAdminInfo},
            "#changepwd": {"click": this.changePassword}
        };
        var selectorMsgProduceFuncMap = {};
        this.batchInitHandler(appendedSelectorHandlerMap, selectorMsgProduceFuncMap);
    };

    UserController.prototype.logoutUser = function() {
        var currentController = this;

        var errCodeTipsMap = {
            "-1": tips.actions.logout.failed
        };

        var inputCallbacks = {
            "errorCodeCallbackMap": {
                0: function() {
                    // var indexPage = __uri("../pages/index.html");
                    var indexPage = "/index.html";
                    currentController.gotoPage(indexPage);
                },
                "-1" : function() {
                    currentController.view.renderLogoutError(errCodeTipsMap["-1"]);
                }
            },
            "errorCallback" : function() {
                currentController.view.renderLoginError(errCodeTipsMap["-1"]);
            }
        };

        currentController.model.login(inputCallbacks);
    };

    UserController.prototype.changePassword = function() {
        this.model.password = $('#newpwd').val();
        this.model.oldPassword = $('#oldpwd').val();
        var confirmPassword = $("#cfpwd").val();

        var passwordValidateResult = this.model.validatePasswordFormat(this.model.password);
        

        if (confirmPassword) {};
    };

    UserController.prototype.gotoChangePassword = function() {
        this.view.renderChangePasswod();
    };

    UserController.prototype.gotoAdminInfo = function() {
        this.view.renderAdminInfo();
    };

    UserController.prototype.gotoPage = function(page) {
        if (undefined == page) {
            throw "error in gotoPage";
        };
        window.location.href = page;
    };


    function UserView () {
        this.model = null;
    }

    UserView.prototype.showWelcomeInfo = function() {
        if(undefined == this.model.email) {
            throw "args error in showWelcomeInfo";
            return;
        };

        var a = "";
        a += "<div id='welcomeinfo'>",
        a += "<span class='logoutcontain welcomeinfo-cell'>",
        a += "<a href='#' id ='logout'title='End tpCamera journey?' class='lang'>",
        a += "Logout",
        a += "</a>",
        a += "</span>",
        a += "<span id='welcome_username' class='welcomeinfo-cell'>",
        a += this.model.email;
        a += "</span>",
        a += "<span id='wn' class='welcomeinfo-cell'>",
        a += "Welcome,&nbsp;",
        a += "</span>",
        a += "</div>";
        $("#toplink").after(a);
    };

    UserView.prototype.renderLogoutError = function(errorMsg) {
        if (undefined == errorMsg) {
            throw "args error in renderLogoutError";
        };

        $.ipc.Msg({
            "type": "alert",
            "info": errorMsg
        });
    };

    UserView.prototype.hideMainBoardSon = function() {
        $("#maincontent").children().hide();
    };

    UserView.prototype.renderAdminInfo = function() {
        this.hideMainBoardSon();
        $("#maincontent > .account-information").show();
    }

    UserView.prototype.renderChangePasswod = function() {
        this.hideMainBoardSon();
        $("#maincontent > .change-password-form").show();
    };

    var u = new User();
    var uv = new UserView();
    var uc = new UserController();
    uc.view = uv;
    uc.model = u;
    uv.model = u;

    var contextRememberUserFunc = $.proxy(uv.showWelcomeInfo, uv);
    User.prototype.readCookieDataCallbacks.add(contextRememberUserFunc);

    uc.initHandler();

});