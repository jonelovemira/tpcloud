(function($) {
    "use strict";

    $.ipc = $.ipc || {};

    function hasNewerVersion(version) {
        if (undefined == version || undefined == this.newestVersion) {
            console.error("args error in hasNewerVersion");
        };
        var result = $.ipc.compareVersion(version, this.newestVersion);
        if (result > 0) {
            console.info("target version is bigger than newestVersion");
        };
        return result < 0;
    };

    var pluginInitPrototype = {
        supportedModels: [],
        name: null,
        downloadPath: null,
        tags: null,
        newestVersion: null,
        hasNewerVersion: hasNewerVersion
    };

    var mjpegVideoCodec = new $.ipc.MJPEGVideoCodec();
    var h264VideoCodec = new $.ipc.H264VideoCodec();

    function PLUGIN_NON_IE_X86() {};

    function PLUGIN_NON_IE_X64() {};

    function PLUGIN_IE_X86() {};

    function PLUGIN_IE_X64() {};

    function PLUGIN_MAC() {};

    function FLASH_PLAYER() {};

    function IMG_PLAYER() {};

    PLUGIN_NON_IE_X86.prototype.mimetypeCssMap = {};
    PLUGIN_NON_IE_X86.prototype.mimetypeCssMap[mjpegVideoCodec.mimeType] = "non-ie-mjpeg";
    PLUGIN_NON_IE_X86.prototype.mimetypeCssMap[h264VideoCodec.mimeType] = "non-ie-h264";

    PLUGIN_NON_IE_X64.prototype.mimetypeCssMap = {};
    PLUGIN_NON_IE_X64.prototype.mimetypeCssMap[mjpegVideoCodec.mimeType] = "non-ie-mjpeg";
    PLUGIN_NON_IE_X64.prototype.mimetypeCssMap[h264VideoCodec.mimeType] = "non-ie-h264";

    PLUGIN_IE_X86.prototype.mimetypeCssMap = {};
    PLUGIN_IE_X86.prototype.mimetypeCssMap[mjpegVideoCodec.mimeType] = "ie-mjpeg";
    PLUGIN_IE_X86.prototype.mimetypeCssMap[h264VideoCodec.mimeType] = "ie-h264";

    PLUGIN_IE_X64.prototype.mimetypeCssMap = {};
    PLUGIN_IE_X64.prototype.mimetypeCssMap[mjpegVideoCodec.mimeType] = "ie-mjpeg";
    PLUGIN_IE_X64.prototype.mimetypeCssMap[h264VideoCodec.mimeType] = "ie-h264";

    PLUGIN_MAC.prototype.mimetypeCssMap = {};
    PLUGIN_MAC.prototype.mimetypeCssMap[mjpegVideoCodec.mimeType] = "non-ie-mjpeg";
    PLUGIN_MAC.prototype.mimetypeCssMap[h264VideoCodec.mimeType] = "non-ie-h264";

    (function() {
        var tmp = [PLUGIN_NON_IE_X86, PLUGIN_NON_IE_X64, PLUGIN_IE_X86, PLUGIN_IE_X64, PLUGIN_MAC];
        for (var i = 0; i < tmp.length; i++) {
            $.ipc.initClassPrototype(pluginInitPrototype, tmp[i].prototype);
        };
    })();

    $.ipc.PLUGIN_NON_IE_X86 = PLUGIN_NON_IE_X86;
    $.ipc.PLUGIN_NON_IE_X64 = PLUGIN_NON_IE_X64;
    $.ipc.PLUGIN_IE_X86 = PLUGIN_IE_X86;
    $.ipc.PLUGIN_IE_X64 = PLUGIN_IE_X64;
    $.ipc.PLUGIN_MAC = PLUGIN_MAC;
    $.ipc.FLASH_PLAYER = FLASH_PLAYER;
    $.ipc.IMG_PLAYER = IMG_PLAYER;

})(jQuery);