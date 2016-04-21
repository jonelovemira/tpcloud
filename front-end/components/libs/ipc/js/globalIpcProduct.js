define(["IpcProduct", "presetLinkieData"], function (IpcProduct, presetLinkieData) {
    var globalIpcProduct = {};
    for (var key in presetLinkieData) {
        var tmpProduct = new IpcProduct();
        tmpProduct.name = key.substring(0, 5).toUpperCase();
        globalIpcProduct[key] = tmpProduct;
    };
    return globalIpcProduct;
});