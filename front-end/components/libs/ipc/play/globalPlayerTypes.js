define(["compareVersion", "MJPEGVideoCodec", "H264VideoCodec"], 
    function (compareVersion, MJPEGVideoCodec, H264VideoCodec) {

    function PlayerType() {
        this.supportedModels = [];
        this.name = null;
        this.downloadPath = null;
        this.tags = null;
        this.newestVersion = null;
        this.mimetypeCssMap = null;
    };

    PlayerType.prototype = {
        constructor: PlayerType,
        hasNewerVersion: function(version) {
            if (undefined == version || undefined == this.newestVersion) {
                console.error("args error in hasNewerVersion");
            };
            var result = compareVersion(version, this.newestVersion);
            if (result > 0) {
                console.info("target version is bigger than newestVersion");
            };
            return result < 0;
        }
    };

    var mjpegVideoCodec = new MJPEGVideoCodec();
    var h264VideoCodec = new H264VideoCodec();

    var PLUGIN_NON_IE_X86 = new PlayerType();

    var PLUGIN_NON_IE_X64 = new PlayerType();

    var PLUGIN_IE_X86 = new PlayerType();

    var PLUGIN_IE_X64 = new PlayerType();

    var PLUGIN_MAC = new PlayerType();

    var FLASH_PLAYER = new PlayerType();

    var IMG_PLAYER = new PlayerType();

    PLUGIN_NON_IE_X86.mimetypeCssMap = {};
    PLUGIN_NON_IE_X86.mimetypeCssMap[mjpegVideoCodec.mimeType] = "non-ie-mjpeg";
    PLUGIN_NON_IE_X86.mimetypeCssMap[h264VideoCodec.mimeType] = "non-ie-h264";

    PLUGIN_NON_IE_X64.mimetypeCssMap = {};
    PLUGIN_NON_IE_X64.mimetypeCssMap[mjpegVideoCodec.mimeType] = "non-ie-mjpeg";
    PLUGIN_NON_IE_X64.mimetypeCssMap[h264VideoCodec.mimeType] = "non-ie-h264";

    PLUGIN_IE_X86.mimetypeCssMap = {};
    PLUGIN_IE_X86.mimetypeCssMap[mjpegVideoCodec.mimeType] = "ie-mjpeg";
    PLUGIN_IE_X86.mimetypeCssMap[h264VideoCodec.mimeType] = "ie-h264";

    PLUGIN_IE_X64.mimetypeCssMap = {};
    PLUGIN_IE_X64.mimetypeCssMap[mjpegVideoCodec.mimeType] = "ie-mjpeg";
    PLUGIN_IE_X64.mimetypeCssMap[h264VideoCodec.mimeType] = "ie-h264";

    PLUGIN_MAC.mimetypeCssMap = {};
    PLUGIN_MAC.mimetypeCssMap[mjpegVideoCodec.mimeType] = "non-ie-mjpeg";
    PLUGIN_MAC.mimetypeCssMap[h264VideoCodec.mimeType] = "non-ie-h264";


    var globalPlayerTypes = {
        PLUGIN_NON_IE_X86: PLUGIN_NON_IE_X86,
        PLUGIN_NON_IE_X64: PLUGIN_NON_IE_X64,
        PLUGIN_IE_X86: PLUGIN_IE_X86,
        PLUGIN_IE_X64: PLUGIN_IE_X64,
        PLUGIN_MAC: PLUGIN_MAC,
        FLASH_PLAYER: FLASH_PLAYER,
        IMG_PLAYER: IMG_PLAYER
    };

    return globalPlayerTypes;
})