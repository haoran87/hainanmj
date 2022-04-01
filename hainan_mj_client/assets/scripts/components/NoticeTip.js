cc.Class({
    extends: cc.Component,

    properties: {
        _guohu:null,
        _info:null,
        _guohuTime:-1,
    },

    // use this for initialization
    onLoad: function () {
        this._guohu = cc.find("Canvas/tip_notice");
        this._guohu.active = false;
        
        this._info = cc.find("Canvas/tip_notice/info").getComponent(cc.Label);
        
        var self = this;
        this.node.on('push_notice',function(data){
            var data = data;
            self._guohu.active = true;
            self._guohuTime = data.time;
            self._info.string = data.info;
        });
    },

    // called every frame, uncomment this function to activate update callback
    update: function (dt) {
       if(this._guohuTime > 0){
           this._guohuTime -= dt;
           if(this._guohuTime < 0){
               this._guohu.active = false;
           }
       }
    },
});
