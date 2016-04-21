define(["Device", "inheritPrototype", "presetLinkieData"], 
    function (Device, inheritPrototype, presetLinkieData) {
    function DeviceWithLinkie() {
        Device.call(this, arguments);
    };

    inheritPrototype(DeviceWithLinkie, Device);

    DeviceWithLinkie.prototype.getLocalLinkieData = function() {
        var key = this.model.substring(0, 5).toUpperCase();
        var result;
        if (presetLinkieData[key]) {
            result = presetLinkieData[key][this.fwVer];
        }
        return result;
    };

    DeviceWithLinkie.prototype.updateLocalLinkieDataList = function(data) {
        var key = this.model.substring(0, 5).toUpperCase();
        if (undefined == presetLinkieData[key]) {
            presetLinkieData[key] = {};
        }
        presetLinkieData[key][this.fwVer] = data;
    };

    DeviceWithLinkie.prototype.isNeedGetLinkie = function() {
        var result = true;
        var key = this.model.substring(0, 5).toUpperCase();
        if (presetLinkieData[key] && presetLinkieData[key][this.fwVer]) {
            result = false;
        }
        return result;
    };

    DeviceWithLinkie.prototype.getLinkie = function(args, inputCallbacks) {
        if (undefined == args.token || undefined == args.appServerUrl) {
            console.error("args error in getLocalInfo");
        };
        var result = {};
        var validateResult = (!this.validateIdFormat(args.id).code && this.validateIdFormat(args.id));
        if (validateResult.code == false) {
            result["validateResult"] = validateResult;
            return result;
        };
        if (!this.isNeedGetLinkie()) {
            console.log("linkie data is already in cache when getLinkie. " +
                "passthrough to get linkie data anyway.");
        }

        var changeStateFunc = function(response) {
            if (response && response.result && response.result.responseData) {
                this.updateLocalLinkieDataList(response.result.responseData);
            };
        };
        var _self = this;
        inputCallbacks = inputCallbacks || {};
        inputCallbacks.errorCodeCallbackMap = inputCallbacks.errorCodeCallbackMap || {};
        var tmpFunc = inputCallbacks.errorCodeCallbackMap["-51207"];
        inputCallbacks.errorCodeCallbackMap["-51207"] = function() {
            _self.updateLocalLinkieDataList("-51207");
            tmpFunc && tmpFunc();
        };

        var data = JSON.stringify({
            "method": "passthrough",
            "params": {
                "requestData": {
                    "command": "LINKIE",
                    "content": {
                        "smartlife.cam.ipcamera.liveStream": {
                            "get_modules": {}
                        }
                    }
                },
                "deviceId": args.id
            }
        });

        result["ajaxObj"] = this.makeAjaxRequest({
            url: args.appServerUrl + "?token=" + args.token,
            data: data,
            changeState: changeStateFunc,
            errCodeStrIndex: "error_code",
            callbacks: inputCallbacks
        }, "xDomain");
        return result;
    };

    return DeviceWithLinkie;
})