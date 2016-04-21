define(function () {
    function PostChannel() {
        this.name = null;
        this.url = null;
        this.encrypt = null;
        this.port = null;
    };
    PostChannel.prototype = {
        constructor: PostChannel,
        generateRelaydCommand: function(args) {
            if (undefined == this.url || undefined == this.port || undefined == args.relayUrl ||
                undefined == args.deviceId || undefined == this.name || undefined == args.token ||
                undefined == args.relayVideoTime) {
                console.error("args error in generateRelaydCommand")
            };
            var localResolutionStr = args.generateLocalParam(args);
            var relayResolutionStr = args.generateRelayParam(args);
            return "relayd -s 'http://127.0.0.1:" + this.port + "/" + this.url + "?" + localResolutionStr +
                "' -d 'http://" + args.relayUrl + "/relayservice?deviceid=" +
                args.deviceId + "&type=" + this.name + "&" + relayResolutionStr + "' -a 'X-token: " +
                args.token + "' -t '" + args.relayVideoTime + "'";
        },
        generateLocalParam: function (args) {
            return '';
        },
        generateRelayParam: function (args) {
            return '';
        }
    };
    return PostChannel;
})