(function ($) {
    
    $.BrowserTypeVersion = (function(){
        var ua= navigator.userAgent, tem, 
        M= ua.match(/(opera|chrome|safari|firefox|msie|edge|trident(?=\/))\/?\s*(\d+)/i) || [];
        if(/trident/i.test(M[1])){
            tem=  /\brv[ :]+(\d+)/g.exec(ua) || [];
            return 'IE '+(tem[1] || '');
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
    })();

    function ieXDomainAjax(options){    
        if (window.XDomainRequest == undefined) {
            throw "no XDomainRequest in current browser";
            return;
        }
        var xdr = new XDomainRequest();
        if (xdr == undefined) {
            throw "can not create XDomainRequest instance";
            return;
        };

        var newOptions = $.extend({}, $.xAjax.ieXDomainAjaxDefaults, options);

        if (newOptions.url == undefined) {
            throw "no url in ieXDomainAjax";
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

        xdr.timeout = newOptions.timeout;
        xdr.open(newOptions.type, newOptions.url);
        xdr.send(newOptions.data);
    };

    function normalAjax (options) {
        var newOptions = $.extend({}, $.xAjax.normalAjaxDefaults, options);
    
        if (newOptions.url == undefined) {
            throw "options.url in undefined in normalAjax";
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
        type : "post",
        data : {},
        dataType : "json",              
        cache : false,
        contentType : "application/json;charset=utf-8",
        headers: {Accept : "application/json; version=1.0; charset=utf-8"},
        timeout : 60000,
        async : true,
        global : false
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
    xDomainAjaxMap[xDomainStr] = browserAjaxMap[$.BrowserTypeVersion] || normalAjax;

})(jQuery);