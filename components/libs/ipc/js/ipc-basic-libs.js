(function ($) {

    "use strict";

    $.ipc = $.ipc || {};

    function findBrowserOS () {
        if (navigator.appVersion.indexOf("Win")!=-1) return "Windows";
        if (navigator.appVersion.indexOf("Mac")!=-1) return "MacOS";
        if (navigator.appVersion.indexOf("X11")!=-1) return "Unix";
        if (navigator.appVersion.indexOf("Linux")!=-1) return "Linux";
        return "unkown OS";
    }

    function findBrowserTypeVersion(){
        var ua= navigator.userAgent, tem, 
        M= ua.match(/(opera|chrome|safari|firefox|msie|edge|trident(?=\/))\/?\s*(\d+)/i) || [];
        for (var ieVer = 0; ieVer < 12; ieVer++) {
            var b = document.createElement('b')
            b.innerHTML = '<!--[if IE ' + ieVer + ']><i></i><![endif]-->';
            if( b.getElementsByTagName('i').length === 1 ) {
                return "MSIE " + ieVer;
            };
        };
        if(/trident/i.test(M[1])){
            tem=  /\brv[ :]+(\d+)/g.exec(ua) || [];
            return 'MSIE '+(tem[1] || '');
        }
        if(M[1]=== 'Chrome'){
            tem= ua.match(/\bOPR\/(\d+)/);
            if(tem!= null) return 'Opera '+tem[1];
            tem = ua.match(/Edge\/(\d+)/);
            if(tem!= null) return 'Edge '+tem[1];
        }
        M= M[2]? [M[1], M[2]]: [navigator.appName, navigator.appVersion, '-?'];
        if((tem= ua.match(/version\/(\d+)/i))!= null) M.splice(1, 1, tem[1]);
        return M.join(' ');
    };

    var browserTypeVersion = findBrowserTypeVersion();
    
    function Browser() {};
    Browser.prototype.os = findBrowserOS();
    Browser.prototype.platform = navigator.platform;
    Browser.prototype.type = browserTypeVersion.split(' ')[0];
    Browser.prototype.version = browserTypeVersion.split(' ')[1];

    $.ipc.Browser = Browser;

})(jQuery);


(function ($) {
    "use strict";

    $.ipc = $.ipc || {};

    function ieXDomainAjax(options){    
        if (window.XDomainRequest == undefined) {
            console.error("no XDomainRequest in current browser");
            return;
        }
        var xdr = new XDomainRequest();
        if (xdr == undefined) {
            console.error("can not create XDomainRequest instance");
            return;
        };

        var newOptions = $.extend(true, {}, $.xAjax.ieXDomainAjaxDefaults, options);

        if (newOptions.url == undefined) {
            console.error("no url in ieXDomainAjax");
            return;
        };

        xdr.onerror = function(){
            (options.error || function(xdr){})(xdr);
        }

        xdr.ontimeout = function(){
            (options.error || function(xdr){})(xdr);
        }

        xdr.onload = function(){
            var response = $.parseJSON(xdr.responseText);
            (options.success || function(resp){})(response);
        }

        xdr.onprogress = function(){
            (options.onprogress || function(xdr){})(xdr);
        }

        if (newOptions.contentType.indexOf("x-www-form-urlencoded")>=0) {
            newOptions.data = $.param(newOptions.data);
        };

        xdr.timeout = newOptions.timeout;
        xdr.open(newOptions.type, newOptions.url);
        xdr.send(newOptions.data);
    };

    function normalAjax (options) {
        var newOptions = $.extend(true, {}, $.xAjax.normalAjaxDefaults, options);
    
        if (newOptions.url == undefined) {
            console.error("options.url in undefined in normalAjax");
            return;
        }

        newOptions.beforeSend = function(){
            (options.beforeSend || function(){})();
        }
        newOptions.complete = function(xhr){
            var ajaxContext = this;
            $.proxy((options.complete || function(xhr){}), ajaxContext)(xhr);
        }
        newOptions.error = function(xhr){
            (options.error || function(xhr){})(xhr);
        }
        newOptions.success = function(response){
            var ajaxContext = this;
            $.proxy((options.success || function(resp){}), ajaxContext)(response);
        }

        var ajaxObj = $.ajax(newOptions);
        return ajaxObj;
    };

    var browserAjaxMap = {
        "MSIE 8": ieXDomainAjax,
        "MSIE 9": ieXDomainAjax,
        "MSIE 10": ieXDomainAjax
    };

    $.xAjax = function(options, xDomain)
    {
        var ajaxFunction = xDomainAjaxMap[xDomain] || normalAjax;
        var ajaxObj = ajaxFunction(options);
        return ajaxObj;
    };

    $.xAjax.normalAjaxDefaults = {
        type: "post",
        data: {},
        dataType: "json",              
        cache: false,
        contentType: "application/json;charset=utf-8",
        headers: {Accept: "application/json, */*; version=1.0; charset=utf-8;"},
        timeout: 60000,
        async: true,
        global: false
    };

    $.xAjax.ieXDomainAjaxDefaults = {
        timeout : 60000,
        type : "post",
        data : {}
    };

    $.xAjax.defaults = {
        xType : "xDomain"
    };

    var xDomainStr = $.xAjax.defaults.xType;
    var xDomainAjaxMap = {};
    xDomainAjaxMap[xDomainStr] = browserAjaxMap[$.ipc.Browser.prototype.type + ' ' + $.ipc.Browser.prototype.version] || normalAjax;

})(jQuery);

(function ($) {
    "use strict";

    $.ipc = $.ipc || {};

    $.ipc.compareVersion = function versionCompare(v1, v2, options) {
        var defaultOptions = {
            lexicographical: false,
            zeroExtend: true
        };
        var _options = $.extend(true, defaultOptions, options);
        var lexicographical = _options && _options.lexicographical,
            zeroExtend = _options && _options.zeroExtend,
            v1parts = v1.split('.'),
            v2parts = v2.split('.');

        function isValidPart(x) {
            return (lexicographical ? /^\d+[A-Za-z]*$/ : /^\d+$/).test(x);
        }

        if (!v1parts.every(isValidPart) || !v2parts.every(isValidPart)) {
            return NaN;
        }

        if (zeroExtend) {
            while (v1parts.length < v2parts.length) v1parts.push("0");
            while (v2parts.length < v1parts.length) v2parts.push("0");
        }

        if (!lexicographical) {
            v1parts = v1parts.map(Number);
            v2parts = v2parts.map(Number);
        }

        for (var i = 0; i < v1parts.length; ++i) {
            if (v2parts.length == i) {
                return 1;
            }

            if (v1parts[i] == v2parts[i]) {
                continue;
            }
            else if (v1parts[i] > v2parts[i]) {
                return 1;
            }
            else {
                return -1;
            }
        }

        if (v1parts.length != v2parts.length) {
            return -1;
        }

        return 0;
    };
})(jQuery);

(function ($) {

    "use strict";

    $.ipc = $.ipc || {};
    
    $.ipc.inheritPrototype = function (subType, baseType) {
        if (undefined == baseType || undefined == subType) {
            console.error( "args error in inherit");
        };

        subType.prototype = $.ipc.create(baseType.prototype);
        subType.prototype.constructor = subType;
    };

    $.ipc.initClassPrototype = function(tmp, classPrototype) {
        if (undefined == tmp || undefined == classPrototype) {
            console.error("args error in initClassPrototype");
        };
        var cloneTmp = $.extend(true, {}, tmp);
        $.extend(true, classPrototype, cloneTmp);
    };
})(jQuery);