const { info } = require("console");

cc.Class({
    extends: cc.Component,
    properties: {    
        _key:null,
        everyInput:cc.EditBox,
        minInput:cc.EditBox,
        reduceInput:cc.EditBox,
        _ruleInfo:null,
    },
    onLoad(){

    },
    onEnable(){
        
    },
    onDisable(){
        cc.find("Canvas/quan/ruleBox").getComponent("QuanRule").getRule()
        // self.updateRule(ret.data)
    },
    exit(){
        this.node.active = false;
    },
    initData(key,infodata){
        this._key = key;
        this.everyInput.string = infodata.coinData.every;
        this.minInput.string = infodata.coinData.min;
        this.reduceInput.string = infodata.coinData.reduce;
        this._ruleInfo = infodata;
        console.log("****(((",this._ruleInfo)
    },
    editConfirm(){
        let self =this;
        if(!this.everyInput.string || this.everyInput.string <= 1){
            this.everyInput.string = 1;
        }
        else if(!this.minInput.string || this.minInput.string < 0){
            this.min.string = 0;
        }  
        else if(!this.reduceInput.string || this.reduceInput.string < 0){
            this.reduceInput.string = 0;
        }  
        let data = {
            quanId:cc.vv.Quan._quanID,
            key:this._key,
            every:parseInt(this.everyInput.string),
            min:parseInt(this.minInput.string),
            reduce:parseInt(this.reduceInput.string)
        }
        var onGet = function (ret) {
            cc.vv.wc.hide()
            if (ret.errcode == 0) {
                cc.vv.alert.tip({
                    msg:ret.errmsg,
                    suc:function(){
                        self.exit()
                    }
                })
              
            }
            else{
                cc.vv.alert.tip({
                    msg:ret.errmsg
                })
            }
        }
        cc.vv.wc.show()
        cc.vv.http.sendRequest("/update_quan_coindata", data, onGet)
    }
})