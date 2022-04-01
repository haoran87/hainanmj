const Buffer = require("buffer").Buffer;
cc.Class({
    extends: cc.Component,
    properties: {
        recordItem: {
            default: null,
            type: cc.Prefab,
        },
        recordContent:cc.Node,
    },
    onLoad() {

    },
    onEnable() {
        this.getApplyRecord()
    },
    onDisable() {
        console.log("圈子申请记录hide")
        this.recordContent.active = false;
        this.node.getChildByName("tip").active = false;
    },
    exitRecord() {
        this.node.active = false
    },
    getApplyRecord: function () {
        var self = this;
        var data = {
            userId: cc.vv.userMgr.userId,
        }
        var onGet = function (ret) {
            if (ret.errcode == 0) {
                console.log("获取圈子申请记录成功= " + JSON.stringify(ret.mData))
                var data = ret.mData;
                self.updateRecordList(data)
            }
        }
        cc.vv.http.sendRequest("/get_quan_apply_message", data, onGet)
    },
    updateRecordList: function (data) {
        console.log("updateRecordList 执行了")
        if (data.length == 0) {
            this.node.getChildByName("tip").active = true;
        } else {
            this.node.getChildByName("tip").active = false;
            for (var i = 0; i < data.length; i++) {
                var info = data[i]
                // info.altname = Buffer.from(info.altname, 'base64').toString();
                var node = this.getViewItem(this.recordContent, i, this.recordItem);
                node.getChildByName("name").getComponent(cc.Label).string = info.quanname;
                node.getChildByName("id").getComponent(cc.Label).string = info.quanid;
                // node.getChildByName("applicant").getComponent(cc.Label).string = info.altname;
                if (info.status == 0) {
                    var istr = "待审核"
                }
                else if (info.status == 1) {
                    var istr = "已同意"
                }
                else if (info.status == 2) {
                    var istr = "已拒绝"
                }
                node.getChildByName("status").getComponent(cc.Label).string = istr;
            }
        }
        this.shrinkContent(this.recordContent, data.length);
    },
    getViewItem: function (content, index, tempNode) {
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
   
})