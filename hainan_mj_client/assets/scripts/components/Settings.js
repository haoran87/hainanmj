cc.Class({
    extends: cc.Component,

    properties: {
    },

    // use this for initialization
    onLoad: function () {
        if(cc.vv == null){
            return;
        }
        
        this.initButtonHandler(this.node.getChildByName("btn_close"));
        if(this.node.getChildByName("btn_exit")){
            this.initButtonHandler(this.node.getChildByName("btn_exit"));
        }
      
        

        var slider = this.node.getChildByName("yinxiao").getChildByName("progress");
        cc.vv.utils.addSlideEvent(slider,this.node,"Settings","onSlided");
        
        var slider = this.node.getChildByName("yinyue").getChildByName("progress");
        cc.vv.utils.addSlideEvent(slider,this.node,"Settings","onSlided");
        
        this.refreshVolume();
    },
    
    onSlided:function(slider){
        if(slider.node.parent.name == "yinxiao"){
            cc.vv.audioMgr.setSFXVolume(slider.progress);
        }
        else if(slider.node.parent.name == "yinyue"){
            cc.vv.audioMgr.setBGMVolume(slider.progress);
        }
        this.refreshVolume();
    },
    
    initButtonHandler:function(btn){
        cc.vv.utils.addClickEvent(btn,this.node,"Settings","onBtnClicked");    
    },
    
    refreshVolume:function(){
        
        var yx = this.node.getChildByName("yinxiao");
        var width = 467 * cc.vv.audioMgr.sfxVolume;
        var progress = yx.getChildByName("progress")
        progress.getComponent(cc.Slider).progress = cc.vv.audioMgr.sfxVolume;
        progress.getChildByName("progress").width = width;  
        //yx.getChildByName("btn_progress").x = progress.x + width;
        var yy = this.node.getChildByName("yinyue");
        var width = 467 * cc.vv.audioMgr.bgmVolume;
        var progress = yy.getChildByName("progress");
        progress.getComponent(cc.Slider).progress = cc.vv.audioMgr.bgmVolume; 
        
        progress.getChildByName("progress").width = width;
    },
    
    onBtnClicked:function(event){
        if(event.target.name == "btn_close"){
            this.node.active = false;
        }
        else if(event.target.name == "btn_exit"){
            cc.sys.localStorage.removeItem("wx_account");
            cc.sys.localStorage.removeItem("wx_sign");
            cc.vv.net.close();
            cc.director.loadScene("login");
        }
        else if(event.target.name == "btn_yx_open"){
            cc.vv.audioMgr.setSFXVolume(1.0);
            this.refreshVolume(); 
        }
        else if(event.target.name == "btn_yx_close"){
            cc.vv.audioMgr.setSFXVolume(0);
            this.refreshVolume();
        }
        else if(event.target.name == "btn_yy_open"){
            cc.vv.audioMgr.setBGMVolume(1);
            this.refreshVolume();
        }
        else if(event.target.name == "btn_yy_close"){
            cc.vv.audioMgr.setBGMVolume(0);
            this.refreshVolume();
        }
    },
    clearAll:function(event){
        console.log("点击了一键静音事件"+event.target.parent.name)
        var isChecked = event.target.parent.getComponent(cc.Toggle).isChecked;
        console.log("是否选择了 == "+isChecked)
        if(isChecked){
            var slider1 = this.node.getChildByName("yinxiao").getChildByName("progress").getComponent(cc.Slider);
            var slider2 = this.node.getChildByName("yinyue").getChildByName("progress").getComponent(cc.Slider);
            console.log("试试 == "+slider1.progress)
            cc.sys.localStorage.setItem("yinxiao", slider1.progress);
            cc.sys.localStorage.setItem("yinyue", slider2.progress);
            cc.vv.audioMgr.setSFXVolume(0);
            this.refreshVolume();
            cc.vv.audioMgr.setBGMVolume(0);
            this.refreshVolume();
            
        }
        else{
            var yxs =  cc.sys.localStorage.getItem("yinxiao");
            var yys = cc.sys.localStorage.getItem("yinyue");
            cc.vv.audioMgr.setSFXVolume(Number(yxs));
            this.refreshVolume();
            cc.vv.audioMgr.setBGMVolume(Number(yys));
            this.refreshVolume();
        }
    },
});
