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
                        "port": 8080,
                        "video": [{
                            "video_codec": "MJPEG",
                            "url": "stream/getvideo",
                            "resolutions": ["320*240", "640*480"]
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
                        "port": 8080,
                        "video": [{
                            "video_codec": "H.264",
                            "url": "stream/getvideo",
                            "resolutions": ["1280*720"],
                            "encrypt": []
                        }, {
                            "video_codec": "MJPEG",
                            "resolutions": ["640*480"],
                            "url": "stream/video/mjpeg"
                        }],
                        "audio": [{
                            "audio_codec": "PCM",
                            "url": "stream/audio/wavpcm"
                        }, {
                            "audio_codec": "AAC",
                            "url": "stream/getaudio",
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
                            "url": "stream/getaudio",
                            "audio_codec": "AAC"
                        }],
                        "name": "smartlife.cam.ipcamera.liveStream",
                        "audio_video": [{
                            "video_codec": "H.264",
                            "resolutions": ["1280*720"],
                            "url": "stream/video/mixed",
                            "audio_codec": "AAC"
                        }],
                        "video": [{
                            "video_codec": "H.264",
                            "encrypt": ["PLAIN", "AES128CBC_XOR", "XOR", "LEAD_AES128CBC"],
                            "resolutions": ["1280*720"],
                            "url": "stream/getvideo"
                        }, {
                            "video_codec": "MJPEG",
                            "resolutions": ["640*480"],
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
                        "port": 8080,
                        "video": [{
                            "video_codec": "H.264",
                            "resolutions": ["320*240", "640*480"],
                            "url": "stream/getvideo",
                            "encrypt": []
                        }, {
                            "resolutions": ["320*240", "640*480"],
                            "video_codec": "MJPEG",
                            "url": "stream/video/mjpeg"
                        }],
                        "audio": [{
                            "audio_codec": "PCM",
                            "url": "stream/audio/wavpcm"
                        }, {
                            "audio_codec": "AAC",
                            "url": "stream/getaudio",
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
                        "port": 8080,
                        "video": [{
                            "resolutions": ["1280*720"],
                            "video_codec": "H.264",
                            "url": "stream/video/h264",
                            "encrypt": []
                        }, {
                            "video_codec": "MJPEG",
                            "resolutions": ["640*480"],
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
                        "port": 8080,
                        "video": [{
                            "video_codec": "H.264",
                            "resolutions": ["1280*720"],
                            "url": "stream/video/h264",
                            "encrypt": []
                        }, {
                            "video_codec": "MJPEG",
                            "resolutions": ["640*480"],
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
        "NC260": {
            "DEFAULT": {
                "smartlife.cam.ipcamera.liveStream": {
                    "get_modules": {
                        "name": "smartlife.cam.ipcamera.liveStream",
                        "version": "0.0",
                        "port": 8080,
                        "video": [{
                            "video_codec": "H.264",
                            "resolutions": ["1280*720"],
                            "url": "stream/video/h264",
                            "encrypt": []
                        }, {
                            "video_codec": "MJPEG",
                            "resolutions": ["640*480"],
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
                        "port": 8080,
                        "video": [{
                            "video_codec": "H.264",
                            "resolutions": ["1280*720"],
                            "url": "stream/video/h264",
                            "encrypt": []
                        }, {
                            "video_codec": "MJPEG",
                            "resolutions": ["640*480"],
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
                        "port": 8080,
                        "video": [{
                            "resolutions": ["1280*720"],
                            "video_codec": "H.264",
                            "url": "stream/video/h264",
                            "encrypt": []
                        }, {
                            "video_codec": "MJPEG",
                            "resolutions": ["640*480"],
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


            
