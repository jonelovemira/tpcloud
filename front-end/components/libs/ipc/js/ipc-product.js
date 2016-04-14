(function($) {
    "use strict";

    $.ipc = $.ipc || {};

    function IpcProduct() {
        this.name = null;
        this.supportVideoResArr = [];
        this.mimeType = null;
        this.smallImgCssClass = null;
        this.middleImgCssClass = null;
        this.playerType = null;
        this.videoDataChannel = null;
        this.released = null;
        this.faqPath = null;
        this.pluginPlayer = null;
        this.firmwareDownloadPath = null;
        this.firmwareNewestVersion = null;
        this.audioCodec = null;
    };

    $.ipc.IpcProduct = IpcProduct;

    if ($.ipc.config && $.ipc.config.presetLinkieData) {
        var linkieData = $.ipc.config.presetLinkieData;
        for (var key in linkieData) {
            var d = new $.ipc.Device();
            d.model = key;
            $.ipc[key] = d.getProductFromLinkieData(linkieData[key]["DEFAULT"]);
        }
    }

})(jQuery);