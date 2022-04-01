const Buffer = require("buffer").Buffer;
cc.Class({
    extends: cc.Component,
    properties: {
        _quanID: "",
        _creator: "",
        head: cc.Sprite,
        zhuoBox: cc.Node,
        memberBox: cc.Node,
        infoBox: cc.Node,
        redDot: cc.Node,
    },
    onLoad() {
        cc.vv.Quan = this;
        var imgLoader = this.head.node.getComponent("ImageLoader");
        imgLoader.setUserID(cc.vv.userMgr.userId);
    },
    onEnable() {
        this.checkMessage()
        console.log("圈子showhsow")
    },
    onDisable() {
        this.redDot.active = false;
        // console.log("圈子hide")
    },
    exitQuan() {
        this.node.active = false
    },
    showmember() {
        this.memberBox.active = true;
    },
    showInfo() {
        this.infoBox.active = true
        this.redDot.active = false;
    },
    showRule(){
        if(cc.vv.userMgr.userId != cc.vv.Quan._creator){
            cc.vv.alert.tip({
                msg:"只有圈主能编辑设置圈子玩法"
            })
            return
        }
        this.node.getChildByName("ruleBox").active = true
    },
    showReddot() {
        this.redDot.active = true
    },
    refreshFunc() {
        let self = this;
        if(cc.vv.userMgr.userId == this._creator){
            var onRefresh = function(ret){
                console.log("刷新圈子返回的",ret)
                self.zhuoBox.getComponent("QuanZhuo").updateZhuos([]);
                self.zhuoBox.getComponent("QuanZhuo").getZhuos()
            }
            cc.vv.wc.show()
            cc.vv.http.sendRequest("/refresh_room", {quanId:this._quanID}, onRefresh)
        }
        else{
            self.zhuoBox.getComponent("QuanZhuo").updateZhuos([]);
            self.zhuoBox.getComponent("QuanZhuo").getZhuos()
        }
       
        this.checkMessage()
    },
    checkMessage: function () {
        var self = this;
        if (cc.vv.userMgr.userId != cc.vv.Quan._creator) {
            return
        }
        var data = {
            userId: cc.vv.userMgr.userId,
            quanId: cc.vv.Quan._quanID,
        }
        var onGet = function (ret) {
            if (ret.errcode == 0) {
                var data = ret.mData;
                if (data.length > 0) {
                    self.showReddot()
                } else {
                    self.redDot.active = false
                }
            }
        }
        cc.vv.http.sendRequest("/get_re_message", data, onGet)
    },
    init(data) {
        this._quanID = data.id;
        this._creator = data.creator;
        this.node.getChildByName("quanID").getComponent(cc.Label).string = "圈ID:" + this._quanID
        this.node.getChildByName("actNum").getComponent(cc.Label).string = "活力值:" + cc.vv.userMgr.coins
    },
    getQuanHistory: function () {
       cc.vv.wc.show()
        var self = this;
        cc.vv.audioMgr.playClicked();
        var quanId = this._quanID
        let isQuanzhu = cc.vv.userMgr.userId == this._creator
        cc.vv.userMgr.getHistoryList(quanId,isQuanzhu, function (data) {
            cc.vv.wc.hide()
            if (data  || data.length > 0) {
                data.sort(function (a, b) {
                    return b.time - a.time;
                });
                cc.vv.history._historyData = data;
                for (var i = 0; i < data.length; ++i) {
                    for (var j = 0; j < data[i].seats.length; ++j) {
                        var s = data[i].seats[j];
                        if (s.userid > 0) {
                            s.name = Buffer.from(s.name, 'base64').toString();
                        }
                    }
                }
                cc.vv.history.initRoomHistoryList(data);
                let storeData = {
                    quanId:quanId,
                    isQuanzhu:isQuanzhu,
                }
                cc.sys.localStorage.setItem("quanHistory", JSON.stringify(storeData));
            }
            else{
                cc.vv.history.shrinkContent(0);
                cc.vv.history._emptyTip.active = true;
                cc.vv.history._history.active = true;
            }
           
        });
    },

})