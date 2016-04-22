define(['UserModel', 'jquery', 'msg'], function (UserModel, $, msg) {
    function UserView() {
        this.model = null;
    };

    UserView.prototype = {
        constructor: UserView,
        renderUserInfo: function() {
            if (undefined == this.model.email) {
                console.error("args error in showWelcomeInfo");
                return;
            };
            $("#welcomeinfo").show();
            $("#welcome_username").text(this.model.email);
            $('#userinfo-email').text(this.model.email);
        },
        renderError: function(errorMsg) {
            if (undefined == errorMsg) {
                console.error("args error in renderError");
            };

            this.renderAlert({
                "info": errorMsg
            });
        },
        renderAlert: function(options) {
            if (undefined == options) {
                console.error("args error in renderAlert");
            };

            var alertOptions = {
                "type": "alert"
            };
            $.extend(true, alertOptions, options);
            msg(alertOptions);
        },
        hideAccountMainBoardSon: function() {
            $(".account-content").children().hide();
        },
        hideAdmin: function() {
            $(".main-content").hide();
        },
        showAccountAdmin: function() {
            $(".account-content").show();
        },
        showDeviceAdmin: function() {
            $(".device-content").show();
        },
        hideDeviceWatchSon: function() {
            $("#watch").children().hide();
        },
        mainBoardPaddingTop: function(val) {
            val != undefined && $("#display-main-board").css("padding-top", val);
        },
        cssToggle: function(element) {
            var currentView = this;
            var elementChangeMap = {
                "#device": function() {
                    currentView.activateNav("#device");
                    $("#display-main-board").css("padding-top", "12px");
                    $("#display-main-board").css("height", "712px");
                    $(".main-content").css("width", "100%");
                },
                "#account": function() {
                    currentView.activateNav("#account");
                    $("#display-main-board").css("padding-top", "25px");
                    $("#display-main-board").css("height", "inherit");
                    $(".main-content").css("width", "1000px");
                }
            };

            var changeFunc = elementChangeMap[element] || $.noop;
            changeFunc();
        },
        renderDeviceAdmin: function() {
            this.hideAdmin();
            this.cssToggle("#device");
            this.showDeviceAdmin()
            this.hideDeviceWatchSon();
            $("#watch > #flash-player-container").show();
        },
        activateNav: function(elementSelector) {
            elementSelector != undefined &&
                $(".navstitle-title").removeClass("navselected") &&
                $(elementSelector).addClass("navselected");
        },
        renderAccountAdmin: function() {
            this.hideAdmin();
            this.cssToggle("#account");
            this.showAccountAdmin();
            this.hideAccountMainBoardSon();
            $(".account-content > .account-information").show();
        },
        renderChangePasswod: function() {
            this.showAccountAdmin()
            this.hideAccountMainBoardSon();
            $(".account-content > .change-password-form").show();
        }
    }
    
    return UserView;
})