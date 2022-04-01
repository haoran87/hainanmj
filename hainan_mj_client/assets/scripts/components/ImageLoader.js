function loadImage(url, code, callback) {
    cc.loader.load(url + ".png", function (err, texture) {
        // console.log("image err = " + err)
        // console.log(texture)
        if (texture) {
            var spriteFrame = new cc.SpriteFrame(texture);
            spriteFrame.width = texture.height || 50;
            spriteFrame.height = texture.width || 50;
            callback(err, spriteFrame)
        } else {
            callback(err, null)
        }
    })
};

function getBaseInfo(userid, callback) {
    if (cc.vv.baseInfoMap == null) {
        cc.vv.baseInfoMap = {};
    }

    if (cc.vv.baseInfoMap[userid] != null) {
        callback(userid, cc.vv.baseInfoMap[userid]);
    } else {
        cc.vv.http.sendRequest('/base_info', {
            userid: userid
        }, function (ret) {
            var url = null;
            if (ret.headimgurl) {
                url = ret.headimgurl;
            }
            var info = {
                name: ret.name,
                sex: ret.sex,
                url: url,
            }
            cc.vv.baseInfoMap[userid] = info;
            callback(userid, info);

        }, cc.vv.http.master_url);
    }
};

cc.Class({
    extends: cc.Component,
    properties: {},
    onLoad: function () {
        this.setupSpriteFrame();
    },

    setUserID: function (userid) {
        // if(cc.sys.isNative == false){
        //     return;
        // }
        if (!userid) {
            return;
        }
        if (cc.vv.images == null) {
            cc.vv.images = {};
        }
        var self = this;
        var url = "http://phoneh5.gaoruankeji.com/"+userid;
        if(cc.sys.isNative == false){
            var url = "http://127.0.0.8/image";
        }
        loadImage(url, userid, function (err, spriteFrame) {
            if (err) {
                console.log("获取图片有错 === " + err)
                return;
            }
            self._spriteFrame = spriteFrame;
            self.setupSpriteFrame();
        });
    },

    setupSpriteFrame: function () {
        console.log("zhixingdaozhe le ")
        if (this._spriteFrame) {
            var spr = this.getComponent(cc.Sprite);
            if (spr) {
                spr.spriteFrame = this._spriteFrame;
            }
        }
    }
});