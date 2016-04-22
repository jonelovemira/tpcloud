define(['User', 'inheritPrototype', 'jquery'], function (User, inheritPrototype, $) {
    function UserModel() {
        User.call(this, arguments);
        this.activateDeviceAdminCallback = $.Callbacks("unique stopOnFalse");
    };

    inheritPrototype(UserModel, User);
    return UserModel;
});