define(function () {
    "use strict";
    return function(p) {
        if (p == null) {
            console.error("unknown type, cannot create");
        };

        if (Object.create) {
            return Object.create(p);
        };

        var t = typeof p;
        if (t !== "object" && t !== "function") {
            console.error("not a object or function");
        };

        function f() {};
        f.prototype = p;
        return new f();
    };
})