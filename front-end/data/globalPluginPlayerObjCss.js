define(function () {
    
    function PluginPlayerObjCss() {
        this.css = null;
    };

    var qvgaPluginPlayerObjCss = new PluginPlayerObjCss();
    qvgaPluginPlayerObjCss.css = {
        width: 320,
        height: 240,
        left: 160,
        top: 120,
        position: "relative"
    };

    var vgaPluginPlayerObjCss = new PluginPlayerObjCss();
    vgaPluginPlayerObjCss.css = {
        width: 640,
        height: 480,
        left: 0,
        top: 0,
        position: "relative"
    };

    var globalPluginPlayerObjCss = {};
    globalPluginPlayerObjCss["qvga"] = qvgaPluginPlayerObjCss;
    globalPluginPlayerObjCss["vga"] = vgaPluginPlayerObjCss;

    return globalPluginPlayerObjCss;
});