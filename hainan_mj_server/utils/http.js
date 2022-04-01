var http = require('http');
var https = require('https');
var qs = require('querystring');
var request = require('request');
var fs = require('fs');

String.prototype.format = function(args) {
	var result = this;
	if (arguments.length > 0) {
		if (arguments.length == 1 && typeof (args) == "object") {
			for (var key in args) {
				if(args[key]!=undefined){
					var reg = new RegExp("({" + key + "})", "g");
					result = result.replace(reg, args[key]);
				}
			}
		}
		else {
			for (var i = 0; i < arguments.length; i++) {
				if (arguments[i] != undefined) {
					//var reg = new RegExp("({[" + i + "]})", "g");//这个在索引大于9时会有问题，谢谢何以笙箫的指出
					var reg = new RegExp("({)" + i + "(})", "g");
					result = result.replace(reg, arguments[i]);
				}
			}
		}
	}
	return result;
};

exports.post = function (host,port,path,data,callback) {
	
	var content = qs.stringify(data);  
	var options = {  
		hostname: host,  
		port: port,  
		path: path + '?' + content,  
		method:'GET'
	};  
	  
	var req = http.request(options, function (res) {  
		console.log('STATUS: ' + res.statusCode);  
		console.log('HEADERS: ' + JSON.stringify(res.headers));  
		res.setEncoding('utf8');  
		res.on('data', function (chunk) {  
			// console.log('BODY: ' + chunk);
			callback(chunk);
		});  
	});
	  
	req.on('error', function (e) {  
		console.log('problem with request: ' + e.message);  
	});  
	  
	req.end(); 
};

exports.get2 = function (url,data,callback,safe) {
	var content = qs.stringify(data);
	var url = url + '?' + content;
	var proto = http;
	if(safe){
		proto = https;
	}
	var req = proto.get(url, function (res) {  
		// console.log('STATUS: ' + res.statusCode);  
		// console.log('HEADERS: ' + JSON.stringify(res.headers));  
		res.setEncoding('utf8');  
		res.on('data', function (chunk) {  
			//  console.log('BODY:' + chunk + ' length is ' + chunk.length);
			var json = {};
            try {
                json = JSON.parse(chunk);
                callback(true, json);
            }
            catch(e) {
                console.log('exports.get2 e is ' + e);
                callback(false, e);
            }
		});  
	});
	  
	req.on('error', function (e) {  
		console.log('problem with request: ' + e.message);
		callback(false,e);
	});  
	  
	req.end(); 
};

exports.get = function (host,port,path,data,callback,safe) {
	var content = qs.stringify(data);  
	var options = {  
		hostname: host,  
		path: path + '?' + content,  
		method:'GET'
	};
	if(port){
		options.port = port;
	}
	var proto = http;
	if(safe){
		proto = https;
	}
	var req = proto.request(options, function (res) {  
		//console.log('STATUS: ' + res.statusCode);  
		//console.log('HEADERS: ' + JSON.stringify(res.headers));  
		res.setEncoding('utf8');  
		res.on('data', function (chunk) {  
			//console.log('BODY: ' + chunk);
			var json = JSON.parse(chunk);
			callback(true,json);
		});  
	});
	  
	req.on('error', function (e) {  
		console.log('problem with request: ' + e.message);
		callback(false,e);
	});   
	req.end(); 
};

exports.send = function(res,errcode,errmsg,data){
	if(data == null){
		data = {};
	}
	data.errcode = errcode;
	data.errmsg = errmsg;
	var jsonstr = JSON.stringify(data);
	res.send(jsonstr);
	res.end()
};
exports.get3 = function (imgsrc, account,callback) {
	var src = imgsrc;
	console.log("get3 执行了  "+src)
	if(!src){
		console.log("没有头像")
		callback(false);
		return;
	}
	var writeStream = fs.createWriteStream('../WWW/a/'+account+'.png');
	var readStream = request(src)
	readStream.pipe(writeStream);
	readStream.on('end', function () {
		console.log('文件下载成功');
	});
	readStream.on('error', function () {
		// console.log("错误信息:");
		callback(false);
	})
	writeStream.on("finish", function () {
		console.log("文件写入成功");
		writeStream.end();
		callback(true);
	});
};
exports.getClientIp = function(req) {
	return req.headers['x-forwarded-for'] ||
	req.connection.remoteAddress ||
	req.socket.remoteAddress ||
	req.connection.socket.remoteAddress;
};