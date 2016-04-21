define(["IpcProduct", "presetLinkieData"], function (IpcProduct, presetLinkieData) {
    var globalIpcProduct = {};
    for (var key in presetLinkieData) {
        var tmpProduct = new IpcProduct();
        var name = key.substring(0, 5).toUpperCase();
        tmpProduct.name = name;
        tmpProduct.smallImgCssClass = name + "-small-img";
        tmpProduct.middleImgCssClass = name + "-middle-img";
        globalIpcProduct[key] = tmpProduct;
    };
    return globalIpcProduct;
});