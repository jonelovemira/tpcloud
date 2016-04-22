define(["User", "Model", "inheritPrototype", "jquery", "Cookies", "Error", "tips", "globalIpcProduct", 'IpcProduct'], 
    function (User, Model, inheritPrototype, $, Cookies, Error, tips, globalIpcProduct, IpcProduct) {
    function Device() {
        Model.call(this, arguments);
        this.owner = null;
        this.id = null;
        this.type = null;
        this.model = null;
        this.mac = null;
        this.isOnline = null;
        this.fwVer = null;
        this.appServerUrl = null;
        this.name = null;
        this.isSameRegion = null;
        this.webServerUrl = null;
        this.azIP = null;
        this.azDNS = null;
        this.systemStatus = null;
        this.needForceUpgrade = null;
        this.fwUrl = null;
        this.relayVideoTime = 600;

        this.hasGetCrossRegionInfo = false;
        this.hasUpgradOnce = null;

        this.product = null;
    };

    inheritPrototype(Device, Model);

    var deviceErrorCodeInfo = {
        "-20501": function() {
            console.log("device id does not exists");
        },
        "-20506": function() {
            console.log("device was binded to another account");
        },
        "-20507": function() {
            console.log("device is not binded to any account");
        },
        "-20571": function() {
            console.log("device is offline now");
        },
        "-20572": function() {
            console.log("alias format is incorrect");
        },
        "-20651": function() {
            console.log("token is invalid, plz relogin");
        },
        "-20675": function() {
            console.log("account is login at another place");
        },
    };

    Device.prototype.errorCodeCallbacks = Device.prototype.extendErrorCodeCallback({
        "errorCodeCallbackMap": deviceErrorCodeInfo
    }); 
    Device.prototype.stateChangeCallbacks = $.Callbacks("unique stopOnFalse");
    Device.prototype.init = function(d) {
        if (undefined == d) {
            console.error("args error in init");
        };
        $.extend(true, this, d);
        var p = this.model.substring(0, 5).toUpperCase();
        var tmpProduct = new IpcProduct();
        $.extend(true, tmpProduct, globalIpcProduct[p]);
        this.product = tmpProduct;
    };
    Device.prototype.get = function(args, inputCallbacks, extendArgs) {
        if (this.owner == undefined) {
            console.error("owner is undefined");
        }
        var result = {};
        var validateResult = (!this.owner.validateEmailFormat(args.email).code && this.owner.validateEmailFormat(args.email)) ||
            (!this.validateIdFormat(args.id).code && this.validateIdFormat(args.id));
        if (validateResult.code == false) {
            result["validateResult"] = validateResult;
            return result;
        };

        var urlPrefix = this.BACK_END_WEB_PROTOCAL + this.webServerUrl;
        var dataRes = {
            "email": args.email,
            "id": args.id
        };
        if (extendArgs) {
            var dataRes = $.extend(true, dataRes, extendArgs.data);
        };
        var data = JSON.stringify(dataRes);

        var changeStateFunc = function(response) {
            this.init(response.msg);
            this.isSameRegion = true;
            this.hasGetCrossRegionInfo = true;
            this.stateChangeCallbacks.fire(this);
        };

        result["ajaxObj"] = this.makeAjaxRequest({
            url: urlPrefix + "/getCamera",
            data: data,
            callbacks: inputCallbacks,
            changeState: changeStateFunc,
            extendAjaxOptions: extendAjaxOptions
        }, "xDomain");
        return result;
    };

    Device.prototype.addNc200UpgradeCookie = function() {
        var device = this;
        var deviceModel = device.model;
        var fwVer = device.firmware;
        var deviceHwVer = device.hardware;
        if (deviceModel == "NC200(UN)" && fwVer == "2.1.3 Build 151125 Rel.24992" && deviceHwVer == "1.0") {
            var date = new Date();
            var minutes = 10;
            date.setTime(date.getTime() + (minutes * 60 * 1000));
            Cookies.set(device.id, "upgrading", {
                expires: date
            });
        };
    };

    Device.prototype.upgrade = function(args, inputCallbacks) {
        if (undefined == this.owner || undefined == this.owner.token ||
            undefined == this.owner.email || undefined == args.fwUrl ||
            undefined == args.mac || undefined == args.azIP ||
            undefined == args.azDNS || undefined == this.webServerUrl) {
            console.error("args error in upgrade");
        }
        var result = {};
        var urlPrefix = this.BACK_END_WEB_PROTOCAL + this.webServerUrl;

        var data = {
            "REQUEST": "FIRMWAREUPGRADE",
            "DATA": {
                "account": this.owner.email,
                "User-Agent": "Web-ffx86-2.0",
                "command": "UPGRADE\n" + args.fwUrl + "\n",
                "dev_address": args.mac + "@" + args.azIP + "@" + args.azDNS,
                "token": this.owner.token,
            },
        };

        var changeStateFunc = function(response) {
            this.systemStatus = "downloading";
            this.hasUpgradOnce = true;
            this.stateChangeCallbacks.fire(this);

            this.addNc200UpgradeCookie();
        };

        var extendAjaxOptions = {
            contentType: "application/x-www-form-urlencoded;charset=utf-8"
        };

        result["ajaxObj"] = this.makeAjaxRequest({
            url: urlPrefix + "/init.php",
            data: data,
            callbacks: inputCallbacks,
            changeState: changeStateFunc,
            extendAjaxOptions: extendAjaxOptions
        }, "xDomain");

        return result;
    };

    Device.prototype.changeName = function(args, inputCallbacks) {
        if (undefined == this.owner || undefined == this.owner.token || undefined == this.appServerUrl) {
            console.error("args error in changeName")
        };
        var result = {};
        var validateResult = (!this.validateIdFormat(args.id).code && this.validateIdFormat(args.id)) ||
            (!this.validateNameFormat(args.name).code && this.validateNameFormat(args.name));
        if (validateResult.code == false) {
            result["validateResult"] = validateResult;
            return result;
        };

        var data = JSON.stringify({
            "method": "setAlias",
            "params": {
                "alias": args.name,
                "deviceId": args.id
            }
        });

        var changeStateFunc = function(response) {
            this.name = args.name;
            this.stateChangeCallbacks.fire(this);
        };

        result["ajaxObj"] = this.makeAjaxRequest({
            url: this.appServerUrl + "?token=" + this.owner.token,
            data: data,
            changeState: changeStateFunc,
            errCodeStrIndex: "error_code",
            callbacks: inputCallbacks,
        }, "xDomain");

        return result;
    };

    Device.prototype.unbind = function(args, inputCallbacks) {
        if (undefined == this.owner || undefined == this.owner.token ||
            undefined == this.appServerUrl) {
            console.error("args error in unbind");
        };
        var result = {};
        var validateResult = (!this.owner.validateAccount(args.account).code && this.owner.validateAccount(args.account)) ||
            (!this.validateIdFormat(args.id).code && this.validateIdFormat(args.id));
        if (validateResult.code == false) {
            result["validateResult"] = validateResult;
            return result;
        };

        var data = JSON.stringify({
            "method": "unbindDevice",
            "params": {
                "cloudUserName": args.account,
                "deviceId": args.id
            }
        });

        result["ajaxObj"] = this.makeAjaxRequest({
            url: this.appServerUrl + "?token=" + this.owner.token,
            data: data,
            changeState: $.noop,
            errCodeStrIndex: "error_code",
            callbacks: inputCallbacks
        }, "xDomain");
        return result;
    };

    Device.prototype.getLocalInfo = function(args, inputCallbacks) {
        if (undefined == args.token || undefined == args.appServerUrl) {
            console.error("args error in getLocalInfo");
        }
        var result = {};
        var validateResult = (!this.validateIdFormat(args.id).code && this.validateIdFormat(args.id));
        if (validateResult.code == false) {
            result["validateResult"] = validateResult;
            return result;
        };

        var data = JSON.stringify({
            "method": "passthrough",
            "params": {
                "requestData": {
                    "command": "GET_EXTRA_INFO",
                    "content": 0
                },
                "deviceId": args.id
            }
        });
        var changeStateFunc = function(response) {
            var passthroughResult = response.result.responseData;
            if (0 == passthroughResult.errCode) {
                $.extend(true, this, passthroughResult.msg);
                this.stateChangeCallbacks.fire(this);
            };
        }

        result["ajaxObj"] = this.makeAjaxRequest({
            url: args.appServerUrl + "?token=" + args.token,
            data: data,
            changeState: changeStateFunc,
            errCodeStrIndex: "error_code",
            callbacks: inputCallbacks
        }, "xDomain");
        return result;
    };

    Device.prototype.validateIdFormat = function(tmpId) {
        if (undefined == tmpId) {
            console.error("args error in validateIdFormat");
            return;
        };
        var e = new Error();
        e.code = true;
        e.msg = "OK";
        return e;
    };

    Device.prototype.validateNameFormat = function(tmpName) {
        if (undefined == tmpName) {
            console.error("args error in validateNameFormat");
            return;
        };

        var validateArgs = {
            "attr": tmpName,
            "attrEmptyMsg": tips.types.deviceName.cantBeEmpty,
            "maxLength": 31,
            "minLength": 1,
            "attrOutOfLimitMsg": tips.types.deviceName.outOfLimit,
            "pattern": /^[^\x00-\x1F\x7F{}<>'"=:&\x2f\x5c]{1,31}$/,
            "patternTestFailMsg": tips.types.deviceName.invalid,
        };
        return this.validateAttr(validateArgs);
    };

    return Device;
})