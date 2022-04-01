cc.Class({
    extends: cc.Component,

    properties: {
        dataEventHandler: null,
        roomId: null,
        maxNumOfGames: 0,
        numOfGames: 0,
        numOfMJ: 0,
        seatIndex: -1,
        seats: null,
        turn: -1,
        button: -1,
        chupai: -1,
        isHuanSanZhang: false,
        gamestate: "",
        isOver: false,
        dissoveData: null,
        haveReddot: true,
        endData: null,
        gameLing: 0,
        lianzhuang: 0,
        isga: false,
    },

    reset: function () {
        this.turn = -1;
        this.chupai = -1,
            this.button = -1;
        this.gamestate = "";
        this.isHuanSanZhang = false;
        this.curaction = null;
        this.haveReddot = true;
        for (var i = 0; i < this.seats.length; ++i) {
            this.seats[i].holds = [];
            this.seats[i].folds = [];
            this.seats[i].pengs = [];
            this.seats[i].chis = [];
            this.seats[i].angangs = [];
            this.seats[i].diangangs = [];
            this.seats[i].wangangs = [];
            this.seats[i].ready = false;
            this.seats[i].hued = false;
            this.seats[i].guoHuShow = false;
        }
    },

    clear: function () {
        this.dataEventHandler = null;
        if (!this.isOver) {
            this.seats = null;
            this.roomId = null;
            this.maxNumOfGames = 0;
            this.numOfGames = 0;
        }
    },

    dispatchEvent(event, data) {
        if (this.dataEventHandler) {
            this.dataEventHandler.emit(event, data);
        }
    },

    getSeatIndexByID: function (userId) {
        if (this.seats) {
            for (var i = 0; i < this.seats.length; ++i) {
                var s = this.seats[i];
                if (s.userid == userId) {
                    return i;
                }
            }
        }
        return -1;
    },

    isOwner: function () {
        return this.seatIndex == 0 && !this.conf.quanId;
    },

    getSeatByID: function (userId) {
        var seatIndex = this.getSeatIndexByID(userId);
        var seat = this.seats[seatIndex];
        return seat;
    },

    getSelfData: function () {
        return this.seats[this.seatIndex];
    },

    getLocalIndex: function (index) {
        var seatNum = this.conf.seatNum;
        var ret = (index - this.seatIndex + seatNum) % seatNum;
        return ret;
    },

    prepareReplay: function (roomInfo, detailOfGame) {
        this.roomId = roomInfo.id;
        this.seats = roomInfo.seats;
        this.isga = true;
        var baseInfo = detailOfGame.base_info;
        this.conf = baseInfo.conf;
        this.turn = baseInfo.button;
        this.button = baseInfo.button;
        this.maxNumOfGames = baseInfo.conf.maxGames;
        this.numOfGames = baseInfo.index;
        this.numOfMJ = baseInfo.numOfMJ;
        this.gameLing = baseInfo.gameLing;
        this.lianzhuang = baseInfo.lianzhuang;
        for (var i = 0; i < this.seats.length; ++i) {
            var s = this.seats[i];
            s.seatindex = i;
            s.score = baseInfo.game_seats[i].score;
            s.holds = baseInfo.game_seats[i].holds;
            s.gaNum = baseInfo.game_seats[i].gaNum;
            s.pengs = [];
            s.chis = [];
            s.angangs = [];
            s.diangangs = [];
            s.wangangs = [];
            s.folds = [];
            s.flowerFolds = [];
            if (cc.vv.userMgr.userId == s.userid) {
                this.seatIndex = i;
            }
        }
        if (this.seatIndex == -1) {
            this.seatIndex = 0;
        }
    },

    getWanfa: function () {
        var conf = this.conf;
        // console.log("游戏的内容",conf)
        if (conf && conf.maxGames != null) {
            var strArr = ["海南麻将"];
            var wanfastr = conf.seatNum + '人玩法';
            strArr.push(wanfastr)
            if (conf.wanfa == 0) {
                strArr.push("有番")
            } else {
                strArr.push("无番")
            }
            var jushustr = conf.maxGames + "局";
            strArr.push(jushustr)
            let otherData = conf.otherData;
            for (var key in otherData) {
                if (otherData[key]) {
                    strArr.push(cc.vv.gameConfText[key]);
                }
            }
            return strArr.join(' ');
        }
        return "";
    },
    beginInit() {
        for (var i = 0; i < this.seats.length; ++i) {
            var s = this.seats[i];
            s.folds = [];
            s.flowerFolds = [];
            s.pengs = [];
            s.chis = [];
            s.angangs = [];
            s.diangangs = [];
            s.wangangs = [];
            s.ready = false;
            s.gaNum = -1;
            s.maxga = 0;
        }
    },
    initSides() {
        var sides = ["myself", "right", "up", "left"];
        var seatNum = this.conf.seatNum;
        if (seatNum == 2) {
            sides = ["myself", "up"];
        } else if (seatNum == 3) {
            sides = ["myself", "right", "left"];
        }
        return sides;
    },
    initHandlers: function () {
        var self = this;
        cc.vv.net.addHandler("login_result", function (data) {
            console.log("mjnetmgr 获得返回数据是login result",JSON.stringify(data)); // JSON.stringify(data)
            if (data.errcode === 0) {
                console.log("mjnetmgr 获得返回数据是login result sss",data.data.seats);
                var data = data.data;
                self.roomId = data.roomid;
                self.conf = data.conf;
                self.maxNumOfGames = data.conf.maxGames;
                self.numOfGames = data.numofgames;
                self.seats = data.seats;
                self.seatIndex = self.getSeatIndexByID(cc.vv.userMgr.userId);
                self.isOver = false;
                self.dissoveData = null;
                self.haveReddot = true;
                self.gamestate = "";
                self.endData = null;
                self.gameLing = 0;
                self.lianzhuang = 0;
                self.isga = false;
            } else {
                console.log(data.errmsg);
            }
            console.log("mjnetmgr 获得返回数据是login result LLL",self.seats);
        });

        cc.vv.net.addHandler("login_finished", function () {
            var curScene = cc.director.getScene().name;
            console.log("login_finished  此时游戏状态 "+self.gamestate,self.seats);
            if (curScene == "mjgame" && self.gamestate == "" && self.numOfGames > 0) {
                cc.find("Canvas/reconnect").active = false;
                if (self.endData) {
                    console.log("需要同步结束数据 === " + JSON.stringify(self.endData))
                    var data = self.endData;
                    var results = data.results;
                    for (var i = 0; i < self.seats.length; ++i) {
                        self.seats[i].score = results[i].totalscore;
                    }
                    if (!data.isForce) {
                        self.doGameOver(results, data.time);
                    }
                    if (data.endinfo) {
                        self.isOver = true;
                        var endData1 = {
                            endinfo: data.endinfo,
                            isForce: data.isForce,
                            time:data.time,
                            roomId:data.roomId,
                            quanId:data.quanId,
                            quanMing:data.quanMing
                        }
                        self.dispatchEvent('game_end', endData1);
                    }
                    self.reset();
                }
                else{

                }
                console.log("此时不需要加载游戏场景了");
            } else {
                console.log("加载场景###",self.seats,cc.vv.MjNetMgr.seats)
                cc.director.loadScene("mjgame");
            }
        });
        cc.vv.net.addHandler("game_sync_enddata_push", function (data) {
            console.log("同步了 玩家结束的数据 == " + data);
            self.endData = data;
        });
        cc.vv.net.addHandler("game_sync_push", function (data) {
            console.log("game_sync_push", data);
            self.numOfMJ = data.numOfMJ;
            self.gamestate = data.state;
            self.turn = data.turn;
            self.button = data.button;
            self.chupai = data.chuPai;
            self.haveReddot = data.haveReddot;
            self.gameLing = data.gameLing;
            self.lianzhuang = data.lianzhuang;
            self.isga = data.isga;
            for (var i = 0; i < self.conf.seatNum; ++i) {
                var seat = self.seats[i];
                var sd = data.seats[i];
                seat.holds = sd.holds;
                seat.folds = sd.folds;
                seat.flowerFolds = sd.flowerFolds;
                seat.angangs = sd.angangs;
                seat.diangangs = sd.diangangs;
                seat.wangangs = sd.wangangs;
                seat.pengs = sd.pengs;
                seat.chis = sd.chis;
                seat.hued = sd.hued;
                seat.iszimo = sd.iszimo;
                seat.huinfo = sd.huinfo;
                seat.doBuHua = sd.doBuHua;
                seat.canChuPai = sd.canChuPai;
                seat.guoHuShow = sd.guoHuShow;
                seat.gaNum = sd.gaNum;
                seat.maxga = sd.maxga;
            }
        });

        cc.vv.net.addHandler("exit_result", function (data) {
            self.roomId = null;
            self.turn = -1;
            self.seats = null;
            self.maxNumOfGames = 0;
            self.numOfGames = 0;
            cc.director.loadScene("hall");
        });

        cc.vv.net.addHandler("exit_notify_push", function (data) {
            var userId = data;
            var s = self.getSeatByID(userId);
            if (s != null) {
                s.userid = 0;
                s.name = "";
                self.dispatchEvent("user_state_changed", s);
            }
        });
        cc.vv.net.addHandler("szbg_tips_push", function (data) {
            self.dispatchEvent("szbg_tips",data);
        });
        cc.vv.net.addHandler("san_dao_pai_push", function (data) {
            self.dispatchEvent("san_dao_pai",data);
        });
        cc.vv.net.addHandler("si_dao_pai_push", function (data) {
            self.dispatchEvent("si_dao_pai",data);
        });
        cc.vv.net.addHandler("dispress_push", function (data) {
            self.roomId = null;
            self.turn = -1;
            self.seats = null;
            self.maxNumOfGames = 0;
            self.numOfGames = 0;
            cc.director.loadScene("hall");
        });


        cc.vv.net.addHandler("disconnect", function (data) {
            //self.isOver == false && 
            // if (!cc.vv.ishoutai) {
            //     self.dispatchEvent("gamereconnct");
            // }
        });

        cc.vv.net.addHandler("new_user_comes_push", function (data) {
            var seatIndex = data.seatindex;
            if (self.seats[seatIndex].userid > 0) {
                self.seats[seatIndex].online = true;
            } else {
                data.online = true;
                self.seats[seatIndex] = data;
            }
            self.dispatchEvent('new_user', self.seats[seatIndex]);
        });

        cc.vv.net.addHandler("user_state_push", function (data) {
            //console.log(data);
            var userId = data.userid;
            var seat = self.getSeatByID(userId);
            if (seat) {
                seat.online = data.online;
                self.dispatchEvent('user_state_changed', seat);
            }

        });

        cc.vv.net.addHandler("user_ready_push", function (data) {
            //console.log(data);
            var userId = data.userid;
            var seat = self.getSeatByID(userId);
            seat.ready = data.ready;
            self.dispatchEvent('user_state_changed', seat);
        });
        cc.vv.net.addHandler("game_begin_push", function (data) {
            var seat = self.seats[self.seatIndex];
            console.log("游戏开始数据", data)
            seat.holds = data.holds;
            self.beginInit()
            self.numOfMJ = data.numOfMJ;
            self.numOfGames = data.numOfGames;
            self.button = data.button;
            self.turn = self.button;
            self.gameLing = data.gameLing;
            self.lianzhuang = data.lianzhuang;
            self.gamestate = "begin";
            self.isga = false
            seat.maxga = data.maxga;
            self.dispatchEvent('game_begin');
        });
        cc.vv.net.addHandler("ga_have_all", function (data) {
            self.isga = data.isga;
            let gaArr = data.gaArr
            gaArr.forEach(function (ga, index) {
                self.seats[index].gaNum = ga;
            })
            console.log("全部gale ", data)
            if (data.gaNum > 0) {
                let  sfx  = "shangga_"+data.gaNum
                let seatData = self.seats[self.seatIndex]
                if (seatData.sex == 2) {
                    sfx = "girl/" + sfx;
                } else {
                    sfx = "boy/" + sfx;
                }
                cc.vv.audioMgr.playSFX(sfx);
            }
            self.dispatchEvent('ga_have_all_do');
        });
        cc.vv.net.addHandler("game_playing_push", function (data) {
            self.gamestate = "playing";
            self.endData = null;
            self.dispatchEvent('game_playing');
        });

        cc.vv.net.addHandler("game_huanpai_push", function (data) {
            self.isHuanSanZhang = true;
            self.dispatchEvent('game_huanpai');
        });

        cc.vv.net.addHandler("hangang_notify_push", function (data) {
            self.seats[data.seatIndex].canChuPai = data.canChuPai;
            self.dispatchEvent('hangang_notify', data.seatIndex);
        });

        cc.vv.net.addHandler("game_action_push", function (data) {
            self.curaction = data;
            self.dispatchEvent('game_action', data);
        });

        cc.vv.net.addHandler("game_chupai_push", function (data) {
            console.log('game_chupai_push');
            var si = data.seatIndex;
            self.seats[si].canChuPai = data.canChuPai;
            self.doTurnChange(si);
        });

        // cc.vv.net.addHandler("game_num_push", function (data) {
        //     self.numOfGames = data;
        //     self.dispatchEvent('game_num', data);
        // });

        cc.vv.net.addHandler("game_over_push", function (data) {
            var results = data.results;
            for (var i = 0; i < self.seats.length; ++i) {
                self.seats[i].score = results[i].totalscore;
            }
            if (!data.isForce) {
                self.doGameOver(results, data.time,data.roomId);
            }
            if (data.endinfo) {
                self.isOver = true;
                var endData = {
                    endinfo: data.endinfo,
                    isForce: data.isForce,
                    time:data.time,
                    roomId:data.roomId,
                    quanId:data.quanId,
                    quanMing:data.quanMing
                }
                self.dispatchEvent('game_end', endData);
            }
            self.reset();
            for (var i = 0; i < self.seats.length; ++i) {
                self.dispatchEvent('user_state_changed', self.seats[i]);
            }
        });

        // cc.vv.net.addHandler("mj_count_push", function (data) {
        //     self.numOfMJ = data;
        //     self.dispatchEvent('mj_count', data);
        // });

        
        // cc.vv.net.addHandler("guo_notify_push", function (data) {
        //     console.log('guo_notify_push');
        //     var userId = data.userId;
        //     var pai = data.pai;
        //     var si = self.getSeatIndexByID(userId);
        //     self.doGuo(si, pai);
        // });

        // cc.vv.net.addHandler("guo_result", function (data) {
        //     console.log('guo_result');
        //     self.dispatchEvent('guo_result');
        // });

        // cc.vv.net.addHandler("guohu_push", function (data) {
        //     console.log('guohu_push');
        //     self.dispatchEvent("push_notice", {
        //         info: "过胡",
        //         time: 1.5
        //     });
        // });
        // cc.vv.net.addHandler("guo_peng", function (data) {
        //     console.log('guo_peng');
        //     self.dispatchEvent("push_notice", {
        //         info: "过碰",
        //         time: 1.5
        //     });
        // });
        cc.vv.net.addHandler("hu_push", function (data) {
            self.doHu(data);
        });

        cc.vv.net.addHandler("game_chupai_notify_push", function (data) {
            var si = data.seatIndex;
            var seatData = self.seats[si];
            seatData.canChuPai = data.canChuPai;
            self.doChupai(si, data);
        });
        cc.vv.net.addHandler("game_buhua_push", function (data) {
            self.buhuaFunc(data);
        });

        cc.vv.net.addHandler("game_mopai_push", function (data) {
            console.log('game_mopai_push');
            self.doMopai(data);
        });

        cc.vv.net.addHandler("peng_notify_push", function (data) {
            console.log('peng_notify_push')
            self.doPeng(data);
        });

        cc.vv.net.addHandler("gang_notify_push", function (data) {
            console.log('gang_notify_push');
            self.doGang(data);
        });


        cc.vv.net.addHandler("show_hu_push", function (data) {
            self.dispatchEvent("show_hu", data);
        });

        cc.vv.net.addHandler("chat_push", function (data) {
            self.dispatchEvent("chat_push", data);
        });


        cc.vv.net.addHandler("quick_chat_push", function (data) {
            self.dispatchEvent("quick_chat_push", data);
        });

        cc.vv.net.addHandler("emoji_push", function (data) {
            self.dispatchEvent("emoji_push", data);
        });

        cc.vv.net.addHandler("dissolve_notice_push", function (data) {
            self.dissoveData = data;
            self.dispatchEvent("dissolve_notice", data);
        });

        cc.vv.net.addHandler("dissolve_cancel_push", function (data) {
            self.dissoveData = null;
            self.dispatchEvent("dissolve_cancel", data);
        });

        cc.vv.net.addHandler("voice_msg_push", function (data) {
            self.dispatchEvent("voice_msg", data);
        });

        cc.vv.net.addHandler("chi_notify_push", function (data) {
            self.doChi(data);
        });

        cc.vv.net.addHandler('game_huanpai66_push', function (data) {
            self.dispatchEvent('game_huanpai66', data);
        });

        cc.vv.net.addHandler('game_huanpai88_push', function (data) {
            var seatData = self.seats[self.seatIndex];
            if (seatData.holds) {
                seatData.holds[seatData.holds.length - 1] = data;
                self.dispatchEvent('game_mopai', {
                    seatIndex: self.seatIndex,
                    pai: data
                });
            }
        });

        cc.vv.net.addHandler("change_other_mapinfo", function (data) {
            self.seats[data.index].mapInfo = data.mapInfo;
        });
        cc.vv.net.addHandler("return_user_mapInfo", function (data) {
            if (self.seats[self.seatIndex].isFirstIn) {
                self.seats[self.seatIndex].isFirstIn = false
            }

            self.dispatchEvent("show_user_mapInfo", data)
        })
        cc.vv.net.addHandler("change_self_mapInfo", function (data) {
            cc.vv.anysdkMgr.getMapInfo();
            cc.vv.net.send("do_change_self_mapInfo", {
                mapInfo: cc.vv.mapInfo
            })
        });
        cc.vv.net.addHandler("tools_shoot_target", function (data) {
            console.log("yyyy")
            self.dispatchEvent("tools_shoot_target_do", data);
        });

    },

    doGuo: function (seatIndex, pai) {
        var seatData = this.seats[seatIndex];
        var folds = seatData.folds;
        folds.push(pai);
        this.dispatchEvent('guo_notify', seatData);
    },

    doMopai: function (data) {
        var seatData = this.seats[data.seatIndex];
        this.numOfMJ = data.numOfMJ
        this.dispatchEvent('mj_count');
        if (seatData.holds && this.seatIndex == data.seatIndex) {
            seatData.holds = data.holds;
            this.dispatchEvent('game_mopai', {
                seatIndex: data.seatIndex,
                pai: data.pai
            });
        }
        else if(cc.vv.replayMgr.isReplay()){
            seatData.holds = data.holds;
            this.dispatchEvent('game_mopai', {
                seatIndex: data.seatIndex,
                pai: data.pai
            });
        }
    },

    doChupai: function (seatIndex, data) {
        this.chupai = data.pai;
        var seatData = this.seats[seatIndex];
        if (this.seatIndex == seatIndex) {
            seatData.holds = data.holds;
        }
        else if(cc.vv.replayMgr.isReplay()){
            seatData.holds = data.holds;
        }
        var folds = seatData.folds;
        folds.push(data.pai);
        this.haveReddot = true;
        this.dispatchEvent('game_chupai_notify', {
            seatData: seatData,
            pai: data.pai
        });
    },
    buhuaFunc: function (data) {
        var seatData = this.seats[data.seatIndex];
        if (data.seatIndex == this.seatIndex) {
            seatData.holds = data.holds;
        }
        else if(cc.vv.replayMgr.isReplay()){
            seatData.holds = data.holds;
        }
        this.numOfMJ = data.numOfMJ
        seatData.flowerFolds = seatData.flowerFolds.concat(data.huaArr);
        this.dispatchEvent('game_buhua_notify', {
            seatData: seatData,
            huaArr: data.huaArr,
        });
    },
    doPeng: function (data) {
        var seatData = this.seats[data.seatIndex];
        //移除手牌
        if (data.seatIndex == this.seatIndex) {
            seatData.holds = data.holds;
        }
        else if(cc.vv.replayMgr.isReplay()){
            seatData.holds = data.holds;
        }
        var pengs = seatData.pengs;
        var pengInfo = {
            pai: data.pai,
            target: data.target,
        }
        seatData.zhuchiNum = data.zhuchiNum
        pengs.push(pengInfo);
        var targetSeat = this.seats[data.target];
        targetSeat.folds.pop();
        this.haveReddot = false;
        this.dispatchEvent('peng_folds_notify', targetSeat);
        this.dispatchEvent('peng_notify', seatData);
    },

    getGangType: function (seatData, pai) {
        if (seatData.pengs.indexOf(pai) != -1) {
            return "wangang";
        } else {
            var cnt = 0;
            for (var i = 0; i < seatData.holds.length; ++i) {
                if (seatData.holds[i] == pai) {
                    cnt++;
                }
            }
            if (cnt == 3) {
                return "diangang";
            } else {
                return "angang";
            }
        }
    },

    doGang: function (data) {
        var seatData = this.seats[data.seatIndex];
        let pai = data.pai;
        let gangtype = data.gangtype;
        let target = data.target;
        if (!gangtype) {
            gangtype = this.getGangType(seatData, pai);
        }

        if (gangtype == "wangang") {
            if (seatData.pengs.length > 0) {
                for (var i = 0; i < seatData.pengs.length; i++) {
                    var peng = seatData.pengs[i];
                    if (peng.pai == pai) {
                        seatData.pengs.splice(i, 1);
                        break;
                    }
                }

            }
            var wgInfo = {
                pai: pai,
                target: target,
            }
            seatData.wangangs.push(wgInfo);
        }
        if (data.seatIndex == this.seatIndex) {
            seatData.holds = data.holds
        }
        else if(cc.vv.replayMgr.isReplay()){
            seatData.holds = data.holds;
        }
        if (gangtype == "angang") {
            var agInfo = {
                pai: pai,
                target: -1,
            }
            seatData.angangs.push(agInfo);
        } else if (gangtype == "diangang") {
            var dgInfo = {
                pai: pai,
                target: target,
            }
            seatData.diangangs.push(dgInfo);
            var targetSeat = this.seats[target];
            targetSeat.folds.pop();
            this.haveReddot = false;
            this.dispatchEvent('gang_folds_notify', targetSeat);
        }
        this.dispatchEvent('gang_notify', {
            seatData: seatData,
            gangtype: gangtype,
            zhuchiNum:data.zhuchiNum
        });
    },

    doHu: function (data) {
        this.dispatchEvent('hupai', data);
    },

    doTurnChange: function (si) {
        var data = {
            last: this.turn,
            turn: si,
        }
        this.turn = si;
        this.dispatchEvent('game_chupai', data);
    },

    connectGameServer: function (data) {
        var sd = {
            token: data.token,
            roomid: data.roomid,
            time: data.time,
            sign: data.sign,
            sex: cc.vv.userMgr.sex,
            userId:cc.vv.userMgr.userId
        };
        cc.vv.net.send("login", sd);
        // cc.vv.net.ip = data.ip + ":" + data.port;
        // console.log(cc.vv.net.ip);
        // var self = this;
        // var onConnectOK = function () {
        //     console.log("onConnectOK");
        //     var sd = {
        //         token: data.token,
        //         roomid: data.roomid,
        //         time: data.time,
        //         sign: data.sign,
        //         sex: cc.vv.userMgr.sex,
        //     };
        //     cc.vv.net.send("login", sd);
        // };
        // var onConnectFailed = function () {
        //     console.log("failed.");
        //     cc.vv.wc.hide();
        // };
        // cc.vv.wc.show("正在进入房间");
        // cc.vv.net.connect(onConnectOK, onConnectFailed);
    },

    doChi: function (data) {
        var seatData = this.seats[data.seatIndex];
        //移除手牌
        let chiPai = data.chiPai;
        let target = data.target;
        if (data.seatIndex == this.seatIndex) {
            seatData.holds = data.holds;
        }
        else if(cc.vv.replayMgr.isReplay()){
            seatData.holds = data.holds;
        }
        seatData.zhuchiNum = data.zhuchiNum
        console.log("吃后手里的牌********",data.zhuchiNum,seatData.zhuchiNum)
        console.log("吃后手里的牌",seatData.holds,seatData.seatIndex,data.seatIndex)
        //更新吃牌数据
        var chis = seatData.chis;
        chis.push(chiPai);
        var targetSeat = this.seats[target];
        targetSeat.folds.pop();
        this.haveReddot = false;
        this.dispatchEvent('chi_folds_notify', targetSeat);
        this.dispatchEvent('chi_notify', seatData);
    },
    doGameOver: function (results, time,roomId) {
        console.log("dogameover 执行了 === " + results)
        for (var i = 0; i < this.seats.length; ++i) {
            this.seats[i].score = results.length == 0 ? 0 : results[i].totalscore;
        }
        this.dispatchEvent('game_over', {
            results: results,
            time: time,
            roomId:roomId,
        });
    },

});