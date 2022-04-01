cc.Class({
    extends: cc.Component,

    properties: {
        _nextPlayTime: 1,
        _replay: null,
        _isPlaying: true,
        _speed: 1,
        _repalyInfo: null,
    },

    onLoad: function () {
        if (cc.vv == null) {
            return;
        }

        this._replay = cc.find("Canvas/replay");
        this._replay.active = cc.vv.replayMgr.isReplay();
        this._repalyInfo = this._replay.getChildByName("replayInfo").getComponent(cc.Label);
        this._repalyInfo.string = "X" + this._speed;
        var pause = this._replay.getChildByName("btn_pause");
        var play = this._replay.getChildByName("btn_play");
        var back = this._replay.getChildByName("btn_back");
        var speedUp = this._replay.getChildByName("btn_up");
        var speedDown = this._replay.getChildByName("btn_down");
        pause.on("click", this.onBtnPauseClicked, this);
        play.on("click", this.onBtnPlayClicked, this);
        back.on("click", this.onBtnBackClicked, this);
        speedDown.on("click", this.onSpeedDown, this);
        speedUp.on("click", this.onSpeedUP, this);
    },

    onBtnPauseClicked: function () {
        this._isPlaying = false;
    },

    onBtnPlayClicked: function () {
        this._isPlaying = true;
    },

    onBtnBackClicked: function () {
        cc.vv.replayMgr.clear();
        cc.vv.MjNetMgr.reset();
        cc.vv.MjNetMgr.roomId = null;
        cc.vv.MjNetMgr.turn = -1;
        cc.vv.MjNetMgr.seats = null;
        cc.vv.MjNetMgr.maxNumOfGames = 0;
        cc.vv.MjNetMgr.numOfGames = 0;
        cc.vv.userMgr.showTip = 1;
        cc.director.loadScene("hall");
    },

    onSpeedDown: function () {
        if (this._speed <= 1 || !this._isPlaying || !cc.vv.replayMgr.isReplay()) {
            return;
        }
        this._speed -= 1;
        this._repalyInfo.string = "X" + this._speed;
    },

    onSpeedUP: function () {
        if (this._speed >= 3 || !this._isPlaying || !cc.vv.replayMgr.isReplay()) {
            return;
        }
        this._speed += 1;
        this._repalyInfo.string = "X" + this._speed;
    },

    update: function (dt) {
        if (cc.vv) {
            if (this._isPlaying && cc.vv.replayMgr.isReplay() == true && this._nextPlayTime > 0) {
                this._nextPlayTime -= dt;
                if (this._nextPlayTime < 0) {
                    this._nextPlayTime = cc.vv.replayMgr.takeAction();
                    this._nextPlayTime *= (1 / this._speed);
                }
            }
        }
    },
});