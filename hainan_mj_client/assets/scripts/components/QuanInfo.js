const Buffer = require("buffer").Buffer;
cc.Class({
    extends: cc.Component,
    properties: {
        infoItem: {
            default: null,
            type: cc.Prefab,
        },
        infoContent:cc.Node,
    },
    onLoad() {

    },
    onEnable() {
        console.log("圈子信息showhsow", cc.vv.Quan._creator)
        this.getReMessage()
    },
    onDisable() {
        console.log("圈子信息hide")
        this.infoContent.active = false;
        this.node.getChildByName("tip").active = false;
    },
    exitInfo() {
        this.node.active = false
    },
    getReMessage: function () {
        var self = this;
        if (cc.vv.userMgr.userId != cc.vv.Quan._creator) {
            return
        }
        var data = {
            userId: cc.vv.userMgr.userId,
            quanId: cc.vv.Quan._quanID,
        }
        var onGet = function (ret) {
            if (ret.errcode == 0) {
                console.log("获取圈子申请记录成功= " + JSON.stringify(ret.mData))
                var data = ret.mData;
                self.updateInfoList(data)
            }
        }
        cc.vv.http.sendRequest("/get_re_message", data, onGet)
    },
    updateInfoList: function (data) {
        console.log("updateinfolist 执行了")
        if (data.length == 0) {
            this.node.getChildByName("tip").active = true;
        } else {
            this.node.getChildByName("tip").active = false;
            for (var i = 0; i < data.length; i++) {
                var info = data[i]
                info.altname = Buffer.from(info.altname, 'base64').toString();
                var node = this.getViewItem(this.infoContent, i, this.infoItem);
                node.getChildByName("name").getComponent(cc.Label).string = info.quanname;
                node.getChildByName("id").getComponent(cc.Label).string = info.quanid;
                node.getChildByName("applicant").getComponent(cc.Label).string = info.altname;
                if (info.creator == cc.vv.userMgr.userId && info.status == 0) {
                    let confirm = node.getChildByName("confirm")
                    let refuse = node.getChildByName("refuse")
                    cc.vv.utils.addClickEvent(confirm, this.node, "QuanInfo", "infoClicked",1);
                    cc.vv.utils.addClickEvent(refuse, this.node, "QuanInfo", "infoClicked",2);
                    // confirm.active = true;
                    confirm.quanInfo = info;
                    // refuse.active = true;
                    refuse.quanInfo = info;
                    if (info.status == 0) {
                        var istr = "申请加入"
                    }
                    node.getChildByName("status").getComponent(cc.Label).string = istr;
                }
            }
        }
        this.shrinkContent(this.infoContent, data.length);
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
        var hg = node.height + 30;
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
    infoClicked: function (event, customEventData) {
        var self = this;
        var node = event.target;
        cc.vv.audioMgr.playClicked();
        var data = {
            quanInfo: JSON.stringify(node.quanInfo),
            result: customEventData,
        }
        cc.vv.alert.tip({
            msg:(customEventData==1?"同意 ":"拒绝 ")+node.quanInfo.altname+" 加入圈子",
            suc:function(){
                self.answer(data);
            },
            showcancel:true,
        })
    },
    answer(data){
        let self = this;
        console.log("回答的圈子信息",data.quanInfo,data.result)
        var onGet = function (ret) {
            if (ret.errcode == 0) {
                cc.vv.alert.show("提示", ret.errmsg)
                cc.vv.Quan.redDot.active = false;
                self.getReMessage()
            }

        };
        cc.vv.http.sendRequest("/answer_re_quan", data, onGet)
    }
})