(function($) {
    "use strict";

    $.ipc = $.ipc || {};

    function Channel() {
        this.url = null;
        this.encrypt = null;
        this.videoCodec = null;
        this.audioCodec = null;
        this.name = null;
        this.port = null;
    };
    Channel.prototype.generateRelaydCommand = function(device) {
        if (undefined == device) {
            console.error("args error in generateRelaydCommand")
        };
        var localResolutionStr = this.generateLocalParam(device);
        var relayResolutionStr = this.generateRelayParam(device);
        var url = this.url;
        var type = this.name;
        return "relayd -s 'http://127.0.0.1:" + this.port + "/" + url + "?" + localResolutionStr +
            "' -d 'http://" + device.relayUrl + "/relayservice?deviceid=" +
            device.id + "&type=" + type + "&" + relayResolutionStr + "' -a 'X-token: " +
            device.owner.token + "' -t '" + device.relayVideoTime + "'";
    };

    function DevicePostChannelVideo() {
        Channel.call(this, arguments);
        this.name = 'video';
    };
    $.ipc.inheritPrototype(DevicePostChannelVideo, Channel);
    DevicePostChannelVideo.prototype.generateLocalParam = function(dev) {
        if (undefined == dev) {
            console.error("args error in gen local res str")
        };
        return $.param({
            resolution: dev.currentVideoResolution.name
        });
    };
    DevicePostChannelVideo.prototype.generateRelayParam = function(dev) {
        if (undefined == dev) {
            console.error("args error in gen local res str")
        };
        return $.param({
            resolution: dev.currentVideoResolution.name
        });
    };

    function DevicePostChannelAudio() {
        Channel.call(this, arguments);
        this.name = 'audio';
    };
    $.ipc.inheritPrototype(DevicePostChannelAudio, Channel);
    DevicePostChannelAudio.prototype.generateLocalParam = function(dev) {
        if (undefined == dev) {
            console.error("args error in gen local res str")
        };
        return $.param({
            resolution: dev.product.audioCodec.name
        });
    };
    DevicePostChannelAudio.prototype.generateRelayParam = function(dev) {
        if (undefined == dev) {
            console.error("args error in gen local res str")
        };
        return $.param({
            resolution: dev.product.audioCodec.name
        });
    };

    function DevicePostChannelMixed() {
        Channel.call(this, arguments);
        this.name = 'mixed';
    };
    $.ipc.inheritPrototype(DevicePostChannelMixed, Channel);
    DevicePostChannelMixed.prototype.generateLocalParam = function(dev) {
        if (undefined == dev) {
            console.error("args error in gen local res str")
        };
        return $.param({
            resolution: dev.currentVideoResolution.name,
            audio: dev.product.audioCodec.name,
            video: dev.product.videoCodec.name
        });
    };
    DevicePostChannelMixed.prototype.generateRelayParam = function(dev) {
        if (undefined == dev) {
            console.error("args error in gen local res str")
        };
        return $.param({
            resolution: dev.currentVideoResolution.name
        });
    };

    $.ipc.DevicePostChannelVideo = DevicePostChannelVideo;
    $.ipc.DevicePostChannelAudio = DevicePostChannelAudio;
    $.ipc.DevicePostChannelMixed = DevicePostChannelMixed;

})(jQuery);