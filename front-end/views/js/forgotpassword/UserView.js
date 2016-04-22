define(['User', 'msg'], function (User, msg) {
    function UserView() {
        this.model = null;
    }

    UserView.prototype.renderMsg = function(tmpMsg) {
        if (undefined == tmpMsg) {
            console.error("args error in renderMsg");
        };
        var alertOptions = {
            "type": "alert",
            "info": tmpMsg
        };
        msg(alertOptions);
    };

    return UserView;
})