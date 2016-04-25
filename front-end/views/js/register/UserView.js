define(['User', 'msg', 'jquery'], function (User, msg, $) {
    function UserView() {
        this.model = null;
        this.registerTitle = "Create Account";
        this.activateTitle = "Activate Account";
    }

    UserView.prototype = {
        constructor: UserView,
        renderError: function(tmpMsg) {
            if (tmpMsg) {
                msg({
                    "type": "alert",
                    "info": tmpMsg
                });
            } else {
                console.error("args error in renderError");
            }
        },
        hideAllTips: function() {
            $(".account-ctrl").hide();
        },
        showActivate: function() {
            this.hideAllTips();
            $("#goto-register").show();
            $("#password").attr("value","");
            $("#password-confirm").attr("value","");
            $("#password").closest("div").hide();
            $("#password-confirm").closest("div").hide();

            $("span.accountinnertext").text(this.activateTitle);
        },
        showRegister: function() {
            this.hideAllTips();
            $("#goto-activate").show();
            $("#password").closest("div").show();
            $("#password-confirm").closest("div").show();

            $("span.accountinnertext").text(this.registerTitle);
        },
    };

    return UserView;
})