define(["PluginPlayer", "inheritPrototype"], function (PluginPlayer, inheritPrototype) {
    function H264PluginPlayer() {
        PluginPlayer.call(this, arguments);
    };
    inheritPrototype(H264PluginPlayer, PluginPlayer);

    H264PluginPlayer.prototype.feedMyArgs = function() {
        var _self = this;
        _self.playerObj.streamtype = _self.device.product.liveStreamConf.videoCodec.pluginStreamTypeCode;
        _self.playerObj.streamresolution = _self.device.currentVideoResolution.pluginStreamResCode;
        _self.playerObj.audiostreamtype = _self.device.product.liveStreamConf.audioCodec.pluginAudioTypeCode;
    };

    H264PluginPlayer.prototype.setResolution = function(val) {
        var code = this.device.currentVideoResolution.pluginStreamResCode;
        this.playerObj.ChangeStreamResolution(code);
    };

    return H264PluginPlayer;
})