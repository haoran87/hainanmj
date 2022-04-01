var roomMgr = require("./roommgr");
var userMgr = require("./usermgr");
var mjutils = require('./mjutils');
var db = require("../utils/db");
var crypto = require("../utils/crypto");
var fs = require("fs");
const fanLogic = require('./fan_logic');
const { exception } = require("console");
var logf = function (roomId, logContent) {
    fs.appendFile('log/' + roomId + '.log', '' + Date.now() + ' :: ' + logContent + '\r\n', function () { });
};
const lingHome = [27, 28, 29, 30];
exports.games = {};
const ACTION_CHUPAI = 1;
const ACTION_MOPAI = 2;
const ACTION_PENG = 3;
const ACTION_GANG = 4;
const ACTION_HU = 5;
const ACTION_ZIMO = 6;
const ACTION_CHI = 7;
const ACTION_OVER = 8;
const ACTION_BUHUA = 9;
var gameSeatsOfUsers = {};

function shufflePlus(game) {
    // 0-8 万 9-17 条  18-26 筒  27-33 字牌  34-41花牌
    let paiHome = []
    game.mahjongs = [];
    for (let i = 0; i < 42; i++) {
        if (game.conf.otherData.wuzi && i >= 27 && i <= 33) { } else {
            paiHome.push(i);
        }
    }
    for (let i = 0; i < 4; i++) {
        xipai(paiHome);
        paiHome.forEach(function (p) {
            if (p >= 34 && game.mahjongs.find(function (gp) {
                return gp == p
            })) { } else {
                game.mahjongs.push(p);
            }
        })
    }
    xipai(game.mahjongs);
    xipai(game.mahjongs);
    xipai(game.mahjongs);
    // game.mahjongs = [
    //     34, 36, 7, 15, 31, 16, 38, 25, 22, 32, 8, 9, 16,
    //     25, 15, 3, 27, 6, 17, 30, 14, 6, 19, 8, 29, 26,
    //     4, 40, 2, 10, 37, 18, 41, 4, 3, 5, 5, 32, 18, 0, 12, 33, 24, 21, 22, 32, 29,
    //     26, 23, 24, 27, 23, 19, 17, 7, 3, 27, 2, 0, 10, 1, 13, 5, 25, 39, 24, 26, 31, 13, 21,
    //     21, 33, 10, 20, 1, 7, 2, 5, 22, 10, 19, 12, 22, 29, 16, 6, 1, 30, 11, 13, 31, 14, 16, 11,
    //     8, 6, 18, 23, 20, 15, 28, 28, 24, 14, 12, 23, 35, 28, 21, 27, 7, 33, 20, 32, 19, 20, 30,
    //     0, 26, 9, 4, 3, 25, 17, 11, 30, 11, 33, 18, 28, 29, 17, 9, 8, 4, 13, 1, 14, 15, 12, 9, 2, 31, 0
    // ]
};


function xipai(mahjongs) {
    mahjongs.sort(function () {
        return Math.random() - 0.5
    })
};

function sortHolds(seatData, checkTing) {
    var mp = null;
    console.log(seatData.name + "**手牌排序", seatData.holds, seatData.holds.length, checkTing)
    var l = seatData.holds.length
    if (l == 2 || l == 5 || l == 8 || l == 11 || l == 14) {
        mp = seatData.holds.pop();
        seatData.countMap[mp] -= 1;
    }
    if (checkTing) {
        checkCanTingPai(seatData);
    }
    seatData.holds.sort(function (a, b) {
        return a - b;
    });
    let wanArr = [];
    let tongArr = [];
    let tiaoArr = [];
    let otherArr = []
    for (var j = 0; j < seatData.holds.length; j++) {
        var mj = seatData.holds[j];
        if (mj >= 0 && mj < 9) {
            wanArr.push(mj)
        } else if (mj >= 9 && mj < 18) {
            tiaoArr.push(mj)
        } else if (mj >= 18 && mj < 27) {
            tongArr.push(mj)
        } else {
            otherArr.push(mj);
        }
    }
    seatData.holds = wanArr.concat(tongArr, tiaoArr, otherArr);
    if (mp != null) {
        seatData.holds.push(mp);
        seatData.countMap[mp] += 1;
    };
}

function mopai(game, seatIndex) {
    if (game.mahjongs.length - game.currentIndex == 15) { //七墩半  剩余15张开始和牌
        return -1;
    }
    var seat = game.gameSeats[seatIndex];
    var holds = seat.holds;
    var pai = game.mahjongs[game.currentIndex];
    holds.push(pai);
    var c = seat.countMap[pai];
    if (c == null) {
        c = 0;
    }
    seat.countMap[pai] = c + 1;
    game.currentIndex++;
    if (game.mahjongs.length - game.currentIndex == 18 && game.conf.seatNum == 3 && game.conf.otherData.haidibao) {
        game.haidibao = true;
    } else if (game.mahjongs.length - game.currentIndex == 19 && game.conf.seatNum == 4 && game.conf.otherData.haidibao) {
        game.haidibao = true;
    }
    return pai;
}

function deal(game) {
    //强制清0
    game.currentIndex = 0;

    var seatIndex = game.button;
    for (var i = 0; i < 13 * game.conf.seatNum; ++i) {
        var mahjongs = game.gameSeats[seatIndex].holds;
        if (mahjongs == null) {
            mahjongs = [];
            game.gameSeats[seatIndex].holds = mahjongs;
        }
        // 20180113 添加
        mopai(game, seatIndex);
        seatIndex++;
        seatIndex %= game.conf.seatNum;
    }
    //庄家多摸最后一张
    mopai(game, game.button);
    //当前轮设置为庄家
    game.turn = game.button;
}

//检查是否可以碰
function checkCanPeng(game, seatData, targetPai) {
    if(seatData.isTg) return
    var count = seatData.countMap[targetPai];
    if (count != null && count >= 2) {
        var index = seatData.guopeng.indexOf(targetPai);
        if (index == -1) {
            seatData.canPeng = true;
        } else {
            console.log("玩家过碰了")
        }
    }
}

//检查是否可以点杠
function checkCanDianGang(game, seatData, targetPai) {
    //检查玩家手上的牌
    //如果没有牌了，则不能再杠
    if(seatData.isTg)return;
    if (game.mahjongs.length <= game.currentIndex) {
        return;
    }
    var count = seatData.countMap[targetPai];
    if (count != null && count >= 3) {
        seatData.canGang = true;
        seatData.gangPai.push(targetPai);
        return;
    }
}

//检查是否可以暗杠
function checkCanAnGang(game, seatData) {
    //如果没有牌了，则不能再杠
    if(seatData.isTg)return
    if (game.mahjongs.length <= game.currentIndex) {
        return;
    }

    for (var key in seatData.countMap) {
        var pai = parseInt(key);
        var c = seatData.countMap[key];
        if (c != null && c == 4) {
            seatData.canGang = true;
            seatData.gangPai.push(pai);
        }
    }
}

function checkCanWanGang(game, seatData) {
    //如果没有牌了，则不能再杠
    if(seatData.isTg)return
    if (game.mahjongs.length <= game.currentIndex) {
        return;
    }
    //从碰过的牌中选
    for (var i = 0; i < seatData.pengs.length; ++i) {
        var pai = seatData.pengs[i].pai;
        if (seatData.countMap[pai] == 1) {
            seatData.canGang = true;
            seatData.gangPai.push(pai);
        }
    }
}

function checkCanHu(game, seatData, targetPai, checkFan) {
    if(seatData.isTg) return
    game.lastHuPaiSeat = -1;
    seatData.canHu = false;
    if (seatData.shisanyaoPai.length > 0) {
        for (var i = 0; i < seatData.shisanyaoPai.length; i++) {
            var pai = seatData.shisanyaoPai[i];
            if (pai == targetPai) {
                seatData.canHu = true;
                break
            }
        }
    } else {
        for (var k in seatData.tingMap) {
            if (targetPai == k) {
                // console.log("****可以胡牌",checkFan,game.conf.wanfa,seatData.tingMap[k].pattern)
                if (checkFan && seatData.tingMap[k].pattern == "normal") {
                    seatData.canHu = fanLogic.check_fan_func(seatData, k, game)
                    // console.log("有番玩法 要检查番", seatData.canHu)
                } else {
                    seatData.canHu = true;
                }
                // console.log("玩家能胡牌了*****",seatData.tingMap[k].analyse.item)
            }
        }
    }
}

function clearAllOptions(game, seatData) {
    var fnClear = function (sd) {
        sd.canChi = false;
        sd.canPeng = false;
        sd.canGang = false;
        sd.gangPai = [];
        sd.canHu = false;
        // sd.canBu = false;
        sd.lastFangGangSeat = -1;
    }
    if (seatData) {
        fnClear(seatData);
    } else {
        game.qiangGangContext = null;
        for (var i = 0; i < game.gameSeats.length; ++i) {
            fnClear(game.gameSeats[i]);
        }
    }
}

//检查听牌
function checkCanTingPai(seatData) {
    seatData.tingMap = {};
    seatData.shisanyaoPai = [];
    var lackArr = isShiSanYao(seatData);
    if (lackArr != -1) {
        seatData.shisanyaoPai = lackArr;
        console.log("玩家手里牌属于十三幺的牌型" + seatData.shisanyaoPai)
        return;
    }
    var pai = isQiXiaoDui(seatData);
    if (pai != -1) {
        seatData.tingMap[pai] = {
            fan: 1,
            pattern: "seven_pairs",
            analyse: {
                item: []
            },
        };
        return;
    }
    mjutils.checkTingPai(seatData, 0, 34);
}
exports.getHuPai = function (userId, pai) {
    let seatData = gameSeatsOfUsers[userId];
    let game = seatData.game
    let tempKey = {}
    let sumKey = 0;
    console.log("获取虎牌****", seatData.holds)
    let temHold = seatData.holds.slice()
    console.log("获取虎牌****111", temHold)
    for (let i = 0; i < seatData.holds.length; i++) {
        if (seatData.holds[i] == pai) {
            seatData.holds.splice(i, 1)
            break;
        }
    }
    console.log("获取虎牌****2222", temHold)
    console.log("获取虎牌****3333", seatData.holds)
    checkCanTingPai(seatData)
    if (seatData.shisanyaoPai.length > 0) {
        game.mahjongs.forEach((el, index) => {
            if (index >= game.currentIndex) {
                let tidx = seatData.shisanyaoPai.findIndex(tl => {
                    return tl == el
                })
                if (tidx != -1) {
                    sumKey += 1;
                    if (tempKey[el]) {
                        tempKey[el] += 1;
                    }
                    else {
                        tempKey[el] = 1;
                    }
                }
            }
        })
        console.log("可以胡十三幺是", tempKey, sumKey)
        if (sumKey > 0) {
            userMgr.sendMsg(userId, "show_hu_push", { paiKey: tempKey, sum: sumKey })
        }
    } else if (Object.keys(seatData.tingMap).length > 0) {
        let tingKeys = Object.keys(seatData.tingMap)
        game.mahjongs.forEach((el, index) => {
            if (index >= game.currentIndex) {
                let tidx = tingKeys.findIndex(tl => {
                    return tl == el
                })
                if (tidx != -1) {
                    sumKey += 1;
                    if (tempKey[el]) {
                        tempKey[el] += 1;
                    }
                    else {
                        tempKey[el] = 1;
                    }
                }
            }
        })
        console.log("可以普通胡是", tempKey)
        if (sumKey > 0) {
            userMgr.sendMsg(userId, "show_hu_push", { paiKey: tempKey, sum: sumKey })
        }
    }
    seatData.holds = temHold;
    seatData.tingMap = {}
    seatData.shisanyaoPai = []
    console.log("获取虎牌%%%&&&", temHold)
    console.log("获取虎牌%%%&&&000", seatData.holds)
}
function getSeatIndex(userId) {
    var seatIndex = roomMgr.getUserSeat(userId);
    if (seatIndex == null) {
        return null;
    }
    return seatIndex;
}

