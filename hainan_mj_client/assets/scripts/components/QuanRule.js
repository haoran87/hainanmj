cc.Class({
    extends: cc.Component,
    properties: {

    },
    onLoad(){

    },
    onEnable(){
        this.getRule()
    },
    onDisable(){

    },
    initWanfa: function (conf) {
        if (conf) {
            var JU_SHU = [4,8,16];
            var tgArr = [0,30,60,120];
            var strArr = [];
            // var wanfastr = seat_num[conf.mjType] + '人玩法';
            // strArr.push(wanfastr)
            if(conf.func){
                strArr.push("同IP不可进")
            }
            if(conf.tg){
                strArr.push(tgArr[conf.tg]+"秒后托管")
            }
            if (conf.wanfa == 0) {
                strArr.push("有番")
            } else {
                strArr.push("无番")
            }
           
            var jushustr = JU_SHU[conf.jushu] + "局";
            strArr.push(jushustr)
            let otherData = conf.otherData;
            for (var key in otherData) {
                if (otherData[key]) {
                    strArr.push(cc.vv.gameConfText[key]);
                }
            }
            return strArr.join('/');
        }
        return "";
    },
    getRule(){
        let self = this;
        var onGet = function (ret) {
            if (ret.errcode == 0) {
               self.updateRule(ret.data)
            }
            else{
                cc.vv.alert.tip({
                    msg:ret.errmsg
                })
            }
        }
        cc.vv.http.sendRequest("/get_quan_rule", {quanId:cc.vv.Quan._quanID}, onGet)
    },
    updateRule(data){
        console.log(data);
        for(var key in data){
            let ruleNode = this.node.getChildByName(key)
            let ruleInfo = data[key]
            ruleNode.getChildByName("min").getComponent(cc.Label).string = ruleInfo.coinData.min;
            ruleNode.getChildByName("every").getComponent(cc.Label).string = ruleInfo.coinData.every;
            ruleNode.getChildByName("reduce").getComponent(cc.Label).string = ruleInfo.coinData.reduce;
            ruleNode.getChildByName("wf").getComponent(cc.Label).string = "玩法："+this.initWanfa(ruleInfo);
            ruleNode.active = true;
            ruleNode._ruleInfo = ruleInfo
        }
    },
    exit(){
        this.node.active = false;
    },
    editFunc(event){
        let edit = cc.find("Canvas/quan/editBox")
        edit.active = true;
        let key = event.target.parent.name;
        let infodata = event.target.parent._ruleInfo;
        edit.getComponent("QuanRuleEdit").initData(key,infodata)
    },
    modifyFunc(event){
        let wf = cc.find("Canvas/quan/wfBox")
        let key = event.target.parent.name;
        let infodata = event.target.parent._ruleInfo;
        wf.getComponent("QuanRuleWf").initData(infodata,key)
        wf.active = true;
    }
})