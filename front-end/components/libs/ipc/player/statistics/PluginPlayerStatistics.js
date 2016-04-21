define(["Statistics", "inheritPrototype", "jquery"], 
    function (Statistics, inheritPrototype, $) {
    function PluginPlayerStatistics() {
        Statistics.call(this, arguments);
    }
    inheritPrototype(PluginPlayerStatistics, Statistics);

    PluginPlayerStatistics.prototype.send = function(ajaxOptions) {
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
        }, "xDomain");
        return result;
    };

    return PluginPlayerStatistics;
})