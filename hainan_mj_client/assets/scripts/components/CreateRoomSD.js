cc.Class({
    extends: cc.Component,

    properties: {
        _jushuList:null,
        _wanfaList:null,
        checkedMemory:null,
        _mjTypeList:null,
        mjTypeText:null,
        memoryObj:null,
        textObj:null,
        jushuText:[],
        wanfaText:[],
        otherText:[],
        tgText:[],
        _otherObj:null,
        otherNode:null,
        _otherList:null,
        _ip:null,
        _tgList:null,
    },

    // use this for initialization
    onLoad: function () {
        this.memoryObj = {
            jushu:"_jushuList",
            wanfa:"_wanfaList",
            mjType:'_mjTypeList',
            other:"_otherList",
            func:"_ip",
            tg:"_tgList"
        }
        this._jushuList = [];
        this._wanfaList = [];
        this._mjTypeList = [];
        this._tgList = [];
         this._otherList = [];
        this.mjTypeText = [];
        this._otherObj = {};
        var rules = this.node.getChildByName("rules");
        var mjtype = this.node.getChildByName("mjType");
        this.otherNode = rules.getChildByName("other");
        var jushu = rules.getChildByName("jushu");
        this._ip = rules.getChildByName("function").getChildByName("ip");
        for (var i = 0; i < jushu.childrenCount; i++) {
            var checkBox = jushu.children[i].getComponent(cc.Toggle);
            if (checkBox != null) {
                this._jushuList.push(checkBox);
                this.jushuText.push(jushu.children[i].getChildByName("infotext"))
            }
            
        }
        var wanfa = rules.getChildByName("wanfa");
        for (var i = 0; i < wanfa.childrenCount; i++) {
            var checkBox = wanfa.children[i].getComponent(cc.Toggle);
            if (checkBox != null) {
                this._wanfaList.push(checkBox);
                this.wanfaText.push(wanfa.children[i].getChildByName("infotext"))
            }
        }
        var tgNode = rules.getChildByName("tg");
        for (var i = 0; i < tgNode.childrenCount; i++) {
            var checkBox = tgNode.children[i].getComponent(cc.Toggle);
            if (checkBox != null) {
                this._tgList.push(checkBox);
                this.tgText.push(tgNode.children[i].getChildByName("infotext"))
            }
        }
        for(let i = 0 ; i < mjtype.childrenCount ; i++){
            var button = mjtype.children[i].getComponent(cc.Button);
            if(!!button){
                this._mjTypeList.push(button)
            }
            this.mjTypeText.push(mjtype.children[i].children[0].children[0])
        }
         for (var i = 0; i < this.otherNode.childrenCount; i++) {
            var checkBox = this.otherNode.children[i].getComponent(cc.Toggle);
            if (checkBox) {
                this._otherList.push(checkBox);
                this.otherText.push(this.otherNode.children[i].getChildByName("infotext"))
            }
        }
        cc.vv.createRoom = this;
    },
    onEnable(){
        if(this.checkedMemory == null){
            this.checkedMemory = {
                jushu:0,
                wanfa:0,
                mjType:0,
                tg:0,
            }
        }
        this.otherMonitor()
        for(var key in this.memoryObj){
            this.initColor(key)
        }
        
    },
    createRoom: function () {
        cc.vv.audioMgr.playClicked();
        var self = this;
        var type = "hainanmj";
        var conf = {
            type: type,
            jushu: this.checkedMemory.jushu,
            wanfa:  this.checkedMemory.wanfa,
            mjType:this.checkedMemory.mjType,
            tg:this.checkedMemory.tg,
            func:this._ip.getComponent(cc.Toggle).isChecked,
            otherData:this.otherObjData(),
        };
        console.log("创建房间时",conf)
        cc.vv.anysdkMgr.getMapInfo();
        var data = {
            account: cc.vv.userMgr.account,
            sign: cc.vv.userMgr.sign,
            conf: JSON.stringify(conf),
            mapInfo: cc.vv.mapInfo,
        };
        cc.vv.wc.show("正在创建房间");
        cc.vv.http.sendRequest("/create_private_room", data, self.onCreate.bind(self));
    },
    onCreate: function (ret) {
        if (ret.errcode !== 0) {
            cc.vv.wc.hide();
            if (ret.errcode == -10) {
                this.node.active = false;
                return;
            }
            if (ret.errcode == 2222) {
                cc.vv.alert.show("提示", "房卡不够，创建房间失败!");
            } else if (ret.errcode == 11) {
                cc.vv.userMgr.commission = 1;
                cc.vv.alert.show("提示", "你的号被禁止玩游戏了！");
            } else if (ret.errcode == -11) {
                cc.vv.alert.show("提示", "已在游戏内");
            } else if (ret.errcode == -12) {
                cc.vv.alert.show("提示", "已在游戏内");
            } else if (ret.errcode == 110) {
                cc.vv.alert.show("提示", "群主没房卡了！");
            } else {
                cc.vv.alert.show("提示", "创建房间失败,错误码:" + ret.errcode);
            }
        } else {
            cc.vv.MjNetMgr.connectGameServer(ret);

        }
    },
    onChecked(event,customEventData){
        var name = event.target.parent.name;
        this.checkedMemory[name] = Number(customEventData);
        this.initColor(name)
        // cc.sys.localStorage.setItem("checkedInfo", JSON.stringify( this.checkedMemory));
    },
    onBtnBack: function () {
        cc.vv.audioMgr.playClicked();
        this.node.active = false;
    },
    onBtnOK: function () {
        this.node.active = false;
        this.createRoom();
    },
    onChooseType(event){
        this._mjTypeList.forEach(element => {
            element.interactable = true;
        });
        event.target.getComponent(cc.Button).interactable = false;
        this.initColor("mjType")
    },
    initColor(listname){
        let self = this;
        if(listname == "mjType"){
            this[listname+"Text"].forEach(function(el,index){
                if(self._mjTypeList[index].interactable){
                    el.color = new cc.Color(255,255,255)
                }
                else{
                    el.color = new cc.Color(154,94,32)
                    self.checkedMemory["mjType"] = index;
                    self.otherMonitor()
                    // cc.sys.localStorage.setItem("checkedInfo", JSON.stringify( self.checkedMemory));
                }
            })
        }
        else if(listname == "func"){
            if(this._ip.getComponent(cc.Toggle).isChecked){
                this._ip.getChildByName("infotext").color = new cc.Color(235,80,47)
            }
            else{
                this._ip.getChildByName("infotext").color = new cc.Color(173,143,118)
            }
        }
        else{
            this[listname+"Text"].forEach(function(el,index){
                if(self['_'+listname+"List"][index].isChecked){
                    el.color = new cc.Color(235,80,47)
                }
                else{
                    el.color = new cc.Color(173,143,118)
                }
            })
        }
    },
    otherClick(e,customEventData){
        let eNode = this.otherNode.getChildByName(customEventData)
        let isChecked = eNode.getComponent(cc.Toggle).isChecked
        if(isChecked){
            eNode.getChildByName("infotext").color = new cc.Color(235,80,47)
        }
        else{
            eNode.getChildByName("infotext").color = new cc.Color(173,143,118)
        }
        this.otherMonitor(customEventData)
    },
    funcClick(e){
        this.initColor("func")
    },
    otherMonitor(target){
        this.otherNode.getChildByName("buchi").active = this.checkedMemory["mjType"] != 0;
        this.otherNode.getChildByName("goujiao").active = this.checkedMemory["mjType"] == 0;
        this.otherNode.getChildByName("haidibao").active = this.checkedMemory["mjType"] != 2;
        this.otherNode.getChildByName("budianpao").active = this.checkedMemory["mjType"] == 2;
        let wuziStatus = this.otherNode.getChildByName("wuzi").getComponent(cc.Toggle).isChecked
        if(wuziStatus){
            this.otherNode.getChildByName("ling").active = false;
        }
        else{
            this.otherNode.getChildByName("ling").active = true;
        }
        let shanggaStatus = this.otherNode.getChildByName("shangga").getComponent(cc.Toggle).isChecked
        let  gaArr = ["shangga3","shangga5","maxga3","fixga3"]
        if(shanggaStatus){
            this.otherNode.getChildByName("zyshangga").active = true;
            let zyss = this.otherNode.getChildByName("zyshangga").getComponent(cc.Toggle).isChecked
            if(zyss){
                gaArr.forEach(el=>{
                    this.otherNode.getChildByName(el).active = false;
                })
            }
            else{
                gaArr.forEach(el=>{
                    this.otherNode.getChildByName(el).active = true;
                })
                if(target && gaArr.includes(target)){
                    let st =  this.otherNode.getChildByName(target).getComponent(cc.Toggle).isChecked
                    if(st){
                        gaArr.forEach(el=>{
                            if(el != target){
                                this.otherNode.getChildByName(el).getComponent(cc.Toggle).isChecked = false;
                            }
                            
                        })
                    }
                }
            }
        }
        else{
            this.otherNode.getChildByName("zyshangga").active = false;
            gaArr.forEach(el=>{
                this.otherNode.getChildByName(el).active = false;
            })
        }
    },
    otherObjData(){
        let temObj = {};
        let childs = this.otherNode.children;
        childs.forEach(element=>{
            let isToggle = element.getComponent(cc.Toggle);
            if(isToggle){
                 let isChecked = element.getComponent(cc.Toggle).isChecked;
                temObj[element.name] = element.active && isChecked;
            }
        })
        return temObj
    },
   
});
