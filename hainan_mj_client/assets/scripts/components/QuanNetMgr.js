cc.Class({
    extends: cc.Component,
    properties:{
     
    },
    initHandlers:function(){
        var self = this;
        cc.vv.net.addHandler("quan_hello_push",function(data){
            console.log("圈子推送过来的",data)
        })
        cc.vv.net.addHandler("get_applay_message",function(data){
            console.log("圈子获取申请信息",data)
            if(cc.vv.Quan && cc.vv.Quan._quanID==data.quanId && cc.vv.Quan._creator == data.creator ){
                cc.vv.Quan.showReddot()
            }
            
        })
        cc.vv.net.addHandler("update_user_quans_push",function(data){
            console.log("更新圈子",data,data.userId)
            if( cc.vv.joinQuan && cc.vv.userMgr.userId == data.userId  ){
                cc.vv.joinQuan.getQuans(cc.vv.userMgr.userId)
            }
            
        })
    }
})