function getGameByUserID(userId) {
    var roomId = roomMgr.getUserRoom(userId);
    if (roomId == null) {
        return null;
    }
    var game = exports.games[roomId];
    return game;
}

function hasOperations(seatData) {
    if (!seatData) return;
    if (seatData.canGang || seatData.canPeng || seatData.canHu || seatData.canChi) {
        return true;
    }
    return false;
}

function sendOperations(game, seatData, pai) {
    if (hasOperations(seatData)) {
        if (pai == -1) {
            pai = seatData.holds[seatData.holds.length - 1];
        }
        var data = {
            pai: pai,
            hu: seatData.canHu,
            peng: seatData.canPeng,
            gang: seatData.canGang,
            gangpai: seatData.gangPai,
            canChi: seatData.canChi,
            // canBu: seatData.canBu,
        };
        //如果可以有操作，则进行操作
        userMgr.sendMsg(seatData.userId, 'game_action_push', data);
        data.si = seatData.seatIndex;
    } else {
        userMgr.sendMsg(seatData.userId, 'game_action_push');
    }
}

function moveToNextUser(game, nextSeat) {
    if (nextSeat == null) {
        while (true) {
            game.turn++;
            game.turn %= game.conf.seatNum;
            var turnSeat = game.gameSeats[game.turn];
            if (turnSeat.hued == false) {
                return;
            }
        }
    } else {
        game.turn = nextSeat;
    }
}

function isyaohu(seatData, modepai) {
    if (seatData.shisanyaoPai.length > 0) {
        for (var i = 0; i < seatData.shisanyaoPai.length; i++) {
            var pai = seatData.shisanyaoPai[i];
            if (pai == modepai) {
                console.log("玩家要胡 111 ")
                return true;
            }
        }
    } else {
        for (var k in seatData.tingMap) {
            if (modepai == k) {
                console.log("玩家要胡 222 ")
                return true;
            }
        }
    }
    return false;
}

function doUserMoPai(game, yp) {
    game.chuPai = -1;
    var turnSeat = game.gameSeats[game.turn];
    turnSeat.lastFangGangSeat = -1;
    turnSeat.guoHu = false;
    turnSeat.guopeng = [];
    if (game.turn == game.button && game.conf.seatNum == 4 && game.szbg == 0) {
        let gseats = game.gameSeats;
        console.log("检查第一张出牌", gseats[game.button].folds)
        if (gseats[0].folds.length == 1) {
            let spai = gseats[game.button].folds[0]
            for (let j = 1; j < gseats.length; j++) {
                console.log("第一张跟牌", gseats[j].folds)
                if (gseats[j].folds.length == 1 && gseats[j].folds[0] == spai) {

                }
                else {
                    game.szbg = 1
                    break
                }
            }
            if (game.szbg == 0) {
                game.szbg = 2
                console.log("第一张跟了都")
                userMgr.broacastInRoom("szbg_tips_push", { button: game.button }, turnSeat.userId, true)
            }
        }
        else {
            game.szbg = 1
        }
    }
    // let temp = Object.keys(turnSeat.tingMap)
    // var yoamopai = game.mahjongs[game.currentIndex];
    // var nh = isyaohu(turnSeat, yoamopai);
    if (false) { //!yp && nh && game.canZM <= 5
        game.mahjongs.splice(game.currentIndex, 1);
        game.mahjongs.push(yoamopai);
        doUserMoPai(game);
    } else {
        console.log("&&&&^^^^", yp >= 0)
        if (yp >= 0) { //null >= 0 ——>true  undefined >= 0 ——> false

        } else {
            console.log(turnSeat.name + "开始摸牌》》》》")
            var pai = mopai(game, game.turn, true);
            console.log("正常摸牌", pai)
            //牌摸完了，结束
            if (pai == -1) {
                game.sdmjhepai = true;
                doGameOver(game, turnSeat.userId);
                return;
            }
            //通知前端新摸的牌
            sortHolds(turnSeat, true)
            let mData = {
                pai: pai,
                holds: turnSeat.holds.slice(),
                numOfMJ: game.mahjongs.length - game.currentIndex,
                seatIndex: game.turn,
            }
            userMgr.broacastInRoom('game_mopai_push', mData, turnSeat.userId, true);
            recordGameAction(game, game.turn, ACTION_MOPAI, mData);
        }
        if (checkCanBuHua(game)) {
            let pai = null;
            let huaArr = turnSeat.holds.filter(element => {
                return element >= 34
            });
            turnSeat.holds = turnSeat.holds.filter(element => {
                return element <= 33
            });
            huaArr.forEach(element => {
                pai = mopai(game, game.turn)
                console.log("补花摸牌", pai)
                if (pai == -1) {
                    game.sdmjhepai = true;
                    doGameOver(game, turnSeat.userId);
                    return;
                }
            });
            sortHolds(turnSeat, true)
            let buhuaData = {
                userId: turnSeat.userId,
                seatIndex: turnSeat.seatIndex,
                huaArr: huaArr,
                holds: turnSeat.holds.slice(),
                numOfMJ: game.mahjongs.length - game.currentIndex,
            }
            userMgr.broacastInRoom('game_buhua_push', buhuaData, turnSeat.userId, true);
            turnSeat.flowerFolds = turnSeat.flowerFolds.concat(huaArr);
            recordGameAction(game, game.turn, ACTION_BUHUA, buhuaData)
            console.log(turnSeat.name + "***摸牌后 需要补花", huaArr, turnSeat.holds)
            doUserMoPai(game, pai)
            return
        }
        //检查是否可以暗杠或者胡
        //检查胡，直杠，弯杠
        checkCanAnGang(game, turnSeat);
        checkCanWanGang(game, turnSeat);
        if (yp && !pai) {
            pai = yp
        }
        checkCanHu(game, turnSeat, pai);
        if (turnSeat.canHu && yp) {
            game.huashanghua = true;
        }
        //广播通知玩家出牌方
        turnSeat.canChuPai = true;
        userMgr.broacastInRoom('game_chupai_push', {
            seatIndex: turnSeat.seatIndex,
            canChuPai: turnSeat.canChuPai,
        }, turnSeat.userId, true);
        //通知玩家做对应操作
        sendOperations(game, turnSeat, game.chuPai);
        if(turnSeat.isTg){
            let chutimer = setTimeout(function(){
                exports.chuPaiFunc(turnSeat.userId,pai)
                clearTimeout(chutimer)
            },500)  
        }
        // var gang3jia = 0;
        // for (let i = 0; i < game.conf.seatNum; i++) {
        //     var sd = game.gameSeats[i];
        //     if (sd.angangs.length > 0 || sd.diangangs.length > 0 || sd.wangangs.length > 0) {
        //         gang3jia++;
        //     }
        // }
        // if (gang3jia >= 3) {
        //     game.sdmjhepai = true;
        //     doGameOver(game, turnSeat.userId);
        // }
    }
}

function computeFanScore(game, fan) {
    return (1 << fan) * game.conf.baseScore;
}

function checkHuahu(sd, game) {
    if (game.conf.otherData.huahu) {
        if (sd.flowerFolds.length < 4) {
            return -1
        } else if (sd.flowerFolds.length == 8) {
            return 2;
        } else {
            let huaHome1 = [34, 35, 36, 37];
            let huaHome2 = [38, 39, 40, 41];
            let isall1 = true;
            let isall2 = true;
            huaHome1.forEach((el) => {
                if (isall1) {
                    isall1 = sd.flowerFolds.includes(el)
                }
            })
            huaHome2.forEach((el) => {
                if (isall2) {
                    isall2 = sd.flowerFolds.includes(el)
                }
            })
            if (isall1 || isall2) {
                return 1
            } else {
                return -1;
            }
        }
    } else {
        if (sd.flowerFolds.length == 7) {
            return 1;
        } else if (sd.flowerFolds.length == 8) {
            return 2;
        } else {
            return -1
        }
    }
}

