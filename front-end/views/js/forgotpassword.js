$(function() {

    function UserController() {
        $.ipc.BaseController.call(this, arguments);
    };

    $.ipc.inheritPrototype(UserController, $.ipc.BaseController);

    UserController.prototype.initHandler = function() {
        var appendedSelectorHandlerMap = {
            "#findpwd": {
                "click": this.findMyPassword
            },
        };

        var selectorMsgProduceFuncMap = {};

        this.batchInitHandler(appendedSelectorHandlerMap, selectorMsgProduceFuncMap);
    };

    UserController.prototype.findMyPassword = function() {
        var args = {
            "email": $("#forgotpwd-input").val()
        };

        var currentController = this;

        var errCodeTipsMap = {
            "0": tips.actions.sendFindPasswordEmail.success,
            "-1": tips.actions.sendFindPasswordEmail.failed
        };

        var inputCallbacks = {
            "errorCodeCallbackMap": {
                "0": function() {
                    currentController.view.renderMsg(errCodeTipsMap[0]);
                }
            },
            "errorCallback": function() {
                currentController.view.renderMsg(errCodeTipsMap[-1]);
            }
        };

        var validateResult = currentController.model.forgotPassword(args, inputCallbacks)["validateResult"];
        if (validateResult != undefined && !validateResult.code) {
            currentController.view.renderMsg(validateResult.msg);
        };
    };

    function UserView() {
        this.model = null;
    }

    UserView.prototype.renderMsg = function(msg) {
        if (undefined == msg) {
            console.error("args error in renderMsg");
        };
        var alertOptions = {
            "type": "alert",
            "info": msg
        };
        $.ipc.Msg(alertOptions);
    };

    var uc = new UserController();
    var u = new $.ipc.User();
    var uv = new UserView();

    uc.model = u;
    uv.model = u;
    uc.view = uv;

    uc.initHandler();

});