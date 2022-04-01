cc.Class({
    extends: cc.Component,
    properties: {
        pgcSelf:{
            default:null,
            type:cc.Prefab
        },
        
        pgcLeft:{
            default:null,
            type:cc.Prefab
        },
        pgcRight:{
            default:null,
            type:cc.Prefab
        },
        rightFold:{
            default:null,
            type:cc.Prefab
        },
        leftFold:{
            default:null,
            type:cc.Prefab
        },
        myFold:{
            default:null,
            type:cc.Prefab
        },
        redPot:{
            default:null,
            type:cc.Prefab
        },
        CardFace:{
            default:null,
            type:cc.Prefab
        },
        majiangAtlas:{
            default:null,
            type:cc.SpriteAtlas,
        },
        posAtlas:{
            default:null,
            type:cc.SpriteAtlas,
        },
        toolsAtlas:{
            default:null,
            type:cc.SpriteAtlas,
        },
        _sides:null,
        _pres:null,
        _foldPres:null,
    },
    
    onLoad:function(){
        if(cc.vv == null){
            return;
        }
        this._sides = cc.vv.MjNetMgr.initSides()
        cc.vv.mahjongmgr = this; 
    },
    
    getSpriteFrameByMJID:function(mjid){
        var spriteFrameName = "CardFace_"+(mjid+1);
        return this.majiangAtlas.getSpriteFrame(spriteFrameName)
    },
    
    getAudioURLByMJID:function(sex, id){
        var realId = 0;
         if (id >= 0 && id < 34) {
            realId = id + 1;
        }
        else if(id >= 34 ){
            realId = "hua";
        }
        if (sex == 2) {
            return 'girl/' + realId + '';
        }
        return 'boy/' + realId + '';
    },
    
    getEmptySpriteFrame:function(side){
        if(side == "up"){
            var carbackName = "CardBack_2_2"
        }   
        else if(side == "myself"){
            var carbackName = "CardBack_0_2"
        }
        else if(side == "left"){
            var carbackName = "CardBack_3_2"
        }
        else if(side == "right"){
            var carbackName = "CardBack_1_2"
        }
        return this.majiangAtlas.getSpriteFrame(carbackName);
    },
    
    getHoldsEmptySpriteFrame:function(side){
        if(side == "up"){
            var carbackName = "CardBack_2_0"
        }   
        else if(side == "myself"){
            return null;
        }
        else if(side == "left"){
            var carbackName = "CardBack_3_0"
        }
        else if(side == "right"){
            var carbackName = "CardBack_1_0"
        }
        return this.majiangAtlas.getSpriteFrame(carbackName);
    },
    
    getFoldsEmptySpriteFrame:function(side){
        if(side == "up"){
            var carbackName = "CardBack_0_1"
        }   
        else if(side == "myself"){
            var carbackName = "CardBack_0_1"
        }
        else if(side == "left"){
            var carbackName = "CardBack_3_1"
        }
        else if(side == "right"){
            var carbackName = "CardBack_1_1"
        }
        return this.majiangAtlas.getSpriteFrame(carbackName);
    },

    sortMJ:function(seatData){
        var self = this;
        var mahjongs = seatData.holds;
        mahjongs.sort(function(a,b){
            return a - b;
        });
        let wanArr = [];
        let tongArr = [];
        let tiaoArr = [];
        let otherArr = []
        for(var j  = 0 ; j < mahjongs.length ; j++ ){
            var mj = mahjongs[j];
            if(mj >= 0 && mj < 9){
                wanArr.push(mj)
            }
            else if(mj >= 9 && mj < 18){
                tiaoArr.push(mj)
            }
            else if(mj >= 18 && mj < 27){
                tongArr.push(mj)
            }
            else{
                otherArr.push(mj);
            }
        }
        seatData.holds = wanArr.concat(tongArr,tiaoArr,otherArr);
    },
    
    getSide:function(localIndex){
        return this._sides[localIndex];
    },
});
