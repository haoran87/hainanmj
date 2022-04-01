var userMgr = require('./usermgr');
exports.listen=function(socket){
    socket.on("quan_hello",function(data){
        let userId = socket.userId
        userMgr.sendMsg(userId,"quan_hello_push",{msg:"接收到了你的消息了"})
        console.log("圈监听了",data)
    })
}