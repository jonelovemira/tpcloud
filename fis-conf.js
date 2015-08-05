fis.config.set('roadmap.path', [
    {
        reg : '**.md',
        release : false,
        isHtmlLike : true
    },
    {
        reg : /^\/common\/(.*html)$/,
        isBaseTemplateFile : true,
        release : '/public/common/$1'
    },  
    {
        reg : /^\/common\/(.*)$/i,
        release : '/public/common/$1'
    },
    {
        reg : /^\/components\/(.*)$/i,
        id : '${name}/${version}/$1',
        //追加isComponents标记属性
        isComponents : true,
        release : '/public/components/$1'
    },
    {
        reg : /^\/views\/(.*html)$/,
        isChildTemplateFile : true,
        release : '/public/views/$1',
    },
    {
        reg : /^\/views\/(.*)$/,
        isViews : true,
        release : '/public/views/$1',
    },
    {
        reg : '**',
        useStandard : false,
        useOptimizer : false
    }
]);

var createFrameworkConfig = function(ret, conf, settings, opt){
    var map = {};
    map.deps = {};
    //别名收集表
    map.alias = {};

    fis.util.map(ret.src, function(subpath, file){
        //添加判断，只有components和component_modules目录下的文件才需要建立依赖树或别名
        if(file.isComponents || file.isComponentModules){
            //判断一下文件名和文件夹是否同名，如果同名则建立一个别名
            var match = subpath.match(/^\/components\/(.*?([^\/]+))\/\2\.js$/i);
            if(match && match[1] && !map.alias.hasOwnProperty(match[1])){
                map.alias[match[1]] = file.id;
            }
            if(file.requires && file.requires.length){
                map.deps[file.id] = file.requires;
            }
        }
    });
    var stringify = JSON.stringify(map, null, opt.optimize ? null : 4);
    fis.util.map(ret.src, function(subpath, file){
        if(file.isViews && (file.isJsLike || file.isHtmlLike)){
            var content = file.getContent();
            content = content.replace(/\b__FRAMEWORK_CONFIG__\b/g, stringify);
            file.setContent(content);
        }
    });
};

var getBaseFileId = function (childFile){
    var tagArrs = getTagArrKeyValue(childFile);
    return tagArrs["extends"];
}

var templateInherit = function (childFile, baseFile) {
    // body...
    var childTagArr = getTagArrKeyValue(childFile);
    var baseTagArr = getTagArrKeyValue(baseFile);

    var baseContent = baseFile.getContent();
    var childContent = childFile.getContent();
    var lastAddedLength = 0;
    for (var block in childTagArr['block']) {

        for (var i = 0; i < baseTagArr['block'][block].length; i++) {
            baseTagArr['block'][block][i] += lastAddedLength;
        };


        var preContent = baseContent.substring(0, baseTagArr['block'][block][0]);
        var lastContent = baseContent.substring(baseTagArr['block'][block][3] + 1);
        var currentBaseBlockLength = baseTagArr['block'][block][3] - baseTagArr['block'][block][0] + 1;
        var addedContent = childContent.substring(childTagArr['block'][block][1] + 1, childTagArr['block'][block][2]);
        lastAddedLength += addedContent.length - currentBaseBlockLength;
        baseContent = preContent + addedContent + lastContent;
    };

    return baseContent;
}

var getTagArrKeyValue = function (fileObj) {
// var getTagArrKeyValue = function (content) {
    // body...
    var content = fileObj.getContent();
    var tagArr = content.match(/\{%[^\}]*%\}/g);

    var tagArrKeyValue = {};
    var extendsTag = "extends";
    var blockTag = "block";
    var endBlockTag = "endblock";
    tagArrKeyValue[blockTag] = {};
    var lastBlockIndex = 0;

    for (var i = 0; i < tagArr.length; i++) {
        
        var extendsIndex = tagArr[i].indexOf(extendsTag);
        var blockIndex = tagArr[i].indexOf(blockTag);
        if (-1 != extendsIndex) {
            var value = tagArr[i].substring(extendsIndex + extendsTag.length, tagArr[i].length - 2);
            value = value.trim();
            value = value.replace(/['"]+/g, "");
            tagArrKeyValue[extendsTag] = value;
        };
        if (-1 != blockIndex) {


            var value = tagArr[i].substring(blockIndex + blockTag.length, tagArr[i].length - 2);
            value = value.trim();
            if (value.length > 0) {
                if (tagArrKeyValue[blockTag][value] == undefined){
                    tagArrKeyValue[blockTag][value] = [];
                }

                var tagStartBeginIndex = content.indexOf(tagArr[i]);
                var tagStartEndIndex = tagStartBeginIndex + tagArr[i].length - 1;
                // var tempContent = content;
                i += 1;

                var tagStopBeginIndex = content.indexOf(tagArr[i]);
                var tagStopEndIndex = tagStopBeginIndex + tagArr[i].length  - 1;

                content = content.substring(tagStopEndIndex + 1);
                tagArrKeyValue[blockTag][value].push(tagStartBeginIndex + lastBlockIndex);
                tagArrKeyValue[blockTag][value].push(tagStartEndIndex + lastBlockIndex);
                tagArrKeyValue[blockTag][value].push(tagStopBeginIndex + lastBlockIndex);
                tagArrKeyValue[blockTag][value].push(tagStopEndIndex + lastBlockIndex);
                lastBlockIndex = lastBlockIndex + tagStopEndIndex + 1;
                
            };
        };
    };
    return tagArrKeyValue;
}

var templateInheritance = function (ret, conf, settings, opt) {
    // body...
    var baseFiles = {};
    var childFiles = {};

    fis.util.map(ret.src, function(subpath, file){
        if (file.isBaseTemplateFile) {
            baseFiles[file.id] = file;
        };
    });

    fis.util.map(ret.src, function(subpath, file){
        if (file.isChildTemplateFile) {
            var baseFileId = getBaseFileId(file);
            if (baseFileId != undefined) {
                var content = templateInherit(file, baseFiles[baseFileId]);
                file.setContent(content);
            };
        };
    });

}

fis.config.set('modules.postpackager', [templateInheritance]);

//在postprocessor对所有js后缀的文件进行内容处理：

//项目配置
fis.config.set('name', 'proj');     //将name、version独立配置，统管全局
fis.config.set('version', '1.0.3');