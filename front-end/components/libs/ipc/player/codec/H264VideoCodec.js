define(["Codec", "inheritPrototype"], function (Codec, inheritPrototype) {
    function H264VideoCodec() {
        Codec.call(this, arguments);
        this.name = "h264";
        this.mimeType = "application/x-tp-camera-h264";
        this.pluginStreamTypeCode = 2;
    };
    inheritPrototype(H264VideoCodec, Codec);
    return H264VideoCodec;
});