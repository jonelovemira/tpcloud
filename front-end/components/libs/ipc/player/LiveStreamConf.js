define(function () {
    function LiveStreamConf() {
        this.mimeType = null;
        this.orderedPlayerTypeArr = null;
        this.playerType = null;
        this.supportVideoResArr = [];
        this.smallImgCssClass = null;
        this.middleImgCssClass = null;
        this.postDataChannel = null;
        this.audioCodec = null;
        this.videoCodec = null;
    };

    return LiveStreamConf;
});