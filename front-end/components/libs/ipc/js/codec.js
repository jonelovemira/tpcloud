(function($) {
    "use strict";

    $.ipc = $.ipc || {};

    function Codec() {
        this.name = null;
    };

    function PCMAudioCodec() {
        Codec.call(this, arguments);
        this.name = "PCM";
    };
    $.ipc.inheritPrototype(PCMAudioCodec, Codec);

    function AACAudioCodec() {
        Codec.call(this, arguments);
        this.name = "AAC";
        this.pluginAudioTypeCode = 2;
    };
    $.ipc.inheritPrototype(AACAudioCodec, Codec);

    function MJPEGVideoCodec() {
        Codec.call(this, arguments);
        this.name = "mjpeg";
        this.mimeType = "application/x-tp-camera";
    };
    $.ipc.inheritPrototype(MJPEGVideoCodec, Codec);

    function H264VideoCodec() {
        Codec.call(this, arguments);
        this.name = "h264";
        this.mimeType = "application/x-tp-camera-h264";
        this.pluginStreamTypeCode = 2;
    };
    $.ipc.inheritPrototype(H264VideoCodec, Codec);

    $.ipc.PCMAudioCodec = PCMAudioCodec;
    $.ipc.AACAudioCodec = AACAudioCodec;
    $.ipc.MJPEGVideoCodec = MJPEGVideoCodec;
    $.ipc.H264VideoCodec = H264VideoCodec;
})(jQuery);