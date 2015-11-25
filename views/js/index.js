$(function (){
    function User() {
        $.ipc.User.call(this, arguments);
    };
    
    $.ipc.inheritPrototype(User, $.ipc.User);
    User.prototype.successLoginCallbacks = $.Callbacks("unique stopOnFalse");

    function UserController() {
        $.ipc.BaseController.call(this, arguments);
    };

    $.ipc.inheritPrototype(UserController, $.ipc.BaseController);


    UserController.prototype.initHandler = function(){
        var appendedSelectorHandlerMap = {
            "#submit_btn": {"click": this.loginUser},
            "#Password": {"keydown": this.passwordInputKeyDown},
            ".product_information_btn_download": {"click": this.locationToDownload},
            ".product_information_btn_learnmore": {"click": this.locationToLearnMore},
            "input.checkbox[name=remember]": {"keydown": this.rememberCheckboxKeyDown},
            ".closetips": {"click": this.hideErrorTips}
        };

        var selectorMsgProduceFuncMap = {};

        this.batchInitHandler(appendedSelectorHandlerMap, selectorMsgProduceFuncMap);
    };

    UserController.prototype.loginUser = function() {
        
        this.rememberUserLogic();
        
        var args = {account: $("#Account").val(), password: $("#Password").val()};

        var currentController = this;

        var errCodeTipsMap = {
            1006: tips.types.account.notExist,
            1009: tips.types.account.notActivated,
            1023: tips.types.account.invalidShort,
            1024: tips.types.password.notMatch,
            1029: tips.types.account.wasLocked,
            "-1": tips.actions.login.failed
        }

        var inputCallbacks = {
            "errorCodeCallbackMap": {
                0: function(response) {
                    var result = response.msg;
                    document.cookie = "email=" + result.email + "; domain=.tplinkcloud.com";
                    document.cookie = "token=" + result.token + "; domain=.tplinkcloud.com";
                    document.cookie = "account=" + account + "; domain=.tplinkcloud.com";
                    
                    currentController.model.successLoginCallbacks.fire();
                },
                1006: function() {
                    currentController.view.renderLoginError(errCodeTipsMap[1006]);
                },
                1009: function() {
                    currentController.view.renderLoginError(errCodeTipsMap[1009]);
                },
                1023: function() {
                    currentController.view.renderLoginError(errCodeTipsMap[1023]);
                },
                1024: function() {
                    currentController.view.renderLoginError(errCodeTipsMap[1024]);
                },
                1029: function() {
                    currentController.view.renderLoginError(errCodeTipsMap[1029]);
                },
                "-1" : function() {
                    currentController.view.renderLoginError(errCodeTipsMap["-1"]);
                }
            },
            "errorCallback" : function() {
                currentController.view.renderLoginError(errCodeTipsMap["-1"]);
            }
        };

        var validateResult = currentController.model.login(args, inputCallbacks);
        if (validateResult != undefined && !validateResult.code) {
            this.view.showTips(validateResult.msg);
        };

    };

    UserController.prototype.passwordInputKeyDown = function(data, event) {
        if (event.keyCode == "13") {
            this.loginUser();
        } else if (event.keyCode == "27") {
            this.loginUser();
        };
    };

    UserController.prototype.rememberUserLogic = function() {
        this.model.setRememberMe($("input.checkbox[name=remember]").is(":checked"));
        if (this.model.rememberMe) {
            var userName = $("#Account").val();
            userName && $.cookie("rmbUser", "true", {expires: 7}) && $.cookie("userName", userName, {expires: 7});
        } else {
            $.cookie("rmbUser", "", {expires: -1}) && $.cookie("userName", '', {expires: -1});
        };
    };

    UserController.prototype.rememberCheckboxKeyDown = function(data, event) {
        if (event.keyCode == "32") {
            $("input.checkbox[name=remember]").click();
        } else if (event.keyCode == "27") {
            this.loginUser();
        };
    };

    UserController.prototype.hideErrorTips = function() {
        this.view.hideTips();
    };

    UserController.prototype.locateTo = function(dst) {
        if (undefined == dst) {
            console.error("args error in locateTo");
            return;
        };

        window.location.href = dst;
    };

    UserController.prototype.locationToDownload = function() {
        var dst = __uri("../pages/download.html");
        this.locateTo(dst);
    };

    UserController.prototype.locationToLearnMore = function() {
        window.open("http://www.tp-link.com/en/products/details/?categoryid=&model=NC200","_blank");
    };

    function UserView() {
        this.model = null;
    };

    UserView.prototype.tipsTimeoutObj = null;

    UserView.prototype.renderLoginError = function(errorTips) {
        if (undefined == errorTips) {
            console.error("args error in showLoginError");
        };

        this.clearPasswordInput();
        this.showTips(errorTips);
    };

    UserView.prototype.showTips = function(displayTips) {
        if (undefined == displayTips) {
            console.error("args error in showTips");
            return;
        };

        this.hideTips();

        var handel = "#Account";
        var top = -39;
        var left = 0;
        var text = displayTips;
        text = text || "Please chech up your enter without illegal";
        var a = "";
        a += "<div id='warningtips'>";
        a += "<span class='declare'>" + text + "</span>"
        a += "<span class='closetips'></span>"
        a += "</div>";
        $(handel).parent().append(a);
        $("#warningtips").css({
            top: top,
            left: left
        });

        this.tipsTimeoutObj = setTimeout("$('#warningtips').fadeOut('slow')", 5000);
    };

    UserView.prototype.hideTips = function() {
        $("#warningtips").remove();
        clearTimeout(this.tipsTimeoutObj);
    };

    UserView.prototype.clearPasswordInput = function() {
        $("#Password").val("");
    };

    UserView.prototype.renderInitRememberMe = function() {
        if(this.model.rememberMe && this.model.account) {
            var rememberMe = this.model.rememberMe == true ? true : false;
            rememberMe && !$("input.checkbox[name=remember]").is(":checked") && $("#remember").click();
            $("#Account").val(this.model.account);
            $("#Password").focus().select();
            $("#account-cover").hide();
            $("#password-cover").hide();
        }
    };


    function DeviceList() {
        $.ipc.DeviceList.call(this, arguments);
    };

    $.ipc.inheritPrototype(DeviceList, $.ipc.DeviceList);

    function DeviceListController () {
        $.ipc.BaseController.call(this, arguments);
    };

    $.ipc.inheritPrototype(DeviceListController, $.ipc.BaseController);

    DeviceListController.prototype.getUpgradeList = function() {
        
        var currentController = this;

        var inputCallbacks = {
            "errorCodeCallbackMap": {
                0: function(response) {
                    if (currentController.model.upgradeList &&
                        currentController.model.upgradeList.length > 0) {
                        var contextUpgradeAll = $.proxy(currentController.upgradeSomeDevice, currentController);
                        var options = {
                            "confirm" : contextUpgradeAll,
                            "cancel": currentController.gotoAdmin
                        };
                        currentController.view.showUpgradeOptions(options);
                    } else {
                        currentController.gotoAdmin();
                    }
                }
            }
        };

        currentController.model.getUpgradeList(inputCallbacks);
    };

    DeviceListController.prototype.gotoAdmin = function() {
        var adminPage = __uri("../pages/admin.html");
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

    function DeviceListView () {
        this.model = null;
    };

    DeviceListView.prototype.showUpgradeOptions = function(options) {
        
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
            $.Msg(options);
        } else {
            console.error("args error in showUpgradeOptions");
        };
    };
    
    
    var u = new User();
    var uc = new UserController();
    var uv = new UserView();
    uc.model = u;
    uc.view = uv;
    uv.model = u;


    var dl = new DeviceList();
    var dlc = new DeviceListController();
    var dlv = new DeviceListView();
    dl.owner = u;
    dlc.model = dl;
    dlc.view = dlv;
    dlv.model = dl;
    
    
    uc.initHandler();

    var contextRememberUserFunc = $.proxy(uv.renderInitRememberMe, uv);
    User.prototype.readCookieDataCallbacks.add(contextRememberUserFunc);

    var contextGetUpgradeList = $.proxy(dlc.getUpgradeList, dlc);
    User.prototype.successLoginCallbacks.add(contextGetUpgradeList);

    u.readDataFromCookie();

});