var URL = "http://192.168.0.107:9000";
// var URL = "http://47.105.74.177:9000";
cc.VERSION = 20161227;
var HTTP = cc.Class({
    extends: cc.Component,
    statics: {
        sessionId: 0,
        userId: 0,
        loading_url: URL,
        hall_url: "",
        sendRequest: function (path, data, handler, extraUrl) {
            var xhr = cc.loader.getXMLHttpRequest();
            xhr.timeout = 10000;
            var str = "?";
            for (var k in data) {
                if (str != "?") {
                    str += "&";
                }
                str += k + "=" + data[k];
            }
            // console.log("extraurl",extraUrl)
            var curScene = cc.director.getScene().name;
            if(extraUrl){

            }
            else if(curScene == "hall" || curScene == "mjgame"){
                extraUrl = HTTP.hall_url;
            }
            else{
                extraUrl = HTTP.loading_url;
            }
            var requestURL = extraUrl + path + encodeURI(str);
            // console.log("RequestURL:" + requestURL);
            xhr.open("GET", requestURL, true);
            if (cc.sys.isNative) {
                xhr.setRequestHeader("Accept-Encoding", "gzip,deflate", "text/html;charset=UTF-8");
            }

            xhr.onreadystatechange = function () {
                if (xhr.readyState === 4) {
                    // console.log("http res(" + xhr.responseText.length + "):" , xhr);
                    if(xhr.status >= 200 && xhr.status < 300){
                        try {
                            var ret = JSON.parse(xhr.responseText);
                            if (handler !== null) {
                                handler(ret);
                            }                
                        } catch (e) {
                            // console.log("err:" + e);
                        }
                        finally {
                            if (cc.vv && cc.vv.wc) {
                                
                            }
                        }
                    }
                    else{
                        console.log(path+"请求状态异常"+xhr.status)
                    }
                }
            };
            if (cc.vv && cc.vv.wc) {
                //cc.vv.wc.show();
            }
            xhr.ontimeout = function (){
               console.log(path+"链接超时")
            }
            xhr.onerror = function(error){
                console.log("服务器异常")
            }
            xhr.send();
            return xhr;
        },
    },
});