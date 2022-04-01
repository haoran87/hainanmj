cc.Class({
    extends: cc.Component,

    properties: {
        _folds:null,
    },

    // use this for initialization
    onLoad: function () {
        if(cc.vv == null){
            return;
        }
        
        this.initView();
        this.initEventHandler();
        
    },
    start:function(){
        this.initAllFolds();
    },
    initView:function(){
        this._folds = {};
        this.clearAllFolds();
    },
    
    clearAllFolds:function(){
        var game = this.node.getChildByName("game");
        var sides = cc.vv.mahjongmgr._sides;
        for(var i = 0; i < sides.length; ++i){
            var sideName = sides[i];
            var sideRoot = game.getChildByName(sideName);
            var foldRoot = sideRoot.getChildByName("folds");
            var flowerRoot = sideRoot.getChildByName("flower_folds");
            foldRoot.destroyAllChildren();
            foldRoot.removeAllChildren();
            flowerRoot.destroyAllChildren();
            flowerRoot.removeAllChildren();
        }
    },
    
    initEventHandler:function(){
        var self = this;
        this.node.on('game_begin',function(data){
            self.clearAllFolds();
        });  
        
        this.node.on('guo_notify',function(data){
            self.initFolds(data,true);
        });
        this.node.on('game_chupai_notify',function(data){
            self.initFolds(data.seatData,true);
        });
        this.node.on('game_buhua_notify',function(data){
            self.initFlowerFolds(data.seatData);
        });
        this.node.on('chi_folds_notify',function(data){
            self.initFolds(data,true);
        });
        this.node.on('gang_folds_notify',function(data){
            self.initFolds(data,true);
        });
        this.node.on('peng_folds_notify',function(data){
            self.initFolds(data,true);
        });
    },
    
    initAllFolds:function(){
        var seats = cc.vv.MjNetMgr.seats;
        for(var i =0 ; i < seats.length ; i++){
            this.initFolds(seats[i],false);
            this.initFlowerFolds(seats[i]);
        }
    },
    initFlowerFolds:function(seatData){
        var flowers = seatData.flowerFolds;
        console.log("floawersssss***",flowers)
        if(!flowers){
            return;
        }
        var game = this.node.getChildByName("game");
        var localIndex = cc.vv.MjNetMgr.getLocalIndex(seatData.seatindex);
        var side = cc.vv.mahjongmgr.getSide(localIndex);
        var sideRoot = game.getChildByName(side);
        var flowerRoot = sideRoot.getChildByName("flower_folds");
        var tempFolds = [];
        for(var j = 0 ; j < flowers.length ; j++){//花  up y 250    myself y -295  left x -100  right x 120
            if(side == "myself"){
                var tempFold = cc.vv.mahjongmgr.myFold;
                var x = -250+(56*(j%8));
                var y = -305
            }
            else if( side == "up"){
                var tempFold = cc.vv.mahjongmgr.myFold;
                var x = 250-(56*(j%8));
                var y = 265 
               
            }
            else if(side == "right"){
                var tempFold = cc.vv.mahjongmgr.rightFold;
                var x = 120   
                var y = -250+(31*(j%8));  
            }
            else if(side == "left"){
                var tempFold = cc.vv.mahjongmgr.leftFold;
                var x = -100;     
                var y = -10-(31*(j%8));  
            }
            var ff = cc.instantiate(tempFold);
            flowerRoot.addChild(ff)
            var cf = ff.getChildByName("CardFace");
            if(side == "up"){
                cf.angle = 180;
            }
            // console.log("floawersssss***",flowers[j])
            cf.getComponent(cc.Sprite).spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID(flowers[j]);
            ff.x = x;
            ff.y = y;
            tempFolds.push(ff)
            if(side == "myself" || side == "right"){
                for(var i = 0 ; i < tempFolds.length; i++){
                    var fold = tempFolds[i];
                     var num = flowerRoot.childrenCount-1-i;
                     fold.setSiblingIndex(num)
                }
            }
        }
    },
    initFolds:function(seatData,isgame){
        var folds = seatData.folds;
        if(folds == null){
            return;
        }
        var game = this.node.getChildByName("game");
        var localIndex = cc.vv.MjNetMgr.getLocalIndex(seatData.seatindex);
        var side = cc.vv.mahjongmgr.getSide(localIndex);
        var sideRoot = game.getChildByName(side);
        var foldRoot = sideRoot.getChildByName("folds");
        if(seatData.seatindex == cc.vv.MjNetMgr.turn){
            this.hideRedpot();
        }
        if(foldRoot.childrenCount == 0 && folds.length > 0){
            var seatNum = cc.vv.MjNetMgr.conf.seatNum;
            if(cc.vv.MjNetMgr.chupai != -1){
                var lastTurn = cc.vv.MjNetMgr.turn;
            }
            else{
                var lastTurn = ((cc.vv.MjNetMgr.turn - 1)+seatNum)%seatNum
            }
          
            var tempFolds = [];
            for(var j = 0 ; j < folds.length ; j++){
                if(side == "myself"){
                    var tempFold = cc.vv.mahjongmgr.myFold;
                    if(cc.vv.MjNetMgr.conf.seatNum == 2){
                        var x = -600+(56*(j%24));
                        var y = -220+(70*parseInt(j/24));
                    }
                    else{
                        var x = -310+(56*(j%12));
                        var y = -220+(70*parseInt(j/12));
                    }
                   
                }
                else if( side == "up"){
                    var tempFold = cc.vv.mahjongmgr.myFold;
                    if(cc.vv.MjNetMgr.conf.seatNum == 2){
                        var x = 600-(56*(j%24));
                        var y = 235-(70*parseInt(j/24));  
                    }
                    else{
                        var x = 310-(56*(j%12));
                        var y = 235-(70*parseInt(j/12));  
                    }
                   
                }
                else if(side == "right"){
                    var tempFold = cc.vv.mahjongmgr.rightFold;
                    var x = 120-(45*parseInt(j/10));     
                    var y = -310+(31*(j%10));  
                }
                else if(side == "left"){
                    var tempFold = cc.vv.mahjongmgr.leftFold;
                    var x = -90+(45*parseInt(j/10));     
                    var y = 10-(31*(j%10));  
                }
                var fold = cc.instantiate(tempFold);
                foldRoot.addChild(fold)
                var cf = fold.getChildByName("CardFace");
                if(side == "up"){
                    cf.angle = 180;
                }
                cf.getComponent(cc.Sprite).spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID(folds[j]);
                fold.x = x;
                fold.y = y;
                tempFolds.push(fold)
            }
            if(!isgame){
                if(side == "myself" || side == "right"){
                    for(var i = 0 ; i < tempFolds.length; i++){
                        var fold = tempFolds[i];
                         var num = foldRoot.childrenCount-1-i;
                         fold.setSiblingIndex(num)
                    }
                }
            }
            else{
                lastTurn = cc.vv.MjNetMgr.turn;   
            }
            if(cc.vv.MjNetMgr.haveReddot && seatData.seatindex == lastTurn){
                var redPot = cc.instantiate(cc.vv.mahjongmgr.redPot);
                var fold = tempFolds[tempFolds.length - 1]
                fold.addChild(redPot);
                if(side == "myself"){
                    redPot.y += 70;
                }
                else{
                    redPot.y += 50;
                }
                
                redPot.getChildByName("sprite").getComponent(cc.Animation).play("retPot");
            }
        }
        else if(foldRoot.childrenCount+1 == folds.length){
            var j = folds.length - 1;
            if(side == "myself"){  
                var tempFold = cc.vv.mahjongmgr.myFold;
                if(cc.vv.MjNetMgr.conf.seatNum == 2){
                    var x = -600+(56*(j%24));
                    var y = -220+(70*parseInt(j/24));
                }
                else{
                    var x = -310+(56*(j%12));
                    var y = -220+(70*parseInt(j/12));
                }
            }
            else if( side == "up"){
                var tempFold = cc.vv.mahjongmgr.myFold;
                if(cc.vv.MjNetMgr.conf.seatNum == 2){
                    var x = 600-(56*(j%24));
                    var y = 235-(70*parseInt(j/24));  
                }
                else{
                    var x = 310-(56*(j%12));
                    var y = 235-(70*parseInt(j/12));  
                }
            }
            else if(side == "right"){
                var tempFold = cc.vv.mahjongmgr.rightFold;
                var x = 120-(45*parseInt(j/10));     
                var y = -310+(31*(j%10));  
            }
            else{
                var tempFold = cc.vv.mahjongmgr.leftFold;
                var x = -90+(45*parseInt(j/10));     
                var y = 10-(31*(j%10));  
            }
            var fold = cc.instantiate(tempFold);
            if(side == "myself" || side == "right"){
                var num = folds.length-1-j;
                foldRoot.insertChild(fold,num);
            }
            else if(side == "up" || side == "left"){
                foldRoot.addChild(fold)
            }
            var cf = fold.getChildByName("CardFace");
            if(side == "up"){
                cf.angle = 180;
            }
            cf.getComponent(cc.Sprite).spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID(folds[j]);
            fold.x = x;
            fold.y = y;
            if(seatData.seatindex == cc.vv.MjNetMgr.turn){
                var redPot = cc.instantiate(cc.vv.mahjongmgr.redPot);
                fold.addChild(redPot);
                if(side == "myself"){
                    redPot.y += 70;
                }
                else{
                    redPot.y += 50;
                }
               
                redPot.getChildByName("sprite").getComponent(cc.Animation).play("retPot");
            }
        }
        else if(foldRoot.childrenCount - 1 == folds.length){
            if(side == "myself" || side == "right"){
                var lastIndex  = 0;          
            }
            else{
                var lastIndex = foldRoot.childrenCount - 1;
            }
            foldRoot.children[lastIndex].destroy();
            foldRoot.children[lastIndex].removeFromParent();
        }
        
    },
    hideRedpot:function(){
        var game = this.node.getChildByName("game");
        var sides = cc.vv.mahjongmgr._sides;
        for(var i = 0; i < sides.length; ++i){
            var sideName = sides[i];
            var sideRoot = game.getChildByName(sideName);
            var foldRoot = sideRoot.getChildByName("folds");
            if(sideName == "myself" || sideName == "right"){
                var fold = foldRoot.children[0]
            }
            else{
                var fold = foldRoot.children[foldRoot.childrenCount - 1];
            }
            if(fold){
                var redPot = fold.getChildByName("redPot");
                if(redPot){
                    redPot.destroy();
                    redPot.removeFromParent();
                }
            }
        }
    },
    setSpriteFrameByMJID:function(sprite,mjid){
        sprite.spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID(mjid);
        sprite.node.active = true;
    },
});
