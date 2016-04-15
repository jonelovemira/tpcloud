(function($) {
    "use strict";

    $.ipc = $.ipc || {};

    function ieXDomainAjax(options) {
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

        xdr.onerror = function() {
            (options.error || function(xdr) {})(xdr);
        }

        xdr.ontimeout = function() {
            (options.error || function(xdr) {})(xdr);
        }

        xdr.onload = function() {
            var response = $.parseJSON(xdr.responseText);
            (options.success || function(resp) {})(response);
        }

        xdr.onprogress = function() {
            (options.onprogress || function(xdr) {})(xdr);
        }

        if (newOptions.contentType.indexOf("x-www-form-urlencoded") >= 0) {
            newOptions.data = $.param(newOptions.data);
        };

        xdr.timeout = newOptions.timeout;
        xdr.open(newOptions.type, newOptions.url);
        xdr.send(newOptions.data);
    };

    function normalAjax(options) {
        var newOptions = $.extend(true, {}, $.xAjax.normalAjaxDefaults, options);

        if (newOptions.url == undefined) {
            console.error("options.url in undefined in normalAjax");
            return;
        }

        newOptions.beforeSend = function() {
            (options.beforeSend || function() {})();
        }
        newOptions.complete = function(xhr) {
            var ajaxContext = this;
            $.proxy((options.complete || function(xhr) {}), ajaxContext)(xhr);
        }
        newOptions.error = function(xhr) {
            (options.error || function(xhr) {})(xhr);
        }
        newOptions.success = function(response) {
            var ajaxContext = this;
            $.proxy((options.success || function(resp) {}), ajaxContext)(response);
        }

        var ajaxObj = $.ajax(newOptions);
        return ajaxObj;
    };

    var browserAjaxMap = {
        "MSIE 8": ieXDomainAjax,
        "MSIE 9": ieXDomainAjax,
        "MSIE 10": ieXDomainAjax
    };

    $.xAjax = function(options, xDomain) {
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
        headers: {
            Accept: "application/json, */*; version=1.0; charset=utf-8;"
        },
        timeout: 60000,
        async: true,
        global: false
    };

    $.xAjax.ieXDomainAjaxDefaults = {
        timeout: 60000,
        type: "post",
        data: {}
    };

    $.xAjax.defaults = {
        xType: "xDomain"
    };

    var xDomainStr = $.xAjax.defaults.xType;
    var xDomainAjaxMap = {};
    xDomainAjaxMap[xDomainStr] = browserAjaxMap[$.ipc.Browser.prototype.type + ' ' + $.ipc.Browser.prototype.version] || normalAjax;

})(jQuery);