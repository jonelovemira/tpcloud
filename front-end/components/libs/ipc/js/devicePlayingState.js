define(function () {
    var devicePlayingState = {
        IDLE: 0,
        BEGIN_PLAY: 1,
        RELAY_URL_READY: 2,
        REQUEST_RELAY_SERVICE_SUCCESS: 3,
        RELAY_READY: 4,
        RESOURCE_READY: 5,
        PLAYING: 6,
        NETWORK_ERROR: 7,
        NEED_RES_FAILED_RETRY: 8,
        NEED_RELAY_READY_FAILED_TRY: 9,
        DEVICE_LOCAL_INFO_READY: 10
    };
    return devicePlayingState;
});