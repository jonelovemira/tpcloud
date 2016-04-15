(function() {
    Function.prototype.before = function(func) {
        var _self = this;
        return function() {
            if (func.apply(this, arguments) === false) {
                return false;
            };
            return _self.apply(this, arguments);
        }
    };

    Function.prototype.after = function(func) {
        var _self = this;
        return function() {
            var ret = _self.apply(this, arguments);
            if (ret === false) {
                return false;
            };
            func.apply(this, arguments);
            return ret;
        }
    };
})();