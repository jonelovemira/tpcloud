(function($) {
    "use strict";
    $.ipc = $.ipc || {};

    function Timer() {
        this.timeout = null;
        this.updateIntervalObj = null;
        this.currentTime = 0;
        this.intervalTime = 1000;
        this.networkFactorDelta = 20000;
        this.timeoutCallback = $.Callbacks("unique stopOnFalse");
    };

    Timer.prototype.clearRubbish = function() {
        clearInterval(this.updateIntervalObj);
        this.currentTime = 0;
    };

    Timer.prototype.start = function() {
        var _self = this;
        _self.clearRubbish();
        _self.updateIntervalObj = setInterval(function() {
            _self.currentTime += _self.intervalTime;
            if (_self.currentTime >= _self.timeout) {
                clearInterval(_self.updateIntervalObj);
                _self.timeoutCallback.fire($.ipc.stopReasonCodeMap.VIDEO_TIME_UP);
            };
        }, _self.intervalTime);
    };

    $.ipc.Timer = Timer;
})(jQuery);