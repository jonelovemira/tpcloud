(function($) {
    "use strict";
    $.ipc = $.ipc || {};

    function getUrl() {
        var analyticUrlServerTypeMap = {
            "alpha": "https://analytics-alpha.tplinkcloud.com/stat",
            "beta": "https://analytics-beta.tplinkcloud.com/stat"
        };
        var url = "https://analytics.tplinkcloud.com/stat";
        for (var type in analyticUrlServerTypeMap) {
            if (window.location.href.indexOf(type) >= 0) {
                url = analyticUrlServerTypeMap[type];
            };
        };
        return url;
    }

    function Statistics() {
        $.ipc.Model.call(this, arguments);

        this.url = getUrl();
        this.token = null;

        this.SUCCESS = 0;
        this.ERROR = 1;

        this.devID = null;
        this.clientType = $.ipc.Browser.prototype.type + ' ' + $.ipc.Browser.prototype.version;
        this.devModel = null;
        this.firmwareVersion = null;
        this.type = null;
        this.success = [];
        this.stopReason = [];
        this.watchTime = null;
    };

    $.ipc.inheritPrototype(Statistics, $.ipc.Model);

    function FlashStatistics() {
        Statistics.call(this, arguments);
    };
    $.ipc.inheritPrototype(FlashStatistics, Statistics);

    FlashStatistics.prototype.send = function(ajaxOptions) {
        var result = {};
        var _self = this;
        var data = JSON.stringify({
            "version": "0.1",
            "type": "webSession",
            "data": {
                "basic": {
                    "devID": _self.devID,
                    "clientType": _self.clientType,
                    "devModel": _self.devModel,
                    "firmwareVersion": _self.firmwareVersion
                },
                "stream": {
                    "type": _self.type,
                    "success": _self.success,
                    "stopReason": _self.stopReason,
                    "watchTime": _self.watchTime
                }
            }
        });

        var extendAjaxOptions = $.extend(true, {
            headers: {
                'X-Token': this.token
            }
        }, ajaxOptions);

        result["ajaxObj"] = _self.makeAjaxRequest({
            url: _self.url,
            data: data,
            callbacks: undefined,
            changeState: $.noop,
            errCodeStrIndex: "errCode",
            extendAjaxOptions: extendAjaxOptions
        }, $.xAjax.defaults.xType);
        return result;
    };

    function PluginStatistics() {
        Statistics.call(this, arguments);
    }
    $.ipc.inheritPrototype(PluginStatistics, Statistics);

    PluginStatistics.prototype.send = function(ajaxOptions) {
        var result = {};
        var _self = this;
        var data = JSON.stringify({
            "version": "0.1",
            "type": "webSession",
            "data": {
                "basic": {
                    "devID": _self.devID,
                    "clientType": _self.clientType,
                    "devModel": _self.devModel,
                    "firmwareVersion": _self.firmwareVersion
                }
            }
        });

        var extendAjaxOptions = $.extend(true, {
            headers: {
                'X-Token': this.token
            }
        }, ajaxOptions);

        result["ajaxObj"] = _self.makeAjaxRequest({
            url: _self.url,
            data: data,
            callbacks: undefined,
            changeState: $.noop,
            errCodeStrIndex: "errCode",
            extendAjaxOptions: extendAjaxOptions
        }, $.xAjax.defaults.xType);
        return result;
    };

    var stopReasonCodeMap = {
        LEAVE_PAGE: 0,
        USER_STOPPED_VIDEO: 1,
        VIDEO_TIME_UP: 2,
        DEVICE_UNBOUND: 3,
        NETWORK_ERROR: -1,
        VIEW_VIDEO_FAILED: -2,
        UNKNOWN_ERROR: -3
    };

    $.ipc.FlashStatistics = FlashStatistics;
    $.ipc.PluginStatistics = PluginStatistics;
    $.ipc.stopReasonCodeMap = stopReasonCodeMap;
})(jQuery);