define(["Codec", "inheritPrototype"], function (Codec, inheritPrototype) {
    function AACAudioCodec() {
        Codec.call(this, arguments);
        this.name = "AAC";
        this.pluginAudioTypeCode = 2;
    };
    inheritPrototype(AACAudioCodec, Codec);
    return AACAudioCodec;
});