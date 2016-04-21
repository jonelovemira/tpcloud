define(["PostChannel", "inheritPrototype"], function (PostChannel, inheritPrototype) {
    function AudioPostChannel() {
        PostChannel.call(this, arguments);
        this.name = 'audio';
    };
    inheritPrototype(AudioPostChannel, PostChannel);
    AudioPostChannel.prototype.generateLocalParam = function(args) {
        if (undefined == args.audioCodecName) {
            console.error("args error in gen local res str")
        };
        return $.param({
            resolution: args.audioCodecName
        });
    };
    AudioPostChannel.prototype.generateRelayParam = function(args) {
        if (undefined == args.audioCodecName) {
            console.error("args error in gen relay res str")
        };
        return $.param({
            resolution: args.audioCodecName
        });
    };
    return AudioPostChannel;
})