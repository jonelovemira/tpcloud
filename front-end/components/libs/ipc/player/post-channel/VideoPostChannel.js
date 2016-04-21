define(["PostChannel", "inheritPrototype", "jquery"], 
    function (PostChannel, inheritPrototype, $) {
    function VideoPostChannel() {
        PostChannel.call(this, arguments);
        this.name = 'video';
    };
    inheritPrototype(VideoPostChannel, PostChannel);
    VideoPostChannel.prototype.generateLocalParam = function(args) {
        if (undefined == args.currentVideoResolutionName) {
            console.error("args error in gen local res str")
        };
        return $.param({
            resolution: args.currentVideoResolutionName
        });
    };
    VideoPostChannel.prototype.generateRelayParam = function(args) {
        if (undefined == args.currentVideoResolutionName) {
            console.error("args error in gen relay res str")
        };
        return $.param({
            resolution: args.currentVideoResolutionName
        });
    };
    return VideoPostChannel;
})