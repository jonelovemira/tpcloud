$(function () {
    function User() {
        $.ipc.User.call(this, arguments);
        this.activateDeviceAdminCallback = $.Callbacks("unique stopOnFalse");
    };

    $.ipc.inheritPrototype(User, $.ipc.User);

    function UserController() {
        $.ipc.BaseController.call(this, arguments);
    }

    $.ipc.inheritPrototype(UserController, $.ipc.BaseController);

    UserController.prototype.initHandler = function() {
        var appendedSelectorHandlerMap = {
            "#submit": {
                "click": this.registerOrActivate
            },
            "#goto-activate": {
                "click": this.showActivate
            },
            "#goto-register": {
                "click": this.showRegister
            }
        };
        var selectorMsgProduceFuncMap = {};
        this.batchInitHandler(appendedSelectorHandlerMap, selectorMsgProduceFuncMap);
    };
});