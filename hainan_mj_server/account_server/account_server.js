var crypto = require('../utils/crypto');
var express = require('express');
var db = require('../utils/db');
var http = require("../utils/http");
var fs = require('fs');
var app = express();
var hallAddr = "";

function send(res,ret){
	var str = JSON.stringify(ret);
	res.send(str)
}

var config = null;

exports.start = function(cfg){
	config = cfg;
	hallAddr = config.HALL_IP  + ":" + config.HALL_CLIENT_PORT;
	app.listen(config.CLIENT_PORT);
	console.log("account server is listening on " + config.CLIENT_PORT);
}

//设置跨域访问
app.all('*', function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    res.header("Access-Control-Allow-Methods","PUT,POST,GET,DELETE,OPTIONS");
    res.header("X-Powered-By",' 3.2.1')
    res.header("Content-Type", "application/json;charset=utf-8");
    next();
});
app.get("/socket_connect",function(req,res){
	console.log("获取socket信息")
	http.send(res, 0, "ok", {ip:config.HALL_IP,port:config.SOCKET_PORT});
});
function check_account(req, res) {
	var account = req.query.account;
	var sign = req.query.sign;
	if (account == null || sign == null) {
		http.send(res, 1, "unknown error");
		return false;
	}
	return true;
}
app.get('/login', function (req, res) {
	if (!check_account(req, res)) {
		return;
	}

	var ip = http.getClientIp(req);
	if (ip.indexOf("::ffff:") != -1) {
		ip = ip.substr(7);
	}

	var account = req.query.account;
	db.get_user_data(account, function (data) {
		if (data == null) {
			http.send(res, 0, "ok");
			return;
		}
		var ret = {
			account: data.account,
			userid: data.userid,
			name: data.name,
			lv: data.lv,
			exp: data.exp,
			coins: data.coins,
			gems: data.gems,
			ip: ip,
			sex: data.sex,
			kong: data.kong, //判定是否有朋友圈权限
			roomid: data.roomid,
			commission: data.commission,
			headimg:data.headimg,
			id_card_img:data.id_card_img,
			real_name:data.real_name,
			certification:data.certification
		};
		var imgURL = "../WWW/a/" + data.userid + ".png"
		console.log("玩家头像图片是否存在 === " + fs.existsSync(imgURL))
		if (fs.existsSync(imgURL)) {
			if (ret.roomid != null) {
				db.is_room_exist(ret.roomid, function (retval) {
					if (retval) {

					} else {
						ret.roomid = null;
						db.set_room_id_of_user(data.userid, null);
					}
					http.send(res, 0, "ok", ret);
				});
			} else {
				http.send(res, 0, "ok", ret);
			}
		} else {
			http.get3(data.headimg, data.userid, function (imgdata) {
				if (ret.roomid != null) {
					db.is_room_exist(ret.roomid, function (retval) {
						if (retval) {

						} else {
							ret.roomid = null;
							db.set_room_id_of_user(data.userid, null);
						}
						http.send(res, 0, "ok", ret);
					});
				} else {
					http.send(res, 0, "ok", ret);
				}

			})
		}
	});
});

app.get('/create_user', function (req, res) {
	if (!check_account(req, res)) {
		return;
	}
	var account = req.query.account;
	var name = req.query.name;
	var coins = 1000;
	var gems = 21;
	db.is_user_exist(account, function (ret) {
		if (!ret) {
			db.create_user(account, name, coins, gems, 0, null, 0, function (ret) {
				if (ret == null) {
					http.send(res, 2, "system error.");
				} else {
					http.send(res, 0, "ok");
				}
			});
		} else {
			http.send(res, 1, "account have already exist.");
		}
	});
});
app.get('/register',function(req,res){
	var account = req.query.account;
	var password = req.query.password;

	var fnFailed = function(){
		send(res,{errcode:1,errmsg:"account has been used."});
	};

	var fnSucceed = function(){
		send(res,{errcode:0,errmsg:"ok"});	
	};

	db.is_user_exist(account,function(exist){
		if(exist){
			db.create_account(account,password,function(ret){
				if (ret) {
					fnSucceed();
				}
				else{
					fnFailed();
				}
			});
		}
		else{
			fnFailed();
			console.log("account has been used.");			
		}
	});
});

app.get('/get_version',function(req,res){
	var ret = {
		version:config.VERSION,
	}
	send(res,ret);
});

app.get('/get_serverinfo',function(req,res){
	var ret = {
		version:config.VERSION,
		hall:hallAddr,
		appweb:config.APP_WEB,
        iOSPassed:1,
	}
	send(res,ret);
});

