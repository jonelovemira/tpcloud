define(function () {
    function Error() {
        this.code = null;
        this.msg = null;
    }

    Error.prototype = {
        constructor: Error,
        printMsg: function() {
            console.log(this.msg);
        }
    };

    return Error;
})