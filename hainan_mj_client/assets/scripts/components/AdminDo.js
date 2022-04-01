cc.Class({
    extends: cc.Component,

    properties: {
        userId: cc.EditBox,
        gemsNum: cc.EditBox,
        doX: true,
    },

    // use this for initialization
    onLoad: function () {
        cc.vv.AdminDo = this;
    },
    doConfirm1:function(){
        cc.vv.audioMgr.playClicked();
        var self = this;
        var userId = this.userId.string;
        var doNum = this.node.doNum;
        var texta = "确定要给玩家 【";
        if (doNum == 1 || doNum == 2) {
           var textb = doNum == 1?"】 添加房卡":"】 减少房卡";
        }
        if (doNum == 3 || doNum == 4 ) {
            var textb = doNum == 3?"】  开通游戏权限":"】 禁止游戏权限";
        }
        if(doNum == 5 || doNum == 6){
            var textb = doNum == 5?"】 开通代理权限":"】 取消代理权限";
        }
        var infoConfirm = function(ret){
            if(ret.errcode == 0){
                cc.vv.alert.show("提示", texta+ret.userName+textb,function(){
                    self.doConfirm()
                });
            }
            else{
                cc.vv.alert.show("提示","获取玩家数据出错，请确认！")
            }
        }
        var data = {
            account: cc.vv.userMgr.account,
            sign: cc.vv.userMgr.sign,
            userId:userId,
        }
        cc.vv.http.sendRequest("/get_user_info",data,infoConfirm)
    },
    doConfirm: function () {
        cc.vv.audioMgr.playClicked();
        var doNum = this.node.doNum;
        if (doNum == 1 || doNum == 2) {
            this.changeUserGems()
        }
        if (doNum == 3 || doNum == 4 || doNum == 5 || doNum == 6) {
            this.changeUserRights()
        }

    },
    changeUserGems: function () {
        if (!this.doX) return;
        this.doX = false;
        var self = this;
        var cUid = this.userId.string;
        var gemsNum = this.gemsNum.string;
        if (cUid.length == 0) {
            cc.vv.alert.show("提示", "请输入ID号");
            return;
        }
        if (gemsNum.length == 0 || Number(gemsNum) <= 0) {
            cc.vv.alert.show("提示", "请输入房卡数");
            return;
        }
        if (Number(cUid) % 1 != 0 || Number(gemsNum) % 1 != 0) {
            cc.vv.alert.show("提示", "输入的必须是整数");
            return;
        }
        if (cUid.length < 5) {
            cc.vv.alert.show("提示", "玩家不存在!")
            return;
        }
        if (cUid == cc.vv.userMgr.userId) {
            cc.vv.alert.show("提示", "自己不能玩自己！")
            return;
        }
        var getResult = function (ret) {
            self.doX = true;
            if (ret.errcode == 0) {
                cc.vv.alert.show("提示", ret.errmsg);
                cc.vv.userMgr.gems = ret.dGems;
                cc.vv.Hall.lblGems.getComponent(cc.Label).string = ret.dGems;
                self.doCancel()


            } else {
                if (ret.errcode == 5) {
                    cc.vv.alert.show("提示", ret.errmsg);
                    cc.vv.userMgr.kong = 0;
                    cc.vv.userMgr.lv = 1;
                    cc.find("Canvas/adminButton/agent").active = false;
                    cc.find("Canvas/adminButton/addGems").active = false;
                    self.node.active = false;
                } else {
                    cc.vv.alert.show("提示", ret.errmsg);
                }

            }
        }
        if (this.node.doNum == 2) {
            gemsNum = 0 - Number(gemsNum);
        } else {
            gemsNum = Number(gemsNum);
        }
        var data = {
            cUid: cUid, //获得者
            dUid: cc.vv.userMgr.userId, //赠送者
            gems: gemsNum,
        }
        // cc.vv.net.send("change_user_gems", data)
        cc.vv.http.sendRequest("/change_user_gems",data,getResult)
    },
    changeUserRights: function () {
        var self = this;
        var cUid = this.userId.string;
        if (cUid.length == 0) {
            cc.vv.alert.show("提示", "请输入ID号");
            return;
        }
        if (Number(cUid) % 1 != 0) {
            cc.vv.alert.show("提示", "输入的必须是整数");
            return;
        }
        if (cUid.length < 5) {
            cc.vv.alert.show("提示", "玩家不存在!")
            return;
        }
        if (cUid == cc.vv.userMgr.userId) {
            cc.vv.alert.show("提示", "自己不能玩自己！")
            return;
        }
        var getResult = function (ret) {
            if (ret.errcode == 0) {
                cc.vv.alert.show("提示", ret.errmsg);
                self.doCancel()
            } else {
                cc.vv.alert.show("提示", ret.errmsg);
                self.doCancel()
            }
        }
        var data = {
            cUid: cUid,//被更改
            dUid: cc.vv.userMgr.userId,//管理者
            doNum: this.node.doNum,
        }
        // cc.vv.net.send("change_user_rights",data)
        cc.vv.http.sendRequest("/change_user_rights", data, getResult)
    },
    doCancel: function () {
        cc.vv.audioMgr.playClicked();
        this.userId.string = "";
        this.gemsNum.string = "";
        this.node.active = false;
    }

});