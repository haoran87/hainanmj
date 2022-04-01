cc.Class({
    extends: cc.Component,

    properties: {
        quanName:cc.EditBox,
        isclicked:false,
    },

    // use this for initialization
    onLoad: function () {
       var btnConfirm = this.node.getChildByName("confirm");
       var btnCancel = this.node.getChildByName('cancel');
       btnConfirm.on("click",this.sendCreateQuan,this);
       btnCancel.on("click",this.cancel,this);
    },
    sendCreateQuan:function(){
        cc.vv.audioMgr.playClicked();
        var self = this;
        var str = this.quanName.string;
        if(str.length == 0){
            cc.vv.alert.show("提示","请给你的亲友圈起个名字！")
            return;
        }
        if(this.isclicked)return
        this.isclicked = true
        console.log("创建的亲友圈的名称 == "+str);
       var resultCallback = function(ret){
           self.isclicked = false;
           console.log("返回的结果代码 == "+ret.errcode+"   "+ ret)
            if(ret.errcode == 0){
                cc.vv.alert.show("提示","恭喜，创建亲友圈成功！ 亲友圈代码："+ret.id)
                self.cancel();
                // cc.vv.joinQuan.updateQuans(ret.data);
                cc.vv.joinQuan.getQuans(cc.vv.userMgr.userId)
            }
            else{
                if(ret.errcode == 4 ){
                    cc.vv.alert.show("提示","改亲友圈昵称已经存在了");
                }
                else{
                    cc.vv.alert.show("提示","创建亲友圈失败 错误代码:"+ret.errcode);
                }
            }
       }
        var data = {
            quanName:str,
            userId:cc.vv.userMgr.userId,
        }
        cc.vv.http.sendRequest("/create_quan",data,resultCallback)
    },
    cancel:function(){
        cc.vv.audioMgr.playClicked();
        this.quanName.string = "";
        this.node.active = false;
    },
    // called every frame, uncomment this function to activate update callback
    // update: function (dt) {

    // },
});
