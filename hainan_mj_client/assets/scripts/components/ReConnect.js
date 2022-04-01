cc.Class({
    extends: cc.Component,

    properties: {
        _reconnect: null,
        _lblTip: null,
        _loadingImage: null,
    },

    // use this for initialization
    onLoad: function () {
        this._reconnect = cc.find("Canvas/reconnect");
        this._loadingImage = cc.find("Canvas/reconnect/loading");
        var self = this;

        var fnTestServerOn = function () {
            cc.vv.net.test(function (ret) {
                if (ret) {
                    var roomId = cc.vv.MjNetMgr.roomId;
                    if (roomId != null) {
                        cc.vv.userMgr.enterRoom(roomId);
                    }
                    else{
                        cc.game.restart();
                        cc.audioEngine.stopAll();
                    }
                } else {
                    self._reconnect.active = false;
                    cc.vv.alert.show("提示", "检测到您的网络异常，需要重连", function () {
                        cc.game.restart();
                        cc.audioEngine.stopAll();
                    })
                }
            });
        }

        var fn = function (data) {
            self.node.off('gamereconnct', fn);
            self._reconnect.active = true;
            fnTestServerOn();
        }
        this.node.on('gamereconnct', fn);
    },

    update: function (dt) {
        if (this._reconnect.active) {
            this._loadingImage.angle = this._loadingImage.angle - dt * 45;
        }
    },
});