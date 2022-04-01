const Buffer = require("buffer").Buffer;
cc.Class({
    extends: cc.Component,

    properties: {
        _inputIndex: 0,
        _createQuan: cc.Node,
        _circleTemp: null,
        circleContent: cc.Node,
        _joincirecle: null,
        _quanStr: "",
        _getReTimer: null,
        _infoList: null,
        _infoTemp: null,
        btnMore: cc.Node,
        _quanTimer: null,
        _quanDowntime: 10,
        _interval: 10,
        _quanId: null,
        _quanZhu: null,
        _checkArr: [],
        _isclicked:false,
        nums: {
            default: [],
            type: [cc.Label]
        },
    },
    onLoad: function () {
        cc.vv.joinQuan = this;
        this._circleTemp = this.circleContent.children[0];
        this.circleContent.removeChild(this._circleTemp);
        this._createQuan = this.node.getChildByName("createQuan")
        this._createQuan.on("click", this.showCreateQuan, this);
        this._joincirecle = this.node.getChildByName("joinCircle");
        this._infoList = this.node.getChildByName("recordList");
        this.getQuans(cc.vv.userMgr.userId);
    },
    onEnable: function () {
        this.onResetClicked1();
    },
    onDisable(){
        if(cc.vv.Hall){
            cc.vv.Hall.refreshInfo()
        }
    },
    showCreateQuan: function () {
        cc.vv.audioMgr.playClicked();
        var self = this;
        var onGet = function (ret) {
            if (ret.errcode !== 0) {
                cc.vv.alert.tip({
                    msg:ret.errmsg
                })
            } else {
                cc.find("Canvas/createQuan").active = true;
            }
        };
        var data = {
            account: cc.vv.userMgr.account,
            sign: cc.vv.userMgr.sign,
            getLv:true,
        };
        cc.vv.http.sendRequest("/get_user_status", data, onGet.bind(this));
    },
    
    
    onInput: function (num) {
        if (this._inputIndex >= this.nums.length) {
            return;
        }
        this.nums[this._inputIndex].string = num;
        this._inputIndex += 1;
        this._quanStr += num;
    },
    onNumClicked:function(event,customEventData){
        cc.vv.audioMgr.playClicked(); 
        console.log("点击数字执行了 == "+customEventData)
        if(customEventData == "11"){
            for (var i = 0; i < this.nums.length; ++i) {
                this.nums[i].string = " ";
            }
            this._inputIndex = 0;
            this._quanStr = "";
        }
        else if(customEventData == "12"){
            if (this._inputIndex > 0) {
                this._inputIndex -= 1;
                this.nums[this._inputIndex].string = "";
                this._quanStr = this._quanStr.substr(0, this._quanStr.length - 1);
                console.log("删除时 圈== " + this._quanStr)
            }
        }else{
            this.onInput(customEventData);
        }
       
    },
   
    onResetClicked1: function (event) {
        for (var i = 0; i < this.nums.length; ++i) {
            this.nums[i].string = " ";
        }
        this._inputIndex = 0;
        this._quanStr = "";
    },
    onCloseQuan: function (event) {
        if(event && event.target.name == "close_btn"){
            cc.vv.audioMgr.playClicked(); 
        }
        this._quanId = null;
        this._quanZhu = null;
        this.node.active = false;
    },
    parseRoomID: function () {
        var str = "";
        for (var i = 0; i < this.nums.length; ++i) {
            str += this.nums[i].string;
        }
        return str;
    },
    getQuans: function (userId,quanId) {
        var self = this;
        var onGet = function (ret) {
            if (ret.errcode == 0) {
                self.updateQuans(ret.data)
                cc.vv.userMgr.kong = ret.kong;
                cc.vv.userMgr.lv = ret.lv;
            } else {
                if (ret.errcode == 4) {
                    console.log("还没有亲友圈呢")
                    self.updateQuans(ret.data)
                   
                }
                if (ret.errcode == 11) {
                    cc.vv.userMgr.commission = 1;
                    self.onCloseQuan();
                    cc.vv.alert.show("提示", "你的号被禁止玩游戏了！");
                }
            }
        };
        var data = {
            userId: userId,
        }
        cc.vv.http.sendRequest("/get_quans", data, onGet)
    },
    updateQuans: function (quans) {
        for (var i = 0; i < quans.length; i++) {
            var node = this.getViewItem(this.circleContent, i, this._circleTemp)
            node.getChildByName("name").getComponent(cc.Label).string = "圈子:"+quans[i].name;
            node.getChildByName("id").getComponent(cc.Label).string = quans[i].id;
            node.getChildByName("num").getComponent(cc.Label).string = quans[i].num;
            node._quanInfo = quans[i];
           
        }
        this.circleContent.height = this._circleTemp.height * quans.length
        this.shrinkContent(this.circleContent, quans.length);

    },
    getViewItem: function (content, index, tempNode, cNum) {
        if (content.childrenCount > index) {
            return content.children[index];
        }
        var node = cc.instantiate(tempNode);
        console.log("content.y =="+content.y)
        if (cNum) {
            var addw = 0
            if(cNum == 3){
                addw = 5
            }
            console.log("tempnode.y =="+tempNode.y)
            var hg = tempNode.height+addw;
            var yNum = Math.floor(index / cNum)
            node.y = tempNode.y - hg* yNum;
            console.log("node.y =="+node.y)
            node.x = tempNode.x + (tempNode.width+addw) * (index % cNum);
        } else {
            var hg = tempNode.height;
            var yNum = index;
            node.y = tempNode.y - tempNode.height * index;
        }
        content.addChild(node);
        console.log("content 高度 =="+content.height)
        return node;
    },
    shrinkContent: function (content, num) {
        while (content.childrenCount > num) {
            var lastOne = content.children[content.childrenCount - 1];
            lastOne.destroy();
            content.removeChild(lastOne, true);
        }
    },
    quanClick: function (event) {
        cc.vv.audioMgr.playClicked();
        let quan = cc.find('Canvas/quan')
        quan.getComponent("Quan").init(event.target._quanInfo);
        quan.active = true;
    },
    checkQuan: function () {
        cc.vv.audioMgr.playClicked();
        var self = this;
        if (this._quanStr.length == 0) {
            cc.vv.alert.show("提示", "请输入你查找的亲友圈")
            return
        }
        if (this._quanStr.length < 7) {
            cc.vv.alert.show("提示", "没有你查找的亲友圈")
            return;
        }
        if (this._quanStr.length == 7) {
            var onGet = function (ret) {
                if (ret.errcode == 0) {
                    cc.vv.alert.show("提示", ret.errmsg, self.sendReMessage.bind(self), true)
                } else {
                    cc.vv.alert.show("提示", ret.errmsg) 
                }
            };
            var data = {
                quanId: this._quanStr,
                userId: cc.vv.userMgr.userId,
                isok: 1,
            }
            cc.vv.http.sendRequest("/request_to_quan", data, onGet)
        }
    },

    sendReMessage: function () {
        cc.vv.audioMgr.playClicked();
        var self = this;
        var qid = this._quanStr;
        var data = {
            quanId: qid,
            userId: cc.vv.userMgr.userId,
            isok: 2,
        }
        var onGet = function (ret) {
            console.log("接收到申请返回的消息" + ret.errcode)
            if (ret.errcode == 0) {
                cc.vv.alert.show("提示", "已经发送申请消息，请联系圈主尽快处理")
            }
        }
        cc.vv.http.sendRequest("/request_to_quan", data, onGet)
    },
    showRecord: function () {
        cc.vv.audioMgr.playClicked();
        this.node.getChildByName("recordList").active = true;
    },
    
});