function calculateResult(game) {
    for (var i = 0; i < game.gameSeats.length; ++i) {
        var sd = game.gameSeats[i];
        if (game.conf.otherData.shangga) {
            sd.reason = sd.gaNum > 0 ? sd.gaNum + "噶 " : "无噶"
        }
        if (game.szbg == 2 && game.button == i) {
            sd.reason += " 首张被跟"
        }
        else if (game.szbg == 2) {
            let lianzhuanNum = 0;
            let zhuangxianNum = 0;
            if (game.conf.otherData.lianzhuang) {
                lianzhuanNum = game.roomInfo.lianzhuang;
            }
            if (game.conf.otherData.zhuangxian) {
                zhuangxianNum = 1;
            }
            if (sd.gaNum < 0) {
                sd.gaNum = 0;
            }
            if (game.gameSeats[game.button].gaNum < 0) {
                game.gameSeats[game.button].gaNum = 0;
            }
            let szbgscore = (1 + sd.gaNum + game.gameSeats[game.button].gaNum + lianzhuanNum + zhuangxianNum);
            game.gameSeats[game.button].score -= szbgscore;
            sd.score += szbgscore;
        }
        //统计杠的数目
        sd.numAnGang = sd.angangs.length;
        if (sd.numAnGang > 0) {
            sd.reason += " 暗杠x" + sd.numAnGang;
        }
        sd.numMingGang = sd.wangangs.length + sd.diangangs.length;
        if (sd.numMingGang > 0) {
            sd.reason += " 明杠x" + sd.numMingGang;
        }
        for (var a = 0; a < sd.actions.length; ++a) {
            var ac = sd.actions[a];
            if ((ac.type == "angang" || ac.type == "wangang" || ac.type == "diangang")) {
                let bei = ac.type == "angang" ? 2 : 1;
                for (var t = 0; t < game.gameSeats.length; ++t) {
                    if (i != t) {
                        let lianzhuanNum = 0;
                        let zhuangxianNum = 0;
                        if (game.button == i || game.button == t) {
                            if (game.conf.otherData.lianzhuang) {
                                lianzhuanNum = game.roomInfo.lianzhuang;
                            }
                            if (game.conf.otherData.zhuangxian) {
                                zhuangxianNum = 1;
                            }
                        }
                        if (sd.gaNum < 0) {
                            sd.gaNum = 0;
                        }
                        if (game.gameSeats[t].gaNum < 0) {
                            game.gameSeats[t].gaNum = 0;
                        }
                        let acscore = (1 + sd.gaNum + game.gameSeats[t].gaNum + lianzhuanNum + zhuangxianNum) * bei;
                        console.log("计算杠分***^^^^.=", acscore, ac.targets)
                        console.log(t + " 杠嘻嘻嘻嘻", sd.gaNum, game.gameSeats[t].gaNum, lianzhuanNum, zhuangxianNum, bei)
                        if (game.conf.otherData.goujiao) {
                            game.gameSeats[ac.targets].score -= acscore;
                        } else {
                            game.gameSeats[t].score -= acscore;
                        }
                        sd.score += acscore
                    }
                }
                console.log(sd.seatIndex + '@@@得到的杠分 ' + sd.score);
            }
            //胡分
            else if (ac.type == "zimo" || ac.type == "hu" || ac.type == "ganghua" || ac.type == "huashanghua" || ac.type == "qiangganghu") {
                let hupaiBeishu = 1;
                let paixingFen = 0;
                if (ac.iszimo) {
                    sd.numZiMo++;
                    console.log('@@@自摸胡');
                } else {
                    sd.numJiePao++;
                }
                if (sd.folds.length == 0 && i == game.button) {
                    hupaiBeishu = 3;
                    sd.reason += " 天胡"
                } else if (sd.folds.length == 0 && i != game.button) {
                    hupaiBeishu = 3;
                    sd.reason += " 地胡"
                } else if (ac.type == "zimo") {
                    hupaiBeishu = 2;
                    sd.reason += " 自摸"
                } else if (ac.type == "ganghua") {
                    hupaiBeishu = 3;
                    sd.reason += " 杠上开花"
                    console.log('是****', ac.type);
                } else if (ac.type == "huashanghua") {
                    hupaiBeishu = 3;
                    sd.reason += " 花上开花"
                    console.log('是****', ac.type);
                } else if (ac.type == "qiangganghu") {
                    sd.reason += " 抢杠"
                }


                let paiStr = " "
                if (sd.pattern == "normal") {
                    if (isPengPengHu(sd)) {
                        paixingFen = 2;
                        if (isqys(sd)) {
                            paixingFen += 2;
                            paiStr = " 碰碰胡 清一色"
                            console.log("………………&&&& 碰碰胡 清一色")
                        }
                        console.log("………………&&&& 碰碰胡")
                    } else if (isqys(sd)) {
                        paixingFen = 2;
                        paiStr = " 清一色"
                        console.log("………………&&&& 清一色")
                    } else {
                        paixingFen = 1;
                        paiStr = " 平胡"
                        console.log("………………&&&& 平胡")
                    }

                } else if (sd.pattern == "shisanyao") {
                    paixingFen = 13;
                    paiStr = " 十三幺"
                    console.log("………………&&&& 十三幺")
                } else if (sd.pattern == "seven_pairs") {
                    for (var p = 0; p < sd.holds.length; p++) {
                        var pp = sd.holds[p];
                        if (sd.countMap[pp] == 4) {
                            fan += 1;
                            sd.pattern = "big_seven_pairs"
                            break;
                        }
                    }
                    paixingFen = sd.pattern == "seven_pairs" ? 2 : 3
                    paiStr = sd.pattern == "seven_pairs" ? " 七小对" : " 豪华七小对"
                    if (isqys(sd)) {
                        paixingFen += 2;
                        paiStr += " 清一色"
                        console.log("………………&&&& 七对 清一色")
                    }
                }
                sd.reason += paiStr
                for (var t = 0; t < game.gameSeats.length; ++t) {
                    if (i != t) {
                        let lianzhuanNum = 0;
                        let zhuangxianNum = 0;
                        let paoNum = 0
                        if (game.button == i || game.button == t) {
                            if (game.conf.otherData.lianzhuang) {
                                lianzhuanNum = game.roomInfo.lianzhuang;
                            }
                            if (game.conf.otherData.zhuangxian) {
                                zhuangxianNum = 1;
                            }

                        }
                        if (ac.type == "hu" || ac.type == "qiangganghu") {
                            if (t == ac.targets) {
                                paoNum = 1;
                                game.gameSeats[t].numDianPao++;
                            }
                        }
                        if (sd.gaNum < 0) {
                            sd.gaNum = 0;
                        }
                        if (game.gameSeats[t].gaNum < 0) {
                            game.gameSeats[t].gaNum = 0;
                        }
                        let huscore = (1 + sd.gaNum + game.gameSeats[t].gaNum + lianzhuanNum + zhuangxianNum) * (hupaiBeishu * paixingFen) + paoNum;
                        console.log("计算 胡***^^^^.=", huscore)
                        console.log(t + " 胡嘻嘻嘻嘻", sd.gaNum, game.gameSeats[t].gaNum, lianzhuanNum, zhuangxianNum, hupaiBeishu, paixingFen, paoNum)
                        if ((ac.type == "hu" || ac.type == "qiangganghu") && game.conf.otherData.goujiao) {
                            game.gameSeats[ac.targets].score -= huscore;
                        } else if (ac.type == "qiangganghu" && game.conf.wanfa != 0) {
                            game.gameSeats[ac.targets].score -= huscore;
                        } else if ((ac.type == "hu" || ac.type == "qiangganghu") && game.haidibao) {
                            game.gameSeats[ac.targets].score -= huscore;
                        } else if ((ac.type == "hu" || ac.type == "qiangganghu") && sd.zhuChiIndex != -1) {
                            game.gameSeats[sd.zhuChiIndex].score -= huscore;
                            if (!game.gameSeats[sd.zhuChiIndex].reason.includes("包牌")) {
                                game.gameSeats[sd.zhuChiIndex].reason += " 包牌"
                            }
                        } else if (ac.type == "zimo" && sd.zhuChiIndex != -1 && sd.zhuChi[sd.zhuChiIndex] == 4) {
                            game.gameSeats[sd.zhuChiIndex].score -= huscore;
                            if (!game.gameSeats[sd.zhuChiIndex].reason.includes("包牌")) {
                                game.gameSeats[sd.zhuChiIndex].reason += " 包牌"
                            }
                        }
                        else {
                            game.gameSeats[t].score -= huscore;
                        }

                        sd.score += huscore
                    }
                }

            }
        }
        let huahuaBei = checkHuahu(sd, game)
        if (huahuaBei != -1) {
            sd.reason += " 花胡"
            console.log("*****&&&&^^^ 有花胡", huahuaBei)
            for (var t = 0; t < game.gameSeats.length; ++t) {
                if (i != t) {
                    let lianzhuanNum = 0;
                    let zhuangxianNum = 0;
                    if (game.button == i || game.button == t) {
                        if (game.conf.otherData.lianzhuang) {
                            lianzhuanNum = game.roomInfo.lianzhuang;
                        }
                        if (game.conf.otherData.zhuangxian) {
                            zhuangxianNum = 1;
                        }
                    }
                    if (sd.gaNum < 0) {
                        sd.gaNum = 0;
                    }
                    if (game.gameSeats[t].gaNum < 0) {
                        game.gameSeats[t].gaNum = 0;
                    }
                    let huascore = (1 + sd.gaNum + game.gameSeats[t].gaNum + lianzhuanNum + zhuangxianNum) * huahuaBei;
                    console.log("计算花胡***^^^^.=", huascore)
                    console.log(t + " huahu嘻嘻嘻嘻", sd.gaNum, game.gameSeats[t].gaNum, lianzhuanNum, zhuangxianNum, huahuaBei)
                    game.gameSeats[t].score -= huascore;
                    sd.score += huascore
                }
            }

        }

    }
}

function doGameOver(game, userId, forceEnd) {
    var roomId = roomMgr.getUserRoom(userId);
    if (roomId == null) {
        return;
    }
    var roomInfo = roomMgr.getRoom(roomId);
    if (roomInfo == null) {
        return;
    }

    var results = [];
    var dbresult = [0, 0, 0, 0];

    var fnNoticeResult = function (isEnd) {
        var endinfo = null;
        if (isEnd) {
            endinfo = [];
            let maxWinner = -1
            let maxScore = 0;
            let everyAct = 0;
            let reduceAct = 0;
            roomInfo.seats.forEach((el, index) => {
                if (el.score > maxScore) {
                    maxWinner = index
                    maxScore = el.score;
                }
            })
            if (roomInfo.conf.coinData) {
                everyAct = roomInfo.conf.coinData.every;
                reduceAct = roomInfo.conf.coinData.reduce;
            }
            for (let a = 0; a < roomInfo.seats.length; ++a) {
                let rs = roomInfo.seats[a];
                let actNum = 0;
                if (rs.score > 0) {
                    actNum += parseInt(rs.score * everyAct)
                }
                else if (rs.score < 0) {
                    actNum -= parseInt(Math.abs(rs.score) * everyAct)
                }
                if (a == maxWinner) {
                    actNum -= reduceAct;
                }
                db.change_user_actNum(rs.userId, actNum, function () {

                })
                endinfo.push({
                    numzimo: rs.numZiMo,
                    numjiepao: rs.numJiePao,
                    numdianpao: rs.numDianPao,
                    numAnGang: rs.numAnGang,
                    numMingGang: rs.numMingGang,
                    score: rs.score,
                    actNum: actNum
                });
            }
        } else {
            roomInfo.startTimer = setTimeout(function () {
                if (exports.games[roomId] == null) {
                    exports.begin(roomId);
                    clearTimeout(roomInfo.startTimer);
                    roomInfo.startTimer = null;
                }
            }, 1000 * 60)
        }
        var endData = {
            results: results,
            endinfo: endinfo,
            isForce: forceEnd,
            time: new Date(),
            roomId: roomInfo.id,
            quanId: roomInfo.conf.quanId,
            quanMing: roomInfo.conf.quanMing,
        }
        roomInfo.endData = endData;
        userMgr.broacastInRoom('game_over_push', endData, userId, true);
        recordGameAction(game, -1, ACTION_OVER, endData);
        //记录打牌信息
        var str = JSON.stringify(game.actionList);
        db.update_game_action_records(roomInfo.uuid, game.gameIndex, str);
        //如果局数已够，则进行整体结算，并关闭房间
        if (isEnd && !roomInfo.already_archive_games) {
            var conf = roomInfo.conf;
            if (roomInfo.startTimer) {
                clearTimeout(roomInfo.startTimer);
                roomInfo.startTimer = null;
            }
            if (roomInfo.numOfGames <= 1 && conf.quanId) {
                if (conf.quanZhu) {
                    var cost = conf.cost;
                    db.cost_gems(conf.quanZhu, -cost, function (ret) { })

                }
            }
            setTimeout(function () {
                if (roomInfo.numOfGames > 1 || roomInfo.already_store_game) {
                    store_history(roomInfo);
                }
                // userMgr.kickAllInRoom(roomId);
                roomMgr.destroy(roomId);
                db.archive_games(roomInfo.uuid);
                roomInfo.already_archive_games = true;
            }, 500);
        }
    }
    console.log("游戏结束时game === " + game)
    if (game != null) {
        if(game.tgTimer){
            clearInterval(game.tgTimer)
            game.tgTimer = null;
        }
        if (!forceEnd) {
            if (!game.sdmjhepai) {
                calculateResult(game);
            } else if (game.conf.otherData.liuju) {
                calculateResult(game);
            }
        }

        for (let i = 0; i < roomInfo.seats.length; ++i) {
            var rs = roomInfo.seats[i];
            var sd = game.gameSeats[i];
            if (!sd) break;
            rs.ready = false;
            rs.score += sd.score;
            rs.numZiMo += sd.numZiMo;
            rs.numJiePao += sd.numJiePao;
            rs.numDianPao += sd.numDianPao;
            rs.numAnGang += sd.numAnGang;
            rs.numMingGang += sd.numMingGang;
            if (sd.hued) {
                rs.numHua += sd.huaNum;
            }
            var userRT = {
                userId: sd.userId,
                pengs: sd.pengs,
                chis: sd.chis,
                actions: [],
                wangangs: sd.wangangs,
                diangangs: sd.diangangs,
                angangs: sd.angangs,
                holds: sd.holds,
                flowers: sd.flowerFolds,
                fan: sd.fan,
                score: sd.score,
                totalscore: rs.score,
                pattern: sd.pattern,
                huorder: sd.hued,
                huaNum: sd.huaNum,
                isHe: game.sdmjhepai,
                isBuhua: game.isBuhua,
                ischengbao: sd.ischengbao,
                yipaosanxiang: sd.canHu ? game.yipaosanxiang : false,
                chupai: game.chuPai,
                reason: sd.reason,
            };
            for (var k in sd.actions) {
                userRT.actions[k] = {
                    type: sd.actions[k].type,
                };
            }
            results.push(userRT);

            dbresult[i] = sd.score;
            roomInfo.scoreList[i] = rs.score;
            delete gameSeatsOfUsers[sd.userId];
        }
        delete exports.games[roomId];

        var old = roomInfo.nextButton;

        if (game.button == game.lastHuPaiSeat || game.lastHuPaiSeat == -1) { //庄胡了连庄，黄庄庄不变
            roomInfo.nextButton = game.button;
            if (game.conf.otherData.lianzhuang) {
                roomInfo.lianzhuang += 1;
            }
        } else { //其他人胡轮庄
            roomInfo.nextButton = (game.button + 1) % game.conf.seatNum;
            roomInfo.lianzhuang = 0;
            if (roomInfo.nextButton == 0) {
                roomInfo.gameLing = (roomInfo.gameLing + 1) % game.conf.seatNum;
            }
        }

        if (old != roomInfo.nextButton) {
            db.update_next_button(roomId, roomInfo.nextButton, roomInfo.gameLing);
        }
    } else {
        for (let i = 0; i < roomInfo.seats.length; i++) {
            var rs = roomInfo.seats[i];
            var userRT = {
                userId: 0,
                pengs: [],
                chis: [],
                actions: [],
                wangangs: [],
                diangangs: [],
                angangs: [],
                holds: [],
                fan: 0,
                score: 0,
                totalscore: rs.score,
                pattern: 0,
                huorder: false,
                huaNum: 0,
                isHe: false,
                isBuhua: false,
                ischengbao: false,
                yipaosanxiang: false,
            };
            results.push(userRT);
        }
    }

    if (forceEnd || game == null) {
        fnNoticeResult(true);
    } else {
        db.update_num_of_turns(roomId, roomInfo.numOfGames);
        db.update_user_score(roomId, roomInfo.scoreList, "t_rooms");
        //保存游戏
        store_game(game, function (ret) {

            roomInfo.already_store_game = true;

            db.update_game_result(roomInfo.uuid, game.gameIndex, dbresult);
            //如果是第一次，并且不是强制解散 则扣除房卡
            if (roomInfo.numOfGames == 1 && !roomInfo.conf.quanId) {
                var cost = roomInfo.conf.cost;
                db.cost_gems(roomInfo.conf.creator, cost);
            }
            var isEnd = roomInfo.numOfGames >= roomInfo.conf.maxGames;
            fnNoticeResult(isEnd);
        });
    }
}

