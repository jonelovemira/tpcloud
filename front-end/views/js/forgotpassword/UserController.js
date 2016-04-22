define(['BaseController', 'inheritPrototype', 'jquery', 'User', 'UserView', 'tips'], 
    function (BaseController, inheritPrototype, $, User, UserView, tips) {
    function UserController() {
        BaseController.call(this, arguments);
    };

    inheritPrototype(UserController, BaseController);

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

    return UserController;
})