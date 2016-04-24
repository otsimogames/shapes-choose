var otsimo = function() {
    "use strict";
    if (typeof otsimo !== "undefined") {
        return otsimo
    }
    var __isloaded = false;
    var __callbackStack = [];
    var __settingsCallbacks = [];

    var otemp = {
        settings: {},
        kv: {},
        child: {},
        debug: false,
        iOS: (navigator.userAgent.match(/(iPad|iPhone|iPod)/g) ? true : false),
        isWKWebView: false,
        isUIWebView: (typeof otsimonative !== 'undefined'),
        sound: true
    }

    if (window.webkit && window.webkit.messageHandlers) {
        otemp.isWKWebView = true;
    }

    var getJSON = function(url, res) {
        var xmlhttp = new XMLHttpRequest();
        xmlhttp.onreadystatechange = function() {
            var status;
            var data;
            if (xmlhttp.readyState == 4) {
                status = xmlhttp.status;
                if (status === 200 || status === 0) {
                    data = JSON.parse(xmlhttp.responseText);
                    res && res(null, data);
                } else {
                    res && res(status, null);
                }
            }
        };
        xmlhttp.open("GET", url, true);
        xmlhttp.send();
    }

    var __registerLoadingCallback = function(fn) {
        __callbackStack.push(fn)
    }

    var __callLoadingCallbacks = function() {
        __isloaded = true
        for (var i = 0; i < __callbackStack.length; i++) {
            __callbackStack[i]()
        }
        __callbackStack.splice(0, __callbackStack.length)
    }

    otemp.log = function() {
        if (otemp.isWKWebView) {
            console.log.apply(console, arguments)
            window.webkit.messageHandlers.console.postMessage(JSON.stringify(arguments));
        } else {
            console.log.apply(console, arguments)
        }
    }

    otemp.customevent = function(eventName, data) {
        if (otemp.isWKWebView) {
            window.webkit.messageHandlers.analytics.postMessage({ event: eventName, data: data });
        } else if (otemp.isUIWebView) {
            otsimonative.customevent({ event: eventName, data: data })
        } else {
            otemp.log("customevent", eventName, data)
        }
    }

    otemp.quitgame = function() {
        if (otemp.isWKWebView) {
            window.webkit.messageHandlers.player.postMessage({ event: "quitgame" });
        } else if (otemp.isUIWebView) {
            otsimonative.player({ event: "quitgame" })
        } else {
            otemp.log("quit game called")
        }
    }

    otemp.run = function(fn) {
        otemp.log("register function to run")

        if (__isloaded) {
            if (fn) {
                fn()
            }
        } else {
            __registerLoadingCallback(fn)
        }
    }

    otemp.onSettingsChanged = function(fn) {
        __settingsCallbacks.push(fn)
    }

    otemp.__callSettingsCallbacks = function(settings, sound) {
        if (settings) {
            otemp.settings = settings
        }
        otemp.sound = sound

        for (var i = 0; i < __settingsCallbacks.length; i++) {
            __settingsCallbacks[i](settings, sound)
        }
    }

    otemp.init = function() {
        otemp.log("initialize of bundle otsimo.js")

        if (otemp.isWKWebView) {
            otemp.log("sandbox won't be initializing")
            return
        }

        if (otemp.isUIWebView) {
            otemp.log("sandbox won't be initializing")
            return
        }

        otemp.child.firstname = "debug"
        otemp.child.lastname = "user"
        otemp.child.language = otemp.getLanguages()[0]
        otemp.width = 1024
        otemp.height = 768
        otemp.debug = true
        getJSON("otsimo.json", otemp.__initManifest)
    }

    otemp.getLanguages = function() {
        var found = []
        if (typeof navigator !== 'undefined') {
            if (navigator.languages) { // chrome only; not an array, so can't use .push.apply instead of iterating
                for (var i = 0; i < navigator.languages.length; i++) {
                    found.push(navigator.languages[i]);
                }
            }
            if (navigator.userLanguage) {
                found.push(navigator.userLanguage);
            }
            if (navigator.language) {
                found.push(navigator.language);
            }
        }
        return found
    }

    otemp.__init = function(option) {
        otemp.log("__init called", option)
        otemp.settings = option.settings
        otemp.child = option.child
        otemp.width = option.screen.width
        otemp.height = option.screen.height
        otemp.sound = option.sound
        otemp.root = option.root

        getJSON(otemp.root + "otsimo.json", function(err, manifest) {
            if (err) {
                otemp.log("Failed to get otsimo.json, status=", err)
            } else {
                otemp.manifest = manifest
                var langFile = otemp.root + manifest.kv_path + "/" + otemp.child.language + ".json"
                getJSON(langFile, function(err, data) {
                    if (err) {
                        otemp.log("failed to get kv, status", err)
                    } else {
                        otemp.kv = data
                        otemp.log("initialized", otemp)
                        __callLoadingCallbacks()
                    }
                })
            }
        })
        return true
    }

    otemp.__initManifest = function(err, data) {
        if (err) {
            otemp.log("Failed to get otsimo.json, status=", err)
        } else {
            otemp.manifest = data
            getJSON(otemp.manifest.settings, otemp.__initSettings)
        }
    }

    otemp.__loadKeyValueStore = function() {
        var sy = otemp.getLanguages()
        var langFile = otemp.manifest.kv_path + "/" + otemp.manifest.default_language + ".json"

        if (sy.length > 0) {
            for (var i = 0; i < sy.length; ++i) {
                var nextLang = otemp.manifest.languages[sy[i].substring(0, 2)];
                if (nextLang) {
                    langFile = otemp.manifest.kv_path + "/" + nextLang + ".json"
                    break;
                }
            }
        }
        getJSON(langFile, function(err, data) {
            if (err) {
                otemp.log("failed to get kv, status", err)
            } else {
                otemp.kv = data
                otemp.log("initialized", otemp)
                __callLoadingCallbacks()
            }
        })
    }

    otemp.__initSettings = function(err, data) {
        if (err) {
            otemp.log("failed to get settings,status", err)
        } else {
            otemp.log("settings", data)
            var ks = Object.keys(data.properties)
            for (var i = 0; i < ks.length; ++i) {
                var p = data.properties[ks[i]]
                otemp.settings[p.id] = p.default
            }
            otemp.__loadKeyValueStore()
        }
    }
    return otemp
} ()
