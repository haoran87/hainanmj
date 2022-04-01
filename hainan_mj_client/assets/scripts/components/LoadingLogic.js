cc.Class({
    extends: cc.Component,

    properties: {
        tipLabel:cc.Label,
        _stateStr:'',
        _progress:0.0,
        _isLoading:false,
    },

    // use this for initialization
    onLoad: function () {
        cc.debug.setDisplayStats(false);
        if(!cc.sys.isNative && cc.sys.isMobile){
            var cvs = this.node.getComponent(cc.Canvas);
            cvs.fitHeight = true;
            cvs.fitWidth = true;
        }
        this.initMgr();
        this.tipLabel.string = this._stateStr;
        
    },
    
    start:function(){        
        var self = this;
        this.checkVersion();
    },
    
    initMgr:function(){
        cc.vv = {};
        var UserMgr = require("UserMgr");
        cc.vv.userMgr = new UserMgr();
        
        var ReplayMgr = require("ReplayMgr");
        cc.vv.replayMgr = new ReplayMgr();
        
        cc.vv.http = require("HTTP");
        cc.vv.global = require("Global");
        cc.vv.net = require("Net");

        var MjNetMgr = require("MjNetMgr");
        cc.vv.MjNetMgr = new MjNetMgr();
        cc.vv.MjNetMgr.initHandlers();
        
        var QuanNetMgr = require("QuanNetMgr");
        cc.vv.QuanNetMgr = new QuanNetMgr();
        cc.vv.QuanNetMgr.initHandlers();

        var AnysdkMgr = require("AnysdkMgr");
        cc.vv.anysdkMgr = new AnysdkMgr();
        cc.vv.anysdkMgr.init();
        
        var VoiceMgr = require("VoiceMgr");
        cc.vv.voiceMgr = new VoiceMgr();
        cc.vv.voiceMgr.init();
        
        var AudioMgr = require("AudioMgr");
        cc.vv.audioMgr = new AudioMgr();
        cc.vv.audioMgr.init();
        
        var Utils = require("Utils");
        cc.vv.utils = new Utils();

        cc.vv.mapInfo = -1;
        cc.vv.hallTimer = null;
        
        cc.args = this.urlParse();
        cc.vv.ishoutai = false;
        cc.vv.toolTarget = -1;
        cc.vv.gameConfText = {
            zhuangxian:"庄闲",
            lianzhuang:'连庄',
            shangga:"上噶",
            zyshangga:"自由上噶",
            liuju:"流局算分",
            huahu:"花胡",
            wuzi:"无字牌",
            ling:"叫令",
            goujiao:"防勾脚",
            buchi:"不可吃",
            haidibao:"海底包牌",
            budianpao:"不可点炮",
            shangga3:"首局上3噶",
            shangga5:"首局上5噶",
            maxga3:"最大上3噶",
            fixga3:"固定上3噶",
            hunyise:"混一色",
            mogangfan:"摸杠翻倍",
            sjzhuang:"随机庄",
            ready:"准备",
        }
        cc.director.preloadScene("hall");
        cc.director.preloadScene("mjgame");
    },
    urlParse:function(){
        var params = {};
        if(window.location == null){
            return params;
        }
        var name,value; 
        var str=window.location.href; //取得整个地址栏
        var num=str.indexOf("?") 
        str=str.substr(num+1); //取得所有参数   stringvar.substr(start [, length ]
        
        var arr=str.split("&"); //各个参数放到数组里
        for(var i=0;i < arr.length;i++){ 
            num=arr[i].indexOf("="); 
            if(num>0){ 
                name=arr[i].substring(0,num);
                value=arr[i].substr(num+1);
                params[name]=value;
            } 
        }
        return params;
    },
    
    checkVersion:function(){
        var self = this;
        var onGetVersion = function(ret){
            cc.vv.iOSPassed = ret.iOSPassed;
            if(ret.version == null){
                console.log("error.");
            }
            else{
                cc.vv.SI = ret;
                console.log("loadinglogic logic cc.vv.SI"+JSON.stringify(ret));
                if(ret.version != cc.VERSION){
                    // cc.find("Canvas/alert").active = true;
                }
                else{
                    // self.startPreloading();
                    self.onLoadComplete();
                }
            }
        };
        
        var xhr = null;
        var complete = false;
        var fnRequest = function(){
            self._stateStr = "";
            xhr = cc.vv.http.sendRequest("/get_serverinfo",null,function(ret){
                xhr = null;
                complete = true;
                onGetVersion(ret);
            });
            setTimeout(fn,5000);            
        }
        var fn = function(){
            if(!complete){
                if(xhr){
                    // xhr.abort();
                    // self._stateStr = "";
                    // setTimeout(function(){
                    //     fnRequest();
                    // },5000);
                }
                else{
                    fnRequest();
                }
            }
        };
        fn();
    },
    
    onBtnDownloadClicked:function(){
        cc.sys.openURL(cc.vv.SI.appweb);
    },
    
    startPreloading:function(){
        this._stateStr = "";
        this._isLoading = true;
        var self = this;
        self.onLoadComplete();
    },
    
    onLoadComplete:function(){
        this._isLoading = false;
        this._stateStr = "";
        cc.vv.anysdkMgr.getMapInfo();
        var audioUrl = "sounds/yinxiao/button_click";
        cc.loader.loadRes(audioUrl, cc.AudioClip, function (err, clip) {
        });
        cc.director.loadScene("login");
        cc.loader.onComplete = null;
    },

    // called every frame, uncomment this function to activate update callback
    update: function (dt) {
        if(this._stateStr.length == 0){
            return;
        }
        this.tipLabel.string = this._stateStr + ' ';
        if (!this._progress) {
            this._progress = 0;
        }
        if(this._isLoading){
            this.tipLabel.string += Math.floor(this._progress * 100) + "%";
            {
                var progress = cc.find('Canvas/progress');
                var width = 453 * this._progress;
                progress.getComponent(cc.Slider).progress = this._progress;
                progress.getChildByName("progress").width = width;
            }
        }
        else{
            var t = Math.floor(Date.now() / 1000) % 4;
            for(var i = 0; i < t; ++ i){
                this.tipLabel.string += '.';
            }            
        }
    }
});