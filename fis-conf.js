/**
 * [set rules for release src file]
 */
var ALPHA_CDN_PATH = '';
var BETA_CDN_PATH = '';
var PRODUCT_CDN_PATH = 'http://test.com/cdn';

fis.set('project.ignore', [
    '.git/**',
    '.svn/**',
    'create-package'
]);

fis.match('*', {
    release: '/$0',
});

fis.match('fis-conf.js',{
    useHash: false
})

fis.match('/common/*.html', {
    isBaseTemplateFile: true
})

fis.match('/views/pages/{*,**/*}.html', {
    release: '$0',
    isChildTemplateFile: true
});

fis.match('/views/pages/index.html', {
    release: '/index.html',
    isChildTemplateFile: true
});

fis.media('build').match('/views/pages/index.html', {
    release: '$0',
    isChildTemplateFile: true
});

fis.media('build').match('*.{js,css,png,ico}', {
    useHash: true
});

fis.media('alpha').match('*.{js,css,png,ico}',{
    domain: ALPHA_CDN_PATH
});

fis.media('beta').match('*.{js,css,png,ico}',{
    domain: BETA_CDN_PATH
});

fis.media('product').match('*.{js,css,png,ico}',{
    domain: PRODUCT_CDN_PATH
});

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
    for (var block in baseTagArr['block']) {

        for (var i = 0; i < baseTagArr['block'][block].length; i++) {
            baseTagArr['block'][block][i] += lastAddedLength;
        };

        var preContent = baseContent.substring(0, baseTagArr['block'][block][0]);
        var lastContent = baseContent.substring(baseTagArr['block'][block][3] + 1);
        var currentBaseBlockLength = baseTagArr['block'][block][3] - baseTagArr['block'][block][0] + 1;

        var addedContent;
        if (childTagArr['block'][block] != undefined) {
            addedContent = childContent.substring(childTagArr['block'][block][1] + 1, childTagArr['block'][block][2]);
            delete childTagArr['block'][block];
        }
        else
        {
            addedContent = "";
        }

        // refresh offset when render child content to base content
        lastAddedLength += addedContent.length - currentBaseBlockLength;
        baseContent = preContent + addedContent + lastContent;
    };

    for (var block in childTagArr['block'])
    {
        throw "child has some block which base doesn't have: " + block + ";";
    }

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

    if (tagArr != undefined) {
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