app.get('/guest',function(req,res){
	var account = "guest_" + req.query.account;
	var sign = crypto.md5(account + req.ip + config.ACCOUNT_PRI_KEY);
	var ret = {
		errcode:0,
		errmsg:"ok",
		account:account,
		halladdr:hallAddr,
		sign:sign
	}
	send(res,ret);
});

app.get('/auth',function(req,res){
	var account = req.query.account;
	var password = req.query.password;

	db.get_account_info(account,password,function(info){
		if(info == null){
			send(res,{errcode:1,errmsg:"invalid account"});
			return;
		}

        var account = "vivi_" + req.query.account;
        var sign = get_md5(account + req.ip + config.ACCOUNT_PRI_KEY);
        var ret = {
            errcode:0,
            errmsg:"ok",
            account:account,
            sign:sign
        }
        send(res,ret);
	});
});

var appInfo = {
	Android:{
		appid:"wx953d889d604e9531",
		secret:"b125f3d8b1d827944aab09381085e37e",
	},
	iOS:{
		appid:"wx953d889d604e9531",
		secret:"b125f3d8b1d827944aab09381085e37e",
	}
};

function get_access_token(code,os,callback){
	var info = appInfo[os];
	if(info == null){
		callback(false,null);
	}
	var data = {
		appid:info.appid,
		secret:info.secret,
		code:code,
		grant_type:"authorization_code"
	};

	http.get2("https://api.weixin.qq.com/sns/oauth2/access_token",data,callback,true);
}

function get_state_info(access_token,openid,callback){
	var data = {
		access_token:access_token,
		openid:openid
	};

	http.get2("https://api.weixin.qq.com/sns/userinfo",data,callback,true);
}

function create_user(account,name,sex,headimgurl,callback){
	var coins = 0;
	var gems = 0;
    
    console.log('创建玩家');
    
    db.get_reg_gems(function(ret) {
        gems = ret;
        console.log('注册赠送房卡  ' + gems);
        db.is_user_exist(account,function(ret){
            if(!ret){
                console.log('gems is' + gems);
                db.create_user(account,name,coins,gems,sex,headimgurl,0,function(ret){
                    callback();
                });
            }
            else{
                console.log('exist');
                db.update_user_info(account,name,headimgurl,sex,function(ret){
                    callback();
                });
            }
        });
    });
};

app.get('/wechat_auth',function(req,res){
	var code = req.query.code;
	var os = req.query.os;
	if(code == null || code == "" || os == null || os == ""){
		return;
	}
	console.log('wechat_auth ' + os);
	get_access_token(code,os,function(suc,data){
        console.log('suc is ' + suc);
		if(suc){
			var access_token = data.access_token;
			var openid = data.openid;
			get_state_info(access_token,openid,function(suc2,data2){
                console.log('suc2 is ' + suc2);
				if(suc2){
					var openid = data2.openid;
					var nickname = data2.nickname;
					var sex = data2.sex;
					var headimgurl = data2.headimgurl;
					var account = "wx_" + openid;
                    console.log('openid ' + openid + ' nickname ' + nickname + ' sex ' + sex + ' headimgurl ' + headimgurl + ' account ' + account);
					create_user(account,nickname,sex,headimgurl,function(){
						var sign = crypto.md5(account + req.ip + config.ACCOUNT_PRI_KEY);
					    var ret = {
					        errcode:0,
					        errmsg:"ok",
					        account:account,
					        halladdr:hallAddr,
					        sign:sign
						};
						console.log('ret is ' + JSON.stringify(ret))
						if(!data2.headimgurl){
							ret.image = 0;
							send(res,ret)
						}
						else{
							db.get_user_data(account,function(uData){
								http.get3(headimgurl,uData.userid,function(eData){
									console.log(uData.userid+" --加载头像返回的数据 == "+eData)
									if(eData){
										ret.image = 1;
										send(res, ret);
									}
									else{
										ret.image = 0;
										send(res,ret)
									}
								})
							})	
						}
                       
					});						
				}
			});
		}
		else{
			send(res,{errcode:-1,errmsg:"unkown err."});
		}
	});
});

app.get('/base_info',function(req,res){
	var userid = req.query.userid;
	db.get_user_base_info(userid,function(data){
		var ret = {
	        errcode:0,
	        errmsg:"ok",
			name:data.name,
			sex:data.sex,
	        headimgurl:data.headimg
	    };
	    send(res,ret);
	});
});