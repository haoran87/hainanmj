String.prototype.format = function (args) {
    if (arguments.length > 0) {
        var result = this;
        if (arguments.length == 1 && typeof (args) == "object") {
            for (var key in args) {
                var reg = new RegExp("({" + key + "})", "g");
                result = result.replace(reg, args[key]);
            }
        } else {
            for (var i = 0; i < arguments.length; i++) {
                if (arguments[i] == undefined) {
                    return "";
                } else {
                    var reg = new RegExp("({[" + i + "]})", "g");
                    result = result.replace(reg, arguments[i]);
                }
            }
        }
        return result;
    } else {
        return this;
    }
};

cc.Class({
    extends: cc.Component,

    properties: {
        _mima: null,
        _mimaIndex: 0,
    },

    // use this for initialization
    onLoad: function () {
        if (!cc.sys.isNative && cc.sys.isMobile) {
            var cvs = this.node.getComponent(cc.Canvas);
            cvs.fitHeight = true;
            cvs.fitWidth = true;
        }

        if (!cc.vv) {
            cc.director.loadScene("loading");
            return;
        }
        // cc.vv.http.url = cc.vv.http.master_url;
        cc.vv.audioMgr.playBGM("bg/bgMain");

        this._mima = ["A", "A", "B", "B", "A", "B", "A", "B", "A", "A", "A", "B", "B", "B"];

        if (!cc.sys.isNative || cc.sys.os == cc.sys.OS_WINDOWS) {
            cc.find("Canvas/btn_yk").active = true;
        }
        if (!cc.vv.iOSPassed) {
            cc.find("Canvas/btn_yk").active = true;
            cc.find("Canvas/z_weixindenglu").active = false;
        };

        if (cc.sys.os == cc.sys.OS_ANDROID || cc.sys.os == cc.sys.OS_IOS) {
            cc.game.on(cc.game.EVENT_HIDE, function () {
                var curScene = cc.director.getScene().name;
                if (cc.vv && !cc.vv.ishoutai) {
                    cc.vv.ishoutai = true;
                    if (curScene == "mjgame") {
                        var playtool = cc.find("Canvas/play_tools");
                        playtool.stopAllActions();
                        playtool.getComponent(cc.Animation).stop();
                        playtool.active = false;
                       
                    } else if (curScene == "hall") {}
                    console.log("切换到后台了！！！")
                    if (cc.vv.net.netTimer) {
                        clearInterval(cc.vv.net.netTimer);
                        cc.vv.net.netTimer = null;
                    }
                    if (cc.vv.net.sio && cc.vv.net.sio.connected) {
                        console.log("切换到后台 ####",cc.vv.net.sio)
                        cc.vv.net.sio.connected = false;
                        cc.vv.net.sio.disconnect();
                        cc.vv.net.sio = null;
                    }
                   
                }
            });
            cc.game.on(cc.game.EVENT_SHOW, function () {
                var curScene = cc.director.getScene().name;
                console.log("切换到前台！！！")
                if (cc.vv && cc.vv.ishoutai) {
                    if (cc.sys.getNetworkType() == 0) {
                        console.log("没有连接网络")
                        cc.vv.alert.show("提示", "检测到您的网络异常，需要重连", function () {
                            cc.game.restart();
                            cc.audioEngine.stopAll();
                        });
                        return;
                    }
                    cc.vv.ishoutai = false;
                    if (curScene == "hall") {
                        cc.vv.wc.show()
                        // cc.find("Canvas/reconnect").active = true;
                         cc.vv.userMgr.socketConnect(function(){
                            cc.vv.wc.hide()
                            // cc.find("Canvas/reconnect").active = false;
                        })
                    } else if (curScene == "mjgame" ) {
                        // cc.find("Canvas/reconnect").active = true;
                        cc.vv.net.test(function (ret) {
                            if (ret) {
                                cc.vv.userMgr.socketConnect(function () {
                                    var roomId = cc.vv.MjNetMgr.roomId;
                                    console.log("后台转过来执行了0" + roomId);
                                    if (roomId != null && !cc.vv.replayMgr.isReplay()) {
                                        cc.vv.MjNetMgr.roomId = null;
                                        cc.vv.userMgr.enterRoom(roomId);
                                        cc.find("Canvas/reconnect").active = false;
                                    } else {
                                        console.log("后台转过来执行了1")
                                        cc.find("Canvas/reconnect").active = false;
                                    }
                                })
    
                            }
                        });
                       
                    } else {
                        return;
                    }

                }

            });
        }

    },

    start: function () {
        var account = cc.sys.localStorage.getItem("wx_account");
        var sign = cc.sys.localStorage.getItem("wx_sign");
        if (account != null && sign != null) {
            var ret = {
                errcode: 0,
                account: account,
                sign: sign
            }
            cc.vv.userMgr.onAuth(ret);
        }
    },

    onBtnQuickStartClicked: function () {
        cc.vv.userMgr.guestAuth();
    },

    onBtnWeichatClicked: function () {
        var self = this;
        cc.vv.anysdkMgr.login();
    },

    onBtnMIMAClicked: function (event) {
        if (this._mima[this._mimaIndex] == event.target.name) {
            this._mimaIndex++;
            if (this._mimaIndex == this._mima.length) {
                cc.find("Canvas/btn_yk").active = true;
            }
        } else {
            console.log("oh ho~~~");
            this._mimaIndex = 0;
        }
    }
});