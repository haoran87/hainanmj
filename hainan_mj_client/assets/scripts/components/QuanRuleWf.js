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
        _key:null,
        _wfInfo:null,
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
         this._otherList = [];
         this._tgList = [];
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
        let wfInfo = this._wfInfo;
        if(this.checkedMemory == null){
            this.checkedMemory = {
                jushu:wfInfo.jushu,
                wanfa:wfInfo.wanfa,
                mjType:wfInfo.mjType,
                tg:wfInfo.tg,
            }
        }
        this.onChooseType(wfInfo)
        this.otherMonitor()
        for(var k in this.memoryObj){
            this.initColor(k)
        }
    },
    onDisable(){
        cc.find("Canvas/quan/ruleBox").getComponent("QuanRule").getRule()
    },
    initData(wfInfo,key){
        this._key = key
        this._wfInfo = wfInfo
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
        console.log("存储游戏规则",conf)
        cc.vv.anysdkMgr.getMapInfo();
        var data = {
            quanId:cc.vv.Quan._quanID,
            key:this._key,
            conf: JSON.stringify(conf),
        };
        cc.vv.wc.show();
        cc.vv.http.sendRequest("/update_quan_wf", data, self.preserveFunc.bind(self));
    },
    preserveFunc: function (ret) {
        cc.vv.wc.hide();
        let self = this;
        if (ret.errcode !== 0) {
         cc.vv.alert.tip({
             msg:ret.errmsg
         })
        } else {
            cc.vv.alert.tip({
                msg:ret.errmsg,
                suc:function(){
                    self.onBtnBack()
                }
            })
        }
    },
    onChecked(event,customEventData){
        var name = event.target.parent.name;
        this.checkedMemory[name] = Number(customEventData);
        this.initColor(name)
    },
    onBtnBack: function () {
        // cc.vv.audioMgr.playClicked();
        this.node.active = false;
    },
    onChooseType(wfInfo){
        let  self = this;
        this._mjTypeList.forEach(element => {
            if(element.node.name == self._key){
                element.interactable = false;
            }
            else{
                element.interactable = true;
            }
        });
        this._wanfaList.forEach((el,index)=>{
            if(index == wfInfo.wanfa){
               el.isChecked = true 
            }
            else{
                el.isChecked = false  
            }
        })
        this._jushuList.forEach((el,index)=>{
            if(index == wfInfo.jushu){
                el.isChecked = true 
             }
             else{
                 el.isChecked = false  
             }
        })
        this._otherList.forEach((el,index)=>{
            el.isChecked = wfInfo.otherData[el.node.name];
        })
        this._ip.getComponent(cc.Toggle).isChecked = wfInfo.func;
        this._tgList.forEach((el,index)=>{
            if(index == wfInfo.tg){
                el.isChecked = true 
             }
             else{
                 el.isChecked = false  
             }
        })
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
    funcClick(e){
        this.initColor("func")
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
