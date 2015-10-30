(function ($){
    function User() {
        $.ipc.User.call(this, arguments);
        this.rememberMe = null;
    };

    User.prototype = $.ipc.create($.ipc.User.prototype);
    User.prototype.constructor = User;

    function UserController() {
        this.user = null;
        this.view = null;
        this.selectorHandlerMap = {};
        this.domClickCallbacks = $.Callbacks("unique stopOnFalse");
        var currentController = this;
        this.domClickCallbacks.add(function(selector, eventName, data, event){
            var func = function(data){console.log("this element did not bind any handler: ", selector);};
            if (currentController.selectorHandlerMap &&  currentController.selectorHandlerMap[selector] && currentController.selectorHandlerMap[selector][eventName]) {
                func = currentController.selectorHandlerMap[selector][eventName];
            };

            var contextFunc = $.proxy(func, currentController);
            contextFunc(data, event);
        });
    };

    UserController.prototype.addHandler = function(inputArgs) {
        var currentController = this;
        var getMsgInformed = inputArgs["getMsgInformed"];
        var selector = inputArgs["selector"];
        var eventName = inputArgs["eventName"];
        $(selector).bind(eventName, function(event) {
            var data = null;
            if (getMsgInformed) {
                data = $.proxy(getMsgInformed, this)();
            };
            currentController.domClickCallbacks.fire(selector, eventName, data, event);
        });
    };

    UserController.prototype.initHandler = function(){
        var appendedSelectorHandlerMap = {
            "#submit_btn": {"click": this.loginUser},
            "#Password": {"keydown": this.passwordInputKeyDown},
            "#forgetpwd": {"keydown": this.forgetPasswordKeyDown},
            ".product_information_btn_download": {"click": this.locationToDownload},
            ".product_information_btn_learnmore": {"click": this.locationToLearnMore},
            ".checkbox[name=remember]" : {"click": this.rememberUser, "keydown": this.rememberCheckboxKeyDown}
        };

        $.extend(this.selectorHandlerMap, appendedSelectorHandlerMap);

        for (var selector in appendedSelectorHandlerMap) {
            var args = {};
            args["selector"] = selector;
            args["getMsgInformed"] = null;
            for (var eventName in appendedSelectorHandlerMap[selector]) {
                args["eventName"] = eventName;
                this.addHandler(args);
            };
        };
    };

    UserController.prototype.loginUser = function() {
        var account = $("#Account").val();
        this.user.account = account;
        if (!this.user.account) {
            var displayTips = tips.types.account.cantBeEmpty;
            this.view.showTips(displayTips);
            return;
        };

        this.user.password = $("#Password").val();
        if (!this.user.account) {
            var displayTips = tips.types.password.cantBeEmpty;
            this.view.showTips(displayTips);
            return;
        };
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
                    document.cookie = "email=" + msg.email + "; domain=.tplinkcloud.com";
                    document.cookie = "token=" + msg.token + "; domain=.tplinkcloud.com";
                    document.cookie = "account=" + account + "; domain=.tplinkcloud.com";
                    // currentController login callbacks
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
            }
        };

        currentController.user.login(inputCallbacks);

    };

    UserController.prototype.passwordKeyDown = function() {
        
    };

    UserController.prototype.forgetPasswordKeyDown = function() {
        
    };

    UserController.prototype.locateTo = function(dst) {
        if (undefined == dst) {
            throw "args error in locateTo";
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
        this.user = null;
    };

    UserView.prototype.renderLoginError = function(errorTips) {
        if (undefined == errorTips) {
            throw "args error in showLoginError";
        };

        this.clearPasswordInput();
        this.showTips(errorTips);
    };

    UserView.prototype.showTips = function(displayTips) {
        if (undefined == displayTips) {
            throw "args error in showTips";
            return;
        };

        var handel = "#Account";
        var top = -39;
        var left = 0;
        var text = displayTips;

        $("#warningtips").remove();
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
        setTimeout("$('#warningtips').fadeOut('slow')", 5000);
        $(".closetips").click(function() {
            $("#warningtips").fadeOut("slow");
        });
    };

    UserView.prototype.clearPasswordInput = function() {
        $("#Password").val("");
    };
    
    
    var u = new User();
    var uc = new UserController();
    var uv = new UserView();

    uc.user = u;
    uc.view = uv;
    
    uc.initHandler();

})(jQuery);