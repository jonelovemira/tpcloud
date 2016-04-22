define(["PostChannel", "inheritPrototype", "jquery"], 
    function (PostChannel, inheritPrototype, $) {
    function MixedPostChannel() {
        PostChannel.call(this, arguments);
        this.name = 'mixed';
    };
    inheritPrototype(MixedPostChannel, PostChannel);
    MixedPostChannel.prototype.generateLocalParam = function(args) {
        if (undefined == args.currentVideoResolutionName ||
            undefined == args.audioCodecName ||
            undefined == args.videoCodecName) {
            console.error("args error in gen local res str")
        };
        return $.param({
            resolution: args.currentVideoResolutionName,
            audio: args.audioCodecName,
            video: args.videoCodecName
        });
    };
    MixedPostChannel.prototype.generateRelayParam = function(args) {
        if (undefined == args.currentVideoResolutionName) {
            console.error("args error in gen local relay str")
        };
        return $.param({
            resolution: args.currentVideoResolutionName
        });
    };
    return MixedPostChannel;
})