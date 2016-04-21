define(["Model", "inheritPrototype", "globalIpcProduct", "globalPlayerTypes"], 
    function (Model, inheritPrototype, globalIpcProduct, globalPlayerTypes) {
    function Software() {
        Model.call(this, arguments);
        this.products = [];
        this.plugins = [];
    }

    inheritPrototype(Software, Model);

    Software.prototype.getUpdateInfos = function(inputCallbacks) {
        var result = {};
        var changeStateFunc = function(response) {
            var productNameObjMap = {};

            for (var i = 0; i < response.msg.product.length; i++) {
                var productName = response.msg.product[i].model.toUpperCase();
                var product = globalIpcProduct[productName] || console.error("not a supportted product");
                product.released = response.msg.product[i].released;
                product.faqPath = response.msg.product[i].href;
                this.products.push(product);
                productNameObjMap[product.name] = product;
            };

            var tagPluginMap = {
                "ff_x86": globalPlayerTypes.PLUGIN_NON_IE_X86,
                "ff_x64": globalPlayerTypes.PLUGIN_NON_IE_X64,
                "ie_x86": globalPlayerTypes.PLUGIN_IE_X86,
                "ie_x64": globalPlayerTypes.PLUGIN_IE_X64,
                "mac": globalPlayerTypes.PLUGIN_MAC
            };

            for (var i = 0; i < response.msg.software.length; i++) {
                var plugin = tagPluginMap[response.msg.software[i].tags];
                if (plugin) {
                    var supportedModelsArr = response.msg.software[i].model.split(";");
                    for (var j = 0; j < supportedModelsArr.length; j++) {
                        if (undefined == productNameObjMap[supportedModelsArr[j]]) {
                            console.error("unknown model: " + supportedModelsArr[j]);
                        } else {
                            plugin.prototype.supportedModels.push(productNameObjMap[supportedModelsArr[j]]);
                        }
                    };
                    plugin.prototype.name = response.msg.software[i].name;
                    plugin.prototype.downloadPath = response.msg.software[i].path;
                    plugin.prototype.tags = response.msg.software[i].tags;
                    plugin.prototype.newestVersion = response.msg.software[i].version;
                    this.plugins.push(plugin);
                } else if (response.msg.software[i].name == "Firmware") {
                    globalIpcProduct[response.msg.software[i].model].firmwareDownloadPath = response.msg.software[i].path;
                    globalIpcProduct[response.msg.software[i].model].firmwareNewestVersion = response.msg.software[i].version;
                };
            };
        };

        result["ajaxObj"] = this.makeAjaxRequest({
            url: "/updateInfos",
            data: {},
            callbacks: inputCallbacks,
            changeState: changeStateFunc
        });
        return result;
    };

    return Software;
})