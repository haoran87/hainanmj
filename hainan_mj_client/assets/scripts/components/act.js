const { throws } = require("assert");

cc.Class({
    extends: cc.Component,
    properties: {
        act:cc.Sprite,
        actBox:cc.Node,
        actItem:{
            default: null,
            type: cc.Prefab, 
        },
        _actIndex:0,
    },
    onLoad(){

    },
    onEnable(){
        this._actIndex = 0
        this.getAct()
    },
    onDisable(){

    },
    getAct(){
        let self = this;
        var onGet = function(ret){
            if(ret.errcode == 0){
                self.updateActBtn(ret.data)
            }
            else{
                self.shrinkContent(self.actBox,0)
                self.act.node.active = false;
                cc.vv.alert.tip({
                    msg:ret.errmsg
                })
            }
        }
        cc.vv.http.sendRequest("/get_act_content",{},onGet)
    },
    actClick(event){
        this._actIndex = event.target._index;
        for(let i = 0 ; i < this.actBox.childrenCount ; i++){
            this.actBox.children[i].getComponent(cc.Button).interactable = true;
        }
        this.refreshAct()
    },
    updateActBtn(data){
        if(data.length > 0){
            for (var i = 0; i < data.length; i++) {
                var node = this.getViewItem(this.actBox, i, this.actItem);
                node.getChildByName("name").getComponent(cc.Label).string = data[i].title;
                node._imgUrl = data[i].act_img;
                node._index = i;
                node.getComponent(cc.Button).interactable = true;
                cc.vv.utils.addClickEvent(node, this.node, "act", "actClick");
            }
            this.refreshAct()
        }
    },
    getViewItem: function (content, index, tempNode) {
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
    refreshAct(){
        this.actBox.children[this._actIndex].getComponent(cc.Button).interactable = false;
        let url = this.actBox.children[this._actIndex]._imgUrl
        console.log("加载的图片",url)
        this.loadImage(url)
    },
    loadImage(url) {
        let self  = this;
        cc.loader.load(url, function (err, texture) {
            if (texture) {
                var spriteFrame = new cc.SpriteFrame(texture);
                spriteFrame.width = texture.height || 50;
                spriteFrame.height = texture.width || 50;
                if(err){
                 cc.vv.alert.tip({
                     msg:"活动内容加载失败"
                 })   
                }
                else{
                    self.act.spriteFrame = spriteFrame
                }
            } else {
                cc.vv.alert.tip({
                    msg:"活动内容加载失败"
                })   
            }
        })
    },
    shrinkContent: function (content, num) {
        while (content.childrenCount > num) {
            var lastOne = content.children[content.childrenCount - 1];
            lastOne.destroy();
            content.removeChild(lastOne, true);
        }
    },
})