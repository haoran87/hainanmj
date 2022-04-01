const {
    createCipher
} = require("crypto");

cc.Class({
    extends: cc.Component,
    properties: {
        actNum: cc.EditBox,
        infoData: null,
    },
    onLoad() {

    },
    onEnable() {

    },
    onDisable() {
        this.actNum.string = ""
        let memNode = this.node.parent.getChildByName("memberBox");
        memNode.getComponent("QuanMember").getMember()

    },
    confirmFunc() {
        let self = this;
        if (!this.actNum.string || parseInt(this.actNum.string) <= 0) {
            cc.vv.alert.tip({
                msg: "输入的活力值必须大于0"
            })
            return;
        }
        var onGet = function (ret) {
            cc.vv.alert.tip({
                msg: ret.errmsg,
                suc: function () {
                    self.cancelFunc()
                }
            })
        }
        this.infoData.num = parseInt(this.actNum.string)
        cc.vv.http.sendRequest("/update_user_coins", this.infoData, onGet)
    },
    cancelFunc() {
        this.node.active = false;
    },
    init(data) {
        this.infoData = data;
        var str = "增加活力值"
        if (data.statu == 2) {
            str = "减少活力值"
        }
        this.node.getChildByName("title").getComponent(cc.Label).string = str;
        this.node.getChildByName("nic").getComponent(cc.Label).string = data.nic;
        this.node.getChildByName("id").getComponent(cc.Label).string = "ID:" + data.user;
        this.node.getChildByName("coins").getComponent(cc.Label).string = "当前活力值:" + data.coins;
    }
})