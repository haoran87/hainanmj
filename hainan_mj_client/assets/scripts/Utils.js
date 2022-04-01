cc.Class({
    extends: cc.Component,

    properties: {
    
    },

    addClickEvent:function(node,target,component,handler,customEventData){
        // console.log("添加事件**"+component + ":" + handler);
        var eventHandler = new cc.Component.EventHandler();
        eventHandler.target = target;
        eventHandler.component = component;
        eventHandler.handler = handler;
        if(customEventData){
            eventHandler.customEventData = customEventData;
        }

        var clickEvents = node.getComponent(cc.Button).clickEvents;
        clickEvents.push(eventHandler);
    },
    
    addSlideEvent:function(node,target,component,handler){
        var eventHandler = new cc.Component.EventHandler();
        eventHandler.target = target;
        eventHandler.component = component;
        eventHandler.handler = handler;

        var slideEvents = node.getComponent(cc.Slider).slideEvents;
        slideEvents.push(eventHandler);
    },
    timeShow(dataStr){
        var time = new Date(dataStr);
    
        function timeAdd0(str) {
            if (str < 10) {
                str = '0' + str;
            }
            return str
        }
        var y = time.getFullYear();
        var m = time.getMonth() + 1;
        var d = time.getDate();
        var h = time.getHours();
        var mm = time.getMinutes();
        var s = time.getSeconds();
        return y + '-' + timeAdd0(m) + '-' + timeAdd0(d) + ' ' + timeAdd0(h) + ':' + timeAdd0(mm) ;
    }
    
});
