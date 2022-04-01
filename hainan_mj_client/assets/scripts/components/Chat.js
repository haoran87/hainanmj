cc.Class({
    extends: cc.Component,

    properties: {
        _chatRoot:null,
        _tabQuick:null,
        _tabEmoji:null,
        _iptChat:null,
        _chatItem:null,
        _chatContent:null,
        
        _quickChatInfo:null,
        _btnChat:null,
        _chatTexts:[],
        _chatTexts2:[],
    },

    // use this for initialization
    onLoad: function () {
        if(cc.vv == null){
            return;
        }
        
        cc.vv.chat = this;
        
        this._btnChat = this.node.getChildByName("btn_chat");
        this._btnChat.active = !cc.vv.replayMgr.isReplay();
        
        this._chatRoot = this.node.getChildByName("chat");
        this._chatRoot.active = false;
        var btnClose = this._chatRoot.getChildByName("close");
        btnClose.on("click",this.onBgClicked,this);
        var btnSend = this._chatRoot.getChildByName("btnSend");
        btnSend.on("click",this.onBtnSendChatClicked,this);
        this._tabQuick = this._chatRoot.getChildByName("quickchatlist");
        this._chatContent = this._tabQuick.getChildByName("view").getChildByName("content");
        this._tabEmoji = this._chatRoot.getChildByName("emojis");
        
        this._iptChat = this._chatRoot.getChildByName("iptChat").getComponent(cc.EditBox);
        
        this._chatTexts2 = [
            "很高兴见到你，让我多胡几把嘛",
            "长夜无心睡眠，小女子这厢有礼",
            "快点吧！我等的花都谢啦",
            "再不出牌，姐姐我会月亮宫了",
            "又断线了，网络怎么这么差啊",
            "不要走决战到天亮",
            "无尽的等待，无尽的寂寞啊",
            "这么慢，奴家都急死了",
            "快点啦，人家还要去做面膜呢",
        ];
        this._chatTexts = [
            "妹子，能告诉我你的联系方式吗？",
            "长夜漫漫，没想到姑娘也没睡",
            "快点啊！都等我花都谢了",
            "快快，甭考验本大王耐心",
            "怎么又断线了，网络怎么这么差呀！",
            "不要走决战到天亮啊",
            "胜负已分，快投降吧",
            "君子报仇，时间不晚",
            "财运来的时候，真是挡也挡不住啊",
        ]
        for(var i = 0 ; i < this._chatContent.childrenCount ; i++){
            var item = this._chatContent.children[i];
            if(cc.vv.userMgr.sex == 2){
                item.getChildByName("label").getComponent(cc.Label).string = this._chatTexts2[i];
            }
            else{
                item.getChildByName("label").getComponent(cc.Label).string = this._chatTexts[i];
            }
          
            item.chatId = i;
            item.on("click",this.onQuickChatItemClicked,this);
        }
    },
    
    onBtnChatClicked:function(){
        this._chatRoot.active = true;
    },
    
    onBgClicked:function(){
        this._chatRoot.active = false;
    },
    
    onQuickChatItemClicked:function(event){
        this._chatRoot.active = false;
        var info = {};
        info.index = event.target.parent.chatId;
        var sound = "chat_"+(event.target.parent.chatId+1);
        if (cc.vv.userMgr.sex == 2) {
            sound = "girl/" + sound;
        }
        else {
            sound = "boy/" + sound;
        }
        info.sound = sound;
        info.sex = cc.vv.userMgr.sex;
        cc.vv.net.send("quick_chat",info);
    },
    
    onEmojiItemClicked:function(event){
        console.log(event.target.name);
        this._chatRoot.active = false;
        cc.vv.net.send("emoji",event.target.name);
    },
    
    onBtnSendChatClicked:function(){
        this._chatRoot.active = false;
        if(this._iptChat.string == ""){
            return;
        }
        cc.vv.net.send("chat",this._iptChat.string);
        this._iptChat.string = "";
    },

    // called every frame, uncomment this function to activate update callback
    // update: function (dt) {

    // },
});
