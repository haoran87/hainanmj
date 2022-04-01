cc.Class({
    extends: cc.Component,

    properties: {
        gameRoot: {
            default: null,
            type: cc.Node
        },
        prepareRoot: {
            default: null,
            type: cc.Node
        },
        _myMJArr: [],
        _myPosArr: [],
        _options: null,
        _selectedMJ: null,
        _mjLoc: null,
        _chupaiList: [],
        _playEfxs: [],
        _opts: [],
        _btnPosition: null,
        _guohu: null,
        _clicked: false,
        _gameInfo: null,
        _hushow:null,
    },

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
        cc.vv.audioMgr.resumeAll()
        cc.vv.audioMgr.playBGM("bg/bgGame");
        this.gameRoot.active = false;
        this.prepareRoot.active = true;
        // this.addComponent("NoticeTip");
        this.addComponent("GameOver");
        this.addComponent("PengGangs");
        // this.addComponent("MJRoom");
        this.addComponent("TimePointer");
        this.addComponent("GameResult");
        this.addComponent("Chat");
        this.addComponent("Folds");
        this.addComponent("ReplayCtrl");
        this.addComponent("PopupMgr");
        this.addComponent("ReConnect");
        this.addComponent("Voice");
        this.addComponent("UserInfoShow");
        // this.addComponent("distance");
        this.initView();
        this.initEventHandlers();
    },
    start: function () {
        this.initWanfaLabel();
        this.onGameBeign();
        if (!cc.vv.replayMgr.isReplay()) {
            // var myData = cc.vv.MjNetMgr.seats[cc.vv.MjNetMgr.seatIndex];
            // if (myData.isFirstIn) {
            //     this.getUserPosition();
            // }
            // if (!myData.ready) {
            //     cc.vv.net.send('ready');
            // }
        }
    },
    initView: function () {
        var self = this;
        var gameChild = this.node.getChildByName("game");
        let sides = cc.vv.MjNetMgr.initSides()
        this._gameInfo = gameChild.getChildByName('game_info').getComponent(cc.RichText);
        this._gameInfo.string = this.initGameInfo();
        this._hushow = this.node.getChildByName("huShow")
        this._hushow.active = false;
        // this._btnPosition = cc.find("Canvas/btn_position");
        // this._btnPosition.on("click", this.robotFunc, this);
        this._guohu = cc.find("Canvas/game/guohu");
        this._guohu.active = false;
        for (var i = 0; i < sides.length; ++i) {
            var side = sides[i];
            var sideChild = gameChild.getChildByName(side);
            sideChild.active = true;
            this._playEfxs.push(sideChild.getChildByName("play_efx").getComponent(cc.Animation));
            this._chupaiList.push(sideChild.getChildByName("ChuPai"));
        }
        var opts = gameChild.getChildByName("ops");
        this._options = opts;
        this.hideOptions();
        this.hideChupai();
        this.initMyholds(gameChild);
    },
    initGameInfo() {
        let lingHome = ["东","南","西","北"]
        let justr = cc.vv.MjNetMgr.numOfGames + "/" + cc.vv.MjNetMgr.maxNumOfGames
        let mjstr = "<color=#9CDABF>剩余</c> <color=#FFFDA0>" + cc.vv.MjNetMgr.numOfMJ + "</color><color=#9CDABF> 张 </c>"
        justr = "<color=#9CDABF> 第 </c><color=#FFFDA0>" + justr + "</color><color=#9CDABF> 局 </c>"
        let zhuangstr = ""
        let lingStr = ""
        if(cc.vv.MjNetMgr.conf.otherData.ling){
            lingStr = "<color=#FFFDA0> "+lingHome[cc.vv.MjNetMgr.gameLing]+"令 </color>"
        }
        if(cc.vv.MjNetMgr.lianzhuang > 0){
            zhuangstr = "<color=#9CDABF> 连庄</c>"+"<color=#FFFDA0> "+ cc.vv.MjNetMgr.lianzhuang +" </color>"
        }
        return mjstr + justr + zhuangstr + lingStr;


    },
    initMyholds: function (gameChild) {
        var self = this;
        var myselfChild = gameChild.getChildByName("myself");
        var myholds = myselfChild.getChildByName("holds");
        for (var i = 0; i < myholds.children.length; ++i) {
            var sprite = myholds.children[i].getChildByName("CardFace").getComponent(cc.Sprite);
            this._myMJArr.push(sprite);
            sprite.spriteFrame = null;
            var x = myholds.children[i].x
            var y = myholds.children[i].y
            var pos = {
                x: x,
                y: y,
            }
            this._myPosArr.push(pos)
            myholds.children[i].on(cc.Node.EventType.TOUCH_MOVE, function (event) {
                var ss = cc.vv.MjNetMgr.seats[cc.vv.MjNetMgr.seatIndex];
                if (!ss.canChuPai) return;
                if (!event.target.getComponent(cc.Button).interactable) return;

                if (event.target == self._draggedMJ) {
                    var y = event.getDeltaY();
                    var x = event.getDeltaX();
                    event.target.y += y;
                    if (event.target.y >= 60) {
                        event.target.x += x;
                    } else {
                        var isContain = event.target.getBoundingBoxToWorld().contains(event.getLocation())
                        if (!isContain) {
                            self.resetPos();
                        }
                    }
                    return;
                } else if (self._draggedMJ != null) { //恢复上次拖动的精灵
                    self._draggedMJ.y = 0;
                    self.resetPos();
                }
                self._draggedMJ = event.target;
            });
            myholds.children[i].on(cc.Node.EventType.TOUCH_CANCEL, function (event) { //防止触摸点移出
                if (self._draggedMJ != null) {
                    if (event.target.y >= 60) {
                        self.shoot(self._draggedMJ.mjId, self._draggedMJ);
                    } else {
                        self.resetPos();
                    }

                }
            });
            myholds.children[i].on(cc.Node.EventType.TOUCH_END, function (event, customEventData) {
                var ss = cc.vv.MjNetMgr.seats[cc.vv.MjNetMgr.seatIndex];
                if (!ss.canChuPai) return;
                if (customEventData) return;
                if (self._draggedMJ != null) {
                    if (event.target.y >= 60) {
                        self.shoot(self._draggedMJ.mjId, self._draggedMJ);
                    } else {
                        self.resetPos();
                        self._draggedMJ = null;
                    }
                } else {
                    return;
                }
            });

        }

        var realwidth = cc.view.getVisibleSize().width;
        myholds.scaleX *= realwidth / 1280;
        myholds.scaleY *= realwidth / 1280;
    },
    resetPos: function () {
        console.log("^^^^^33333")
        var myselfChild = this.node.getChildByName("game").getChildByName("myself");
        var myholds = myselfChild.getChildByName("holds");
        for (var i = 0; i < myholds.children.length; ++i) {
            var pos = this._myPosArr[i];
            myholds.children[i].x = pos.x;
            myholds.children[i].y = pos.y;
        }
    },
    deleteChooseMyHolds: function () {
        var ss = cc.vv.MjNetMgr.seats[cc.vv.MjNetMgr.seatIndex];
        if (!ss.canChuPai) return;
        if (this._selectedMJ == null) return;
        this._selectedMJ = null;
        this._hushow.active = false;
        console.log("消除选牌 了 deleteChooseMyHolds ");
        var myselfChild = this.node.getChildByName("game").getChildByName("myself");
        var myholds = myselfChild.getChildByName("holds");
        for (var i = 0; i < myholds.children.length; ++i) {
            var pos = this._myPosArr[i];
            myholds.children[i].x = pos.x;
            myholds.children[i].y = pos.y;
        }
    },
    // getUserPosition: function () {
    //     cc.vv.net.send("get_user_mapInfo")
    // },
    robotFunc(){
        console.log("设置机器人")
        cc.vv.net.send("set_user_robot")
    },
    hideChupai: function () {
        for (var i = 0; i < this._chupaiList.length; ++i) {
            this._chupaiList[i].active = false;
        }
    },

    initEventHandlers: function () {
        cc.vv.MjNetMgr.dataEventHandler = this.node;

        //初始化事件监听器
        var self = this;

        this.node.on('game_begin', function (data) {
            self._gameInfo.string = self.initGameInfo()
            cc.find("Canvas/game_over").active = false;
            self.onGameBeign();
        });

        this.node.on("ga_have_all_do",function(data){
            self.showHolds();
        })
        this.node.on("show_hu",function(data){
            self.initHushow(data)
        })
        this.node.on('game_chupai', function (data) {
            data = data;
            if (data.last != cc.vv.MjNetMgr.seatIndex) {
                self.initMopai(data.last, null);
            }
            if (!cc.vv.replayMgr.isReplay() && data.turn != cc.vv.MjNetMgr.seatIndex) {
                self.initMopai(data.turn, -1);
            }
        });

        this.node.on('game_mopai', function (data) {
            data = data;
            var pai = data.pai;
            var localIndex = cc.vv.MjNetMgr.getLocalIndex(data.seatIndex);
            if (localIndex == 0) {
                // var index = 13;
                // var sprite = self._myMJArr[index];
                // self.setSpriteFrameByMJID(sprite, pai);
                // sprite.node.parent.mjId = pai;
                // sprite.node.parent.y = 0;
                self.initMahjongs()
            } else if (cc.vv.replayMgr.isReplay()) {
                self.initMopai(data.seatIndex, pai);
            }
        });

        this.node.on('game_huanpai66', function (data) {
            var huanpai = cc.find('Canvas/huanpai');
            console.log("换牌*****")
            huanpai.active = true;
            if (cc.vv.huanpai) {
                cc.vv.huanpai.setData(data);
            }
        });

        this.node.on('game_action', function (data) {
            self.showAction(data);
        });
        this.node.on('hupai', function (data) {
            var seatIndex = data.seatindex;
            var seatData = cc.vv.MjNetMgr.seats[seatIndex];
            var sfx = "hu";
            if (data.iszimo) {
                sfx = "zimo"
            }
            if (seatData.sex == 2) {
                sfx = "girl/" + sfx;
            } else {
                sfx = "boy/" + sfx;
            }
            cc.vv.audioMgr.playSFX(sfx);
        });

        this.node.on('mj_count', function () {
            self._gameInfo.string = self.initGameInfo()
        });


        this.node.on('game_over', function (data) {
            self.gameRoot.active = false;
            self.prepareRoot.active = true;
        });
        this.node.on('game_chupai_notify', function (data) {
            var seatData = data.seatData;
            //如果是自己，则刷新手牌
            self._selectedMJ = null;
            self._draggedMJ = null;
            if (self._guohu.active) {
                self._guohu.active = false;
            }
            if (seatData.seatindex == cc.vv.MjNetMgr.seatIndex) {
                self.hideOptions();
                self.initMahjongs();
            } else {
                // console.log("游戏内接受到出牌消息", seatData)
                self.initOtherMahjongs(seatData);
            }
            self.showChupai(seatData.seatindex);
            var audioUrl = cc.vv.mahjongmgr.getAudioURLByMJID(seatData.sex, data.pai);
            cc.vv.audioMgr.playSFX(audioUrl);
            cc.vv.audioMgr.playSFX("yinxiao/carddown");
            self.initMopai(seatData.seatindex, null);
        });
        this.node.on("szbg_tips",function(data){
            var localIndex = self.getLocalIndex(data.button);
            self.playEfx(localIndex,"play_szbg");
        });
        this.node.on("san_dao_pai",function(data){
            var localIndex = self.getLocalIndex(data.seatIndex);
            self.playEfx(localIndex,"play_sandp");
        });
        this.node.on("si_dao_pai",function(data){
            var localIndex = self.getLocalIndex(data.seatIndex);
            self.playEfx(localIndex,"play_sidp");
        });
        this.node.on('game_buhua_notify', function (data) {
            self._gameInfo.string = self.initGameInfo()
            var seatData = data.seatData;
            var localIndex = self.getLocalIndex(seatData.seatindex);
            var sfx = "buhua";
            if (seatData.sex == 2) {
                sfx = "girl/" + sfx;
            } else {
                sfx = "boy/" + sfx;
            }
            cc.vv.audioMgr.playSFX(sfx);
            self.playEfx(localIndex, "play_buhua");
            // cc.vv.audioMgr.playSFX("yinxiao/peng");
            if (seatData.seatindex == cc.vv.MjNetMgr.seatIndex) {
                self.initMahjongs();
            }
            else {
                self.initOtherMahjongs(seatData);
            }
        });
        this.node.on('guo_notify', function (data) {
            self.hideOptions();
            var seatData = data;
            //如果是自己，则刷新手牌
            if (seatData.seatindex == cc.vv.MjNetMgr.seatIndex) {
                self.initMahjongs();
            }
            cc.vv.audioMgr.playSFX("yinxiao/carddown");
        });
        this.node.on('guo_result', function (data) {
            self.hideOptions();
        });


        this.node.on('peng_notify', function (data) {
            self.hideChupai();
            var seatData = data;
            if (seatData.seatindex == cc.vv.MjNetMgr.seatIndex) {
                self.initMahjongs();
            } else {
                self.initOtherMahjongs(seatData);
            }
            var localIndex = self.getLocalIndex(seatData.seatindex);

            var sfx = "peng";
            if (seatData.sex == 2) {
                sfx = "girl/" + sfx;
            } else {
                sfx = "boy/" + sfx;
            }
            cc.vv.audioMgr.playSFX(sfx);
            console.log("&&&&*****peng**",data.zhuchiNum)
            if(data.zhuchiNum == 4){
                self.playEfx(localIndex, "play_sidp");
            }
            else if(data.zhuchiNum == 3){
                self.playEfx(localIndex, "play_sandp");
            }
            else{
                self.playEfx(localIndex, "play_peng");
            }
           
            cc.vv.audioMgr.playSFX("yinxiao/peng");
            self.hideOptions();
        });

        this.node.on('gang_notify', function (data) {
            self.hideChupai();
            var data = data;
            var seatData = data.seatData;
            var gangtype = data.gangtype;
            if (seatData.seatindex == cc.vv.MjNetMgr.seatIndex) {
                self.initMahjongs();
            } else {
                self.initOtherMahjongs(seatData);
            }
            var localIndex = self.getLocalIndex(seatData.seatindex);
            var sfx = "gang";
            if (seatData.sex == 2) {
                sfx = "girl/" + sfx;
            } else {
                sfx = "boy/" + sfx;
            }
            cc.vv.audioMgr.playSFX(sfx);
            console.log("&&&&*****gang**",data.zhuchiNum)
            if(data.zhuchiNum == 4){
                self.playEfx(localIndex, "play_sidp");
            }
            else if(data.zhuchiNum == 3){
                self.playEfx(localIndex, "play_sandp");
            }
            else{
                self.playEfx(localIndex, "play_gang");
            }
          
            if (gangtype == "angang") {
                cc.vv.audioMgr.playSFX("yinxiao/rain");
            } else {
                cc.vv.audioMgr.playSFX("yinxiao/guafeng");
            }

        });
        this.node.on("hangang_notify", function (data) {
            var localIndex = self.getLocalIndex(data);
            var seatData = cc.vv.MjNetMgr.seats[data];
            self.hideOptions();
        });

        this.node.on('chi_notify', function (data) {
            self.hideChupai();
            var seatData = data;
            if (seatData.seatindex == cc.vv.MjNetMgr.seatIndex) {
                self.initMahjongs();
            } else {
                self.initOtherMahjongs(seatData);
            }
            var localIndex = self.getLocalIndex(seatData.seatindex);
            console.log("&&&&*****chi**",data.zhuchiNum)
            if(data.zhuchiNum == 4){
                self.playEfx(localIndex, "play_sidp");
            }
            else if(data.zhuchiNum == 3){
                self.playEfx(localIndex, "play_sandp");
            }
            else{
                 self.playEfx(localIndex, "play_chi");
            }
           
            var sfx = "chi"
            if (seatData.sex == 2) {
                sfx = "girl/" + sfx;
            } else {
                sfx = "boy/" + sfx;
            }
            cc.vv.audioMgr.playSFX(sfx);
            self.hideOptions();
        });
        this.node.on("do_buhua", function (data) {
            var seatIndex = data.seatIndex;
            self.hideOptions();
            for (var i = 0; i < self._myMJArr.length; i++) {
                var mj = self._myMJArr[i].node.parent
                if (mj.active) {
                    if (mj.mjId < 34) {
                        mj.getComponent(cc.Button).interactable = false;
                    } else {
                        mj.getComponent(cc.Button).interactable = true;
                    }
                }
            }
        })
    },
    initHushow(data){
        let num = this._hushow.getChildByName("num_label").getChildByName("num")
        let paiBox = this._hushow.getChildByName("paiBox")
        for ( let i = 0 ; i < paiBox.childrenCount ; i++){
            paiBox.children[i].active = false;
        }
        num.getComponent(cc.Label).string = data.sum
        let paiKey = data.paiKey
        let keyArr = Object.keys(paiKey)
        for(var k in keyArr){
            let pai = parseInt(keyArr[k])
            paiBox.children[k].getChildByName("CardFace").getComponent(cc.Sprite).spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID(pai)
            paiBox.children[k].active = true
            paiBox.children[k].getChildByName("paiNum").getComponent(cc.Label).string = paiKey[pai] + "张"
        }
        this._hushow.active = true
    },
    showChupai: function (index) {
        var pai = cc.vv.MjNetMgr.chupai;
        if (pai >= 0) {
            var localIndex = this.getLocalIndex(index);
            var cp = this._chupaiList[localIndex];
            cp.getChildByName("pai").getChildByName("CardFace").getComponent(cc.Sprite).spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID(pai);
            cp.active = true;
            cp.getComponent(cc.Animation).play("chupai");
        }
    },

    addOption: function (btnName, pai, xIndex, pgl) {
        if (btnName == "btnGang" && cc.vv.MjNetMgr.seatIndex == cc.vv.MjNetMgr.turn) {
            this._options.getChildByName("btnGuo").active = false;
        } else {
            this._options.getChildByName("btnGuo").active = true;
        }

        for (var i = 0; i < this._options.childrenCount; ++i) {
            var option = this._options.children[i];
            if (option.name == btnName && option.active == false) {
                if (pgl) {
                    for (var k = 0; k < option.childrenCount; k++) {
                        var chicard = option.children[k].getChildByName("CardFace");
                        chicard.getComponent(cc.Sprite).spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID(pgl[k]);
                    }
                }
                option.active = true;
                option.x = 280 - xIndex * 180;
                option.pai = pai;
                return;
            }
        }

    },

    hideOptions: function (data) {
        this._options.active = false;
        for (var i = 0; i < this._options.childrenCount; ++i) {
            var child = this._options.children[i];
            if (child.name != "btnGuo") {
                child.active = false;
                child.x = 310;
            }
        }
    },

    showAction: function (data) {
        if (this._options.active) {
            this.hideOptions();
        }
        if (data && (data.hu || data.gang || data.peng || data.canChi || data.canBu)) {
            this._options.active = true;
            var xIndex = 0;
            // if (data.canBu) {
            //     this.addOption("btnBuhua", data.pai, xIndex);
            //     xIndex++
            // }
            if (data.hu) {
                this.addOption("btnHu", data.pai, xIndex);
                xIndex++
            }
            if (data.peng) {
                this.addOption("btnPeng", data.pai, xIndex);
                xIndex++
            }
            if (data.gang) {
                for (var i = 0; i < data.gangpai.length; ++i) {
                    var gp = data.gangpai[i];
                    this.addOption("btnGang", gp, xIndex);
                    xIndex++
                }
            }
            if (data.canChi) {
                var paiGroupList = this.getChiList(data.pai);
                for (var g = 0; g < paiGroupList.length; g++) {
                    this.addOption('btnChi' + (g + 1), data.pai, xIndex, paiGroupList[g]);
                    xIndex++
                }

            }
        }
    },

    initWanfaLabel: function () {
        var pwanfa = cc.find("Canvas/prepare/wanfa").getComponent(cc.Label);
        var wanfa = cc.find("Canvas/game/wanfa").getComponent(cc.Label);
        wanfa.string = cc.vv.MjNetMgr.getWanfa();
        pwanfa.string = cc.vv.MjNetMgr.getWanfa();
    },

    playEfx: function (index, name) {
        this._playEfxs[index].node.active = true;
        this._playEfxs[index].play(name);
    },

    onGameBeign: function () {
        for (var i = 0; i < this._playEfxs.length; ++i) {
            this._playEfxs[i].node.active = false;
        }
        this.hideChupai();
        this.hideOptions();
        let sides = cc.vv.MjNetMgr.initSides();
        var gameChild = this.node.getChildByName("game");
        this.showHolds()
        for (var i = 0; i < sides.length; ++i) {
            if(sides[i] == "myself") continue;
            var sideChild = gameChild.getChildByName(sides[i]);
            var holds = sideChild.getChildByName("holds");
            for (var j = 0; j < holds.childrenCount; ++j) {
                var nc = holds.children[j];
                var sprite = nc.getComponent(cc.Sprite);
                nc.active = true;
                if (cc.vv.replayMgr.isReplay()) {
                    sprite.spriteFrame = cc.vv.mahjongmgr.getFoldsEmptySpriteFrame(sides[i]);
                    var cf = cc.instantiate(cc.vv.mahjongmgr.CardFace);
                    if (sides[i] == "right") {
                        nc.scaleX = 0.35;
                        nc.scaleY = 0.35;
                        cf.angle = 90
                    } else if (sides[i] == "left") {
                        nc.scaleX = 0.35;
                        nc.scaleY = 0.35;
                        cf.angle = -90;
                    } else if (sides[i] == "up") {
                        cf.angle = 180;
                    }
                    cf.y = 10;
                    nc.addChild(cf);
                } else {
                    nc.scaleX = 0.5;
                    nc.scaleY = 0.5;
                    sprite.spriteFrame = cc.vv.mahjongmgr.getHoldsEmptySpriteFrame(sides[i]);
                }
            }
        }

        if (cc.vv.MjNetMgr.gamestate == "" && cc.vv.replayMgr.isReplay() == false) {
            return;
        }
        this.gameRoot.active = true;
        this.prepareRoot.active = false;
        this.initMahjongs();
        var seats = cc.vv.MjNetMgr.seats;
        for (var i in seats) {
            var seatData = seats[i];
            var localIndex = cc.vv.MjNetMgr.getLocalIndex(i);
            if (localIndex != 0) {
                this.initOtherMahjongs(seatData);
                if (i == cc.vv.MjNetMgr.turn && seatData.canChuPai) {
                    this.initMopai(i, -1);
                } else {
                    this.initMopai(i, null);
                }
            } else {
                this._guohu.active = seatData.guoHuShow;
            }
        }
       
        if (cc.vv.MjNetMgr.curaction != null) {
            this.showAction(cc.vv.MjNetMgr.curaction);
        } 
    },

    onMJClicked: function (event, customEventData) {
        //如果不是自己的轮子，则忽略
        var ss = cc.vv.MjNetMgr.seats[cc.vv.MjNetMgr.seatIndex];
        if (!ss.canChuPai) return;
        if (!customEventData) return;
        if (!event.target.getComponent(cc.Button).interactable) return;
        console.log("点击目标数据 === " + customEventData);
        console.log("onMJClicked 点击目标 == " + this._selectedMJ)
        for (var i = 0; i < this._myMJArr.length; ++i) {
            if (event.target == this._myMJArr[i].node.parent) {
                //如果是再次点击，则出牌
                if (event.target == this._selectedMJ) {
                    this.shoot(this._selectedMJ.mjId, this._selectedMJ);
                    return;
                }
                if (this._selectedMJ != null) {
                    this.resetPos();
                }
                event.target.y = 35;
                this._selectedMJ = event.target;
                this._hushow.active = false;
                cc.vv.net.send("get_hu_pai",{pai:this._selectedMJ.mjId})
                return;
            }
        }
    },

    //出牌
    shoot: function (mjId, mjNode) {
        if (mjId == null) {
            return;
        }
        console.log("shooot 出牌  " + mjId)
        var ss = cc.vv.MjNetMgr.seats[cc.vv.MjNetMgr.seatIndex];
        this._hushow.active = false
        cc.vv.net.send('chupai', mjId);
        ss.canChuPai = false;
        this.hideOptions()
        mjNode.active = false;
    },

    getMJIndex: function (side, index) {
        if (side == "right" || side == "up") {
            return 13 - index;
        }
        return index;
    },

    initMopai: function (seatIndex, pai) {
        var localIndex = cc.vv.MjNetMgr.getLocalIndex(seatIndex);
        var side = cc.vv.mahjongmgr.getSide(localIndex);
        var gameChild = this.node.getChildByName("game");
        var sideChild = gameChild.getChildByName(side);
        var holds = sideChild.getChildByName("holds");
        var lastIndex = this.getMJIndex(side, 13);
        var nc = holds.children[lastIndex];
        // nc.scaleX = 0.5;
        // nc.scaleY = 0.5;
        if (pai == null) {
            nc.active = false;
        } else if (pai >= 0) {
            var sprite = nc.getComponent(cc.Sprite);
            sprite.spriteFrame = cc.vv.mahjongmgr.getFoldsEmptySpriteFrame(side);
            if (nc.childrenCount == 0) {
                var cf = cc.instantiate(cc.vv.mahjongmgr.CardFace);
                if (side == "right") {
                    nc.scaleX = 0.35;
                    nc.scaleY = 0.35;
                    cf.angle = 90
                } else if (side == "left") {
                    nc.scaleX = 0.35;
                    nc.scaleY = 0.35;
                    cf.angle = -90
                } else if (side == "up") {
                    cf.angle = 180;
                }
                cf.y = 10;
                cf.getComponent(cc.Sprite).spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID(pai);
                nc.addChild(cf);
            } else {
                nc.getChildByName("CardFace").getComponent(cc.Sprite).spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID(pai);
            }

            nc.active = true;
        } else if (pai == -1) {
            nc.active = true;
            var sprite = nc.getComponent(cc.Sprite);
            if (cc.vv.replayMgr.isReplay()) {
                sprite.spriteFrame = cc.vv.mahjongmgr.getFoldsEmptySpriteFrame(side);
            } else {
                sprite.spriteFrame = cc.vv.mahjongmgr.getHoldsEmptySpriteFrame(side);
            }

        }
    },

    initEmptySprites: function (seatIndex) {
        var localIndex = cc.vv.MjNetMgr.getLocalIndex(seatIndex);
        var side = cc.vv.mahjongmgr.getSide(localIndex);

        var gameChild = this.node.getChildByName("game");
        var sideChild = gameChild.getChildByName(side);
        var holds = sideChild.getChildByName("holds");
        var spriteFrame = cc.vv.mahjongmgr.getEmptySpriteFrame(side);
        for (var i = 0; i < holds.childrenCount; ++i) {
            var nc = holds.children[i];
            nc.scaleX = 1.0;
            nc.scaleY = 1.0;

            var sprite = nc.getComponent(cc.Sprite);
            sprite.spriteFrame = spriteFrame;
        }
    },

    initOtherMahjongs: function (seatData) {
        var localIndex = this.getLocalIndex(seatData.seatindex);
        if (localIndex == 0) {
            return;
        }

        if (!seatData.pengs || !seatData.angangs || !seatData.diangangs || !seatData.chis) return;

        var side = cc.vv.mahjongmgr.getSide(localIndex);
        var game = this.node.getChildByName("game");
        var sideRoot = game.getChildByName(side);
        var sideHolds = sideRoot.getChildByName("holds");
        var num = seatData.pengs.length + seatData.angangs.length + seatData.diangangs.length + seatData.wangangs.length + seatData.chis.length;
        num *= 3;
        for (var i = 0; i < num; ++i) {
            var idx = this.getMJIndex(side, i);
            sideHolds.children[idx].active = false;
        }
        
        if (seatData.holds && seatData.holds.length > 0) {
            var holds = seatData.holds;
            for (var i = 0; i < holds.length; ++i) {
                var idx = this.getMJIndex(side, i + num);
                var paiNode = sideHolds.children[idx]
                if (paiNode) {
                    var sprite = paiNode.getChildByName("CardFace").getComponent(cc.Sprite);
                    sprite.node.active = true;
                    sprite.spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID(holds[i]);
                }

            }

            if (holds.length + num == 13) {
                var lasetIdx = this.getMJIndex(side, 13);
                sideHolds.children[lasetIdx].active = false;
            }
        }
    },

    initMahjongs: function () {
        this.resetPos();
        var seats = cc.vv.MjNetMgr.seats;
        var seatData = seats[cc.vv.MjNetMgr.seatIndex];
        let sholds = seatData.holds;
        console.log("排列手里的牌",sholds)
        if (!sholds) {
            return;
        }
        //初始化手牌
        var lackingNum = (seatData.pengs.length + seatData.angangs.length + seatData.diangangs.length + seatData.wangangs.length + seatData.chis.length) * 3;
        for (var i = 0; i < sholds.length; ++i) {
            var mjid = sholds[i];
            var sprite = this._myMJArr[i + lackingNum];
            if (sprite) {
                sprite.node.parent.mjId = mjid;
                if(mjid < 34){
                    sprite.node.parent.getComponent(cc.Button).interactable = true;
                }
                else{
                    sprite.node.parent.getComponent(cc.Button).interactable = false;
                }
                this.setSpriteFrameByMJID(sprite, mjid);
            }

        }
        for (var i = 0; i < lackingNum; ++i) {
            var sprite = this._myMJArr[i];
            sprite.node.parent.mjId = null;
            sprite.spriteFrame = null;
            sprite.node.parent.active = false;
            sprite.node.parent.getComponent(cc.Button).interactable = true;
        }
        for (var i = lackingNum + sholds.length; i < this._myMJArr.length; ++i) {
            var sprite = this._myMJArr[i];
            sprite.node.parent.mjId = null;
            sprite.spriteFrame = null;
            sprite.node.parent.active = false;
            sprite.node.parent.getComponent(cc.Button).interactable = true;
        }
    },

    setSpriteFrameByMJID: function (sprite, mjid) {
        sprite.spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID(mjid);
        sprite.node.parent.active = true;
    },

    getLocalIndex: function (index) {
        var seatNum = cc.vv.MjNetMgr.conf.seatNum;
        var ret = (index - cc.vv.MjNetMgr.seatIndex + seatNum) % seatNum;
        return ret;
    },

    onOptionClicked: function (event) {
        var self = this;
        if (event.target.name == "btnPeng") {
            cc.vv.net.send("peng");
        } else if (event.target.name == "btnGang") {
            cc.vv.net.send("gang", event.target.pai);
        } else if (event.target.name == "btnHu") {
            cc.vv.net.send("hu");
        } else if (event.target.name == "btnGuo") {
            if (cc.vv.MjNetMgr.curaction.hu) {
                cc.vv.alert.show("友情提示", "你可以胡牌了，是否放弃胡牌？", function () {
                    cc.vv.net.send("guo", {
                        msg: cc.vv.userMgr.userId + "胡时点过传过来的信息",
                        guo: true
                    });
                    self._guohu.active = true;
                    self.hideOptions();
                }, true)
            } else {
                cc.vv.net.send("guo", {
                    msg: cc.vv.userMgr.userId + "其他 点过传过来的信息",
                    guo: true
                });
                self.hideOptions();
            }

        } else if (event.target.name == "btnChi1") {
            this.chiPaiCallback(event.target.pai, 0);
        } else if (event.target.name == "btnChi2") {
            this.chiPaiCallback(event.target.pai, 1);
        } else if (event.target.name == "btnChi3") {
            this.chiPaiCallback(event.target.pai, 2);
        } else if (event.target.name == "btnBuhua") {
           
        }

    },
    chiPaiCallback: function (pai, number) {
        var paiGroupList = this.getChiList(pai);
        var subChilist = paiGroupList[number];
        var data = {
            p1: subChilist[0],
            p2: subChilist[1],
            p3: subChilist[2],
        }
        cc.vv.net.send("chi", data);
    },
    // called every frame, uncomment this function to activate update callback
    update: function (dt) {},

    onDestroy: function () {
        
    },

    showChiAction: function (pai) {
        var chilist = this.getChiList(pai);
        if (chilist.length == 0) {
            return;
        }
        var subChilist = chilist[0];
        var data = {
            p1: subChilist[0],
            p2: subChilist[1],
            p3: subChilist[2],
        }
        cc.vv.net.send("chi", data);
    },

    getChiList: function (pai) {
        var allList = [];
        if (pai > 26 || pai < 0) return allList;
        var seatIndex = cc.vv.MjNetMgr.seatIndex;
        var seatData = cc.vv.MjNetMgr.seats[seatIndex];
        var holds = seatData.holds;
        let check1 = this.checkPaiInHolds(pai - 1, holds);
        let check2 = this.checkPaiInHolds(pai - 2, holds);
        let type1 = this.NumInNum(pai, pai - 1);
        let type2 = this.NumInNum(pai, pai - 2);
        if (check1 && check2 && type1 && type2) {
            let list1 = [];
            list1.push(pai - 2);
            list1.push(pai - 1);
            list1.push(pai);
            allList.push(list1);
        }
        check1 = this.checkPaiInHolds(pai - 1, holds);
        check2 = this.checkPaiInHolds(pai + 1, holds);
        type1 = this.NumInNum(pai, pai - 1);
        type2 = this.NumInNum(pai, pai + 1);
        if (check1 && check2 && type1 && type2) {
            let list2 = [];
            list2.push(pai - 1);
            list2.push(pai);
            list2.push(pai + 1);
            allList.push(list2);
        }
        check1 = this.checkPaiInHolds(pai + 1, holds);
        check2 = this.checkPaiInHolds(pai + 2, holds);
        type1 = this.NumInNum(pai, pai + 1);
        type2 = this.NumInNum(pai, pai + 2);
        if (check1 && check2 && type1 && type2) {
            let list3 = [];
            list3.push(pai);
            list3.push(pai + 1);
            list3.push(pai + 2);
            allList.push(list3);
        }
        return allList.reverse();
    },

    checkPaiInHolds: function (pai, holds) {
        for (var i = 0; i < holds.length; i++) {
            if (pai == holds[i]) return true;
        }
        return false;
    },

    NumInNum: function (a, b) {
        if (a > 26 || b > 26) return false;
        if (a >= 0 && a <= 8 && b >= 0 && b <= 8) {
            return true;
        } else if (a >= 9 && a <= 17 && b >= 9 && b <= 17) {
            return true;
        } else if (a >= 18 && a <= 26 && b >= 18 && b <= 26) {
            return true;
        }
        return false;
    },

    onHuanPaiClicked: function (event) {
        console.log("点击换牌了")
        cc.vv.net.send('huanpai66');
    },
    gaClick(event,customEventData){
        console.log("玩家选的噶",customEventData)
        cc.vv.net.send("choose_ga",{gaNum:Number(customEventData)})
    },
    showHolds(){
        let gaHome = this.node.getChildByName("gaHome");
        let seats = cc.vv.MjNetMgr.seats;
        seats.forEach((s,index) => {
            let localIndex = cc.vv.MjNetMgr.getLocalIndex(index)
            let side = cc.vv.mahjongmgr.getSide(localIndex)
            let sideNode = this.gameRoot.getChildByName(side);
            if(s.gaNum == -1){
                sideNode.getChildByName("gaNum").getComponent(cc.Label).string = " "
            }
            else{
                sideNode.getChildByName("gaNum").getComponent(cc.Label).string = s.gaNum == 0?"无噶":s.gaNum+"噶"
            }    
        });
        if(cc.vv.MjNetMgr.conf.otherData.shangga && !cc.vv.MjNetMgr.isga && cc.vv.MjNetMgr.seats[cc.vv.MjNetMgr.seatIndex].gaNum == -1){
            if(cc.vv.MjNetMgr.conf.otherData.zyshangga){

            }
            else{
                let gaChilds = gaHome.children;
                let maxga = cc.vv.MjNetMgr.seats[cc.vv.MjNetMgr.seatIndex].maxga;
                for(let k = 0 ; k < gaChilds.length ; k++){
                    if(k < maxga){
                        gaChilds[k].getComponent(cc.Button).interactable = false;
                    }
                    else{
                        gaChilds[k].getComponent(cc.Button).interactable = true; 
                    }
                    
                }
                if(cc.vv.MjNetMgr.conf.otherData.maxga3){
                    gaChilds[gaChilds.length-1].getComponent(cc.Button).interactable = false;
                }
                else if(maxga < 3){
                    gaChilds[gaChilds.length-1].getComponent(cc.Button).interactable = false;
                }
                    
            }
            gaHome.active = true;
        }
        else{
            gaHome.active = false;
        }
        let sides = cc.vv.MjNetMgr.initSides();
        for (var i = 0; i < sides.length; ++i) {
            var sideChild = this.gameRoot.getChildByName(sides[i]);
            var holds = sideChild.getChildByName("holds");
            if(cc.vv.MjNetMgr.conf.otherData.shangga){
                if(cc.vv.MjNetMgr.isga){
                    holds.active = true;
                }
                else{
                    holds.active = false;  
                }
            }
            else{
                holds.active = true;
            }
        }
    }
});