function recordUserAction(game, seatData, type, target) {
    var d = {
        type: type,
        targets: []
    };
    if (target != null) {
        if (typeof (target) == 'number') {
            d.targets.push(target);
        } else {
            d.targets = target;
        }
    } else {
        for (var i = 0; i < game.gameSeats.length; ++i) {
            var s = game.gameSeats[i];
            if (i != seatData.seatIndex && s.hued == false) {
                d.targets.push(i);
            }
        }
    }
    if (type == "beiqianggang") {
        for (var j = 0; j < seatData.actions.length; j++) {
            var ac = seatData.actions[j];
            if (ac.type == "wangang") {
                console.log("被抢杠删除了弯杠")
                seatData.actions.splice(j, 1);
                break;
            }
        }
    }
    seatData.actions.push(d);
    return d;
}

function recordGameAction(game, si, action, rData) {
    let temObj = {
        si: si,
        type: action,
        data: rData,
    }
    game.actionList.push(temObj)
    // game.actionList.push(si);
    // game.actionList.push(action);
    // if (pai != null) {
    //     game.actionList.push(pai);
    // }
}

exports.setReady = function (userId, callback) {
    var roomId = roomMgr.getUserRoom(userId);
    if (roomId == null) {
        return;
    }
    var roomInfo = roomMgr.getRoom(roomId);
    if (roomInfo == null) {
        return;
    }
    roomMgr.setReady(userId, true);
    var game = exports.games[roomId];

    if (game == null) {
        var existNum = 0;
        var readyAll = true;
        if (roomInfo.seats.length == roomInfo.conf.seatNum) {
            for (var i = 0; i < roomInfo.seats.length; ++i) {
                var s = roomInfo.seats[i];
                if (s.userId) {
                    existNum++;
                    if (s.ready == false) { //|| userMgr.isOnline(s.userId) == false
                        readyAll = false;
                    }
                }
                else {
                    readyAll = false;
                }

            }
            if (readyAll) {
                exports.begin(roomId);
            }
            // else if (roomInfo.numOfGames == 0) {
            //     if (existNum == roomInfo.conf.seatNum) {
            //         exports.begin(roomId);
            //     }
            // }
        }
    }
}
exports.sync = function (userId) {
    var roomId = roomMgr.getUserRoom(userId);
    if (roomId == null) {
        return;
    }
    var roomInfo = roomMgr.getRoom(roomId);
    if (roomInfo == null) {
        return;
    }
    var game = exports.games[roomId];
    if (game == null) {
        if (roomInfo.endData) {
            userMgr.sendMsg(userId, 'game_sync_enddata_push', roomInfo.endData);
        }
    } else {
        var numOfMJ = game.mahjongs.length - game.currentIndex;
        var data = {
            state: game.state,
            numOfMJ: numOfMJ,
            button: game.button,
            turn: game.turn,
            chuPai: game.chuPai,
            haveReddot: game.haveReddot,
            gameLing: roomInfo.gameLing,
            lianzhuang: roomInfo.lianzhuang,
            isga: game.isga,
        };

        data.seats = [];
        var seatData = null;
        for (let i = 0; i < roomInfo.conf.seatNum; ++i) {
            var sd = game.gameSeats[i];
            var s = {
                userid: sd.userId,
                folds: sd.folds,
                flowerFolds: sd.flowerFolds,
                angangs: sd.angangs,
                diangangs: sd.diangangs,
                wangangs: sd.wangangs,
                pengs: sd.pengs,
                chis: sd.chis,
                hued: sd.hued,
                iszimo: sd.iszimo,
                doBuHua: sd.doBuHua,
                canChuPai: sd.canChuPai,
                guoHuShow: sd.guoHuShow,
                gaNum: sd.gaNum,
                maxga: sd.maxga,
            }
            if (sd.userId == userId) {
                s.holds = sd.holds;
                seatData = sd;
            }
            data.seats.push(s);
        }
        //同步整个信息给客户端
        userMgr.sendMsg(userId, 'game_sync_push', data);
        sendOperations(game, seatData, game.chuPai);
        // userMgr.sendMsg(userId,"login_finished",{});
    }
}

function store_history(roomInfo) {
    var seats = roomInfo.seats;
    var history = {
        uuid: roomInfo.uuid,
        id: roomInfo.id,
        time: Math.ceil(Date.now() / 1000),
        seats: new Array(roomInfo.conf.seatNum)
    };
    let users = [];
    for (var i = 0; i < seats.length; ++i) {
        var rs = seats[i];
        var hs = history.seats[i] = {};
        hs.userid = rs.userId;
        if (!rs.name) {
            rs.name = '';
        }
        hs.name = crypto.toBase64(rs.name);
        hs.score = rs.score;
        users.push(rs.userId)
    }
    db.store_history(roomInfo.uuid, history, roomInfo.conf.quanId, users.toString(), function (sh) {
        if (sh) {
            console.log("游戏记录存储成功")
            // for (var i = 0; i < seats.length; ++i) {
            //     var s = seats[i];
            //     store_single_history(s.userId, roomInfo.uuid);
            // }
        }
    });
    db.create_zhanji_info(roomInfo.id, roomInfo.conf.quanId, roomInfo.conf.quanZhu, function (zh) {
        if (zh) {
            console.log("创建战绩信息成功 ==")
            for (var i = 0; i < seats.length; ++i) {
                var s = seats[i];
                db.store_sigle_zhanji(s.userId, crypto.toBase64(s.name), s.score, i + 1, zh);
            }
        }
    });

}

function store_single_history(userId, history) {
    db.get_user_history(userId, function (data) {
        if (data == null) {
            data = [];
        }
        while (data.length >= 10) {
            data.shift();
        }
        data.push(history);
        db.update_user_history(userId, data);
    });
}

function store_game(game, callback) {
    db.create_game(game.roomInfo.uuid, game.gameIndex, game.baseInfoJson, callback);
}

function construct_game_base_info(game) {
    var baseInfo = {
        type: game.conf.type,
        button: game.button,
        index: game.gameIndex,
        conf: game.conf,
        mahjongs: game.mahjongs,
        game_seats: new Array(game.conf.seatNum),
        numOfMJ: game.mahjongs.length - game.currentIndex,
        gameLing: game.roomInfo.gameLing,
        lianzhuang: game.roomInfo.lianzhuang,
    }
    for (var i = 0; i < game.conf.seatNum; ++i) {
        baseInfo.game_seats[i] = {};
        baseInfo.game_seats[i].holds = game.gameSeats[i].holds;
        baseInfo.game_seats[i].score = game.roomInfo.seats[i].score;
        baseInfo.game_seats[i].gaNum = game.gameSeats[i].gaNum;

    }
    game.baseInfoJson = JSON.stringify(baseInfo);
}


