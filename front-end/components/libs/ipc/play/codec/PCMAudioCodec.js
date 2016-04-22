define(["Codec", "inheritPrototype"], function (Codec, inheritPrototype) {
    "use strict";

    function PCMAudioCodec() {
        Codec.call(this, arguments);
        this.name = "PCM";
    };
    inheritPrototype(PCMAudioCodec, Codec);

    return PCMAudioCodec;
});