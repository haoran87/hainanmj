cc.Class({
    extends: cc.Component,

    properties: {
        nums:{
            default:[],
            type:[cc.Label]
        },
        _inputIndex:0,
    },
    onLoad: function () {
        
    },
    
    onEnable:function(){
        this.onResetClicked();
    },
    
    onInputFinished:function(roomId){
        cc.vv.userMgr.enterRoom(roomId,true);
    },
    onInput:function(num){
        if(this._inputIndex >= this.nums.length){
            return;
        }
        this.nums[this._inputIndex].string = num;
        this._inputIndex += 1;
        
        if(this._inputIndex == this.nums.length){
            var roomId = this.parseRoomID();
            console.log("ok:" + roomId);
            this.onInputFinished(roomId);
        }
    },
    onNumClicked:function(event,customEventData){
        cc.vv.audioMgr.playClicked();
        var num = Number(customEventData);
        if(event.target.name == "Z_button_reset"){
            for(var i = 0; i < this.nums.length; ++i){
                this.nums[i].string = " ";
            }
            this._inputIndex = 0;
        }
        else if(event.target.name == "Z_button_delete"){
            if(this._inputIndex > 0){
                this._inputIndex -= 1;
                this.nums[this._inputIndex].string = " ";
            }
        }
        else{
            this.onInput(num);
        } 
    },
    
    onResetClicked:function(){
        for(var i = 0; i < this.nums.length; ++i){
            this.nums[i].string = " ";
        }
        this._inputIndex = 0;
    },
    onCloseClicked:function(){
        cc.vv.audioMgr.playClicked();
        this.node.active = false;
    },
    
    parseRoomID:function(){
        var str = "";
        for(var i = 0; i < this.nums.length; ++i){
            str += this.nums[i].string;
        }
        return str;
    },
});
