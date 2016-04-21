define(function () {
    function PlayerContainerCss() {
        this.player = {};
        this.loadingImg = {};
        this.loadingTips = {};
        this.controlBoard = {};
    };

    var vgaPlayerContainerCss = new PlayerContainerCss();
    vgaPlayerContainerCss.player = {
        width: 640,
        height: 480,
        "margin-left": "103px"
    };

    vgaPlayerContainerCss.loadingImg = {
        left: "400px",
        top: "270px"
    };
    vgaPlayerContainerCss.loadingTips = {
        "right": "4px"
    };
    vgaPlayerContainerCss.controlBoard = {
        width: vgaPlayerContainerCss.player.width
    };

    var qvgaPlayerContainerCss = new PlayerContainerCss();
    qvgaPlayerContainerCss.player = {
        width: 640,
        height: 480,
        "margin-left": "103px"
    };
    qvgaPlayerContainerCss.loadingImg = {
        left: "400px",
        top: "270px"
    };
    qvgaPlayerContainerCss.loadingTips = {
        "right": "4px"
    };
    qvgaPlayerContainerCss.controlBoard = {
        width: qvgaPlayerContainerCss.player.width
    };

    var hdPlayerContainerCss = new PlayerContainerCss();
    hdPlayerContainerCss.player = {
        width: 768,
        height: 432,
        "margin-left": "40px"
    };
    hdPlayerContainerCss.loadingImg = {
        left: "400px",
        top: "250px"
    };
    hdPlayerContainerCss.loadingTips = {
        "right": "4px"
    };
    hdPlayerContainerCss.controlBoard = {
        width: hdPlayerContainerCss.player.width
    };

    var fullhdPlayerContainerCss = new PlayerContainerCss();
    fullhdPlayerContainerCss.player = {
        width: 768,
        height: 432,
        "margin-left": "40px"
    };
    fullhdPlayerContainerCss.loadingImg = {
        left: "400px",
        top: "250px"
    };
    fullhdPlayerContainerCss.loadingTips = {
        "right": "4px"
    };
    fullhdPlayerContainerCss.controlBoard = {
        width: fullhdPlayerContainerCss.player.width
    };

    var globalPlayerContainerCss = {};
    globalPlayerContainerCss["vga"] = vgaPlayerContainerCss;
    globalPlayerContainerCss["qvga"] = qvgaPlayerContainerCss;
    globalPlayerContainerCss["hd"] = hdPlayerContainerCss;
    globalPlayerContainerCss["fullhd"] = fullhdPlayerContainerCss;

    return globalPlayerContainerCss;
});