//开始新的一局
exports.begin = function (roomId) {
    var roomInfo = roomMgr.getRoom(roomId);
    if (!roomInfo) return;
    if (roomInfo.startTimer) {
        clearTimeout(roomInfo.startTimer);
        roomInfo.startTimer = null;
    }
    roomInfo.already_store_game = false;
    roomInfo.endData = null;
    if (roomInfo == null) {
        return;
    }
    var seats = roomInfo.seats;
    roomInfo.numOfGames++;
    if (roomInfo.numOfGames == 1) {
        db.update_isStart(roomId, 1);
    }
    var game = {
        conf: roomInfo.conf,
        roomInfo: roomInfo,
        gameIndex: roomInfo.numOfGames,
        button: roomInfo.nextButton,
        gameLing: lingHome[roomInfo.gameLing],
        mahjongs: [],
        currentIndex: 0,
        gameSeats: new Array(roomInfo.conf.seatNum),

        numOfQue: 0,
        turn: 0,
        chuPai: -1,
        state: "",
        actionList: [],
        chupaiCnt: 0,

        sdmjhepai: false,
        canQiangGang: false,
        isBuhua: false,
        haveReddot: true,
        yipaosanxiang: false,
        kaida: false,
        chengbaoIndex: -1,
        canZM: -1,
        isga: false,
        haidibao: false,
        huashanghua: false,
        szbg: 0,
        tgTimer: null,
        tgTime: 0,
    };



    for (let i = 0; i < roomInfo.conf.seatNum; ++i) {

        var data = game.gameSeats[i] = {};

        data.game = game;

        data.seatIndex = i;

        data.userId = seats[i].userId;
        data.name = seats[i].name;
        //持有的牌
        data.holds = [];
        //打出的牌
        data.folds = [];
        data.flowerFolds = [];
        //暗杠的牌
        data.angangs = [];
        //点杠的牌
        data.diangangs = [];
        //弯杠的牌
        data.wangangs = [];
        //碰了的牌
        data.pengs = [];

        data.pengTargets = [];

        data.chis = [];

        //玩家手上的牌的数目，用于快速判定碰杠
        data.countMap = {};
        //玩家听牌，用于快速判定胡了的番数
        data.tingMap = {};
        data.pattern = "";

        //是否可以杠
        data.canGang = false;
        //用于记录玩家可以杠的牌
        data.gangPai = [];

        //是否可以碰
        data.canPeng = false;
        //是否可以胡
        data.canHu = false;
        //是否可以出牌
        data.canChuPai = false;

        data.canChi = false;

        data.guoHu = false;
        data.guoHuShow = false;
        data.canBu = false;
        data.doBuHua = false;

        //是否胡了
        data.hued = false;
        //是否是自摸
        data.iszimo = false;

        data.isGangHu = false;

        //
        data.actions = [];

        data.fan = 0;
        data.score = 0;
        data.lastFangGangSeat = -1;
        data.shisanyaoPai = [];
        data.zhuChi = {};
        data.zhuChiIndex = -1;
        data.beiChi = {};
        data.beiChiIndex = -1;
        data.chengbao = -1;
        data.ischengbao = false;
        data.isbcb = false;
        data.guopeng = [];

        data.numZiMo = 0;
        data.numJiePao = 0;
        data.numDianPao = 0;
        data.numAnGang = 0;
        data.numMingGang = 0;
        data.huaNum = 0;
        data.gaNum = -1;
        data.maxga = seats[i].maxga;
        gameSeatsOfUsers[data.userId] = data;
        data.reason = ""
        data.isTg = false
    }
    exports.games[roomId] = game;
    shufflePlus(game);
    //发牌
    deal(game);
    var numOfMJ = game.mahjongs.length - game.currentIndex;
    let gaArr = []
    let maxGaNum = -1;
    for (let i = 0; i < seats.length; ++i) {
        //开局时，通知前端必要的数据
        var s = seats[i];
        s.ready = true;
        if (game.conf.otherData.zyshangga) {
            gaArr.push(-1)
        } else if (game.conf.otherData.shangga3 && roomInfo.numOfGames == 1) {
            game.gameSeats[i].gaNum = 3;
            seats[i].maxga = 3;
            gaArr.push(3)
            maxGaNum = 3;
        }
        else if (game.conf.otherData.fixga3) {
            game.gameSeats[i].gaNum = 3;
            seats[i].maxga = 3;
            gaArr.push(3)
            maxGaNum = 3
        }
        else if (game.conf.otherData.shangga5) {
            game.gameSeats[i].gaNum = 5;
            seats[i].maxga = 5;
            gaArr.push(5)
            maxGaNum = 5
        } else if (game.conf.otherData.maxga3 && seats[i].maxga == 3) {
            game.gameSeats[i].gaNum = 3;
            gaArr.push(3)
            maxGaNum = 3
        }
        else if (seats[i].maxga == 5) {
            game.gameSeats[i].gaNum = 5;
            gaArr.push(5)
            maxGaNum = 5
        } else {
            gaArr.push(-1)
        }
        //通知玩家手牌
        sortHolds(game.gameSeats[i], true);
        let gamedata = {
            holds: game.gameSeats[i].holds,
            numOfMJ: numOfMJ,
            numOfGames: roomInfo.numOfGames,
            button: game.button,
            gameLing: roomInfo.gameLing,
            lianzhuang: roomInfo.lianzhuang,
            maxga: game.gameSeats[i].maxga,
        }
        //通知游戏开始
        userMgr.sendMsg(s.userId, 'game_begin_push', gamedata);
    }
    game.state = "begin";
    if (game.conf.otherData.shangga) {
        if (game.gameSeats.find(function (s) {
            return s.gaNum == -1
        })) {

        } else {
            game.isga = true;
            setTimeout(function () {
                startPlay(game)
            }, 500);
        }
        userMgr.broacastInRoom("ga_have_all", {
            isga: game.isga,
            gaArr: gaArr,
            gaNum: maxGaNum,
        }, game.gameSeats[game.turn].userId, true)
    } else {
        setTimeout(function () {
            startPlay(game)
        }, 500);
    }

};

function startPlay(game) {
    construct_game_base_info(game);
    var turnSeat = game.gameSeats[game.turn];
    while (checkCanBuHua(game)) {
        let huaArr = turnSeat.holds.filter(element => {
            return element >= 34
        });
        turnSeat.holds = turnSeat.holds.filter(element => {
            return element <= 33
        });
        huaArr.forEach(element => {
            mopai(game, game.turn)
        });
        sortHolds(turnSeat, true)
        let buhuaData = {
            userId: turnSeat.userId,
            seatIndex: turnSeat.seatIndex,
            huaArr: huaArr,
            holds: turnSeat.holds.slice(),
            numOfMJ: game.mahjongs.length - game.currentIndex,
        }
        userMgr.broacastInRoom('game_buhua_push', buhuaData, turnSeat.userId, true);
        turnSeat.flowerFolds = turnSeat.flowerFolds.concat(huaArr);
        recordGameAction(game, game.turn, ACTION_BUHUA, buhuaData)
    }
    userMgr.broacastInRoom('game_playing_push', null, turnSeat.userId, true);
    game.state = "playing";
    //通知玩家出牌方
    turnSeat.canChuPai = true;
    userMgr.broacastInRoom('game_chupai_push', {
        userId: turnSeat.userId,
        seatIndex: turnSeat.seatIndex,
        canChuPai: turnSeat.canChuPai
    },turnSeat.userId, true);
    //检查是否可以暗杠或者胡
    //直杠
    checkCanAnGang(game, turnSeat);
    //检查胡 用最后一张来检查
    checkCanHu(game, turnSeat, turnSeat.holds[turnSeat.holds.length - 1]);
    //通知前端
    sendOperations(game, turnSeat, game.chuPai);
    console.log("有设置托管吗？",game.conf.tg)
    if(game.conf.tg){
        if(game.tgTimer == null){
            game.tgTime = game.conf.tg;
            game.tgTimer = setInterval(function(){
                console.log("检测托管中",game.tgTime)
                if(game.tgTime <= 0){
                    let turnSeat = game.gameSeats[game.turn]
                    if(turnSeat.canChuPai){
                        turnSeat.isTg = true
                        let pai = turnSeat.holds[turnSeat.holds.length - 1]
                        exports.chuPaiFunc(turnSeat.userId,pai)
                    }
                    else{
                        let pengUser = null;
                        let chiUser = null;
                        let gangUser = null;
                        for (let i = 0; i < game.gameSeats.length; ++i){
                            let user = game.gameSeats[i];
                            console.log(user.canChi,user.canHu,user.canPeng,user.canGang)
                            if(user.canGang){
                                gangUser = user;
                            } else if(user.canPeng){
                                pengUser = user;
                            }else if(user.canChi){
                                chiUser = user;
                            }
                        }
                        if(gangUser){
                            gangUser.isTg = true
                            let data = {
                                msg: gangUser.userId+ "倒计时杠传过来的信息",
                                guo: true
                            }
                            exports.guo(gangUser.userId,data)
                        }
                        else if(pengUser){
                            pengUser.isTg = true
                            let data = {
                                msg: pengUser.userId+ "倒计时peng传过来的信息",
                                guo: true
                            }
                            exports.guo(pengUser.userId,data)
                        }
                        else if(chiUser){
                            chiUser.isTg = true;
                            let data = {
                                msg: chiUser.userId+ "倒计时吃传过来的信息",
                                guo: true
                            }
                            exports.guo(chiUser.userId,data)
                        }

                    }
                }
                else{
                    game.tgTime -= 1;
                }
            },1000)
        }
    }
};
exports.chooseGa = function (userId, data) {
    var seatData = gameSeatsOfUsers[userId];
    if (seatData.gaNum != -1) return;
    var game = seatData.game;
    seatData.gaNum = JSON.parse(data).gaNum;
    game.roomInfo.seats[seatData.seatIndex].maxga = seatData.gaNum;
    let gameSeats = game.gameSeats;
    let isAll = true;
    let gaArr = [];
    gameSeats.forEach(function (s) {
        if (s.gaNum == -1) {
            isAll = false;
        }
        gaArr.push(s.gaNum);
    })
    if (isAll) {
        game.isga = true;
        setTimeout(function () {
            startPlay(game)
        }, 500);
    } else {

    }
    userMgr.broacastInRoom("ga_have_all", {
        isga: game.isga,
        gaArr: gaArr,
        gaNum: seatData.gaNum
    }, userId, true)
};

function checkCanBuHua(game) {
    var turnSeat = game.gameSeats[game.turn];
    let huaArr = turnSeat.holds.filter(element => {
        return element >= 34
    });
    if (huaArr.length > 0) {
        return true;
    } else {
        return false;

    }
};
exports.chuPaiFunc = function (userId, pai) {
    pai = Number.parseInt(pai);
    var seatData = gameSeatsOfUsers[userId];
    if (seatData == null) {
        console.log("can't find user game data.");
        return;
    }

    var game = seatData.game;
    var seatIndex = seatData.seatIndex;
    //如果不该他出，则忽略
    if (game.turn != seatIndex) {
        console.log("not your turn.");
        return;
    }
    if (seatData.hued) {
        console.log('you have already hued. no kidding plz.');
        return;
    }

    if (seatData.canChuPai == false) {
        console.log('不能出牌.');
        return;
    }

    if (hasOperations(seatData)) {
        if (seatData.canHu && game.conf.seatNum > 2) {
            seatData.guoHu = true;
        }
        clearAllOptions(game, seatData)
    }
    console.log("出牌$$$$")
    game.huashanghua = false;
    //从此人牌中扣除
    var index = seatData.holds.indexOf(pai);
    if (index == -1) {
        console.log("没有要出的牌")
        return;
    }
    seatData.canChuPai = false;
    game.chupaiCnt++;

    seatData.holds.splice(index, 1);
    seatData.countMap[pai]--;

    game.chuPai = pai;
    // checkCanTingPai(game, seatData);
    sortHolds(seatData, true)
    let chuData = {
        userId: seatData.userId,
        seatIndex: seatData.seatIndex,
        pai: pai,
        canChuPai: seatData.canChuPai,
        holds: seatData.holds.slice(),
    }
    userMgr.broacastInRoom('game_chupai_notify_push', chuData, seatData.userId, true);
    recordGameAction(game, seatData.seatIndex, ACTION_CHUPAI, chuData);
    for (let n = 0; n < game.gameSeats.length; ++n) {
        game.gameSeats[n].guoHuShow = false;
    };
    seatData.folds.push(game.chuPai);
    game.haveReddot = true;
    if (game.kaida == false) {
        game.kaida = true;
    }
    game.isBuhua = false;
    game.tgTime = game.conf.tg;
    //检查是否有人要胡，要碰 要杠
    var hasActions = false;
    var huNum = 0
    for (let i = 0; i < game.gameSeats.length; ++i) {
        //玩家自己不检查
        if (game.turn == i) {
            continue;
        }
        var ddd = game.gameSeats[i];
        //已经和牌的不再检查
        if (ddd.hued) {
            continue;
        }
        if (!game.conf.otherData.budianpao && !ddd.guoHu) { //能点炮  并且不能过胡
            let checkFan = game.conf.wanfa == 0;
            checkCanHu(game, ddd, pai, checkFan);
            if (ddd.canHu) {
                huNum++
            }
        }

        checkCanPeng(game, ddd, pai);
        checkCanDianGang(game, ddd, pai);
        if ((game.turn + 1) % game.conf.seatNum == i) {
            checkCanChi(game, ddd, pai);
        }
        if (hasOperations(ddd)) {
            sendOperations(game, ddd, game.chuPai);
            hasActions = true;
        }
    }
    if (huNum == 3) { //一炮三响  流局
        game.sdmjhepai = true;
        game.yipaosanxiang = true;
        doGameOver(game, seatData.userId)
        return;
    }
    //如果没有人有操作，则向下一家发牌，并通知他出牌
    if (!hasActions) {
        game.chuPai = -1;
        moveToNextUser(game);
        game.canZM = Math.round(Math.random() * 10);
        doUserMoPai(game);
    }
};

