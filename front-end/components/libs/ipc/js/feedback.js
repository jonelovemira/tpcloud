(function($) {
    "use strict";

    $.ipc = $.ipc || {};

    function Feedback() {
        $.ipc.Model.call(this, arguments);
        this.account = null;
        this.productName = null;
        this.country = null;
        this.problemType = null;
        this.description = null;
    };

    $.ipc.inheritPrototype(Feedback, $.ipc.Model);

    var feedbackErrorCodeInfo = {
        1000: function() {
            console.log("email address cannot be empty")
        },
        1006: function() {
            console.log("account is not exist")
        },
        1011: function() {
            console.log("username cannot be empty")
        },
    };

    Feedback.prototype.errorCodeCallbacks = Feedback.prototype.extendErrorCodeCallback({
        "errorCodeCallbackMap": feedbackErrorCodeInfo
    });

    Feedback.prototype.send = function(args, inputCallbacks) {
        var result = {};
        var validateResult = (!this.validateAccount(args.account).code && this.validateAccount(args.account)) ||
            (!this.validateProductName(args.productName).code && this.validateProductName(args.productName)) ||
            (!this.validateDescription(args.description).code && this.validateDescription(args.description));
        if (validateResult.code == false) {
            result["validateResult"] = validateResult;
            return result;
        };

        if (undefined == args.problemType) {
            console.error("args error in send");
            return;
        };

        var data = {
            'REQUEST': 'EMAILSERVICE',
            'DATA': {
                "email": args.account,
                "subject": "User Feedback",
                "content": "From:" + args.account + "<br/>" +
                    "Model: " + args.productName + "<br/>" +
                    "Country: " + args.country + "<br/>" +
                    "Problem: " + args.problemType + "<br/>" +
                    "Description: " + args.description,
                "service": "Feedback"
            }
        };

        var changeStateFunc = function(response) {
            $.extend(true, this, args);
        };

        var extendAjaxOptions = {
            contentType: "application/x-www-form-urlencoded;charset=utf-8"
        };

        result["ajaxObj"] = this.makeAjaxRequest({
            url: "/init3.php",
            data: data,
            callbacks: inputCallbacks,
            changeState: changeStateFunc,
            extendAjaxOptions: extendAjaxOptions
        });
        return result;
    };

    Feedback.prototype.validateAccount = function(tmpAccount) {
        if (undefined == tmpAccount) {
            console.error("args error in validateAccount");
            return;
        };

        var validateArgs = {
            "attr": tmpAccount,
            "attrEmptyMsg": tips.types.contact.account.cantBeEmpty,
            "maxLength": 64,
            "minLength": 1,
            "attrOutOfLimitMsg": "account out of limit",
            "pattern": /^.*$/,
            "patternTestFailMsg": tips.types.account.invalid,
        };

        return this.validateAttr(validateArgs);
    };

    Feedback.prototype.validateDescription = function(tmpDescription) {
        if (undefined == tmpDescription) {
            console.error("args error in validateDescription");
        };

        var validateArgs = {
            "attr": tmpDescription,
            "attrEmptyMsg": tips.types.contact.description.cantBeEmpty,
            "maxLength": 500,
            "minLength": 1,
            "attrOutOfLimitMsg": tips.types.contact.description.outOfLimit,
            "pattern": /.*/,
            "patternTestFailMsg": tips.types.contact.description.invalid,
        };

        return this.validateAttr(validateArgs);
    };

    Feedback.prototype.validateProductName = function(productName) {
        if (undefined == productName) {
            console.error("args error in validateProductName");
        };

        var validateArgs = {
            "attr": productName,
            "attrEmptyMsg": tips.types.contact.productName.cantBeEmpty,
            "maxLength": 6,
            "minLength": 1,
            "attrOutOfLimitMsg": "product name is out of limit",
            "pattern": /.*/,
            "patternTestFailMsg": "product name is invalid",
        };

        return this.validateAttr(validateArgs);
    };

    $.ipc.Feedback = Feedback;
})(jQuery);