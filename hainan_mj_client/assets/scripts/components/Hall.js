const Buffer = require("buffer").Buffer;
cc.Class({
    extends: cc.Component,
    properties: {
        lblName: cc.Label,
        lblGems: cc.Label,
        lblID: cc.Label,
        lblNotice: cc.Label,
        joinGameWin: cc.Node,
        joinFriendCircle: cc.Node,
        createRoomWin: cc.Node,
        settingsWin: cc.Node,
        helpWin: cc.Node,
        xiaoxiWin: cc.Node,
        shop:cc.Node,
        
        btnJoinGame: cc.Node,
        sprHeadImg: cc.Sprite,
        shareUI: cc.Node,
        mzsmWin: cc.Node,
        actNode:cc.Node,
        certification:cc.Node,
        ver: cc.Label,
        halltime:5000,
    },
    initNetHandlers: function () {
        var self = this;
    },

    onShare: function () {
        this.shareUI.active = true;
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
        cc.vv.Hall = this;
        this.initLabels();
        var imgLoader = this.sprHeadImg.node.getComponent("ImageLoader");
        imgLoader.setUserID(cc.vv.userMgr.userId);
        cc.vv.utils.addClickEvent(this.sprHeadImg.node, this.node, "Hall", "onBtnClicked");
        this.addComponent("UserInfoShow");
        this.initButtonHandler("Canvas/top_btns/btn_shezhi");
        this.initButtonHandler("Canvas/top_btns/btn_chongqi");
        this.initButtonHandler("Canvas/top_btns/btn_shiming");
        this.initButtonHandler("Canvas/bottom_btns/btn_wanfa");
        this.initButtonHandler("Canvas/bottom_btns/btn_huodong");
        this.initButtonHandler("Canvas/bottom_btns/btn_kefu");
        this.initButtonHandler("Canvas/bottom_btns/shangcheng");
        // this.initButtonHandler('Canvas/btn_mianze');
        this.helpWin.addComponent("OnBack");
        this.actNode.addComponent("OnBack");
        this.certification.addComponent("OnBack");
        this.xiaoxiWin.addComponent("OnBack");
        this.mzsmWin.addComponent('OnBack');
        this.shop.addComponent('OnBack');

        if (!cc.vv.userMgr.notice) {
            cc.vv.userMgr.notice = {
                version: null,
                msg: "数据请求中...",
            }
        }

        if (!cc.vv.userMgr.xiaoxi) {
            cc.vv.userMgr.xiaoxi = {
                version: null,
                msg: "数据请求中...",
            };
        }

        this.lblNotice.string = cc.vv.userMgr.notice.msg;
        this.refreshInfo();
        this.refreshNotice();
        this.refreshXiaoXi();
        cc.vv.audioMgr.resumeAll()
        cc.vv.audioMgr.playBGM("bg/bgMain");
        cc.systemEvent.on(cc.SystemEvent.EventType.KEY_DOWN, this.onKeyDown, this);
    },
    start: function () {
        // this.showHistory();
        cc.director.preloadScene("mjgame");
    },
    initCer(){
        let cerNode = this.certification
        let nameInput = cerNode.getChildByName("real_name").getChildByName("name_input")
        let carInput = cerNode.getChildByName("car_num").getChildByName("car_input")
        let nameStr = cerNode.getChildByName("real_name").getChildByName("label").getComponent(cc.Label)
        let carStr = cerNode.getChildByName("car_num").getChildByName("label").getComponent(cc.Label)
        let statuStr = cerNode.getChildByName("real_status").getChildByName("label").getComponent(cc.Label);
        console.log("jjjj",cc.vv.userMgr.certification)
        if(cc.vv.userMgr.certification == 0 || cc.vv.userMgr.certification == 4){
            cerNode.getChildByName("confirm_btn").active = true
            statuStr.string = cc.vv.userMgr.certification == 4?"已拒绝":"未实名"
            nameInput.active = true;
            carInput.active = true;
            nameStr.string = "";
            carStr.string = "";
        }
        else{
            cerNode.getChildByName("confirm_btn").active = false
            statuStr.string = cc.vv.userMgr.certification == 1?"待审核":"已实名"
            nameInput.active = false;
            carInput.active = false;
            nameStr.string = cc.vv.userMgr.real_name;
            carStr.string = cc.vv.userMgr.id_card_img;
        }
    },
    certificationFunc(){
        let self = this;
       let cerNode = this.certification
       let nameStr = cerNode.getChildByName("real_name").getChildByName("name_input").getComponent(cc.EditBox).string
       let carStr = cerNode.getChildByName("car_num").getChildByName("car_input").getComponent(cc.EditBox).string
       let msg = ""
        if(!nameStr){
            msg = "请输入真实姓名"
        }
        else if(!carStr){
            msg = "请输入身份证号"
        }
        else if(carStr.length != 18){
            msg = "身份证格式不对"
        }
        if(msg){
            cc.vv.alert.tip({
                msg:msg,
            });
            return
        }
        let data = {
            nameStr:nameStr,
            carStr:carStr,
            userId:cc.vv.userMgr.userId,
            cerId:cc.vv.userMgr.certification,
        }
        cc.vv.wc.show()
        cc.vv.http.sendRequest("/request_cer",data,function(result){
            cc.vv.wc.hide()
            if(result.errcode == 0){
                cc.vv.userMgr.real_name = nameStr
                cc.vv.userMgr.id_card_img = carStr
                cc.vv.userMgr.certification = 1;
                self.initCer()
            }
            else{
               
            }
            cc.vv.alert.tip({
                msg:result.errmsg
            })
        })
    },
    onDestroy() {
        cc.systemEvent.off(cc.SystemEvent.EventType.KEY_DOWN, this.onKeyDown, this);
    },
    onKeyDown(event) {
        if (event.keyCode == cc.macro.KEY.back) {
            cc.vv.alert.show('提示', '确定要退出游戏吗？', function () {
                cc.game.end();
            }, true);
        }
    },

    refreshInfo: function () {
        var self = this;
        var onGet = function (ret) {
            if (ret.errcode !== 0) {
                console.log(ret.errmsg);
            } else {
                if (ret.gems != null) {
                    cc.vv.userMgr.gems = ret.gems;
                    cc.vv.userMgr.coins = ret.coins;
                    this.lblGems.string = cc.vv.userMgr.gems;
                    cc.vv.userMgr.commission = ret.commission;
                    cc.vv.userMgr.lv = ret.lv;
                    cc.vv.userMgr.kong = ret.kong;
                    if (cc.vv.userMgr.lv == 2) {
                        cc.find("Canvas/adminButton/addGems").active = true;
                    } else if (cc.vv.userMgr.lv == 3) {
                        cc.find("Canvas/adminButton/addGems").active = true;
                        cc.find("Canvas/adminButton/deleteGems").active = true;
                        // cc.find("Canvas/adminButton/admin").active = true;
                        // cc.find("Canvas/adminButton/forbidGame").active = true;
                        // cc.find("Canvas/adminButton/removeForbid").active = true;
                        cc.find("Canvas/adminButton/showAgent").active = true;
                        cc.find("Canvas/adminButton/hideAgent").active = true;
                    } else {
                        var ads = cc.find("Canvas/adminButton")
                        for (var i = 0; i < ads.childrenCount; i++) {
                            ads.children[i].active = false;
                        }
                    }

                }
            }
        };

        var data = {
            account: cc.vv.userMgr.account,
            sign: cc.vv.userMgr.sign,
        };
        cc.vv.http.sendRequest("/get_user_status", data, onGet.bind(this));
    },


    refreshNotice: function () {
        var self = this;
        var onGet = function (ret) {
            if (ret.errcode !== 0) {
                console.log(ret.errmsg);
            } else {
                cc.vv.userMgr.notice.version = ret.version;
                cc.vv.userMgr.notice.msg = ret.msg;
                this.lblNotice.string = ret.msg;
            }
        };

        var data = {
            account: cc.vv.userMgr.account,
            sign: cc.vv.userMgr.sign,
            type: "notice",
            version: cc.vv.userMgr.notice.version
        };
        cc.vv.http.sendRequest("/get_message", data, onGet.bind(this));
    },
    socketTest(){
        cc.vv.net.send('hall_click',{hello:"来自大厅的点击问候"})
    },
    refreshXiaoXi: function () {
        var onGet = function (ret) {
            if (ret.errcode !== 0) {} else {
                var info = this.xiaoxiWin.getChildByName("info").getComponent(cc.Label);
                info.string = ret.msg;
            }
        };

        var data = {
            account: cc.vv.userMgr.account,
            sign: cc.vv.userMgr.sign,
            type: "xiaoxi",
            version: cc.vv.userMgr.xiaoxi.version
        };

        cc.vv.http.sendRequest("/get_message", data, onGet.bind(this));
    },

    showHistory() {
        // if (cc.vv.userMgr.showTip == 0) {
        //     cc.sys.localStorage.removeItem("quanHistory");
        //     cc.sys.localStorage.removeItem("roomInfo");
        //     return;
        // }
        // cc.vv.userMgr.showTip = 0;
        // if (cc.sys.localStorage.getItem("roomInfo")) {
        //     var quanId = cc.sys.localStorage.getItem("quanHistory")
        //     if (!quanId) {
        //         quanId = -1;
        //     }
        //     cc.vv.userMgr.getHistoryList(quanId, function (data) {
        //         if (data == null) {
        //             cc.vv.history.shrinkContent(0);
        //             cc.vv.history._emptyTip.active = true;
        //             cc.vv.history._history.active = true;
        //             return;
        //         }
        //         data.sort(function (a, b) {
        //             return b.time - a.time;
        //         });
        //         cc.vv.history._historyData = data;
        //         for (var i = 0; i < data.length; ++i) {
        //             for (var j = 0; j < data[i].seats.length; ++j) {
        //                 var s = data[i].seats[j];
        //                 if (s.userid > 0) {
        //                     s.name = Buffer.from(s.name, 'base64').toString();
        //                 }
        //             }
        //         }
        //         if (cc.sys.localStorage.getItem("roomInfo")) {
        //             var idx = cc.sys.localStorage.getItem("roomInfo");
        //             cc.vv.history.getGameListOfRoom(Number(idx));
        //             cc.vv.history._history.active = true;
        //             cc.vv.history._emptyTip.active = false;
        //         } else {
        //             cc.vv.history.initRoomHistoryList(data);
        //         }

        //         cc.sys.localStorage.setItem("quanHistory", quanId);
        //     });
        // }
    },

    initButtonHandler: function (btnPath) {
        var btn = cc.find(btnPath);
        cc.vv.utils.addClickEvent(btn, this.node, "Hall", "onBtnClicked");
    },



    initLabels: function () {
        this.lblName.string = cc.vv.userMgr.userName;
        this.lblID.string = "ID:" + cc.vv.userMgr.userId;
    },

    onBtnClicked: function (event, customEventData) {
        console.log(event.target.name)
        cc.vv.audioMgr.playClicked();
        if(event.target.name == "btn_chongqi"){
             cc.sys.localStorage.removeItem("wx_account");
            cc.sys.localStorage.removeItem("wx_sign");
            cc.vv.net.close();
            cc.audioEngine.stopAll();
            if(cc.sys.isNative){
                cc.game.restart();
            }
            else{
                cc.director.loadScene("login");
            }
            
        }
        else if (event.target.name == "btn_shezhi") {
            this.settingsWin.active = true;
        } else if (event.target.name == "btn_wanfa") {
            this.helpWin.active = true;
        }
        else if (event.target.name == "btn_shiming") {
            this.initCer()
            this.certification.active = true;
        }
        else if (event.target.name == "btn_huodong") {
            this.actNode.active = true;
        } else if (event.target.name == "btn_kefu") {
            this.xiaoxiWin.active = true;
        }else if (event.target.name == "shangcheng") {
            this.shop.active = true;
        } else if (event.target.name == "head") {
            cc.vv.anysdkMgr.getMapInfo();
            cc.vv.userinfoShow.show(
                cc.vv.userMgr.userName,
                cc.vv.userMgr.userId,
                this.sprHeadImg,
                cc.vv.userMgr.sex,
                cc.vv.userMgr.ip,
                cc.vv.mapInfo
            );
        } else if (event.target.name == 'btn_mianze') {
            this.mzsmWin.active = true;
        } else if (event.target.name == "admin") {
            // return;
            var url = "http://jiuzhouht.17kuaileqp.com/Admin/Login/index";
            cc.sys.openURL(url);
        } else if (event.target.name == "addGems") {
            var adminDo = cc.find("Canvas/adminDo");
            adminDo.getChildByName("title").getComponent(cc.Label).string = "加房卡";
            adminDo.getChildByName("userId").y = 38;
            adminDo.getChildByName("gemsNum").active = true;
            adminDo.doNum = customEventData;
            adminDo.active = true;
        } else if (event.target.name == "deleteGems") {
            var adminDo = cc.find("Canvas/adminDo");
            adminDo.getChildByName("title").getComponent(cc.Label).string = "减房卡";
            adminDo.getChildByName("userId").y = 38;
            adminDo.getChildByName("gemsNum").active = true;
            adminDo.doNum = customEventData;
            adminDo.active = true;
        } else if (event.target.name == "removeForbid") {
            var adminDo = cc.find("Canvas/adminDo");
            adminDo.getChildByName("title").getComponent(cc.Label).string = "解除限制";
            adminDo.getChildByName("userId").y = 0;
            adminDo.getChildByName("gemsNum").active = false;
            adminDo.doNum = customEventData;
            adminDo.active = true;
        } else if (event.target.name == "forbidGame") {
            var adminDo = cc.find("Canvas/adminDo");
            adminDo.getChildByName("title").getComponent(cc.Label).string = "禁止游戏";
            adminDo.getChildByName("userId").y = 0;
            adminDo.getChildByName("gemsNum").active = false;
            adminDo.doNum = customEventData;
            adminDo.active = true;
        } else if (event.target.name == "showAgent") {
            var adminDo = cc.find("Canvas/adminDo");
            adminDo.getChildByName("title").getComponent(cc.Label).string = "添加代理";
            adminDo.getChildByName("userId").y = 0;
            adminDo.getChildByName("gemsNum").active = false;
            adminDo.doNum = customEventData;
            adminDo.active = true;
        } else if (event.target.name == "hideAgent") {
            var adminDo = cc.find("Canvas/adminDo");
            adminDo.getChildByName("title").getComponent(cc.Label).string = "取消代理";
            adminDo.getChildByName("userId").y = 0;
            adminDo.getChildByName("gemsNum").active = false;
            adminDo.doNum = customEventData;
            adminDo.active = true;
        }
    },
    shopClick(){
        this.shop.active = false;
        this.xiaoxiWin.active = true;
    },
    onJoinGameClicked: function () {
        cc.vv.audioMgr.playClicked();
        this.joinGameWin.active = true;
    },
    onJoinCircleClicked: function () {
        cc.vv.audioMgr.playClicked();
        if (cc.vv.userMgr.commission == 1) {
            cc.vv.alert.show("提示", "你的号被禁止玩游戏了！");
            return;
        }
        if (cc.vv.joinQuan && cc.vv.joinQuan.node) {
            cc.vv.joinQuan.getQuans(cc.vv.userMgr.userId);
        }
        this.joinFriendCircle.active = true;
    },

    onCreateRoomClicked: function () {
        cc.vv.audioMgr.playClicked();
        console.log("创建房间事件")
        this.createRoomWin.active = true;
        var btn_create = cc.find("Canvas/CreateRoomSD/btConfirm");
        var interactable = btn_create.getComponent(cc.Button).interactable;
        if (!interactable) {
            btn_create.getComponent(cc.Button).interactable = true;
        }
    },
    onCopyWeichat:function(event){
        var str = event.target.parent.getChildByName("info").getComponent(cc.Label).string;
        cc.vv.anysdkMgr.JsCopy(str);
    },
    onShareClicked: function () {  
        var desc = "海南麻将";
        cc.vv.anysdkMgr.share("海南麻将",desc,1);
    },
    update: function (dt) {
        var x = this.lblNotice.node.x;
        x -= dt * 100;
        if (x + this.lblNotice.node.width < -1000) {
            x = 500;
        }
        this.lblNotice.node.x = x;
    },
});