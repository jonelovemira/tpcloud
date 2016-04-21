define(function () {
    function findBrowserOS() {
        if (navigator.appVersion.indexOf("Win") != -1) return "Windows";
        if (navigator.appVersion.indexOf("Mac") != -1) return "MacOS";
        if (navigator.appVersion.indexOf("X11") != -1) return "Unix";
        if (navigator.appVersion.indexOf("Linux") != -1) return "Linux";
        return "unkown OS";
    }

    function findBrowserTypeVersion() {
        var ua = navigator.userAgent,
            tem,
            M = ua.match(/(opera|chrome|safari|firefox|msie|edge|trident(?=\/))\/?\s*(\d+)/i) || [];
        for (var ieVer = 0; ieVer < 12; ieVer++) {
            var b = document.createElement('b')
            b.innerHTML = '<!--[if IE ' + ieVer + ']><i></i><![endif]-->';
            if (b.getElementsByTagName('i').length === 1) {
                return "MSIE " + ieVer;
            };
        };
        if (/trident/i.test(M[1])) {
            tem = /\brv[ :]+(\d+)/g.exec(ua) || [];
            return 'MSIE ' + (tem[1] || '');
        };
        if (M[1] === 'Chrome') {
            tem = ua.match(/\bOPR\/(\d+)/);
            if (tem != null) return 'Opera ' + tem[1];
            tem = ua.match(/Edge\/(\d+)/);
            if (tem != null) return 'Edge ' + tem[1];
        }
        M = M[2] ? [M[1], M[2]] : [navigator.appName, navigator.appVersion, '-?'];
        if ((tem = ua.match(/version\/(\d+)/i)) != null) M.splice(1, 1, tem[1]);
        return M.join(' ');
    };

    var browserTypeVersion = findBrowserTypeVersion();

    var browser = {
        os: findBrowserOS(),
        platform: navigator.platform,
        type: browserTypeVersion.split(' ')[0],
        version: browserTypeVersion.split(' ')[1],
        userAgent: navigator.userAgent
    };

    return browser;
});