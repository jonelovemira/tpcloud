(function($) {
    "use strict";

    $.ipc = $.ipc || {};

    $.ipc.config = $.ipc.config || {};

    $.ipc.config.presetLinkieData = {
        "NC200": {
            "DEFAULT": {
                "smartlife.cam.ipcamera.liveStream": {
                    "get_modules": {
                        "name": "smartlife.cam.ipcamera.liveStream",
                        "version": "0.0",
                        "resolutions": ["320*240", "640*480"],
                        "port": 8080,
                        "video": [{
                            "video_codec": "MJPEG",
                            "url": "stream/getvideo"
                        }],
                        "audio": [{
                            "audio_codec": "PCM",
                            "url": "stream/getaudio"
                        }]
                    }
                }
            }
        },
        "NC210": {
            "DEFAULT": {
                "smartlife.cam.ipcamera.liveStream": {
                    "get_modules": {
                        "name": "smartlife.cam.ipcamera.liveStream",
                        "version": "0.0",
                        "resolutions": ["1280*720"],
                        "port": 8080,
                        "video": [{
                            "video_codec": "H.264",
                            "url": "stream/video/h264",
                            "encrypt": []
                        }, {
                            "video_codec": "MJPEG",
                            "url": "stream/video/mjpeg"
                        }],
                        "audio": [{
                            "audio_codec": "PCM",
                            "url": "stream/audio/wavpcm"
                        }, {
                            "audio_codec": "AAC",
                            "url": "stream/audio/mpegaac",
                            "encrypt": []
                        }]
                    }
                }
            },
            "1.0.3 Build 160229 Rel.27055": {
                "smartlife.cam.ipcamera.liveStream": {
                    "get_modules": {
                        "port": 8080,
                        "audio": [{
                            "url": "stream/audio/wavpcm",
                            "audio_codec": "PCM"
                        }, {
                            "encrypt": ["PLAIN", "AES128CBC_XOR", "XOR", "LEAD_AES128CBC"],
                            "url": "stream/audio/mpegaac",
                            "audio_codec": "AAC"
                        }],
                        "name": "smartlife.cam.ipcamera.liveStream",
                        "audio_video": [{
                            "video_codec": "H.264",
                            "url": "stream/video/mixed",
                            "audio_codec": "AAC"
                        }, {
                            "video_codec": "MJPEG",
                            "url": "stream/video/mjpeg_mixed",
                            "audio_codec": "PCM"
                        }],
                        "resolutions": ["1280*720"],
                        "video": [{
                            "video_codec": "H.264",
                            "encrypt": ["PLAIN", "AES128CBC_XOR", "XOR", "LEAD_AES128CBC"],
                            "url": "stream/video/h264"
                        }, {
                            "video_codec": "MJPEG",
                            "url": "stream/video/mjpeg"
                        }],
                        "version": "0.0"
                    }
                }
            }
        },
        "NC220": {
            "DEFAULT": {
                "smartlife.cam.ipcamera.liveStream": {
                    "get_modules": {
                        "name": "smartlife.cam.ipcamera.liveStream",
                        "version": "0.0",
                        "resolutions": ["320*240", "640*480"],
                        "port": 8080,
                        "video": [{
                            "video_codec": "H.264",
                            "url": "stream/video/h264",
                            "encrypt": []
                        }, {
                            "video_codec": "MJPEG",
                            "url": "stream/video/mjpeg"
                        }],
                        "audio": [{
                            "audio_codec": "PCM",
                            "url": "stream/audio/wavpcm"
                        }, {
                            "audio_codec": "AAC",
                            "url": "stream/audio/mpegaac",
                            "encrypt": []
                        }]
                    }
                }
            }
        },
        "NC230": {
            "DEFAULT": {
                "smartlife.cam.ipcamera.liveStream": {
                    "get_modules": {
                        "name": "smartlife.cam.ipcamera.liveStream",
                        "version": "0.0",
                        "resolutions": ["1280*720"],
                        "port": 8080,
                        "video": [{
                            "video_codec": "H.264",
                            "url": "stream/video/h264",
                            "encrypt": []
                        }, {
                            "video_codec": "MJPEG",
                            "url": "stream/video/mjpeg"
                        }],
                        "audio": [{
                            "audio_codec": "PCM",
                            "url": "stream/audio/wavpcm"
                        }, {
                            "audio_codec": "AAC",
                            "url": "stream/audio/mpegaac",
                            "encrypt": []
                        }]
                    }
                }
            }
        },
        "NC250": {
            "DEFAULT": {
                "smartlife.cam.ipcamera.liveStream": {
                    "get_modules": {
                        "name": "smartlife.cam.ipcamera.liveStream",
                        "version": "0.0",
                        "resolutions": ["1280*720"],
                        "port": 8080,
                        "video": [{
                            "video_codec": "H.264",
                            "url": "stream/video/h264",
                            "encrypt": []
                        }, {
                            "video_codec": "MJPEG",
                            "url": "stream/video/mjpeg"
                        }],
                        "audio": [{
                            "audio_codec": "PCM",
                            "url": "stream/audio/wavpcm"
                        }, {
                            "audio_codec": "AAC",
                            "url": "stream/audio/mpegaac",
                            "encrypt": []
                        }]
                    }
                }
            }
        },
        "NC350": {
            "DEFAULT": {
                "smartlife.cam.ipcamera.liveStream": {
                    "get_modules": {
                        "name": "smartlife.cam.ipcamera.liveStream",
                        "version": "0.0",
                        "resolutions": ["1280*720"],
                        "port": 8080,
                        "video": [{
                            "video_codec": "H.264",
                            "url": "stream/video/h264",
                            "encrypt": []
                        }, {
                            "video_codec": "MJPEG",
                            "url": "stream/video/mjpeg"
                        }],
                        "audio": [{
                            "audio_codec": "PCM",
                            "url": "stream/audio/wavpcm"
                        }, {
                            "audio_codec": "AAC",
                            "url": "stream/audio/mpegaac",
                            "encrypt": []
                        }]
                    }
                }
            }
        },
        "NC450": {
            "DEFAULT": {
                "smartlife.cam.ipcamera.liveStream": {
                    "get_modules": {
                        "name": "smartlife.cam.ipcamera.liveStream",
                        "version": "0.0",
                        "resolutions": ["1280*720"],
                        "port": 8080,
                        "video": [{
                            "video_codec": "H.264",
                            "url": "stream/video/h264",
                            "encrypt": []
                        }, {
                            "video_codec": "MJPEG",
                            "url": "stream/video/mjpeg"
                        }],
                        "audio": [{
                            "audio_codec": "PCM",
                            "url": "stream/audio/wavpcm"
                        }, {
                            "audio_codec": "AAC",
                            "url": "stream/audio/mpegaac",
                            "encrypt": []
                        }]
                    }
                }
            }
        }
    }
})(jQuery);