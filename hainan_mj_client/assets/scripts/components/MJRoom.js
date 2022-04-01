cc.Class({
    extends: cc.Component,

    properties: {
        _lblRoomNolblRoomNo: null,
        _seats: [],
        _seats2: [],
        _timeLabel: null,
        _voiceMsgQueue: [],
        _lastPlayingSeat: null,
        _playingSeat: null,
        _lastPlayTime: null,
        _zhuobu: null,
        _toolsPosArr:[],
        _playTool:null,
    },

    // use this for initialization
    onLoad: function () {
        if (cc.vv == null) {
            return;
        }
        cc.find("Canvas/infobar/ver").getComponent(cc.Label).string = "ver:1.3.0016"
        cc.find("Canvas/infobar/actNum").getComponent(cc.Label).string = cc.vv.userMgr.coins;
        this.initView();
        this.initSeats();
        this.initEventHandlers();
        this.initToolsPos();
    },
    initView: function () {
        var self = this;
        this._zhuobu = this.node.getChildByName("zhuobu");
        this._playTool = this.node.getChildByName("play_tools")
        var prepare = this.node.getChildByName("prepare");
        var gameNode = this.node.getChildByName("game");
        
        var seats = prepare.getChildByName("seats");
        var seatNum = cc.vv.MjNetMgr.conf.seatNum;
        if (seatNum == 3) {
            for (var i = 0; i < seats.children.length; ++i) {
                if (i == 2) {
                    seats.children[i].active = false;
                } else {
                    this._seats.push(seats.children[i].getComponent("SeatMj"));
                }
            }
        } else if (seatNum == 2) {
            for (var i = 0; i < seats.children.length; ++i) {
                if (i == 3 || i == 1) {
                    seats.children[i].active = false;
                } else {
                    this._seats.push(seats.children[i].getComponent("SeatMj"));
                }
            }
        } else {
            for (var i = 0; i < seats.children.length; ++i) {
                this._seats.push(seats.children[i].getComponent("SeatMj"));
            }
        }
        this.refreshBtns();
        this._lblRoomNo = cc.find("Canvas/infobar/Z_room_txt").getComponent(cc.Label);
        this._timeLabel = cc.find("Canvas/infobar/time").getComponent(cc.Label);
        this._lblRoomNo.string = "房间号:"+cc.vv.MjNetMgr.roomId;
        var gameChild = this.node.getChildByName("game");
        var sides = ["myself", "right", "up", "left"];
        if (seatNum == 2) {
            sides = ["myself", "up"];
            gameChild.getChildByName("right").active = false;
            gameChild.getChildByName("left").active = false;
        } else if (seatNum == 3) {
            sides = ["myself", "right", "left"];
            gameChild.getChildByName("up").active = false;
        }
        for (var i = 0; i < sides.length; ++i) {
            var sideNode = gameChild.getChildByName(sides[i]);
            var seat = sideNode.getChildByName("seat");
            
            this._seats2.push(seat.getComponent("SeatMj"));
        }

        // var zbIndex = cc.sys.localStorage.getItem("zhuobuIndex")
        // if (zbIndex != null) {
        //     var zhuobuName = "mjzhuobu" + zbIndex;
        //     cc.loader.loadRes('zhuobu/' + zhuobuName, cc.SpriteFrame, function (err, spriteFrame) {
        //         if (err) {
        //             cc.error(err.message || err);
        //             return;
        //         }
        //         self._zhuobu.getComponent(cc.Sprite).spriteFrame = spriteFrame;
        //     });
        // }
    },

    refreshBtns: function () {
        var prepare = this.node.getChildByName("prepare");
        var btnExit = prepare.getChildByName("btnExit");
        var btnDispress = prepare.getChildByName("btnDissolve");
        var btnWeichat = prepare.getChildByName("btnWeichat");
        var btnCopy = prepare.getChildByName("btnCopy");
        var isIdle = cc.vv.MjNetMgr.numOfGames == 0;

        btnExit.active = !cc.vv.MjNetMgr.isOwner() && isIdle;
        btnDispress.active = cc.vv.MjNetMgr.isOwner() && isIdle;
        prepare.getChildByName("btnReady").active = !cc.vv.MjNetMgr.seats[cc.vv.MjNetMgr.seatIndex].ready
        btnWeichat.active = isIdle;
        btnCopy.active = isIdle;
        if (!cc.vv.iOSPassed) {
            btnWeichat.active = false;
        }
    },

    initEventHandlers: function () {
        var self = this;
        this.node.on('new_user', function (data) {
            console.log("接收到new_user消息了")
            self.initSingleSeat(data);
        });

        this.node.on('user_state_changed', function (data) {
            var prepare = self.node.getChildByName("prepare");
            prepare.getChildByName("btnReady").active = !cc.vv.MjNetMgr.seats[cc.vv.MjNetMgr.seatIndex].ready
            self.initSingleSeat(data);
        });

        this.node.on('game_begin', function (data) {
            self.refreshBtns();
            self.initSeats();
        });

        this.node.on('voice_msg', function (data) {
            var data = data;
            self._voiceMsgQueue.push(data);
            self.playVoice();
        });

        this.node.on('chat_push', function (data) {
            var data = data;
            var idx = cc.vv.MjNetMgr.getSeatIndexByID(data.sender);
            var localIdx = cc.vv.MjNetMgr.getLocalIndex(idx);
            self._seats[localIdx].chat(data.content);
            self._seats2[localIdx].chat(data.content);
        });

        this.node.on('quick_chat_push', function (data) {
            var idx = cc.vv.MjNetMgr.getSeatIndexByID(data.sender);
            var localIdx = cc.vv.MjNetMgr.getLocalIndex(idx);
            console.log("xini ==" + JSON.stringify(data))
            var index = parseInt(data.content.index);
            if (data.content.sex == 2) {
                var info = cc.vv.chat._chatTexts2[index];
            } else {
                var info = cc.vv.chat._chatTexts[index];
            }
            self._seats[localIdx].chat(info);
            self._seats2[localIdx].chat(info);
            console.log("要发的声音 == " + data.content.sound)
            cc.vv.audioMgr.playSFX(data.content.sound);
        });

        this.node.on('emoji_push', function (data) {
            var data = data;
            var idx = cc.vv.MjNetMgr.getSeatIndexByID(data.sender);
            var localIdx = cc.vv.MjNetMgr.getLocalIndex(idx);
            console.log(data);
            self._seats[localIdx].emoji(data.content);
            self._seats2[localIdx].emoji(data.content);
        });
        this.node.on("exit_regRoom", function (data) {
            self.onBtnExit();
        });
        this.node.on("tools_shoot_target_do", function (data) {
            self.doShootTools(data);
        })
    },
    initToolsPos:function(){
        var seats = this.node.getChildByName("prepare").getChildByName("seats");
        var seatNum = cc.vv.MjNetMgr.conf.seatNum;
        for(var i = 0 ; i < seats.childrenCount; i++){
            var seat = seats.children[i];
            var pos = seat.getPosition();
            if(seatNum == 4){
                this._toolsPosArr.push(pos);
            }
            else if(seatNum == 3 && i != 2){
                this._toolsPosArr.push(pos);
            }
            else if(seatNum == 2 && (i == 0 || i == 2)){
                this._toolsPosArr.push(pos);
            }
        }
        // console.log("获取到的座位位置 == "+this._toolsPosArr);
    },
    toolsClicked:function(event){
        if(cc.vv.toolTarget == -1) return;
        // console.log("要发送的道具 === "+event.target.name)
        var tooldata = {
            target:cc.vv.toolTarget,
            toolName:event.target.name,
        }
        cc.vv.net.send("tools_fire",tooldata)
        cc.vv.userinfoShow.onClicked();
    },
    doShootTools:function(data){
        this._playTool.getComponent(cc.Sprite).spriteFrame = cc.vv.mahjongmgr.toolsAtlas.getSpriteFrame(data.toolName);
        var sLoc = cc.vv.MjNetMgr.getLocalIndex(data.sendIndex);
        var tLoc = cc.vv.MjNetMgr.getLocalIndex(data.targetIndex);
        var sp = this._toolsPosArr[sLoc];
        var tp = this._toolsPosArr[tLoc];
        this.sendToolAnimation(sp,tp,data.toolName)
    },
    sendToolAnimation: function (from, to, toolName,callback) {
        this._playTool.stopAllActions(); //!!
        this._playTool.setPosition(from);
        this._playTool.active = true;
        this._playTool.opacity = 255;
        var action = cc.sequence(
            cc.moveTo(0.5, to.x, to.y),
            cc.callFunc(function (target) {
                target.getComponent(cc.Animation).play(toolName);
                if (callback) {
                    callback();
                }
            }, this, null)
        );
        var sfx = "yinxiao/"+toolName;
        cc.vv.audioMgr.playSFX(sfx)
        this._playTool.runAction(action);
    },

    initSeats: function () {
        var seats = cc.vv.MjNetMgr.seats;
        for (var i = 0; i < seats.length; ++i) {
            this.initSingleSeat(seats[i]);
        }
    },

    initSingleSeat: function (seat) {
        var index = cc.vv.MjNetMgr.getLocalIndex(seat.seatindex);
        var isOffline = !seat.online;
        var isZhuang = seat.seatindex == cc.vv.MjNetMgr.button;
        this._seats[index].setInfo(seat.name, seat.score);
        this._seats[index].setReady(seat.ready);
        this._seats[index].setOffline(isOffline);
        this._seats[index].setID(seat.userid);
        this._seats[index].voiceMsg(false);

        this._seats2[index].setInfo(seat.name, seat.score);
        this._seats2[index].setZhuang(isZhuang);
        this._seats2[index].setOffline(isOffline);
        this._seats2[index].setID(seat.userid);
        this._seats2[index].voiceMsg(false);
    },

    onBtnSettingsClicked: function () {
        cc.vv.popupMgr.showSettings();
    },

    onBtnBackClicked: function () {
        cc.vv.alert.show("返回大厅", "返回大厅房间仍会保留，快去邀请大伙来玩吧！", function () {
            cc.director.loadScene("hall");
        }, true);
    },

    onBtnChatClicked: function () {

    },

    onBtnWeichatClicked: function (event,customEventData) {
        var desc = "房号:" + cc.vv.MjNetMgr.roomId + " 玩法:" + cc.vv.MjNetMgr.getWanfa();
        var type = Number(customEventData);
        console.log("分享的类型 === "+customEventData);
        cc.vv.anysdkMgr.share("海南麻将",desc,type);
    },
    onReady(){
        cc.vv.net.send('ready');
    },
    onBtnCopyClicked: function () {
        var conf = cc.vv.MjNetMgr.conf;
        var qinyoustr = conf.quanId == -1?"":"亲友圈";
        var wanfastr = conf.seatNum+'人玩法';
        var jushustr = conf.maxGames+"局";
        var str = "【海南麻将】 \n "+qinyoustr+" 房号:" + cc.vv.MjNetMgr.roomId + "，" +wanfastr+"，"+jushustr;
        console.log("点击了复制信息 "+str)
        cc.vv.anysdkMgr.JsCopy(str);
    },

    onBtnDissolveClicked: function () {
        var str = '解散房间不扣房卡，是否确定解散？';
        if (!cc.vv.iOSPassed) {
            str = '是否确定解散？';
        }
        cc.vv.alert.show("解散房间", str, function () {
            cc.vv.net.send("dispress");
        }, true);
    },

    onBtnExit: function () {
        cc.vv.net.send("exit");
    },

    playVoice: function () {
        if (this._playingSeat == null && this._voiceMsgQueue.length) {
            console.log("playVoice2");
            var data = this._voiceMsgQueue.shift();
            var idx = cc.vv.MjNetMgr.getSeatIndexByID(data.sender);
            var localIndex = cc.vv.MjNetMgr.getLocalIndex(idx);
            this._playingSeat = localIndex;
            this._seats[localIndex].voiceMsg(true);
            this._seats2[localIndex].voiceMsg(true);

            var msgInfo = JSON.parse(data.content);

            var msgfile = "voicemsg.amr";
            console.log(msgInfo.msg.length);
            cc.vv.voiceMgr.writeVoice(msgfile, msgInfo.msg);
            cc.vv.voiceMgr.play(msgfile);
            this._lastPlayTime = Date.now() + msgInfo.time;
        }
    },
    changeZhoBu: function () {
        var self = this;
        var zbIndex = cc.sys.localStorage.getItem("zhuobuIndex");
        var zhuobuName = "mjzhuobu";
        if (zbIndex == null) {
            zbIndex = 1;
        } else {
            zbIndex = Number(zbIndex);
            if (zbIndex < 5) {
                zbIndex += 1;
            } else {
                zbIndex = 0;
            }
        }
        zhuobuName = zhuobuName + zbIndex;
        cc.loader.loadRes('zhuobu/' + zhuobuName, cc.SpriteFrame, function (err, spriteFrame) {
            if (err) {
                cc.error(err.message || err);
                return;
            }
            self._zhuobu.getComponent(cc.Sprite).spriteFrame = spriteFrame;
        });
        cc.sys.localStorage.setItem("zhuobuIndex", zbIndex);
    },
    update: function (dt) {
        var minutes = Math.floor(Date.now() / 1000 / 60);
        if (this._lastMinute != minutes) {
            this._lastMinute = minutes;
            var date = new Date();
            var h = date.getHours();
            h = h < 10 ? "0" + h : h;

            var m = date.getMinutes();
            m = m < 10 ? "0" + m : m;
            this._timeLabel.string = "" + h + ":" + m;
        }


        if (this._lastPlayTime != null) {
            if (Date.now() > this._lastPlayTime + 200) {
                this.onPlayerOver();
                this._lastPlayTime = null;
            }
        } else {
            this.playVoice();
        }
    },


    onPlayerOver: function () {
        cc.vv.audioMgr.resumeAll();
        console.log("onPlayCallback:" + this._playingSeat);
        var localIndex = this._playingSeat;
        this._playingSeat = null;
        this._seats[localIndex].voiceMsg(false);
        this._seats2[localIndex].voiceMsg(false);
    },

    onDestroy: function () {
        cc.vv.voiceMgr.stop();
        //        cc.vv.voiceMgr.onPlayCallback = null;
    }
});