exports.peng = function (userId) {
    var seatData = gameSeatsOfUsers[userId];
    if (seatData == null) {
        console.log("can't find user game data.");
        return;
    }

    var game = seatData.game;
    game.isBuhua = false;
    //如果是他出的牌，则忽略
    if (game.turn == seatData.seatIndex) {
        console.log("it's your turn.");
        return;
    }

    //如果没有碰的机会，则不能再碰
    if (seatData.canPeng == false) {
        console.log("seatData.peng == false");
        return;
    }

    //和的了，就不要再来了
    if (seatData.hued) {
        console.log('you have already hued. no kidding plz.');
        return;
    }

    //如果有人可以胡牌，则需要等待
    var i = game.turn;
    while (true) {
        var i = (i + 1) % game.conf.seatNum;
        if (i == game.turn) {
            break;
        } else {
            var ddd = game.gameSeats[i];
            if (ddd.canHu && i != seatData.seatIndex) {
                return;
            }
        }
    }


    clearAllOptions(game);

    //验证手上的牌的数目
    var pai = game.chuPai;
    var c = seatData.countMap[pai];
    if (c == null || c < 2) {
        console.log("pai:" + pai + ",count:" + c);
        console.log(seatData.holds);
        console.log("lack of mj.");
        return;
    }

    //进行碰牌处理
    //扣掉手上的牌
    //从此人牌中扣除
    for (var i = 0; i < 2; ++i) {
        var index = seatData.holds.indexOf(pai);
        if (index == -1) {
            console.log("can't find mj.");
            return;
        }
        seatData.holds.splice(index, 1);
        seatData.countMap[pai]--;
    }
    var pengInfo = {
        pai: pai,
        target: game.turn,
    }
    seatData.pengs.push(pengInfo);
    seatData.pengTargets.push(game.turn);
    if (game.conf.seatNum > 2) {
        statisticsCPG(seatData, game.turn, game)
    }
    game.chuPai = -1;
    //广播通知其它玩家
    sortHolds(seatData, false)
    let pengData = {
        userid: seatData.userId,
        seatIndex: seatData.seatIndex,
        pai: pai,
        target: game.turn,
        holds: seatData.holds.slice(),
        zhuchiNum: seatData.zhuChi[game.turn]
    }
    userMgr.broacastInRoom('peng_notify_push', pengData, seatData.userId, true);
    recordGameAction(game, seatData.seatIndex, ACTION_PENG, pengData);
    var targetSeat = game.gameSeats[game.turn];
    targetSeat.folds.pop();
    game.haveReddot = false;
    //碰的玩家打牌
    moveToNextUser(game, seatData.seatIndex, true);

    //广播通知玩家出牌方
    seatData.canChuPai = true;
    userMgr.broacastInRoom('game_chupai_push', {
        seatIndex: seatData.seatIndex,
        canChuPai: seatData.canChuPai,
    }, seatData.userId, true);

    checkCanAnGang(game, seatData);
    checkCanWanGang(game, seatData);
    sendOperations(game, seatData, pai);
};

function statisticsCPG(sd, target, game) {
    // var selfIndex = sd.seatIndex;
    if (!sd.zhuChi[target]) {
        sd.zhuChi[target] = 1;
    } else {
        sd.zhuChi[target]++;
        if (sd.zhuChi[target] >= 3) {
            sd.zhuChiIndex = target
            //    userMgr.broacastInRoom("san_dao_pai_push",{seatIndex:sd.seatIndex},sd.userId,true)
        }
        // else if(sd.zhuChi[target] == 4){
        //     userMgr.broacastInRoom("si_dao_pai_push",{seatIndex:sd.seatIndex},sd.userId,true)
        // }
    }
    // var tSeat = game.gameSeats[target];
    // if (!tSeat.beiChi[selfIndex]) {
    //     tSeat.beiChi[selfIndex] = 1;
    // } else {
    //     tSeat.beiChi[selfIndex]++;
    //     if (tSeat.beiChi[selfIndex] == 3) {
    //         if (tSeat.chengbao == -1) {
    //             tSeat.chengbao = selfIndex;
    //             game.chengbaoIndex = selfIndex;
    //             tSeat.isbcb = true;
    //         }

    //     }
    // }
}
exports.isPlaying = function (userId) {
    var seatData = gameSeatsOfUsers[userId];
    if (seatData == null) {
        return false;
    }

    var game = seatData.game;

    if (game.state == "") {
        return false;
    }
    return true;
}

function checkCanQiangGang(game, turnSeat, seatData, pai) {
    var hasActions = false;
    for (var i = 0; i < game.gameSeats.length; ++i) {
        //杠牌者不检查
        if (seatData.seatIndex == i) {
            continue;
        }
        var ddd = game.gameSeats[i];
        //已经和牌的不再检查
        if (ddd.hued) {
            continue;
        }

        checkCanHu(game, ddd, pai);
        if (ddd.canHu) {
            sendOperations(game, ddd, pai);
            hasActions = true;
        }
    }
    if (hasActions) {
        game.qiangGangContext = {
            turnSeat: turnSeat,
            seatData: seatData,
            pai: pai,
            isValid: true,
        }
    } else {
        game.qiangGangContext = null;
    }
    return game.qiangGangContext != null;
}

function doGang(game, turnSeat, seatData, gangtype, numOfCnt, pai) {
    var seatIndex = seatData.seatIndex;
    var fangGangIndex = turnSeat.seatIndex; //出杠牌的玩家

    var pengTarget = null;
    if (gangtype == "wangang") {
        for (var i = 0; i < seatData.pengs.length; i++) {
            if (seatData.pengs[i].pai == pai) {
                seatData.pengs.splice(i, 1);
                pengTarget = seatData.pengTargets[i];
                seatData.pengTargets.splice(i, 1);
            }
        }
    }
    //进行碰牌处理
    //扣掉手上的牌
    //从此人牌中扣除
    for (var i = 0; i < numOfCnt; ++i) {
        var index = seatData.holds.indexOf(pai);
        if (index == -1) {
            console.log(seatData.holds);
            console.log("can't find mj.");
            return;
        }
        seatData.holds.splice(index, 1);
        seatData.countMap[pai]--;
    }

    //记录下玩家的杠牌
    var target = -1
    if (gangtype == "angang") {
        var agInfo = {
            pai: pai,
            target: -1,
        }
        seatData.angangs.push(agInfo);
        var ac = recordUserAction(game, seatData, "angang");
        // ac.score = 2;
    } else if (gangtype == "diangang") {
        target = fangGangIndex;
        var dgInfo = {
            pai: pai,
            target: fangGangIndex,
        }
        seatData.diangangs.push(dgInfo);
        if (game.conf.seatNum > 2) {
            statisticsCPG(seatData, fangGangIndex, game)
        }
        var ac = recordUserAction(game, seatData, "diangang", fangGangIndex);
        // ac.score = 1;
    } else if (gangtype == "wangang") {
        target = pengTarget;
        var wgInfo = {
            pai: pai,
            target: pengTarget,
        }
        seatData.wangangs.push(wgInfo);
        var ac = recordUserAction(game, seatData, "wangang", pengTarget);
        // ac.score = 1;
    }

    // checkCanTingPai(game, seatData);
    sortHolds(seatData)
    //通知其他玩家，有人杠了牌
    let gangData = {
        seatIndex: seatData.seatIndex,
        userid: seatData.userId,
        pai: pai,
        gangtype: gangtype,
        target: target,
        holds: seatData.holds.slice(),
        zhuchiNum: seatData.zhuChi[target],
    }
    userMgr.broacastInRoom('gang_notify_push', gangData, seatData.userId, true);
    recordGameAction(game, seatData.seatIndex, ACTION_GANG, gangData);
    if (gangtype == "diangang") {
        var targetSeat = game.gameSeats[target];
        targetSeat.folds.pop();
        game.haveReddot = false;
    }

    if (game.qiangGangContext != null && game.qiangGangContext.isValid) return;
    console.log("dogang执行到这了")
    //变成自己的轮子
    moveToNextUser(game, seatIndex);
    //再次摸牌
    game.canZM = Math.round(Math.random() * 10);
    doUserMoPai(game);
    //只能放在这里。因为过手就会清除杠牌标记
    seatData.lastFangGangSeat = fangGangIndex;
}

exports.gang = function (userId, pai) {
    var seatData = gameSeatsOfUsers[userId];
    if (seatData == null) {
        console.log("can't find user game data.");
        return;
    }

    var seatIndex = seatData.seatIndex;
    var game = seatData.game;
    game.isBuhua = false;
    //如果没有杠的机会，则不能再杠
    if (seatData.canGang == false) {
        console.log("seatData.gang == false");
        return;
    }

    //和的了，就不要再来了
    if (seatData.hued) {
        console.log('you have already hued. no kidding plz.');
        return;
    }

    if (seatData.gangPai.indexOf(pai) == -1) {
        console.log("the given pai can't be ganged.");
        return;
    }

    //如果有人可以胡牌，则需要等待
    var i = game.turn;
    while (true) {
        var i = (i + 1) % game.conf.seatNum;
        if (i == game.turn) {
            break;
        } else {
            var ddd = game.gameSeats[i];
            if (ddd.canHu && i != seatData.seatIndex) {
                return;
            }
        }
    }

    var numOfCnt = seatData.countMap[pai];

    var gangtype = ""
    //弯杠 去掉碰牌
    if (numOfCnt == 1) {
        gangtype = "wangang"
    } else if (numOfCnt == 3) {
        gangtype = "diangang"
    } else if (numOfCnt == 4) {
        gangtype = "angang";
    } else {
        console.log("invalid pai count.");
        return;
    }

    game.chuPai = -1;
    clearAllOptions(game);
    seatData.canChuPai = false;
    userMgr.broacastInRoom('hangang_notify_push', {
        seatIndex: seatIndex,
        canChuPai: seatData.canChuPai,
    }, seatData.userId, true);


    var turnSeat = game.gameSeats[game.turn];
    if (numOfCnt == 1) {
        checkCanQiangGang(game, turnSeat, seatData, pai);
    }
    //如果是弯杠，则需要检查是否可以抢杠
    doGang(game, turnSeat, seatData, gangtype, numOfCnt, pai);
};

