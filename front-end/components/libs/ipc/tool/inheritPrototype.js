define(["create"], function () {
    return function(subType, baseType) {
        if (undefined == baseType || undefined == subType) {
            console.error("args error in inherit");
        };

        subType.prototype = create(baseType.prototype);
        subType.prototype.constructor = subType;
    };
})