define(function () {
    var stopReasonCodeMap = {
        LEAVE_PAGE: 0,
        USER_STOPPED_VIDEO: 1,
        VIDEO_TIME_UP: 2,
        DEVICE_UNBOUND: 3,
        NETWORK_ERROR: -1,
        VIEW_VIDEO_FAILED: -2,
        UNKNOWN_ERROR: -3
    };
    return stopReasonCodeMap;
})