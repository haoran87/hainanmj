// const { createCipher } = require("crypto");
const Buffer = require("buffer").Buffer;
cc.Class({
    extends: cc.Component,
    properties: {
        siren: {
            default: null,
            type: cc.Prefab,
        },
        sanren: {
            default: null,
            type: cc.Prefab,
        },
        eren: {
            default: null,
            type: cc.Prefab,
        },
        content: cc.Node,
    },
    onLoad() {
        console.log("圈桌加载")
    },
    onEnable() {
        console.log("圈桌showhsow", cc.vv.Quan._quanID)
        this.getZhuos()
    },
    onDisable() {
        console.log("圈桌hide")
    },
    getZhuos() {
        var self = this;
        var onGet = function (ret) {
            cc.vv.wc.hide()
            console.log("获取到的桌", ret)
            if (ret.errcode == 0) {
                var rData = ret.zhuos;
                self.updateZhuos(rData);
            } else {
                cc.vv.alert.show("提示", "获取亲友圈信息错误 errcode = " + ret.errcode)
            }
        }
        var data = {
            quanId: cc.vv.Quan._quanID,
        }
        cc.vv.wc.show()
        cc.vv.http.sendRequest("/get_zhuos", data, onGet)
    },
    updateZhuos: function (zhuos) {
        if (zhuos.length == 0) {
            this.shrinkContent(this.content, zhuos.length);
        } else {
            for (var i = 0; i < zhuos.length; i++) {
                let zhuo = zhuos[i];
                let info = zhuo.base_info;
                let temNode = this.siren;
                if (info == 3) {
                    temNode = this.sanren;
                }
                if (info == 2) {
                    temNode = this.eren;
                }
                var node = this.getViewItem(this.content, i, temNode);
                node.roomId = zhuo.id;
                cc.vv.utils.addClickEvent(node, this.node, "QuanZhuo", "zhuoClick");
                var childs = node.getChildByName("seats").children;
                for (var n = 0; n < childs.length; n++) {
                    let child = childs[n];
                    child.getChildByName("name").getComponent(cc.Label).string = Buffer.from(zhuo["user_name" + n], 'base64').toString();
                    let headimg = child.getChildByName("headimg")
                    let user_id = zhuo["user_id" + n]
                    if (headimg) {
                        if(user_id){
                            var imgLoader = headimg.getChildByName("head").getComponent("ImageLoader");
                            imgLoader.setUserID(user_id);
                            headimg.active = true;
                        }
                        else{
                            headimg.active = false;
                        }    
                    }
                } 
            }
        }
        this.shrinkContent(this.content, zhuos.length);
    },
    getViewItem: function (content, index, tempNode, cNum) {
        if (content.childrenCount > index) {
            return content.children[index];
        }
        var node = cc.instantiate(tempNode);
        console.log("content.y ==" + content.y)
        console.log("tempnode.y ==" + node.y)
        var hg = node.height + 30;
        var yNum = Math.floor(index / 3)
        node.y = node.y - hg * yNum;
        console.log("node.y ==" + node.y)
        node.x = node.x + (node.width + 30) * (index % 3);
        content.addChild(node);
        content.height = hg * (yNum + 1)
        console.log("content 高度 ==" + content.height)
        return node;
    },
    shrinkContent: function (content, num) {
        while (content.childrenCount > num) {
            var lastOne = content.children[content.childrenCount - 1];
            lastOne.destroy();
            content.removeChild(lastOne, true);
        }
    },
    zhuoClick(event) {
        let roomId = event.target.roomId;
        cc.vv.wc.show()
        cc.vv.userMgr.enterRoom(roomId)
        console.log("选中的房间", event.target.roomId)
    }
})