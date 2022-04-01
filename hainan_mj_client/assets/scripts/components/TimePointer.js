cc.Class({
    extends: cc.Component,

    properties: {
        _arrow:null,
        _pointer:null,
        _timeLabel:null,
        _time:-1,
        _alertTime:-1,
        _dir:null,
    },

    // use this for initialization
    onLoad: function () {
        var gameChild = this.node.getChildByName("game");
        this._arrow = gameChild.getChildByName("arrow");
        this._pointer = this._arrow.getChildByName("pointer");
        this._dir = this._arrow.getChildByName("direction_home");
        this.initDir();
        this.initPointer();
        
        this._timeLabel = this._arrow.getChildByName("lblTime").getComponent(cc.Label);
        this._timeLabel.string = "00";
        
        var self = this;
        
        this.node.on('game_begin',function(data){
            self.initPointer();
        });
        
        this.node.on('game_chupai',function(data){
            self.initPointer();
            self._time = 10;
            // self._alertTime = 3;
        });
    }, 
    initDir:function(){
        var seats = cc.vv.MjNetMgr.seats;
        if(!seats)return;
        var dirHome = ["东","南","西","北"]
        var seatNum = cc.vv.MjNetMgr.conf.seatNum;
        var pArr = [0,1,2,3]
        if(seatNum == 2){
            pArr = [0,2]
        }
        else if(seatNum == 3){
            pArr = [0,1,3]
        }
        for(let i = 0 ; i < seats.length ; i++){
            var localIndex = cc.vv.MjNetMgr.getLocalIndex(seats[i].seatindex);
            this._dir.children[pArr[localIndex]].getComponent(cc.Label).string = dirHome[seats[i].seatindex]
        }
    },
    initPointer:function(){
        if(cc.vv == null){
            return;
        }
        this._arrow.active = !cc.vv.replayMgr.isReplay();//cc.vv.MjNetMgr.gamestate == "playing";
        if(!this._arrow.active){
            return;
        }
        var turn = cc.vv.MjNetMgr.turn;
        var seatNum = cc.vv.MjNetMgr.conf.seatNum;
        var pArr = [0,1,2,3]
        if(seatNum == 2){
            pArr = [0,2]
        }
        else if(seatNum == 3){
            pArr = [0,1,3]
        }
        var localIndex = cc.vv.MjNetMgr.getLocalIndex(turn);
        for(var i = 0; i < pArr.length; ++i){
            var index = pArr[i]
            this._pointer.children[index].active = i == localIndex;
        }
    },
    
    // called every frame, uncomment this function to activate update callback
    update: function (dt) {
        if(this._time > 0){
            this._time -= dt;
            // if(this._alertTime > 0 && this._time < this._alertTime){
            //  
            //     this._alertTime = -1;
            // }
            var pre = "";
            if(this._time < 0){
                this._time = 0;
            }
            
            var t = Math.ceil(this._time);
            if(t < 10){
                pre = "0";
            }
            this._timeLabel.string = pre + t; 
        }
    },
});
