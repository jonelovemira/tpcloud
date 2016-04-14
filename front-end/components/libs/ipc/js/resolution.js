(function($) {
    "use strict";

    $.ipc = $.ipc || {};

    function Resolution() {
        this.name = null;
        this.width = null;
        this.height = null;
        this.str = null;
        this.playerContainerCss = null;
        this.pluginStreamResCode = null;
        this.pluginPlayerObjCss = null;
    };

    var RESOLUTION_VIDEO_VGA = new Resolution();
    RESOLUTION_VIDEO_VGA.name = "VGA";
    RESOLUTION_VIDEO_VGA.width = 640;
    RESOLUTION_VIDEO_VGA.height = 480;
    RESOLUTION_VIDEO_VGA.str = RESOLUTION_VIDEO_VGA.width + "*" + RESOLUTION_VIDEO_VGA.height;
    RESOLUTION_VIDEO_VGA.playerContainerCss = $.ipc.vgaPlayerContainerCss;
    RESOLUTION_VIDEO_VGA.pluginStreamResCode = 0;
    RESOLUTION_VIDEO_VGA.pluginPlayerObjCss = $.ipc.vgaPluginPlayerObjCss;
    var RESOLUTION_VIDEO_QVGA = new Resolution();
    RESOLUTION_VIDEO_QVGA.name = "QVGA";
    RESOLUTION_VIDEO_QVGA.width = 320;
    RESOLUTION_VIDEO_QVGA.height = 240;
    RESOLUTION_VIDEO_QVGA.str = RESOLUTION_VIDEO_QVGA.width + "*" + RESOLUTION_VIDEO_QVGA.height;
    RESOLUTION_VIDEO_QVGA.playerContainerCss = $.ipc.qvgaPlayerContainerCss;
    RESOLUTION_VIDEO_QVGA.pluginStreamResCode = 1;
    RESOLUTION_VIDEO_QVGA.pluginPlayerObjCss = $.ipc.qvgaPluginPlayerObjCss;
    var RESOLUTION_VIDEO_HD = new Resolution();
    RESOLUTION_VIDEO_HD.name = "HD";
    RESOLUTION_VIDEO_HD.width = 1280;
    RESOLUTION_VIDEO_HD.height = 720;
    RESOLUTION_VIDEO_HD.str = RESOLUTION_VIDEO_HD.width + "*" + RESOLUTION_VIDEO_HD.height;
    RESOLUTION_VIDEO_HD.playerContainerCss = $.ipc.hdPlayerContainerCss;
    RESOLUTION_VIDEO_HD.pluginStreamResCode = 2;
    var RESOLUTION_VIDEO_FULLHD = new Resolution();
    RESOLUTION_VIDEO_FULLHD.name = "FullHD";
    RESOLUTION_VIDEO_FULLHD.width = 1920;
    RESOLUTION_VIDEO_FULLHD.height = 1080;
    RESOLUTION_VIDEO_FULLHD.str = RESOLUTION_VIDEO_FULLHD.width + "*" + RESOLUTION_VIDEO_FULLHD.height;
    RESOLUTION_VIDEO_FULLHD.playerContainerCss = $.ipc.fullhdPlayerContainerCss;

    $.ipc.Resolution = Resolution;
    $.ipc.RESOLUTION_VIDEO_VGA = RESOLUTION_VIDEO_VGA;
    $.ipc.RESOLUTION_VIDEO_QVGA = RESOLUTION_VIDEO_QVGA;
    $.ipc.RESOLUTION_VIDEO_HD = RESOLUTION_VIDEO_HD;
    $.ipc.RESOLUTION_VIDEO_FULLHD = RESOLUTION_VIDEO_FULLHD;

})(jQuery);