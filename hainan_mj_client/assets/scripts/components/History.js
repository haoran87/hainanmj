const Buffer = require("buffer").Buffer; //20180122 添加

cc.Class({
    extends: cc.Component,

    properties: {
        HistoryItemPrefab: {
            default: null,
            type: cc.Prefab,
        },
        _history: null,
        _viewlist: null,
        _content: null,
        _viewitemTemp: null,
        _historyData: null,
        _curRoomInfo: null,
        _emptyTip: null,
        _factData: null,
        _backNum: null,
        _isclick:false,
    },
    onLoad: function () {
        cc.vv.history = this;
    },
    start() {
        this._history = this.node.getChildByName("history");
        this._history.active = false;

        this._emptyTip = this._history.getChildByName("emptyTip");
        this._emptyTip.active = true;

        this._viewlist = this._history.getChildByName("viewlist");
        this._content = cc.find("view/content", this._viewlist);

        this._viewitemTemp = this._content.children[0];
        this._content.removeChild(this._viewitemTemp);

        var node = cc.find("Canvas/bottom_btns/btn_zhanji");
        this.addClickEvent(node, this.node, "History", "onBtnHistoryClicked");

        var node = cc.find("Canvas/history/btn_back");
        this.addClickEvent(node, this.node, "History", "onBtnBackClicked");
    },
    addClickEvent: function (node, target, component, handler) {
        var eventHandler = new cc.Component.EventHandler();
        eventHandler.target = target;
        eventHandler.component = component;
        eventHandler.handler = handler;
        var clickEvents = node.getComponent(cc.Button).clickEvents;
        clickEvents.push(eventHandler);
    },

    onBtnBackClicked: function () {
        cc.vv.audioMgr.playClicked();
        if (this._backNum == null) {
            this._historyData = null;
            this._history.active = false;
            cc.sys.localStorage.removeItem("quanHistory");
        } else {
            this.initRoomHistoryList(this._historyData);
            cc.sys.localStorage.removeItem("roomInfo");
        }
    },

    onBtnHistoryClicked: function () {
       cc.vv.wc.show()
        cc.vv.audioMgr.playClicked();
        var self = this;
        cc.vv.userMgr.getHistoryList("",false, function (data) {
            cc.vv.wc.hide()
            if (data && data.length > 0) {
                data.sort(function (a, b) {
                    return b.time - a.time;
                });
                self._historyData = data;
                for (var i = 0; i < data.length; ++i) {
                    for (var j = 0; j < data[i].seats.length; ++j) {
                        var s = data[i].seats[j];
                        if (s.userid > 0) {
                            s.name = Buffer.from(s.name, 'base64').toString();
                        }
                    }
                }
                self.initRoomHistoryList(data, 1);
            }
            else {
                self.shrinkContent(0);
                self._emptyTip.active = true;
                self._history.active = true;
            }
            
        });
    },

    dateFormat: function (time) {
        var date = new Date(time);
        var year = date.getFullYear();
        var month = date.getMonth() + 1;
        month = month >= 10 ? month : ("0" + month);
        var day = date.getDate();
        day = day >= 10 ? day : ("0" + day);
        var h = date.getHours();
        h = h >= 10 ? h : ("0" + h);
        var m = date.getMinutes();
        m = m >= 10 ? m : ("0" + m);
        var s = date.getSeconds();
        s = s >= 10 ? s : ("0" + s);
        return {
            yy:year+'-'+month+"-"+day,
            ht:h+":"+m+":"+s
        };
    },

    initRoomHistoryList: function (data) {
        console.log("初始化战绩了")
        for (var i = 0; i < data.length; ++i) {
            var node = this.getViewItem(i);
            node.idx = i;
            node.getChildByName("title").active = true;
            node.getChildByName("title").getComponent(cc.Label).string = i+1;
            node.getChildByName("winlogo").active = false;
            node.getChildByName("loselogo").active = false;
            var datetime = this.dateFormat(data[i].time * 1000);
            node.getChildByName("time").getComponent(cc.Label).string = datetime.yy;
            node.getChildByName("timeH").getComponent(cc.Label).string = datetime.ht;
            var btnOp = node.getChildByName("btnOp");
            btnOp.idx = i;
            var btnHuifang = node.getChildByName("btnHuifang");
            var btnCode = node.getChildByName("btnCode")
            btnCode.active = false;
            btnHuifang.active = false;
           
            node.getChildByName("roomNo").getComponent(cc.Label).string = "房间号:"+data[i].id;
            node.getChildByName("juNo").getComponent(cc.Label).string = "海南麻将"
            btnOp.active = true;
            for (var j = 0; j < 4; ++j) {
                var info = node.getChildByName("info" + j);
                var name = info.getChildByName('name').getComponent(cc.Label);
                var score = info.getChildByName('score').getComponent(cc.Label);
                info.active =false;
                name.string = '';
                score.string = '';
                if(j < data[i].seats.length){
                    var s = data[i].seats[j];
                    if (s) {
                        if (s.userid > 0) {
                            name.string = s.name;
                            score.string = s.score > 0 ? "+" + s.score : s.score;
                        }
                        info.active = true;
                    }
                }
            }
        }
        this._emptyTip.active = data.length == 0;
        this._history.active = true;
        this.shrinkContent(data.length);
        this._curRoomInfo = null;
        this._backNum = null;
    },

    initGameHistoryList: function (roomInfo, data) {
        data.sort(function (a, b) {
            return a.create_time - b.create_time;
        });
        for (var i = 0; i < data.length; ++i) {
            var node = this.getViewItem(i);
            var idx = data[i].game_index;
            node.idx = idx;
            node.getChildByName("title").active = false;
            node.getChildByName("winlogo").active = false;
            node.getChildByName("loselogo").active = false;
            node.getChildByName("roomNo").getComponent(cc.Label).string = "房间号:"+roomInfo.id;
            var datetime = this.dateFormat(data[i].create_time * 1000);
            node.getChildByName("time").getComponent(cc.Label).string = datetime.yy;
            node.getChildByName("timeH").getComponent(cc.Label).string = datetime.ht;
            node.getChildByName("juNo").active = true;
            node.getChildByName("juNo").getComponent(cc.Label).string = "第" + (idx) + "局";
            var btnOp = node.getChildByName("btnOp");
            var btnHuifang = node.getChildByName("btnHuifang");
            var btnCode = node.getChildByName("btnCode")
            btnCode.active = true;
            btnCode.idx = idx;
            btnHuifang.idx = idx;
            btnOp.active = false;
            btnHuifang.active = true;
            var result = JSON.parse(data[i].result);
            for (var j = 0; j < 4; ++j) {
                var info = node.getChildByName("info" + j);
                var name = info.getChildByName('name').getComponent(cc.Label);
                var score = info.getChildByName('score').getComponent(cc.Label);
                info.active = false;  
                name.string = '';
                score.string = '';
                if(j <= roomInfo.seats.length){
                    var s = roomInfo.seats[j];
                    if (s) {
                        info.active = true;
                        if (s.userid > 0) {
                            name.string = s.name;
                            score.string = result[j] > 0 ? "+" + result[j] : result[j];
                            if(s.userid == cc.vv.userMgr.userId){
                                if(result[j] > 0){
                                    node.getChildByName("winlogo").active = true;
                                }
                                else{
                                    node.getChildByName("loselogo").active = true;
                                }
                            }
                        }
                    }
                }   
            }
        }
        this.shrinkContent(data.length);
        this._curRoomInfo = roomInfo;
        this._backNum = 1;
    },

    getViewItem: function (index) {
        var content = this._content;
        if (content.childrenCount > index) {
            return content.children[index];
        }
        var node = cc.instantiate(this._viewitemTemp);
        content.addChild(node);
        return node;
    },
    
    shrinkContent: function (num) {
        while (this._content.childrenCount > num) {
            var lastOne = this._content.children[this._content.childrenCount - 1];
            lastOne.destroy();
            this._content.removeChild(lastOne, true);
        }
    },

    getGameListOfRoom: function (idx) {
        console.log("获取房间详细列表  "+idx)
        if(this._isclick)return;
        this._isclick = true;
        var self = this;
        var roomInfo = this._historyData[idx];
        cc.sys.localStorage.setItem("roomInfo", idx);
        cc.vv.userMgr.getGamesOfRoom(roomInfo.uuid, function (data) {
            
            if (data != null && data.length > 0) {
                self.initGameHistoryList(roomInfo, data);
                self._isclick = false;
            }
            else{
                self._isclick = false;
            }
        });
    },

    getDetailOfGame: function (idx) {
        console.log("获取游戏信息 == "+idx)
        cc.vv.wc.show()
        var self = this;
        var roomUUID = this._curRoomInfo.uuid;
        cc.vv.userMgr.getDetailOfGame(roomUUID, idx, function (data) {
            cc.vv.wc.hide()
            console.log("接收到回放返回结果")
            if(data){
                data.base_info = JSON.parse(data.base_info);
                data.action_records = JSON.parse(data.action_records);
                cc.vv.MjNetMgr.dissoveData = null;
                cc.vv.MjNetMgr.prepareReplay(self._curRoomInfo, data);
                cc.vv.replayMgr.init(data);
                cc.director.loadScene("mjgame");
            }
        });
    },
    onBtnOpClicked: function (event) {
        var idx = event.target.idx;
        var name = event.target.name;
        if (name == "btnOp") {
            this.getGameListOfRoom(idx);
        } else if(name == "btnHuifang"){
            this.getDetailOfGame(idx);
        }
        else if(name == "btnCode"){
          let codestr =   this._curRoomInfo.uuid+"*"+idx;
          console.log("fz回放码====",codestr)
          cc.vv.anysdkMgr.JsCopy(codestr);
        }
    },
    showCodeInput(event){
        event.target.parent.getChildByName("codeBox").active = true;
    },
    codeCofirm(event){
        let codeStr = event.target.parent.getChildByName("codeStr").getComponent(cc.EditBox).string
        this.getOhterDetail(codeStr)
        console.log("回放码====",codeStr)
    },
    codeCancel(event){
        event.target.parent.active = false;
    },
    getOhterDetail: function (codeStr) {
        var self = this;
        var roomUUID = codeStr.split("*")[0];
        var idx = codeStr.split("*")[1];
        cc.vv.wc.show()
       
        var onGet = function(ret){
            if(ret.errcode == 0){
                let rinfo = ret.info;
                rinfo.seats.forEach(element => {
                    element.name = Buffer.from(element.name, 'base64').toString();
                });
                cc.vv.userMgr.getDetailOfGame(roomUUID, idx, function (data) {
                    cc.vv.wc.hide()
                    if(data){
                        data.base_info = JSON.parse(data.base_info);
                        data.action_records = JSON.parse(data.action_records);
                        cc.vv.MjNetMgr.dissoveData = null;
                        cc.vv.MjNetMgr.prepareReplay(rinfo, data);
                        cc.vv.replayMgr.init(data);
                        cc.director.loadScene("mjgame");
                    }
                });
            }
            else{
                cc.vv.wc.hide() 
                cc.vv.alert.tip({msg:"没有该历史记录"})
            }
        }
        cc.vv.http.sendRequest("/get_other_history_info", {uuid:roomUUID}, onGet);
    },
});