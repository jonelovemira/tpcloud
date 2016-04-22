define(['User', 'inheritPrototype', 'jquery'], function (User, inheritPrototype, $) {
    function UserModel() {
        User.call(this, arguments);
    };

    inheritPrototype(UserModel, User);
    UserModel.prototype.successLoginCallbacks = $.Callbacks("unique stopOnFalse");
    return UserModel;
})