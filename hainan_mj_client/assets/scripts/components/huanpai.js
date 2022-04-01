cc.Class({
    extends: cc.Component,
    
    properties: {
        
    },
    
    onLoad: function() {
        this._root = cc.find('Canvas/huanpai');
        
        var hh = cc.find('Canvas/huanpai');
        this.addClickEvent(hh, this.node, 'huanpai', 'onBackgroundClicked');
        var bg = cc.find('Canvas/huanpai/bg');
        this.addClickEvent(bg, this.node, 'huanpai', 'onBackgroundClicked');
                
        this._wan = [];
        this._tiao = [];
        this._tong = [];
        this._zi = [];
        
        for (var i = 1; i <= 9; i++) {
            var btn = cc.find('Canvas/huanpai/v/wan/' + i);
            this._wan.push(btn);
            this.addClickEvent(btn, this.node, 'huanpai', 'onWanClicked');
        }

        for (var i = 1; i <= 9; i++) {
            var btn = cc.find('Canvas/huanpai/v/tiao/' + i);
            this._tiao.push(btn);
            this.addClickEvent(btn, this.node, 'huanpai', 'onTiaoClicked');
        }
        
        for (var i = 1; i <= 9; i++) {
            var btn = cc.find('Canvas/huanpai/v/tong/' + i);
            this._tong.push(btn);
            this.addClickEvent(btn, this.node, 'huanpai', 'onTongClicked');
        }
        
        for (var i = 1; i <= 7; i++) {
            var btn = cc.find('Canvas/huanpai/v/zi/' + i);
            this._zi.push(btn);
            this.addClickEvent(btn, this.node, 'huanpai', 'onZiClicked');
        }
        
        cc.vv.huanpai = this;
    },
    
    start: function() {
        
    },
    
    onWanClicked: function(event) {
        console.log('onWanClicked' + event.target.name);
        var pai = parseInt(event.target.name) - 1;
        console.log('pai is ' + pai);
        cc.vv.net.send('huanpai88', pai);
        this._root.active = false;
    },
    
    onTiaoClicked: function(event) {
        // console.log('onTiaoClicked' + event.target.name);
        var pai = parseInt(event.target.name) + 9 - 1;
        cc.vv.net.send('huanpai88', pai);
        this._root.active = false;
    },
    
    onTongClicked: function(event) {
        // console.log('onTongClicked' + event.target.name);
        var pai = parseInt(event.target.name) + 18 - 1;
        cc.vv.net.send('huanpai88', pai);
        this._root.active = false;
    },
    
    onZiClicked: function(event) {
        // console.log('onZiClicked' + event.target.name);
        var pai = parseInt(event.target.name) + 27 - 1;
        cc.vv.net.send('huanpai88', pai);
        this._root.active = false;
    },
    
    onBackgroundClicked: function(event) {
        // console.log('onBackgroundClicked' + event.target.name);
        this._root.active = false;
    },
    
    setData: function(event) {
        var data = event;
        console.log('setData' + data);
        if (data.length != 34) {
            console.log('data.length wrong!');
        }
        for (var i = 0; i < 9; i++) {
            var count = data[i];
            this._wan[i].active = (count == 0)?false:true;
        }
        for (var i = 0; i < 9; i++) {
            var count = data[9+i];
            this._tiao[i].active = (count == 0)?false:true;
        }
        for (var i = 0; i < 9; i++) {
            var count = data[18+i];
            this._tong[i].active = (count == 0)?false:true;
        }
        for (var i = 0; i < 7; i++) {
            var count = data[27+i];
            this._zi[i].active = (count == 0)?false:true;
        }
    },
        
    addClickEvent: function(node, target, component, handler) {
        var eventHandler = new cc.Component.EventHandler();
        eventHandler.target = target;
        eventHandler.component = component;
        eventHandler.handler = handler;

        var clickEvents = node.getComponent(cc.Button).clickEvents;
        clickEvents.push(eventHandler);
    },
});