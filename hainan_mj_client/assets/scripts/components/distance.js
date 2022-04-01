cc.Class({
    extends: cc.Component,

    properties: {
        _seats: null,
        _localNode: null,
        _sides: null,
        _lines: null,
        _showLines: null,
    },

    // use this for initialization
    onLoad: function () {
        this._localNode = this.node.getChildByName("location");
        this._sides = cc.vv.mahjongmgr._sides;
        this._showLines = [];
        for (var i = 0; i < this._sides.length - 1; i++) {
            var beforeName = this._sides[i];
            for (var j = i + 1; j < this._sides.length; j++) {
                var afterName = this._sides[j];
                var lineName = beforeName + "_" + afterName;
                this._showLines.push(lineName);
            }
        }
        this._seats = this._localNode.getChildByName("seats");
        this._lines = this._localNode.getChildByName("lines");
        var layout = this._localNode.getChildByName("layout");
        layout.on("click", this.goBack, this);
       
        var self = this;
        this.node.on("show_user_mapInfo", function (data) {
            // self.initLine();
            // self.showLocationInfo(data.seats);
            // self._localNode.active = true
        })
    },
    showLocationInfo: function (sData) {
        var mapArr = [];
        for (var i = 0; i < sData.length; i++) {
            var localIndex = cc.vv.MjNetMgr.getLocalIndex(i);
            var localSide = this._sides[localIndex];
            var seat = this._seats.getChildByName(localSide);
            seat.getChildByName("name").getComponent(cc.Label).string = sData[i].name;
            if (sData[i].userId > 0 && sData[i].mapInfo &&  sData[i].mapInfo != "-1") {
                var mapData = {
                    index: localIndex,
                    mapInfo: sData[i].mapInfo,
                }
                mapArr.push(mapData);
            }
        }
        if (mapArr.length > 1) {
            mapArr.sort(function (a, b) {
                return a.index - b.index
            });
            this.calDistance(mapArr);
        }

    },
    calDistance: function (arr) {
        var newArr = arr.slice(0);
        for (var i = 0; i < arr.length - 1; i++) {
            newArr = newArr.slice(1);
            var mapInfo = JSON.parse(arr[i].mapInfo);
            var lat1 = mapInfo.latitude;
            var lng1 = mapInfo.longitude;
            for (var j = 0; j < newArr.length; j++) {
                var side1 = this._sides[arr[i].index];
                var side2 = this._sides[newArr[j].index];
                var name = side1 + "_" + side2;
                var node = this._lines.getChildByName(name);
                var mf = JSON.parse(newArr[j].mapInfo);
                var lat2 = mf.latitude;
                var lng2 = mf.longitude;
                var s = this.GetDistance(lat1, lng1, lat2, lng2);
                if (s != -1) {
                    if (Number(s) < 0.1) {
                        node.getComponent(cc.Sprite).spriteFrame = cc.vv.mahjongmgr.posAtlas.getSpriteFrame("location_line_vertical_red")
                    } else {
                        node.getComponent(cc.Sprite).spriteFrame = cc.vv.mahjongmgr.posAtlas.getSpriteFrame("location_line_vertical_green")
                    }
                    if (s >= 1) {
                        s = s.toFixed(3) + "千米";
                    }
                    if (s >= 0 && s < 1) {
                        s *= 1000;
                        s = s.toFixed(1) + "米"
                    }
                } else {
                    node.getComponent(cc.Sprite).spriteFrame = cc.vv.mahjongmgr.posAtlas.getSpriteFrame("location_line_vertical_green")
                    s = ""
                }
                node.getChildByName("distance").getComponent(cc.Label).string = s;
            }
        }
    },
    initLine: function () {
        for (var i = 0; i < this._sides.length; i++) {
            var side = this._sides[i];
            this._seats.getChildByName(side).active = true;
        };
        for (var i = 0; i < this._showLines.length; i++) {
            var line = this._showLines[i];
            this._lines.getChildByName(line).active = true;
            this._lines.getChildByName(line).getComponent(cc.Sprite).spriteFrame = cc.vv.mahjongmgr.posAtlas.getSpriteFrame("location_line_vertical_green")
        }
    },
    goBack: function () {
        this._localNode.active = false;
    },
    //进行经纬度转换为距离的计算
    Rad: function (d) {
        return d * Math.PI / 180.0; //经纬度转换成三角函数中度分表形式。
    },
    //计算距离，参数分别为第一点的纬度，经度；第二点的纬度，经度
    GetDistance: function (lat1, lng1, lat2, lng2) {
        if (lat1 == 0 || lat2 == 0) {
            return -1
        }
        var radLat1 = this.Rad(lat1);
        var radLat2 = this.Rad(lat2);
        var a = radLat1 - radLat2;
        var b = this.Rad(lng1) - this.Rad(lng2);
        var s = 2 * Math.asin(Math.sqrt(Math.pow(Math.sin(a / 2), 2) +
            Math.cos(radLat1) * Math.cos(radLat2) * Math.pow(Math.sin(b / 2), 2)));
        s = s * 6378.137; // EARTH_RADIUS;
        return s;
    },

});