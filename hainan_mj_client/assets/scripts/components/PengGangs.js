cc.Class({
    extends: cc.Component,

    properties: {

    },
    onLoad: function () {
        if (!cc.vv) {
            return;
        }

        var gameChild = this.node.getChildByName("game");
        var myself = gameChild.getChildByName("myself");
        var pengangroot = myself.getChildByName("penggangs");
        var realwidth = cc.view.getVisibleSize().width;
        var scale = realwidth / 1280;
        pengangroot.scaleX *= scale;
        pengangroot.scaleY *= scale;

        var self = this;
        this.node.on('peng_notify', function (data) {
            var data = data;
            self.onPengGangChanged(data);
        });

        this.node.on('gang_notify', function (data) {
            var data = data;
            self.onPengGangChanged(data.seatData);
        });

        this.node.on('game_begin', function (data) {
            self.initAllCPG();
        });

        this.node.on('chi_notify', function (data) {
            var data = data;
            self.onPengGangChanged(data);
        });
    },
    start:function(){
        var seats = cc.vv.MjNetMgr.seats;
        for (var i in seats) {
            this.onPengGangChanged(seats[i]);
        }
    },
    initAllCPG: function () {
        var sides = cc.vv.mahjongmgr._sides;
        for (var i = 0; i < sides.length; i++) {
            this.hideSide(sides[i]);
        }
    },

    hideSide: function (side) {
        var gameChild = this.node.getChildByName("game");
        var myself = gameChild.getChildByName(side);
        var pengangroot = myself.getChildByName("penggangs");
        pengangroot.destroyAllChildren();
        pengangroot.removeAllChildren();
    },

    onPengGangChanged: function (seatData) {
        if (seatData.angangs == null &&
            seatData.diangangs == null &&
            seatData.wangangs == null &&
            seatData.pengs == null
        ) {
            return;
        }
        var seatindex = seatData.seatindex;
        var localIndex = cc.vv.MjNetMgr.getLocalIndex(seatData.seatindex);
        var side = cc.vv.mahjongmgr.getSide(localIndex);
        var gameChild = this.node.getChildByName("game");
        var sideObj = gameChild.getChildByName(side);
        var pengangroot = sideObj.getChildByName("penggangs");
        pengangroot.destroyAllChildren();
        pengangroot.removeAllChildren();
        //初始化杠牌
        var index = 0;

        var gangs = seatData.angangs
        for (var i = 0; i < gangs.length; ++i) {
            var mjid = gangs[i].pai;
            var target = gangs[i].target;
            this.initPengAndGangs(pengangroot, side, index, mjid, "angang",target,seatindex);
            index++;
        }
        var gangs = seatData.diangangs
        for (var i = 0; i < gangs.length; ++i) {
            var mjid = gangs[i].pai;
            var target = gangs[i].target;
            this.initPengAndGangs(pengangroot, side, index, mjid, "diangang",target,seatindex);
            index++;
        }

        var gangs = seatData.wangangs
        for (var i = 0; i < gangs.length; ++i) {
            var mjid = gangs[i].pai;
            var target = gangs[i].target;
            this.initPengAndGangs(pengangroot, side, index, mjid, "wangang",target,seatindex);
            index++;
        }

        //初始化碰牌
        var pengs = seatData.pengs
        if (pengs) {
            for (var i = 0; i < pengs.length; ++i) {
                var mjid = pengs[i].pai;
                var target = pengs[i].target;
                this.initPengAndGangs(pengangroot, side, index, mjid, "peng",target,seatindex);
                index++;
            }
        }

        var chis = seatData.chis;
        if (chis) {
            for (var i = 0; i < chis.length; i++) {
                var mjid = chis[i];
                this.initPengAndGangs(pengangroot, side, index, mjid, "chi",-1,seatindex);
                index++;
            }
        }
    },

    initPengAndGangs: function (pengangroot, side, index, mjid, flag,target,seatindex) {
        var pgroot = null;
        if (pengangroot.childrenCount <= index) {
            if (side == "left") {
                pgroot = cc.instantiate(cc.vv.mahjongmgr.pgcLeft);
            }
            else if (side == "right") {
                pgroot = cc.instantiate(cc.vv.mahjongmgr.pgcRight);
            } 
            else {
                pgroot = cc.instantiate(cc.vv.mahjongmgr.pgcSelf);
            }
            pengangroot.addChild(pgroot);
        }

        if (side == "left") {
            pgroot.y = -(index * 32 * 3);
        } else if (side == "right") {
            pgroot.y = (index * 32 * 3);
            pgroot.zIndex = -index;
        } else if (side == "myself") {
            pgroot.x = index * 65 * 3 + index * 10;
        } else if (side == "up"){
            pgroot.x = -(index * 65 * 3);
            for(var c = 0 ; c < pgroot.childrenCount ; c++){
                var pp = pgroot.children[c].getChildByName("CardFace");
                pp.angle = 180;
            }
        }

        if(target != -1){
            var loc = cc.vv.MjNetMgr.getLocalIndex(seatindex)
           var targetLoc = cc.vv.MjNetMgr.getLocalIndex(target)
           var seatNum = cc.vv.MjNetMgr.conf.seatNum;
           if(seatNum == 4){
            if(side == "up" || side == "right"){
                var num =  ((targetLoc - loc)+seatNum)%seatNum
               }
               else{
                var num = seatNum - ((targetLoc - loc)+seatNum)%seatNum;
               }
           }
           else if(seatNum == 3){
               if((targetLoc > loc && targetLoc - loc == 1) || (targetLoc < loc && targetLoc - loc == -2)){
                var num = side == "right"?1:3;
               }
               else{
                var num = side == "right"?3:1;
               }
           }
           else if(seatNum == 2){
                var num = side == "up"?3:1;
           }
           var cpname = "cp"+num;
        }
        var sprites = pgroot.children;
        for (var s = 0; s < sprites.length; ++s) {
            var sprite = sprites[s];
            var cf = sprite.getChildByName("CardFace")   
            cf.active = false;
            if (sprite.name == "gang") {
                var isGang = true;
                if (flag == 'peng' || flag == 'chi') {
                    isGang = false;
                }
                sprite.active = isGang;
                sprite.scaleX = 0.35;
                sprite.scaleY = 0.35;
                if (side == "myself" || side == "up") {
                    sprite.scaleX = 0.7;
                    sprite.scaleY = 0.7;
                }
                if ( cpname == "cp2" || (flag == "angang" && side != 'myself')) {//
                    sprite.getComponent(cc.Sprite).spriteFrame = cc.vv.mahjongmgr.getEmptySpriteFrame(side);
                } else {
                    cf.getComponent(cc.Sprite).spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID(mjid);
                    cf.active = true;
                }
            } else {
                sprite.scaleX = 0.35;
                sprite.scaleY = 0.35;
                if (side == "myself" || side == "up") {
                    sprite.scaleX = 0.7;
                    sprite.scaleY = 0.7;
                }
                if ( flag == 'angang') {//side != 'myself' &&
                    sprite.getComponent(cc.Sprite).spriteFrame = cc.vv.mahjongmgr.getEmptySpriteFrame(side);
                } else {
                    if (flag == "chi") {
                        if (sprite.name == "cp1") {
                            if(side == "up" || side == "right"){
                                cf.getComponent(cc.Sprite).spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID(mjid.p3);
                            }
                            else{
                                cf.getComponent(cc.Sprite).spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID(mjid.p1);
                            }
                           
                        } else if (sprite.name == "cp2") {
                            cf.getComponent(cc.Sprite).spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID(mjid.p2);
                        } else if (sprite.name == "cp3") {
                            if(side == "up" || side == "right"){
                                cf.getComponent(cc.Sprite).spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID(mjid.p1);
                            }
                            else{
                                cf.getComponent(cc.Sprite).spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID(mjid.p3);
                            }
                        }
                        cf.active = true;
                    } else {
                        if(sprite.name == cpname){
                            sprite.getComponent(cc.Sprite).spriteFrame = cc.vv.mahjongmgr.getEmptySpriteFrame(side);
                        }
                        else{
                            cf.getComponent(cc.Sprite).spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID(mjid);
                            cf.active = true;
                        }
                        
                    }
                    
                }
            }
        }
    },
});