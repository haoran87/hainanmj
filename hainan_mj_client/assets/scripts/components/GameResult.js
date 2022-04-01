cc.Class({
    extends: cc.Component,

    properties: {
        _gameresult:null,
        _seats:[],
    },

    // use this for initialization
    onLoad: function () {
        if(cc.vv == null){
            return;
        }
        
        this._gameresult = this.node.getChildByName("game_result");
        
        var seats = this._gameresult.getChildByName("seats");
        var seatNum = cc.vv.MjNetMgr.conf.seatNum;
        for(var i = 0; i < seats.children.length; ++i){
            if(seatNum == 2 && i < seatNum){
                seats.children[i].x += 240;
            }
            if(seatNum == 3 && i < seatNum){
                seats.children[i].x += 120;
            }
            seats.children[i].active = false;
        }
        
        var btnClose = cc.find("Canvas/game_result/bg/btnClose");
        if(btnClose){
            cc.vv.utils.addClickEvent(btnClose,this.node,"GameResult","onBtnCloseClicked");
        }
        
        var btnShare = cc.find("Canvas/game_result/btnSharewx");
        if(btnShare){
            cc.vv.utils.addClickEvent(btnShare,this.node,"GameResult","onBtnSharewxClicked");
        }

        var btnCopy = cc.find("Canvas/game_result/btnCopy");
        if(btnCopy){
            cc.vv.utils.addClickEvent(btnCopy,this.node,"GameResult","onBtnCopyClicked");
        }
        //初始化网络事件监听器
        var self = this;
        this.node.on('game_end',function(data){
            self.onGameEnd(data);
            if(data.isForce){
                cc.find("Canvas/popups").active = false;
                // cc.find("Canvas/location").active = false;
                cc.find("Canvas/game_result").active = true;
            }
        });
    },
    
    showResult:function(node,info,isfangzhu,isBigwin,seat){
        node.getChildByName("fangzhu").active = isfangzhu;
        node.getChildByName("zimocishu").getComponent(cc.Label).string = info.numzimo;
        node.getChildByName("jiepaocishu").getComponent(cc.Label).string = info.numjiepao;
        node.getChildByName("dianpaocishu").getComponent(cc.Label).string = info.numdianpao;
        node.getChildByName("angangshu").getComponent(cc.Label).string = info.numAnGang;
        node.getChildByName("minggangshu").getComponent(cc.Label).string = info.numMingGang;
        node.getChildByName("score").getComponent(cc.Label).string = info.score;
        node.getChildByName("name").getComponent(cc.Label).string = seat.name;
        node.getChildByName("id").getComponent(cc.Label).string = seat.userid;
        node.getChildByName("dayingjia").active = isBigwin;
        node.getChildByName("win_bg").active = isBigwin;
        node.getChildByName("icon").getComponent("ImageLoader").setUserID(seat.userid);
        node.active = true;
    },
    
    onGameEnd:function(data){
        let endinfo = data.endinfo
        var seats = cc.vv.MjNetMgr.seats;
        var maxscore = -1;
        for(var i = 0; i < seats.length; ++i){
            var seat = seats[i];
            if(seat.score > maxscore){
                maxscore = seat.score;
            }
        }
        var resultSeats = this._gameresult.getChildByName("seats").children;
        this._gameresult.getChildByName("room_num").getComponent(cc.Label).string = "房间号："+data.roomId;
        this._gameresult.getChildByName("time").getComponent(cc.Label).string =cc.vv.utils.timeShow(data.time);
        let quanStr = ""
        if(data.quanId){
            quanStr = "亲友圈名："+data.quanMing+" 亲友圈ID："+data.quanId
        }
        this._gameresult.getChildByName("quan_info").getComponent(cc.Label).string =quanStr;
        for(var i = 0; i < seats.length; ++i){
            var seat = seats[i];
            var isBigwin = false;
            if(seat.score > 0){
                isBigwin = seat.score == maxscore;
            }
            var isfangzhu = seat.userid == cc.vv.MjNetMgr.conf.creator;
            // this._seats[i].setInfo(seat.name,seat.score, isBigwin);
            // this._seats[i].setID(seat.userid);
            if(data.quanId){
                resultSeats[i].getChildByName("actNum").active = true;
                // let actStr = endinfo[i].actNum > 0 ? "+"+endinfo[i].actNum:endinfo[i].actNum;
                resultSeats[i].getChildByName("actNum").getComponent(cc.Label).string = "活力值:"+endinfo[i].actNum
            }
            else{
                resultSeats[i].getChildByName("actNum").active = false;
            }
            this.showResult(resultSeats[i],endinfo[i],isfangzhu,isBigwin,seat);
        }
    },
    
    onBtnCloseClicked:function(){
        cc.vv.MjNetMgr.roomId = null;
        cc.vv.MjNetMgr.turn = -1;
        cc.vv.MjNetMgr.seats = null;
        cc.vv.MjNetMgr.maxNumOfGames = 0;
        cc.vv.MjNetMgr.numOfGames = 0;
        cc.director.loadScene("hall");
    },
    
    onBtnSharewxClicked:function(){
        cc.vv.anysdkMgr.shareResult(1);
    },
    // onBtnSharexlClicked:function(){
    //     cc.vv.anysdkMgr.shareResult(2);
    // },
    onBtnCopyClicked:function(){
        var seats = cc.vv.MjNetMgr.seats;
        var time = cc.vv.MjNetMgr.conf.createTime;
        var roomId = cc.find("Canvas/infobar/Z_room_txt").getComponent(cc.Label).string;
        var str = ""
        for(var i = 0 ; i < seats.length ; i++){
            var s = seats[i];
            if(str.length == 0){
                str += s.name+"[ID:"+s.userid+"]: "+s.score+"分"
            }
            else{
               str += "\n"+ s.name+"[ID:"+s.userid+"]: "+s.score+"分"
            }
        }
        str = "【海南麻将】 "+ roomId+" "+cc.vv.MjNetMgr.maxNumOfGames+'局 时间:'+this.dateFormat(time*1000)+"\n"+str;
        console.log("复制战绩内容  "+str)
        cc.vv.anysdkMgr.JsCopy(str);
    },
    dateFormat:function(time){
        var date = new Date(time);
        var datetime = "{0}-{1}-{2} {3}:{4}:{5}";
        var year = date.getFullYear();
        var month = date.getMonth() + 1;
        month = month >= 10? month : ("0"+month);
        var day = date.getDate();
        day = day >= 10? day : ("0"+day);
        var h = date.getHours();
        h = h >= 10? h : ("0"+h);
        var m = date.getMinutes();
        m = m >= 10? m : ("0"+m);
        var s = date.getSeconds();
        s = s >= 10? s : ("0"+s);
        datetime = datetime.format(year,month,day,h,m,s);
        return datetime;
    },
});
