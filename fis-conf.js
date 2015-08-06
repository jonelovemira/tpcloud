/**
 * [set rules for release src file]
 */
fis.config.set('roadmap.path', [
    {
        reg : '**.md',
        release : false,
        isHtmlLike : true
    },
    {
        reg : /^\/common\/(.*html)$/,
        // flag for indicating this file is a base template file
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
        // flag for indicating this file is a component file
        isComponents : true,
        release : '/public/components/$1'
    },
    {
        reg : /^\/views\/(.*html)$/,
        // flag for indicating this file is child template file
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

/**
 * [createFrameworkConfig replace the depandency map for special flag]
 * @param  {[type]} ret      [description]
 * @param  {[type]} conf     [description]
 * @param  {[type]} settings [description]
 * @param  {[type]} opt      [description]
 */
var createFrameworkConfig = function(ret, conf, settings, opt){
    var map = {};
    map.deps = {};
    map.alias = {};

    // find dependency and create alias by directory name
    fis.util.map(ret.src, function(subpath, file){
        if(file.isComponents || file.isComponentModules){
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

    // replace map for __FRAMEWORK_CONFIG__ in js code
    fis.util.map(ret.src, function(subpath, file){
        if(file.isViews && (file.isJsLike || file.isHtmlLike)){
            var content = file.getContent();
            content = content.replace(/\b__FRAMEWORK_CONFIG__\b/g, stringify);
            file.setContent(content);
        }
    });
};

/**
 * [getBaseFileId ]
 * @param  {[file object]} childFile [file object reference for read file]
 * @return {string}           [path defined in child template file.]
 */
var getBaseFileId = function (childFile){
    var tagArrs = getTagArrKeyValue(childFile);
    return tagArrs["extends"];
}

/**
 * [templateInherit replace child template block for base template block]
 * @param  {file object refrence} childFile 
 * @param  {file object refrence} baseFile  
 * @return {[string]} baseContent          [whole template after inherit from base template]
 */
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

        // refresh offset when render child content to base content
        lastAddedLength += addedContent.length - currentBaseBlockLength;
        baseContent = preContent + addedContent + lastContent;
    };

    return baseContent;
}

/**
 * [getTagArrKeyValue find "extends" and "block" tags.]
 * @param  {[reference]} fileObj [file object for reference]
 * @return {[object]} tagArrKeyValue        
 * [tagArrKeyValue['extends'] will save the basefilename path defined in child template file,
 * and tagArrKeyValue['block'] will save the block 4 positions: 0th for startblock begins, 1th
 * for startblock ends, 2th for stopblock begins, 3th for stopblock ends. like :
 *     {% block body  %} hfdjfhdsjkfsdjkfsdjhk  {% endblock %}
 *     |0th            |1th                     |2th         |3th
 * when inherit child template from base template, we can use child's 1th~2th replace base's 0th~3th.
 * ]
 */
var getTagArrKeyValue = function (fileObj) {

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


                // don't forget to find endblock tag
                i += 1;
                var tagStopBeginIndex = content.indexOf(tagArr[i]);
                var tagStopEndIndex = tagStopBeginIndex + tagArr[i].length  - 1;

                content = content.substring(tagStopEndIndex + 1);
                tagArrKeyValue[blockTag][value].push(tagStartBeginIndex + lastBlockIndex);
                tagArrKeyValue[blockTag][value].push(tagStartEndIndex + lastBlockIndex);
                tagArrKeyValue[blockTag][value].push(tagStopBeginIndex + lastBlockIndex);
                tagArrKeyValue[blockTag][value].push(tagStopEndIndex + lastBlockIndex);

                // change relative position to absolute position.
                lastBlockIndex = lastBlockIndex + tagStopEndIndex + 1;
                
            };
        };
    };
    return tagArrKeyValue;
}

/**
 * [templateInheritance function will call in postpackager when we release code.]
 * @param  {[type]} ret      [description]
 * @param  {[type]} conf     [description]
 * @param  {[type]} settings [description]
 * @param  {[type]} opt      [description]
 */
var templateInheritance = function (ret, conf, settings, opt) {
    // body...
    var baseFiles = {};
    var childFiles = {};

    // save base file refernce
    fis.util.map(ret.src, function(subpath, file){
        if (file.isBaseTemplateFile) {
            baseFiles[file.id] = file;
        };
    });

    // inherit template if we flag it as a child template
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
fis.config.set('name', 'proj'); 
fis.config.set('version', '1.0.3');