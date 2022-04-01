cc.Class({
    extends: cc.Component,

    properties: {
        _gameover: null,
        _gameresult: null,
        _seats: [],
        _isGameEnd: false,
        _btnReady: null,
        _btnResult: null,
        _juNum:null,
        _roomNum:null,
        _time:null,
        _wanfa:null,
        _winTitle:null,
        _normalTitle:null,
    },

    onLoad: function () {
        if (cc.vv == null) {
            return;
        }
        if (cc.vv.MjNetMgr.conf == null) {
            return;
        }
        this._gameover = this.node.getChildByName("game_over");
        this._gameover.active = false;
        this._juNum = this._gameover.getChildByName("ju_num").getComponent(cc.Label);
        this._roomNum = this._gameover.getChildByName("room_num").getComponent(cc.Label);
        this._time = this._gameover.getChildByName("time").getComponent(cc.Label);
        this._wanfa = this._gameover.getChildByName("wanfa").getComponent(cc.Label);
        this._normalTitle = this._gameover.getChildByName("helpbg").getChildByName("normal");
        this._winTitle = this._gameover.getChildByName("helpbg").getChildByName("win")
        this._btnReady = this._gameover.getChildByName("btnReady");
        this._btnReady.on("click", this.onBtnReadyClicked, this);

        var btnShare = this._gameover.getChildByName("btnShare");
        btnShare.on("click", this.onBtnShareClicked, this);

        this._btnResult = this._gameover.getChildByName("btnResult");
        this._btnResult.on("click", this.onBtnResultClicked, this);

        this._gameresult = this.node.getChildByName("game_result");

        var listRoot = this._gameover.getChildByName("result_list");
        var seatNum = cc.vv.MjNetMgr.conf.seatNum;
        for (var i = 1; i <= listRoot.childrenCount; ++i) {
            var s = "s" + i;
            var sn = listRoot.getChildByName(s);
            if (i > seatNum) {
                sn.active = false;
            } else {
                sn.active = true;
                var viewdata = {};
                viewdata.username = sn.getChildByName('username').getComponent(cc.Label);
                viewdata.reason = sn.getChildByName('reason').getComponent(cc.Label);
                viewdata.score = sn.getChildByName('score');
                viewdata.hu = sn.getChildByName('hu');
                viewdata.winBg = sn.getChildByName("winbg");
                viewdata.chengbao = sn.getChildByName('chengbao');
                viewdata.fangpao = sn.getChildByName('fangpao');
                viewdata.mahjongs = sn.getChildByName('pai');
                viewdata.flowers  = sn.getChildByName("flower_pai")
                viewdata.zhuang = sn.getChildByName('zhuang');
                viewdata.hupai = sn.getChildByName('hupai');
                viewdata.zimo = sn.getChildByName('zimo');
                viewdata.liuju = sn.getChildByName('liuju');
                viewdata.qianggang = sn.getChildByName('qianggang');
                viewdata.beiqianggang = sn.getChildByName('beiqianggang');
                viewdata.gangkai = sn.getChildByName("gangkai");
                viewdata._pengandgang = [];
                this._seats.push(viewdata);
            }
        }

        //初始化网络事件监听器
        var self = this;
        this.node.on('game_over', function (data) {
            self._btnReady.active = !self._isGameEnd;
            self._btnResult.active = self._isGameEnd;
            self.onGameOver(data);
        });
        this.node.on('game_end', function () {
            cc.find("Canvas/popups").active = false;
            self._isGameEnd = true;
            self._btnReady.active = false;
            self._btnResult.active = true;
        });
    },


    onGameOver(overData) {
        this._btnReady.active = !cc.vv.replayMgr.isReplay()
        let data = overData.results
        console.log(data);
        if (data.length == 0) {
            this._gameresult.active = true;
            return;
        }
        this._gameover.active = true;
        this._juNum.string = "局数："+cc.vv.MjNetMgr.numOfGames + "/" + cc.vv.MjNetMgr.maxNumOfGames
        this._time.string = cc.vv.utils.timeShow(overData.time);
        this._roomNum.string = "房号："+cc.vv.MjNetMgr.roomId;
        this._wanfa.string = cc.vv.MjNetMgr.getWanfa();
        this._winTitle.active = data[cc.vv.MjNetMgr.seatIndex].score > 0;
        this._normalTitle.active = data[cc.vv.MjNetMgr.seatIndex].score <= 0;
        //显示玩家信息
        var seatNum = cc.vv.MjNetMgr.conf.seatNum
        for (var i = 0; i < seatNum; ++i) {
            var seatView = this._seats[i];
            var userData = data[i];
            var hued = false;
            var hupai = -1;
            var mgn = 0;
            var agn = 0;
            var isshow = true;
            seatView.hu.active = false;
            seatView.winBg.active = false;
            seatView.chengbao.active = false;
            seatView.fangpao.active = false;
            seatView.zimo.active = false;
            seatView.liuju.active = false;
            seatView.qianggang.active = false;
            seatView.beiqianggang.active = false;
            seatView.gangkai.active = false;
            //胡牌的玩家才显示 是否清一色
            var numOfGangs = userData.angangs.length + userData.wangangs.length + userData.diangangs.length;
            for (var j = 0; j < userData.actions.length; ++j) {
                var ac = userData.actions[j];
                if (ac.type == "zimo" || ac.type == "ganghua" || ac.type == "hu" || ac.type == "qiangganghu") {
                    if (ac.type == "zimo") {
                        seatView.zimo.active = true;
                        isshow = false;
                    } else if (ac.type == "ganghua") {
                        seatView.gangkai.active = true;
                        isshow = false;
                    } else if (ac.type == "qiangganghu") {
                        seatView.qianggang.active = true;
                        isshow = false;
                    }
                    hued = true;
                } else if (ac.type == "fangpao") {
                    seatView.fangpao.active = true;
                } else if (ac.type == "angang") {
                    agn++;
                } else if (ac.type == "diangang" || ac.type == "wangang") {
                    mgn++;
                } else if (ac.type == "beiqianggang") {
                    seatView.beiqianggang.active = true;
                }
            }
            if (userData.huorder && isshow) {
                seatView.hu.active = true;
                seatView.winBg.active = true;
            }
            if (userData.isHe) {
                seatView.liuju.active = true;
            }
            if (hued) {
                hupai = userData.holds.pop();
                console.log("忽的牌 == "+hupai)
            }
            cc.vv.mahjongmgr.sortMJ(userData,null);
            //胡牌不参与排序
            if (hued) {
                userData.holds.push(hupai);
            }
            if (userData.ischengbao) {
                seatView.chengbao.active = true;
            }

            seatView.username.string = cc.vv.MjNetMgr.seats[i].name;
            seatView.zhuang.active = cc.vv.MjNetMgr.button == i;
            seatView.reason.string = userData.reason;
            if (userData.score > 0) {
                seatView.score.getComponent(cc.Label).string = userData.score;
                seatView.score.color = new cc.Color(219,89,71)
            } else {
                seatView.score.getComponent(cc.Label).string = userData.score;
                seatView.score.color = new cc.Color(109,115,116)
            }

            //隐藏所有牌
            for (var k = 0; k < seatView.mahjongs.childrenCount; ++k) {
                let n = seatView.mahjongs.children[k];
                n.active = false;
            }
            for (var k = 0; k < seatView.flowers.childrenCount; ++k) {
                let n = seatView.flowers.children[k];
                n.active = false;
            }

            var lackingNum = (userData.pengs.length + numOfGangs + userData.chis.length) * 3;
            if(isNaN(lackingNum)){
                lackingNum = 0;
            }
            //显示相关的牌
            for (var k = 0; k < userData.holds.length; ++k) {
                var pai = userData.holds[k];
                var n = seatView.mahjongs.children[k + lackingNum];
                if(n){
                    n.active = true;
                    var sprite = n.getChildByName("CarFace").getComponent(cc.Sprite);
                    sprite.spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID(pai);
                }
              
            }
            for (var k = 0; k < userData.flowers.length; ++k) {
                var pai = userData.flowers[k];
                var n = seatView.flowers.children[k];
                if(n){
                    n.active = true;
                    var sprite = n.getChildByName("CarFace").getComponent(cc.Sprite);
                    sprite.spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID(pai);
                }
              
            }
            for (var k = 0; k < seatView._pengandgang.length; ++k) {
                seatView._pengandgang[k].removeFromParent();
                seatView._pengandgang[k].destroy();
            }
            seatView._pengandgang = [];
            //初始化杠牌
            var index = 0;
            var gangs = userData.angangs;
            for (var k = 0; k < gangs.length; ++k) {
                var mjid = gangs[k].pai;
                this.initPengAndGangs(seatView, index, mjid, "angang");
                index++;
            }

            var gangs = userData.diangangs;
            for (var k = 0; k < gangs.length; ++k) {
                var mjid = gangs[k].pai;
                this.initPengAndGangs(seatView, index, mjid, "diangang");
                index++;
            }

            var gangs = userData.wangangs;
            for (var k = 0; k < gangs.length; ++k) {
                var mjid = gangs[k].pai;
                this.initPengAndGangs(seatView, index, mjid, "wangang");
                index++;
            }

            //初始化碰牌
            var pengs = userData.pengs
            if (pengs) {
                for (var k = 0; k < pengs.length; ++k) {
                    var mjid = pengs[k].pai;
                    this.initPengAndGangs(seatView, index, mjid, "peng");
                    index++;
                }
            }

            var chis = userData.chis;
            if (chis) {
                for (var k = 0; k < chis.length; k++) {
                    var mjid = chis[k];
                    this.initPengAndGangs(seatView, index, mjid, "chi");
                    index++;
                }
            }
        }
    },
    initPengAndGangs: function (seatView, index, mjid, flag) {
        var pgroot = null;
        if (seatView._pengandgang.length <= index) {
            pgroot = cc.instantiate(cc.vv.mahjongmgr.pgcSelf);
            pgroot.scaleX = 0.7
            pgroot.scaleY = 0.7
            seatView._pengandgang.push(pgroot);
            seatView.mahjongs.addChild(pgroot);
        } else {
            pgroot = seatView._pengandgang[index];
            pgroot.active = true;
        }

        var sprites = pgroot.children;
        for (var s = 0; s < sprites.length; ++s) {
            var sprite = sprites[s];
            var cf = sprite.getChildByName("CardFace");
            cf.active = false;
            sprite.scaleX = 0.7;
            sprite.scaleY = 0.7;
            if (sprite.name == "gang") {
                var isGang = true;
                if (flag == 'peng' || flag == 'chi') {
                    isGang = false;
                }
                sprite.active = isGang;
                if (isGang) {
                    cf.getComponent(cc.Sprite).spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID(mjid);
                    cf.active = true;
                }
            } else {
                if (flag == 'chi') {
                    if (sprite.name == "cp1") {
                        cf.getComponent(cc.Sprite).spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID(mjid.p1);
                    } else if (sprite.name == "cp2") {
                        cf.getComponent(cc.Sprite).spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID(mjid.p2);
                    } else if (sprite.name == "cp3") {
                        cf.getComponent(cc.Sprite).spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID(mjid.p3);
                    }
                    cf.active = true;
                } else if (flag == "angang") {
                    sprite.getComponent(cc.Sprite).spriteFrame = cc.vv.mahjongmgr.getEmptySpriteFrame("myself");

                } else {
                    cf.getComponent(cc.Sprite).spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID(mjid);
                    cf.active = true;
                }
            }
        }
        pgroot.x = index * 55*0.7 * 3 + index * 20*0.7 + 20;
    },

    onBtnReadyClicked: function () {
        if (cc.vv.replayMgr.isReplay()) return;
        if (this._isGameEnd) {
            console.log("youxi yijieshu ")
        } else {
            if(cc.vv.MjNetMgr.gamestate == ""){
                cc.vv.net.send('ready');
            }
        }
        this._gameover.active = false;
    },

    onBtnShareClicked: function () {
        console.log("onBtnShareClicked");
        cc.vv.anysdkMgr.shareResult(1);
    },

    onBtnResultClicked:function(){
        console.log("查看结果")
        if (this._isGameEnd) {
            this._gameover.active = false;
            this._gameresult.active = true;
        } 
    },

});