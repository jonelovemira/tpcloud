$(function(){
    
    function SoftwareController () {
        $.ipc.BaseController.call(this, arguments);
    }

    $.ipc.inheritPrototype(SoftwareController, $.ipc.BaseController);

    SoftwareController.prototype.getUpdateInfos = function() {
        var currentController = this;
        var inputCallbacks = {
            "errorCodeCallbackMap": {
                0: function() {
                    currentController.view.feedModelSelect();
                }
            },
            "errorCallback": $.noop
        };

        this.model.getUpdateInfos(inputCallbacks);
    };

    SoftwareController.prototype.initHandler = function() {
        var appendedSelectorHandlerMap = {
            "#submit": {"click": this.sendFeedBack},
        };

        var selectorMsgProduceFuncMap = {};

        this.batchInitHandler(appendedSelectorHandlerMap, selectorMsgProduceFuncMap);
    };

    SoftwareController.prototype.sendFeedBack = function() {
        var currentController = this;
        var args = {account: $('#contact_account').attr('value'),
                    product: $('#model_select').attr('value'),
                    country: $('#rCountry').attr('value'),
                    problemType: $('#problem_select').attr('value'),
                    description: $("#contact_content").attr('value')};

        var errCodeTipsMap = {
            "0": tips.actions.sendFeedback.success,
            "-1": tips.actions.sendFeedback.failed
        };

        var inputCallbacks = {
            "errorCodeCallbackMap": {
                "0": function(){
                    currentController.view.renderMsg(errCodeTipsMap[0]);
                    currentController.view.renderDisableTimer();
                }
            },
            "errorCallback": function() {
                currentController.view.renderMsg(errCodeTipsMap[-1]);
            }
        };
        var feedback = new $.ipc.Feedback();
        var validateResult = feedback.send(args, inputCallbacks);
        if (validateResult != undefined && !validateResult.code) {
            currentController.view.renderError(validateResult.msg);
        };
    };

    function SoftwareView () {
        this.model = null;
        this.totalDisableSendTime = 60;
        this.currentDisableTimeLeft = null;
        this.updateDisableTimeSpanIntervalObj = null;
    };

    SoftwareView.prototype.feedModelSelect = function () {
        var addedOptions = {};
        for (var i = 0; i < this.model.products.length; i++) {
            addedOptions[this.model.products[i].name] = {};
        };
        $("#model_select").empty();
        $("#model_select").Select({
            addedOptions: addedOptions
        });
    };

    SoftwareView.prototype.renderMsg = function(msg) {
        if (undefined == msg) {
            console.error("args error in renderMsg");
        };
        var alertOptions = {
            "type": "alert",
            "info": msg
        };
        $.ipc.Msg(alertOptions);
    };

    SoftwareView.prototype.renderError = function(errorMsg) {
        if (undefined == errorMsg) {
            console.error("args error in renderError");
            return;
        };

        this.renderMsg(errorMsg);
    };

    SoftwareView.prototype.renderDisableTimer = function() {
        var currentView = this;
        currentView.currentDisableTimeLeft = currentView.totalDisableSendTime;
        if (currentView.updateDisableTimeSpanIntervalObj) {
            clearInterval(currentView.updateDisableTimeSpanIntervalObj);
        };

        currentView.updateDisableTimeSpanIntervalObj = setInterval(function(){
            if (currentView.currentDisableTimeLeft > 0) {
                $("#submit").attr("disabled", "disabled");
                $("#contraint-time-left").text("(" + currentView.currentDisableTimeLeft + ")");
                $("#unusable-cover").show();
            } else {
                $("#submit").removeAttr("disabled");
                $("#contraint-time-left").text("");
                $("#unusable-cover").hide();
                clearInterval(currentView.updateDisableTimeSpanIntervalObj);
            };
            currentView.currentDisableTimeLeft -= 1;
        }, 1000);
    };

    var sc = new SoftwareController();
    var s = new $.ipc.Software();
    var sv = new SoftwareView();
    sc.model = s;
    sc.view = sv;
    sv.model = s;

    sc.initHandler();

    sc.getUpdateInfos();
});