exports.hu = function (userId) {
    console.log("接受到胡牌的消息")
    var seatData = gameSeatsOfUsers[userId];
    if (seatData == null) {
        console.log("can't find user game data.");
        return;
    }

    var seatIndex = seatData.seatIndex;

    var game = seatData.game;
    console.log("玩家胡  + " + seatIndex + "   " + game.turn)
    //如果他不能和牌，那和个啥啊
    if (seatData.canHu == false) {
        console.log("invalid request.");
        return;
    }

    //和的了，就不要再来了
    if (seatData.hued) {
        console.log('you have already hued. no kidding plz.');
        return;
    }
    if (game.yipaosanxiang) {
        return;
    }
    if (game.turn != seatIndex) {
        for (var i = 0; i < game.gameSeats.length; ++i) {
            var tempIndex = (game.turn + i + 1) % game.conf.seatNum;
            if (tempIndex != seatIndex) {
                console.log("胡的玩家前面有玩家  " + tempIndex)
                var tempdata = game.gameSeats[tempIndex];
                if (tempdata.canHu) {
                    console.log("前面有玩家能胡 === " + tempIndex)
                    return;
                }
            } else if (tempIndex == seatIndex) {
                break;
            }
        }
    }


    //标记为和牌
    seatData.hued = true;
    var hupai = game.chuPai;
    var isZimo = false;

    var turnSeat = game.gameSeats[game.turn];
    seatData.isGangHu = turnSeat.lastFangGangSeat >= 0;
    var notify = -1;
    var qiangGangContext = game.qiangGangContext;
    if (qiangGangContext != null) {
        var gangSeat = qiangGangContext.seatData;
        hupai = qiangGangContext.pai;
        notify = hupai;
        var ac = recordUserAction(game, seatData, "qiangganghu", gangSeat.seatIndex);
        ac.iszimo = false;
        // recordGameAction(game, seatIndex, ACTION_HU, hupai);
        seatData.isQiangGangHu = true;
        qiangGangContext.isValid = false;
        var idx = gangSeat.holds.indexOf(hupai);
        if (idx != -1) {
            gangSeat.holds.splice(idx, 1);
            gangSeat.countMap[hupai]--;
            userMgr.sendMsg(gangSeat.userId, 'game_holds_push', gangSeat.holds);
        }
        //将牌添加到玩家的手牌列表，供前端显示
        seatData.holds.push(hupai);
        if (seatData.countMap[hupai]) {
            seatData.countMap[hupai]++;
        } else {
            seatData.countMap[hupai] = 1;
        }
        recordUserAction(game, gangSeat, "beiqianggang", seatIndex);
    } else if (game.chuPai == -1) { //未出牌
        hupai = seatData.holds[seatData.holds.length - 1];
        notify = -1;
        console.log("胡了》》》", game.huashanghua)
        if (game.huashanghua) {
            var ac = recordUserAction(game, seatData, "huashanghua");
            ac.iszimo = true;
        } else if (seatData.isGangHu) {
            var ac = recordUserAction(game, seatData, "ganghua");
            ac.iszimo = true;
        } else {
            var ac = recordUserAction(game, seatData, "zimo"); //自摸只在这里产生
            ac.iszimo = true;
        }

        isZimo = true;
        // recordGameAction(game, seatIndex, ACTION_ZIMO, hupai);
    } else {
        notify = game.chuPai;
        //将牌添加到玩家的手牌列表，供前端显示
        seatData.holds.push(game.chuPai);
        if (seatData.countMap[game.chuPai]) {
            seatData.countMap[game.chuPai]++;
        } else {
            seatData.countMap[game.chuPai] = 1;
        }
        console.log(seatData.holds);
        var at = "hu";

        var ac = recordUserAction(game, seatData, at, game.turn);
        ac.iszimo = false;

    }
    //保存番数
    if (seatData.shisanyaoPai.length == 0) {
        var ti = seatData.tingMap[hupai];
        console.log('ti.fan is ' + ti.fan);
        seatData.fan = ti.fan; //@@@
        seatData.pattern = ti.pattern;

    } else {
        console.log("玩家胡 十三幺")
        seatData.fan = 1;
        seatData.pattern = "shisanyao";
    }
    seatData.iszimo = isZimo;

    clearAllOptions(game, seatData);
    //清空所有非胡牌操作
    for (var i = 0; i < game.gameSeats.length; ++i) {
        var ddd = game.gameSeats[i];
        sendOperations(game, ddd, hupai);
    }
    //代码移到截胡之后，防止逻辑混乱
    {
        if (game.qiangGangContext == null && game.chuPai != -1) { //修正不是点炮的时候，也显示点炮
            //记录玩家放炮信息
            var fs = game.gameSeats[game.turn];
            recordUserAction(game, fs, "fangpao", seatIndex);
        }
        // //通知前端，有人和牌了
        let huData = {
            seatindex: seatIndex,
            iszimo: isZimo,
            hupai: notify
        }
        userMgr.broacastInRoom('hu_push', huData, seatData.userId, true);
        recordGameAction(game, seatIndex, ACTION_HU, huData);
        if (game.lastHuPaiSeat == -1) {
            game.lastHuPaiSeat = seatIndex;
        }
    }
    doGameOver(game, seatData.userId);
};

exports.guo = function (userId, data) {
    var seatData = gameSeatsOfUsers[userId];
    if (seatData == null) {
        return;
    }
    var game = seatData.game;
    console.log("过过过&&&&&。。。")
    game.huashanghua = false;
    if (!data) return;
    var seatIndex = seatData.seatIndex;
    //如果玩家没有对应的操作，则也认为是非法消息
    if ((seatData.canGang || seatData.canPeng || seatData.canHu || seatData.canChi) == false) {
        return;
    }
    // userMgr.sendMsg(seatData.userId, "guo_result");
    //如果是玩家自己的轮子，不是接牌，则不需要额外操作
    var doNothing = game.chuPai == -1 && game.turn == seatIndex;
    if (seatData.canPeng) {
        seatData.guopeng.push(game.chuPai);
    }

    //这里还要处理过胡的情况
    if (seatData.canHu && data) {
        if (data.guo) {
            seatData.guoHuShow = true;
        }
    }
    if (seatData.canHu && game.conf.seatNum > 2) {
        seatData.guoHu = true;
    }
    clearAllOptions(game, seatData);
    game.tgTimer = game.conf.tg;
    if (doNothing) {
        return;
    }

    //如果还有人可以操作，则等待
    for (var i = 0; i < game.gameSeats.length; ++i) {
        var ddd = game.gameSeats[i];
        if (hasOperations(ddd)) {
            return;
        }
    }
    //如果是已打出的牌，则需要通知。
    if (game.chuPai >= 0) {
        game.chuPai = -1;
    }


    var qiangGangContext = game.qiangGangContext;
    //清除所有的操作
    clearAllOptions(game);
    if (qiangGangContext != null && qiangGangContext.isValid) {
        moveToNextUser(game, qiangGangContext.seatData.seatIndex);
        game.canZM = Math.round(Math.random() * 10);
        doUserMoPai(game);
        qiangGangContext.seatData.lastFangGangSeat = qiangGangContext.turnSeat.seatIndex;
        qiangGangContext = null;
    } else {
        for (var i = 0; i < game.gameSeats.length; i++) {
            if (game.gameSeats[i].hued) {
                doGameOver(game, userId);
                return;
            }
        }
        //下家摸牌
        moveToNextUser(game);
        game.canZM = Math.round(Math.random() * 10);
        sortHolds(game.gameSeats[game.turn], true)
        doUserMoPai(game);
    }
};

exports.hasBegan = function (roomId) {
    var game = exports.games[roomId];
    if (game != null) {
        return true;
    }
    var roomInfo = roomMgr.getRoom(roomId);
    if (roomInfo != null) {
        return roomInfo.numOfGames > 0;
    }
    return false;
};


var dissolvingList = [];

exports.doDissolve = function (roomId) {
    var roomInfo = roomMgr.getRoom(roomId);
    if (roomInfo == null) {
        return null;
    }
    var d = roomInfo.seats[0].userId;
    if (roomInfo.seats[0].userId == 0) {
        for (let i = 0; i < roomInfo.seats.length; i++) {
            if (roomInfo.seats[i].userId > 0) {
                d = roomInfo.seats[i].userId;
            }
        }
    }
    var game = exports.games[roomId];
    doGameOver(game, d, true)
};

exports.dissolveRequest = function (roomId, userId) {
    var roomInfo = roomMgr.getRoom(roomId);
    if (roomInfo == null) {
        return null;
    }

    if (roomInfo.dr != null) {
        return null;
    }

    var seatIndex = roomMgr.getUserSeat(userId);
    if (seatIndex == null) {
        return null;
    }

    roomInfo.dr = {
        endTime: Date.now() + 60000 * 3,
        states: [],
    };

    var rs = roomInfo.seats;
    for (var i = 0; i < rs.length; i++) {
        if (rs[i].userId > 0) {
            roomInfo.dr.states[i] = 0;
        }
    }

    roomInfo.dr.states[seatIndex] = 1;

    dissolvingList.push(roomId);
    return roomInfo;
};
///同意 或者拒绝
exports.dissolveAgree = function (roomId, userId, agree) {
    var roomInfo = roomMgr.getRoom(roomId);
    if (roomInfo == null) {
        return null;
    }

    if (roomInfo.dr == null) {
        return null;
    }

    var seatIndex = roomMgr.getUserSeat(userId);
    if (seatIndex == null) {
        return null;
    }

    if (agree) {
        roomInfo.dr.states[seatIndex] = 2;
    } else {
        roomInfo.dr = null;
        var idx = dissolvingList.indexOf(roomId);
        if (idx != -1) {
            dissolvingList.splice(idx, 1);
        }
    }
    return roomInfo;
};


function update() {
    for (var i = dissolvingList.length - 1; i >= 0; --i) {
        var roomId = dissolvingList[i];

        var roomInfo = roomMgr.getRoom(roomId);
        if (roomInfo != null && roomInfo.dr != null) {
            if (Date.now() > roomInfo.dr.endTime) {
                exports.doDissolve(roomId);
                dissolvingList.splice(i, 1);
            }
        } else {
            dissolvingList.splice(i, 1);
        }
    }
}

