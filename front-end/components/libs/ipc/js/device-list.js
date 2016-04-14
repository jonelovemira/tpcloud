(function($) {
    "use strict";

    $.ipc = $.ipc || {};

    function DeviceList() {

        $.ipc.Model.call(this, arguments);

        this.owner = null;
        this.url == null;
        this.upgradeList = [];
        this.devices = [];
        this.lastActiveDeviceId = null;
        this.playedDeviceChanged = false;
    };

    $.ipc.inheritPrototype(DeviceList, $.ipc.Model);

    var deviceListErrorCodeInfo = {
        100: function() {
            console.log("Session timeout or invaild");
        },
        1000: function() {
            console.log("email is needed");
        },
        1002: function() {
            console.log("email format is invalid");
        },
        1006: function() {
            console.log("account does not exist");
        },
        1007: function() {
            console.log("account has already been activated");
        },
    };

    DeviceList.prototype.errorCodeCallbacks = DeviceList.prototype.extendErrorCodeCallback({
        "errorCodeCallbackMap": deviceListErrorCodeInfo
    });

    DeviceList.prototype.clearNc200UpgradeCookie = function(response) {
        if (response && response.msg) {
            for (var i = 0; i < response.msg.length; i++) {
                if (undefined == response.msg[i].needForceUpgrade || 0 == response.msg[i].needForceUpgrade) {
                    $.removeCookie(response.msg[i].id);
                }
            };
        };
    };

    DeviceList.prototype.updateFromNc200UpgradeCookie = function(response) {
        if (response) {
            for (var i = 0; i < response.msg.length; i++) {
                if ($.cookie(response.msg[i].id)) {
                    response.msg[i].system_status = $.cookie(response.msg[i].id);
                };
            };
        };
        return response;
    };

    DeviceList.prototype.getDeviceList = function(inputCallbacks, extendArgs) {
        if (undefined == this.owner) {
            console.error("owner of device list is undefined")
        };
        var result = {};
        var data = {};
        var changeStateFunc = function(response) {
            var oldDevices = this.devices;

            this.devices = [];

            this.clearNc200UpgradeCookie(response);
            response = this.updateFromNc200UpgradeCookie(response);

            for (var i = 0; i < response.msg.length; i++) {
                var newDevice = new $.ipc.Device();
                newDevice.init(response.msg[i]);
                newDevice.owner = this.owner;
                this.devices.push(newDevice);
            };

            for (var i = 0; i < oldDevices.length; i++) {
                var tmpIndex = this.findIndexForId(oldDevices[i].id);
                if (tmpIndex >= 0 && tmpIndex < this.devices.length) {
                    $.extend(true, oldDevices[i], response.msg[tmpIndex]);
                    this.devices[tmpIndex] = oldDevices[i];
                } else {
                    oldDevices[i].clearRubbish();
                }
            };

            for (var i = 0; i < this.devices.length; i++) {
                var device = this.devices[i];
                var args = null;
                !device.isSameRegion && (args = {
                    email: this.owner.email,
                    id: device.id,
                    urlPrefix: "https://jp-alpha.tplinkcloud.com"
                }) && device.get(args, undefined, extendArgs);
            };

            var activeDeviceArr = this.findActiveDeviceArr();
            this.playedDeviceChanged = false;
            if (activeDeviceArr.length <= 0 && this.devices.length > 0) {
                this.changeActiveDevice(undefined, this.devices[0]);
            };
        };

        var extendAjaxOptions = {
            headers: {
                "X-AutoRefresh": "false"
            }
        };

        if (extendArgs && extendArgs.ajax) {
            extendAjaxOptions = $.extend(true, extendAjaxOptions, extendArgs.ajax);
        };


        result["ajaxObj"] = this.makeAjaxRequest({
            url: "/getDeviceList",
            data: data,
            callbacks: inputCallbacks,
            extendAjaxOptions: extendAjaxOptions,
            changeState: changeStateFunc
        });
        return result;
    };

    DeviceList.prototype.findActiveDeviceArr = function() {
        var result = [];
        for (var i = 0; i < this.devices.length; i++) {
            if (this.devices[i].isActive == true) {
                result.push(this.devices[i]);
            }
        };
        return result;
    };

    DeviceList.prototype.findFirstActiveDevIndex = function() {
        var index = null;
        for (var i = 0; i < this.devices.length; i++) {
            if (this.devices[i].isActive == true) {
                index = i;
                break;
            };
        };
        return index;
    };

    DeviceList.prototype.changeActiveDevice = function(srcDevice, destDevice) {
        if (undefined == destDevice) {
            console.error("args error in setActiveDevice");
        };
        if (srcDevice != undefined) {
            srcDevice.isActive = false;
        };
        destDevice.isActive = true;
        this.playedDeviceChanged = true;
    };

    DeviceList.prototype.findIdForIndex = function(devIndex) {
        if (undefined == devIndex) {
            return undefined;
        };
        if (devIndex >= this.devices.length || devIndex < 0) {
            console.error("args error in findIdForIndex");
        };
        return this.devices[devIndex].id;
    };

    DeviceList.prototype.findIndexForId = function(devId) {
        for (var i = 0; i < this.devices.length; i++) {
            if (this.devices[i].id == devId) {
                return i;
            }
        };
        return undefined;
    };

    DeviceList.prototype.getUpgradeList = function(inputCallbacks) {
        if (undefined == this.owner || undefined == this.owner.email || undefined == this.owner.token) {
            console.error("args error in getUpgradeList");
            return;
        };
        var result = {};
        var data = {
            "REQUEST": "GETUPGRADELIST",
            "DATA": {
                "email": this.owner.email,
                "token": this.owner.token
            }
        };

        var changeStateFunc = function(response) {
            this.url = response.msg.url;
            this.upgradeList = response.msg.list;
        };

        var extendAjaxOptions = {
            contentType: "application/x-www-form-urlencoded;charset=utf-8"
        };

        result["ajaxObj"] = this.makeAjaxRequest({
            url: "/init.php",
            data: data,
            callbacks: inputCallbacks,
            changeState: changeStateFunc,
            extendAjaxOptions: extendAjaxOptions
        });
        return result;
    };

    DeviceList.prototype.upgradeAll = function(inputCallbacks) {
        if (undefined == this.owner || undefined == this.owner.email || undefined == this.owner.token || undefined == this.upgradeList) {
            console.error("args error in upgradeAll");
            return;
        };
        var result = {};
        var data = {
            "REQUEST": "EXEUPGRADELIST",
            "DATA": {
                "email": this.owner.email,
                "token": this.owner.token,
                "list": JSON.stringify(this.upgradeList)
            },
        };

        var extendAjaxOptions = {
            contentType: "application/x-www-form-urlencoded;charset=utf-8"
        };

        result["ajaxObj"] = this.makeAjaxRequest({
            url: "/init.php",
            data: data,
            callbacks: inputCallbacks,
            changeState: $.noop,
            extendAjaxOptions: extendAjaxOptions
        });
        return result;
    };

    $.ipc.DeviceList = DeviceList;

})(jQuery);