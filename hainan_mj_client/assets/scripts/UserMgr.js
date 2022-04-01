const { Certificate } = require("crypto");
cc.Class({
    extends: cc.Component,
    properties: {
        account: null,
        userId: null,
        userName: null,
        lv: 0,
        exp: 0,
        coins: 0,
        gems: 0,
        sign: 0,
        ip: "",
        sex: 0,
        kong:0,
        roomData: null,
        oldRoomId: null,
        showTip:0,
        avatar:"",
        certification:0,
        id_card_img:"",
        real_name:"",
    },

    guestAuth: function () {
        var account = cc.args["account"];
        if (account == null) {
            account = cc.sys.localStorage.getItem("account");
        }

        if (account == null) {
            account = Date.now();
            cc.sys.localStorage.setItem("account", account);
        }

        cc.vv.http.sendRequest("/guest", { account: account }, this.onAuth);
    },

    onAuth: function (ret) {
        var self = cc.vv.userMgr;
        if (ret.errcode !== 0) {
            console.log(ret.errmsg);
        }
        else {
            self.account = ret.account;
            self.sign = ret.sign;
            cc.vv.http.hall_url = "http://" + cc.vv.SI.hall;
            self.login();
        }
    },

    login: function () {
        var self = this;
        var onLogin = function (ret) {
            if (ret.errcode !== 0) {
                console.log(ret.errmsg);
            }
            else {
                if (!ret.userid) {
                    if (cc.sys.os == cc.sys.OS_ANDROID) {
                        cc.sys.localStorage.removeItem("wx_account");
                        cc.sys.localStorage.removeItem("wx_sign");
                        cc.director.loadScene("login");
                    }
                    if (cc.sys.os == cc.sys.OS_IOS) {
                        cc.sys.localStorage.removeItem("wx_account");
                        cc.sys.localStorage.removeItem("wx_sign");
                        cc.director.loadScene("login")
                    }
                    else {
                        cc.director.loadScene("createrole");
                    }
                }
                else {
                    console.log("userMgr 登录获得返回数据" + JSON.stringify(ret));
                    self.account = ret.account;
                    self.userId = ret.userid;
                    self.userName = ret.name;
                    self.lv = ret.lv;
                    self.exp = ret.exp;
                    self.coins = ret.coins;
                    self.gems = ret.gems;
                    self.roomData = ret.roomid;
                    self.sex = ret.sex;
                    self.ip = ret.ip;
                    self.avatar = ret.headimg;
                    self.certification = ret.certification;
                    self.id_card_img = ret.id_card_img
                    self.real_name = ret.real_name
                    self.socketConnect(function(){
                        if(self.roomData){
                            cc.vv.wc.show();
                            self.enterRoom(self.roomData);
                            self.roomData = null;
                        }
                        else{
                            cc.vv.wc.show("正在进入游戏大厅");
                            cc.director.loadScene("hall");
                        }
                    })
                }
            }
        };
       
        cc.vv.http.sendRequest("/login", { account: this.account, sign: this.sign }, onLogin);
    },
    socketConnect:function(cb){
        let self = this;
        cc.vv.http.sendRequest("/socket_connect", {}, function(res){
            // console.log("获取到的连接参数",res)
            cc.vv.net.ip = res.ip + ":" + res.port;
            var onConnectOK = function (data) {
                console.log("onConnectOK",data);
                cc.vv.net.send("hall_hello", {userId:cc.vv.userMgr.userId});
                if(cb){
                    cb()
                } 
            };
            var onConnectFailed = function () {
                console.log("failed.");
            };
            cc.vv.net.connect(onConnectOK, onConnectFailed);
            
        });
    },
    create: function (name) {
        var self = this;
        var onCreate = function (ret) {
            if (ret.errcode !== 0) {
                console.log(ret.errmsg);
            }
            else {
                self.login();
            }
        };
        var data = {
            account: this.account,
            sign: this.sign,
            name: name
        };
        cc.vv.http.sendRequest("/create_user", data, onCreate);
    },
    enterRoom: function (roomId, isHall) {
        var self = this;
        var onEnter = function (ret) {
            console.log("返回值",ret)
            if (ret.errcode != 0) {
                cc.vv.wc.hide();
                if (ret.errcode == -1) {
                    setTimeout(function () {
                        self.enterRoom(roomId,isHall);
                    }, 5000);
                } else if (ret.errcode == 123) {
                    console.log(cc.vv.alert)
                    cc.vv.alert.show("提示", "你不是这个亲友圈里的人");
                } else if (ret.errcode == 456) {
                    var curScene = cc.director.getScene().name;
                    if (curScene == "hall") {
                       cc.vv.alert.show("提示", "房间不存在");
                    }else if(curScene == "mjgame"){
                        cc.vv.MjNetMgr.roomId = null;
                        cc.director.loadScene("hall");
                    }
                } else if (ret.errcode == 11) {
                    cc.vv.userMgr.commission = 1;
                    cc.vv.alert.show("提示", "你的号被禁止玩游戏了！");
                } 
                else if (ret.errcode == 99) {
                    cc.vv.alert.show("提示", ret.errmsg);
                } 
                else if (ret.errcode == 10) {
                    cc.vv.alert.show("提示", "同IP不可进入房间！");
                } 
                else if (ret.errcode == 4) {
                    cc.vv.alert.show("提示", "房间已满！！");
                } else {
                    cc.director.loadScene("hall");
                }
            } else {
                if (cc.vv.joinQuan && cc.vv.joinQuan._quanId) {
                    cc.vv.joinQuan.onCloseQuan();
                    cc.vv.joinQuan._quanId = null;
                    cc.vv.joinQuan._quanZhu = null;
                    cc.vv.joinQuan = null;
                }
                cc.vv.MjNetMgr.connectGameServer(ret);
            }
        };
       cc.vv.anysdkMgr.getMapInfo();
        var data = {
            account: cc.vv.userMgr.account,
            sign: cc.vv.userMgr.sign,
            roomid: roomId,
            mapInfo: cc.vv.mapInfo,
        };
        console.log("正在进入房间",roomId)
        // cc.vv.wc.show("正在进入房间" + roomId);
        cc.vv.http.sendRequest("/enter_private_room", data, onEnter,cc.vv.http.hall_url);
    },

    getHistoryList: function (quanId,isQuanzhu,callback) {
        console.log("usermgr 是获取的什么战绩"+quanId,typeof(isQuanzhu))
        var self = this;
        var onGet = function (ret) {
            if (ret.errcode !== 0) {
                console.log(ret.errmsg);
            } else {
                console.log("获取到了战绩",ret);
                if (callback != null) {
                    callback(ret.history);
                }
            }
        };
        var data = {
            account: cc.vv.userMgr.account,
            sign: cc.vv.userMgr.sign,
            userId:cc.vv.userMgr.userId,
            quanId:quanId,
            isQuanzhu:Number(isQuanzhu),
        };
        cc.vv.http.sendRequest("/get_history_list", data, onGet);
    },
    getGamesOfRoom: function (uuid, callback) {
        var self = this;
        var onGet = function (ret) {
            if (ret.errcode != 0) {
                console.log(ret.errmsg);
            } else {
                console.log(ret.data);
                callback(ret.data);
            }
        };

        var data = {
            account: cc.vv.userMgr.account,
            sign: cc.vv.userMgr.sign,
            uuid: uuid,
        };
        cc.vv.http.sendRequest("/get_games_of_room", data, onGet);
    },
    getDetailOfGame: function (uuid, index, callback) {
        var self = this;
        var onGet = function (ret) {
            if (ret.errcode != 0) {
                console.log(ret.errmsg);
                callback(null);
            } else {
                console.log(ret.data);
                callback(ret.data);
            }
        };
        var data = {
            account: cc.vv.userMgr.account,
            sign: cc.vv.userMgr.sign,
            uuid: uuid,
            index: index-1,
        };
        cc.vv.http.sendRequest("/get_detail_of_game", data, onGet);
    },
    getUserLocation:function(mapInfo){
        console.log("mapinfo == "+mapInfo)
        if(!mapInfo || mapInfo == -1){
            var address = "获取不到地址数据"
        }
        else{
            var mapInfo = JSON.parse(mapInfo);
            var address = ""+mapInfo.country+mapInfo.province+mapInfo.city+mapInfo.district;
            if(address == ""){
                address = "定位权限关闭，请到手机设置中开启！"
            }
        }
        return address;
    },

});
