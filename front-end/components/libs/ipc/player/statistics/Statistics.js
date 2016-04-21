define(["Model", "inheritPrototype", "browser"], function (Model, inheritPrototype, browser) {
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
        Model.call(this, arguments);

        this.url = getUrl();
        this.token = null;

        this.SUCCESS = 0;
        this.ERROR = 1;

        this.devID = null;
        this.clientType = browser.prototype.type + ' ' + browser.prototype.version;
        this.devModel = null;
        this.firmwareVersion = null;
        this.type = null;
        this.success = [];
        this.stopReason = [];
        this.watchTime = null;
    };

    inheritPrototype(Statistics, Model);

    Statistics.prototype.send = function () {};

    return Statistics;
});