define(["jquery"], function ($) {
    "use strict";
    return function (tmp, classPrototype) {
        if (undefined == tmp || undefined == classPrototype) {
            console.error("args error in initClassPrototype");
        };
        var cloneTmp = $.extend(true, {}, tmp);
        $.extend(true, classPrototype, cloneTmp);
    }
});