setInterval(update, 1000);
exports.chi = function (userId, a1, a2, a3) {
    console.log('a1 a2 a3 is ' + a1 + ' ' + a2 + ' ' + a3);
    var seatData = gameSeatsOfUsers[userId];
    if (seatData == null) {
        console.log("can't find user game data.");
        return;
    }
    var game = seatData.game;
    game.isBuhua = false;
    //如果是他出的牌，则忽略
    if (game.turn == seatData.seatIndex) {
        console.log("it's your turn.");
        return;
    }
    //如果没有吃的机会，则不能再吃
    if (seatData.canChi == false) {
        console.log("seatData.chi == false");
        return;
    }
    //胡过了，就不要再来了
    if (seatData.hued) {
        console.log('you have already hued. no kidding plz.');
        return;
    }
    // 如果有人胡牌，则需要等待 
    var i = game.turn;
    while (true) {
        var i = (i + 1) % game.conf.seatNum;
        if (i == game.turn) {
            break;
        } else {
            var ddd = game.gameSeats[i];
            if (ddd.canHu && i != seatData.seatIndex) {
                return;
            }
        }
    }
    // 如果有人杠牌，则需要等待 
    var j = game.turn;
    while (true) {
        var j = (j + 1) % game.conf.seatNum;
        if (j == game.turn) {
            break;
        } else {
            var ddd = game.gameSeats[j];
            if (ddd.canGang && j != seatData.seatIndex) {
                console.log("canGang:" + ddd);
                return;
            }
        }
    }
    //如果有人碰牌，则需要等待
    var j = game.turn;
    while (true) {
        var j = (j + 1) % game.conf.seatNum;
        if (j == game.turn) {
            break;
        } else {
            var ddd = game.gameSeats[j];
            if (ddd.canPeng && j != seatData.seatIndex) return;
        }
    }

    clearAllOptions(game);

    var pai = game.chuPai;
    if (pai == a1 || pai == a2 || pai == a3) {
        console.log("pai:" + pai);
    }
    if (a1 != pai) {
        if (a2 == pai) {
            a2 = a1;
        } else if (a3 == pai) {
            a3 = a2;
            a2 = a1
        }
        a1 = pai
    }
    var chiArr = [];
    chiArr.push(a1);
    chiArr.push(a2);
    chiArr.push(a3);
    var len = chiArr.length;
    for (var i = 0; i < len; ++i) {
        if (chiArr[i] == pai) continue;
        var index = seatData.holds.indexOf(chiArr[i]);
        if (index == -1) {
            console.log("吃 can't find mj.");
            return;
        }
        seatData.holds.splice(index, 1);
        seatData.countMap[chiArr[i]]--;
    }
    var data = {
        p1: a1,
        p2: a2,
        p3: a3
    };
    game.chuPai = -1;
    seatData.chis.push(data);
    if (game.conf.seatNum > 2) {
        statisticsCPG(seatData, game.turn, game)
    }


    //广播通知其它玩家
    sortHolds(seatData, false)
    var chiData = {
        userid: seatData.userId,
        pai: pai,
        chiPai: data,
        target: game.turn,
        holds: seatData.holds.slice(),
        seatIndex: seatData.seatIndex,
        zhuchiNum: seatData.zhuChi[game.turn],
    }
    userMgr.broacastInRoom('chi_notify_push', chiData, seatData.userId, true);
    recordGameAction(game, seatData.seatIndex, ACTION_CHI, chiData);
    var targetSeat = game.gameSeats[game.turn];
    targetSeat.folds.pop();
    game.haveReddot = false;
    //chi的玩家打牌
    moveToNextUser(game, seatData.seatIndex);

    //广播通知玩家出牌方
    seatData.canChuPai = true;
    userMgr.broacastInRoom('game_chupai_push', {
        seatIndex: seatData.seatIndex,
        canChuPai: seatData.canChuPai,
    }, seatData.userId, true);
    checkCanAnGang(game, seatData);
    checkCanWanGang(game, seatData);
    sendOperations(game, seatData, pai);
}

//检查是否可以吃
function checkCanChi(game, seatData, targetPai) {
    if(seatData.isTg)return;
    if (game.conf.otherData.buchi) return;
    if (targetPai > 26 || targetPai < 0) return;
    var holds = seatData.holds;
    if (checkPaiInHolds(targetPai - 1, holds) && checkPaiInHolds(targetPai - 2, holds) && NumInNum(targetPai, targetPai - 1) && NumInNum(targetPai, targetPai - 2)) {
        seatData.canChi = true;
        return 1;
    }
    if (checkPaiInHolds(targetPai - 1, holds) && checkPaiInHolds(targetPai + 1, holds) && NumInNum(targetPai, targetPai - 1) && NumInNum(targetPai, targetPai + 1)) {
        seatData.canChi = true;
        return 2;
    }
    if (checkPaiInHolds(targetPai + 1, holds) && checkPaiInHolds(targetPai + 2, holds) && NumInNum(targetPai, targetPai + 1) && NumInNum(targetPai, targetPai + 2)) {
        seatData.canChi = true;
        return 3;
    }
    return 0;
}

function checkPaiInHolds(pai, holds) {
    for (var i = 0; i < holds.length; i++) {
        if (pai == holds[i]) return true;
    }
    return false;
}

function NumInNum(a, b) {
    if (a > 26 || b > 26) return false;
    if (a >= 0 && a <= 8 && b >= 0 && b <= 8) {
        return true;
    }
    if (a >= 9 && a <= 17 && b >= 9 && b <= 17) {
        return true;
    }
    if (a >= 18 && a <= 26 && b >= 18 && b <= 26) {
        return true;
    }
    return false;
}

function huanpai66(userId) {
    var seatData = gameSeatsOfUsers[userId];
    if (!seatData) return;
    var game = seatData.game;
    if (!game) return;
    if (!game.kaida) {
        console.log("还没出第一张牌")
        return
    }
    var len = game.actionList.length;
    // if (len >= 1 && game.actionList[len - 1].type != ACTION_MOPAI) {
    //     return;

    // }
    if (seatData.seatIndex != game.turn) {
        return;
    }
    var data = [];
    for (var i = 0; i < 34; i++) {
        data.push(0);
    }
    var index = game.currentIndex;
    for (var i = index; i < game.mahjongs.length; i++) {
        var pai = game.mahjongs[i];
        data[pai]++;
    }
    userMgr.sendMsg(seatData.userId, 'game_huanpai66_push', data);
}
exports.huanpai66 = huanpai66;

function huanpai88(userId, data) {
    console.log('huanpai88');
    var seatData = gameSeatsOfUsers[userId];
    if (!seatData) return;
    var game = seatData.game;
    if (!game) return;
    var len = game.actionList.length;
    // if (len >= 1 && game.actionList[len - 1].type != ACTION_MOPAI) {
    //     return;
    // }
    data = parseInt(data);
    if (seatData.seatIndex != game.turn) {
        console.log('换牌还没轮到你2');
        return;
    }
    var heapIndex = game.mahjongs.indexOf(data, game.currentIndex);
    if (heapIndex == -1) {
        var arr1 = game.mahjongs.slice(game.currentIndex, game.mahjongs.length);
        return;
    }
    var index = seatData.holds.length - 1;
    var pai = seatData.holds[index];
    seatData.holds.splice(index, 1);
    seatData.countMap[pai]--;
    var temp = game.mahjongs[heapIndex];
    game.mahjongs[heapIndex] = pai;
    pai = temp;
    seatData.holds.push(pai);
    var c = seatData.countMap[pai];
    if (c == null) {
        c = 0;
    }
    seatData.countMap[pai] = c + 1;
    userMgr.sendMsg(seatData.userId, 'game_huanpai88_push', pai);

    checkCanAnGang(game, seatData);
    checkCanWanGang(game, seatData);
    checkCanHu(game, seatData, pai);
    sendOperations(game, seatData, pai);
    console.log("换牌之前")
    var index = game.actionList.length - 1;
    game.actionList.splice(index, 1);
    let mData = {
        pai: pai,
        holds: seatData.holds.slice(),
        numOfMJ: game.mahjongs.length - game.currentIndex,
        seatIndex: game.turn,
    }
    recordGameAction(game, game.turn, ACTION_MOPAI, mData);
}
exports.huanpai88 = huanpai88;

function isQiXiaoDui(sd) {
    if (sd.holds.length == 13) {
        var singlePai = -1;
        var pairCount = 0;
        for (var k in sd.countMap) {
            var c = sd.countMap[k];
            if (c == 2 || c == 3) {
                pairCount++;
            } else if (c == 4) {
                pairCount += 2;
            }
            if (c == 1 || c == 3) {
                //如果已经有单牌了，表示不止一张单牌
                if (singlePai >= 0) {
                    break;
                }
                singlePai = k;
            }
        }
        if (pairCount == 6) {
            return singlePai;
        } else {
            return -1;
        }
    }
    return -1;
};
//13幺
function isShiSanYao(sd) {
    if (sd.holds.length == 13) {
        let lackArr = [];
        let yaohome = [0, 8, 9, 17, 18, 26, 27, 28, 29, 30, 31, 32, 33];
        let isInclude = true;
        sd.holds.forEach(function (sh) {
            if (yaohome.includes(sh)) { } else {
                isInclude = false;
            }
        })
        if (!isInclude) return -1;
        yaohome.forEach(function (p) {
            let exit = sd.holds.includes(p)
            if (exit) {

            } else {
                lackArr.push(p)
            }
        })
        if (lackArr.length == 0) {
            return yaohome;
        } else if (lackArr.length == 1) {
            return lackArr;
        } else {
            return -1;
        }
    } else {
        return -1;
    }

};

function isPengPengHu(sd) {
    //检查是否是对对胡  由于四川麻将没有吃，所以只需要检查手上的牌
    //对对胡叫牌有两种情况
    //1、N坎 + 1张单牌
    //2、N-1坎 + 两对牌
    if (sd.chis.length > 0) return false;
    var singleCount = 0;
    var colCount = 0;
    var pairCount = 0;
    var arr = [];
    for (var k in sd.countMap) {
        var c = sd.countMap[k];
        if (c == 1) {
            singleCount++;
            arr.push(k);
        } else if (c == 2) {
            pairCount++;
            arr.push(k);
        } else if (c == 3) {
            colCount++;
        } else if (c == 4) {
            //手上有4个一样的牌 
            pairCount += 2;
        }
    }
    if (singleCount > 0) return false;
    if (pairCount > 1) return false;
    sd.pattern = "duidui";
    return true;
}

function isqys(sd) {
    let allPais = [];
    sd.holds.forEach(element => {
        allPais.push(element)
    });
    if (sd.pengs.length > 0) {
        sd.pengs.forEach(function (peng) {
            allPais.push(peng.pai)
        })
    }
    if (sd.chis.length > 0) {
        sd.chis.forEach(function (el) {
            for (var k in el) {
                allPais.push(el[k])
            }
        })
    }
    if (sd.angangs.length > 0) {
        sd.angangs.forEach(function (el) {
            allPais.push(el.pai)
        })
    }
    if (sd.wangangs.length > 0) {
        sd.wangangs.forEach(function (el) {
            allPais.push(el.pai)
        })
    }
    if (sd.diangangs.length > 0) {
        sd.diangangs.forEach(function (el) {
            allPais.push(el.pai)
        })
    }
    let pai = allPais[0];
    if (pai > 26) return false;
    let pindex = -1;
    if (pai < 9) {
        pindex = allPais.findIndex(function (p) {
            return p >= 9
        })
    } else if (pai < 18) {
        pindex = allPais.findIndex(function (p) {
            return p < 9 || p >= 18
        })
    } else if (pai < 27) {
        pindex = allPais.findIndex(function (p) {
            return p < 18
        })
    }
    if (pindex == -1) {
        sd.pattern = "qys"
    }
    return pindex == -1;
}