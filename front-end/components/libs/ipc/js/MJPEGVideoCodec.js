define(["Codec", "inheritPrototype"], function (Codec, inheritPrototype) {
    function MJPEGVideoCodec() {
        Codec.call(this, arguments);
        this.name = "mjpeg";
        this.mimeType = "application/x-tp-camera";
    };
    inheritPrototype(MJPEGVideoCodec, Codec);
    return MJPEGVideoCodec;
});