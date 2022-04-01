const Buffer = require("buffer").Buffer;
cc.Class({
     extends: cc.Component,
     properties:{
        userItem:{
            default: null,
            type: cc.Prefab, 
        },
        userContent:cc.Node,
        keyword:cc.EditBox,
     },
     onLoad(){
         
     },
     onEnable(){
          console.log("圈成员showhsow",cc.vv.Quan._quanID)
          this.getMember()
      },
      onDisable(){
          console.log("圈成员hide")
      },
      exit(){
           this.node.active =false;
      },
      getMember: function () {
          var self = this;
          var data = {
              quanId: cc.vv.Quan._quanID,
              keyword:this.keyword.string,
          }
          var onGet = function (ret) {
              if (ret.errcode == 0) {
                  self.updateMembers(ret.data);
              } else {
                self.updateMembers([]);
                  cc.vv.alert.show("提示", ret.errmsg)
              }
          }
          cc.vv.http.sendRequest("/get_quan_member", data, onGet)
      },
      updateMembers: function (data) {
        console.log("updateMembers 执行了")
        if (data.length == 0) {
            
        } else {
            for (var i = 0; i < data.length; i++) {
                var user = data[i]
                // info.altname = Buffer.from(info.altname, 'base64').toString();
                var node = this.getViewItem(this.userContent, i, this.userItem);
                let info = node.getChildByName("info")
                user._nic =  Buffer.from(user.name, 'base64').toString()
                info.getChildByName("nic").getComponent(cc.Label).string =  user._nic;
                info.getChildByName("ID").getComponent(cc.Label).string = "ID:"+user.userid
                info.getChildByName("qz").active = user.userid == cc.vv.Quan._creator;
                var imgLoader =  info.getChildByName("headimg").getChildByName("head").getComponent("ImageLoader");
                imgLoader.setUserID(user.userid);
                node.getChildByName("actNum").getComponent(cc.Label).string = user.coins
                let showbtn = cc.vv.userMgr.userId == cc.vv.Quan._creator && (user.userid != cc.vv.userMgr.userId && user.userid != cc.vv.Quan._creator)
                node.getChildByName("addbtn").active = showbtn;
                node.getChildByName("reducebtn").active = showbtn;
                node._userid = user.userid
                node._nic = user._nic
                node._coins = user.coins
                cc.vv.utils.addClickEvent(node.getChildByName("addbtn"), this.node, "QuanMember", "addClick",1);
                cc.vv.utils.addClickEvent(node.getChildByName("reducebtn"), this.node, "QuanMember", "addClick",2);
               
            }
        }
        this.shrinkContent(this.userContent, data.length);
    },
    getViewItem: function (content, index, tempNode) {
        // cc.resources.load("prefabs/prefab", function (err, prefab) {
        //     var newNode = cc.instantiate(prefab);
        //     cc.director.getScene().addChild(newNode);
        // });
        if (content.childrenCount > index) {
            return content.children[index];
        }
        var node = cc.instantiate(tempNode);
        console.log("content.y ==" + content.y)
        console.log("tempnode.y ==" + node.y)
        var hg = node.height + 20;
        node.y = node.y - hg * index;
        console.log("node.y ==" + node.y)
        content.addChild(node);
        content.height = hg * (index + 1)
        console.log("content 高度 ==" + content.height)
        return node;
    },
    shrinkContent: function (content, num) {
        while (content.childrenCount > num) {
            var lastOne = content.children[content.childrenCount - 1];
            lastOne.destroy();
            content.removeChild(lastOne, true);
        }
        content.active = true
    },
    addClick(event,cuatomEventData){
        let self = this;
        var onGet = function(ret){
            if(ret.errcode == 0){
                let data = {
                    coins:event.target.parent._coins,
                    nic:event.target.parent._nic,
                    user:event.target.parent._userid,
                    admin:cc.vv.userMgr.userId,
                    statu:cuatomEventData
                }
                let coinNode =  self.node.parent.getChildByName("addCoins");
                coinNode.getComponent("QuanUserCoins").init(data)
                coinNode.active = true;
            }
            else{
                cc.vv.alert.tip({
                    msg:ret.errmsg
                })
            }
        }
        cc.vv.http.sendRequest("/check_user_game",{userId:event.target.parent._userid},onGet)
    }
})