/**
 * [set rules for release src file]
 */
var ALPHA_CDN_PATH = process.env.CDN_PATH || '';
var BETA_CDN_PATH = process.env.CDN_PATH || '';
var PRODUCT_CDN_PATH = process.env.CDN_PATH || '';

fis.set('project.ignore', [
    '.git/**',
    '.svn/**',
    'create-package'
]);

fis.media('build')
    .match('*', {
        release: '/${projectName}/${version}/$0'
    })
    .match('/components/libs/ipc/js/*', {
        isMod: true,
    })
    .match(/views\/pages\/(.*).html/, {
        release: '/$1'
    })
    .match('deploy', {
        release: '/$0'
    })
    .match('fis-conf.js', {
        release: '/$0',
        useHash: false,
        optimizer: false
    })
    .match('*.{js,css,png,ico}', {
        useHash: true
    })
    .match('*.js', {
        optimizer: fis.plugin('uglify-js')
    })
    .match('*.css', {
        optimizer: fis.plugin('clean-css')
    })
    .match('*.png', {
        optimizer: fis.plugin('png-compressor')
    })
    .match('*.min.{js,css}', {
        optimizer: false
    })
    .match('require.js', {
        optimizer: false
    })
    .match('jwplayer.js', {
        useHash: false
    })
    .match('::package', {
        postpackager: fis.plugin('loader', {
            resourceType: 'amd',
            useInlineMap: true
        })
    });;

fis.hook('amd', {
    baseUrl: './components/libs/ipc/js',
    paths: {
        jquery: './components/libs/public/js/jquery-1.8.2.min'
    }
})


// fis.media('alpha')
//     .match('*.{js,css,png,ico}', {
//         domain: ALPHA_CDN_PATH
//     })
//     .match('*', {
//         release: '/$0'
//     })
//     .match('fis-conf.js', {
//         release: false
//     });

// fis.media('beta')
//     .match('*.{js,css,png,ico}', {
//         domain: BETA_CDN_PATH
//     })
//     .match('*', {
//         release: '/$0'
//     })
//     .match('fis-conf.js', {
//         release: false
//     });

// fis.media('product')
//     .match('*.{js,css,png,ico}', {
//         domain: PRODUCT_CDN_PATH
//     })
//     .match('*', {
//         release: '/$0'
//     })
//     .match('fis-conf.js', {
//         release: false
//     });

/**
 * [getBaseFileId ]
 * @param  {[file object]} childFile [file object reference for read file]
 * @return {string}           [path defined in child template file.]
 */
var getBaseFileName = function(childFile) {
    var tagArrs = getTagArrKeyValue(childFile);
    return tagArrs["extends"];
}

/**
 * [templateInherit replace child template block for base template block]
 * @param  {file object refrence} childFile 
 * @param  {file object refrence} baseFile  
 * @return {[string]} baseContent          [whole template after inherit from base template]
 */
var templateInherit = function(childFile, baseFile) {
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
        } else {
            addedContent = "";
        }

        // refresh offset when render child content to base content
        lastAddedLength += addedContent.length - currentBaseBlockLength;
        baseContent = preContent + addedContent + lastContent;
    };

    for (var block in childTagArr['block']) {
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
var getTagArrKeyValue = function(fileObj) {

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
                    if (tagArrKeyValue[blockTag][value] == undefined) {
                        tagArrKeyValue[blockTag][value] = [];
                    }

                    var tagStartBeginIndex = content.indexOf(tagArr[i]);
                    var tagStartEndIndex = tagStartBeginIndex + tagArr[i].length - 1;


                    // don't forget to find endblock tag
                    i += 1;
                    var tagStopBeginIndex = content.indexOf(tagArr[i]);
                    var tagStopEndIndex = tagStopBeginIndex + tagArr[i].length - 1;

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
var templateInheritance = function(ret, conf, settings, opt) {
    // body...
    var releaseFileMap = {};

    // inherit template if we flag it as a child template
    fis.util.map(ret.src, function(subpath, file) {
        if (file.isHtmlLike) {
            var baseFileName = getBaseFileName(file);
            if (baseFileName) {
                var baseFile = fis.uri(baseFileName, file.dirname);
                if (baseFile.file) {
                    var content = templateInherit(file, ret.src[baseFile.file.subpath]);
                    file.setContent(content);
                }
            }
        };
    });
};

var replaceResourceLocation = function(fileSrc, file) {
    if (file) {
        var content = file.getContent();
        var fileDir = file.dirname;

        var aHrefPattern = /(<a.*?)href=(['"]?)([^'"\s?]+)((\?[^'"\s]*)?)\2([^>]*>)/ig;
        var afterReplaceAHrefContent = content.replace(aHrefPattern, function(all, prefix, quote, value, query, queryInner, postfix) {
            var f = fis.uri(value, fileDir);
            if (f.file) {
                var releasePath = fileSrc["/" + f.file.id].getHashRelease();
                all = prefix + 'href=' + quote + releasePath + query + quote + postfix;
            }
            return all;
        });

        var dateUrlPattern = /(<img.*?)data-url=(['"]?)([^'"\s?]+)((\?[^'"\s]*)?)\2([^>]*>)/ig;
        var dataUrlLocateContent = afterReplaceAHrefContent.replace(dateUrlPattern, function(all, prefix, quote, value, query, queryInner, postfix) {
            var f = fis.uri(value, fileDir);
            if (f.file) {
                var releasePath = fileSrc["/" + f.file.id].getHashRelease();
                all = prefix + 'data-url=' + quote + releasePath + query + quote + postfix;
            }
            return all;
        });

        return dataUrlLocateContent;
    };

}

var myResourceLocate = function(ret, conf, settings, opt) {
    fis.util.map(ret.src, function(subpath, file) {
        if (file.isHtmlLike) {
            file.setContent(replaceResourceLocation(ret.src, file));
        };
    });
}

fis.config.set('modules.postpackager', [myResourceLocate, templateInheritance]);
var version = process.env.VERSION || "1.0.1";
fis.set('version', version);
var projectName = process.env.PROJECT_NAME || "ipc-web-front-end";
fis.set('projectName', projectName);