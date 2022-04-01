var crypto = require('../utils/crypto');
var db = require('../utils/db');
var http = require('../utils/http');
var room_service = require("./room_service");
var quanRule = require("../utils/QuanRule");

const cors = require('cors') // 跨域
const bodyParser = require('body-parser') // 解析参数
var express = require('express');
var fs = require('fs');
var multer = require('multer')
var path = require('path')
var formidable = require("formidable");
const {
	json
} = require('body-parser');
const e = require('express');
var app = express();
app.use(cors()) //解决跨域
app.use(bodyParser.json()) //json请求
app.use(bodyParser.urlencoded({
	extended: false
})) // 表单请求
var config = null;
exports.start = function ($config) {
	config = $config;
	app.listen(config.CLEINT_PORT);
	console.log("client service is listening on port " + config.CLEINT_PORT);
};

function check_account(req, res) {
	var account = req.query.account;
	var sign = req.query.sign;
	if (account == null || sign == null) {
		http.send(res, 1, "unknown error");
		return false;
	}
	return true;
}
app.get("/request_cer", function (req, res) {
	let data = req.query
	let cerId = data.cerId;
	if (cerId == 0 || cerId == 4) {
		cerId = 1
	} else {
		http.send(res, 1, "不能提交申请")
	}
	db.update_user_cer(data.userId, data.nameStr, data.carStr, cerId, function (result) {
		if (result) {
			http.send(res, 0, "提交成功")
		} else {
			http.send(res, 1, "不能提交申请")
		}
	})
	console.log("实名认证", req.query)
})
app.post('/upload_img', function (req, res) {
	var form = new formidable.IncomingForm();
	form.parse(req, (err, fields, files) => {
		//报错的时候直接抛出错误
		if (err) {
			console.log(err);
			http.send(res, 1, "上传失败.");
		}
		//path.extname获得的是文件从'.'开始到最后的扩展名(是最后一个.)
		var extname = path.extname(files.file.name);
		fs.readFile(files.file.path, (err, data) => {
			if (err) {
				console.log(err)
				http.send(res, 1, "上传失败..");
			} else {
				let userId = fields.userId;
				let imgpath = '../WWW/card_image/' + userId + extname
				fs.writeFile(imgpath, data, function (err) {
					if (err) {
						console.log(err)
						http.send(res, 1, "上传失败...");
					} else {
						console.log("保存成功")
						http.send(res, 0, "上传成功");
					}

				})
			}

		})
	})
})
app.get("/socket_connect", function (req, res) {
	http.send(res, 0, "ok", {
		ip: config.HALL_IP,
		port: config.SOCKET_PORT
	});
});

app.get('/create_private_room', function (req, res) {
	//验证参数合法性
	var data = req.query;
	console.log('data is ' + JSON.stringify(data));
	//验证玩家身份
	if (!check_account(req, res)) {
		return;
	}
	var account = data.account;
	data.account = null;
	data.sign = null;
	var conf = data.conf;
	var mapInfo = data.mapInfo;
	// console.log("创建普通房间 " + quanId)
	db.get_user_data(account, function (data) {
		if (data == null) {
			http.send(res, 1, "system error");
			return;
		}
		if (data.commission == 1) {
			http.send(res, 11, "没有游戏权限");
			return;
		}
		var userId = data.userid;
		var name = data.name;
		//验证玩家状态
		db.get_room_id_of_user(userId, function (rm) {
			if (rm.roomid != null) {
				http.send(res, -11, "user is playing in room now.");
				return;
			}
			//创建房间
			room_service.createRoom(account, userId, conf, "", "","", function (err, roomId) {
				if (err == 0 && roomId != null) {
					let edata = {
						userId:userId,
						name:name,
						roomId:roomId,
						mapInfo:mapInfo,
						roomquan:"",
						eip:http.getClientIp(req),
					}
					room_service.enterRoom(edata, function (errcode, enterInfo) {
						if (enterInfo) {
							var ret = {
								roomid: roomId,
								ip: enterInfo.ip,
								port: enterInfo.port,
								token: enterInfo.token,
								time: Date.now(),
							};
							ret.sign = crypto.md5(ret.roomid + ret.token + ret.time + config.ROOM_PRI_KEY);
							http.send(res, 0, "ok", ret);
						} else {
							http.send(res, errcode, "room doesn't exist.");
						}
					});
				} else {
					http.send(res, err, "create failed.");
				}
			});
		});
	});
});
app.get('/enter_private_room', function (req, res) {
	var data = req.query;
	var roomId = data.roomid;
	if (roomId == null) {
		http.send(res, -1, "parameters don't match api requirements.");
		return;
	}
	if (!check_account(req, res)) {
		return;
	}

	var account = data.account;
	var mapInfo = data.mapInfo;
	db.get_user_data(account, function (data) {
		if (data == null) {
			http.send(res, -1, "system error");
			return;
		}
		if (data.commission == 1) {
			http.send(res, 11, "没有游戏权限");
			return;
		}
		var userId = data.userid;
		var name = data.name;
		var quans = JSON.parse(data.quan);
		var coins = data.coins;
		if (data.roomid) {
			if (data.roomid != roomId) {
				var ret = {
					roomid: data.roomid
				};
				http.send(res, 66, "已经在另一个房里进行游戏", ret);
				return;
			} else {
				console.log("进入的房间相等 ===" + data.roomid);
			}
		}
		//验证玩家状态
		//todo
		//进入房间
		db.get_room_data(roomId, function (gData) {
			var haveright = false
			if (gData) {
				var quanId = gData.quanid;
				if (quanId) {
					if (quans && quans.length > 0) {
						for (var j = 0; j < quans.length; j++) {
							if (quanId == quans[j]) {
								haveright = true;
								break;
							}
						}
						if(haveright){
							let roomConf = JSON.parse(gData.base_info)
							console.log(roomConf,"@@@@@")
							let min = roomConf.coinData.min
							if(coins < min){
								http.send(res, 99, "活力值不够,最低"+min+"活力值", ret);
								return
							}
						}
					}
				} else {
					haveright = true;
				}
				if (haveright) {
					var roomquan = quanId || "";
					let edata = {
						userId:userId,
						name:name,
						roomId:roomId,
						mapInfo:mapInfo,
						roomquan:roomquan,
						eip:http.getClientIp(req),
					}
					room_service.enterRoom(edata, function (errcode, enterInfo) {
						if (enterInfo) {
							var ret = {
								roomid: roomId,
								ip: enterInfo.ip,
								port: enterInfo.port,
								token: enterInfo.token,
								time: Date.now()
							};
							ret.sign = crypto.md5(roomId + ret.token + ret.time + config.ROOM_PRI_KEY);
							http.send(res, 0, "ok", ret);
						} else {
							http.send(res, errcode, "enter room failed.");
						}
					});
				} else {
					http.send(res, 123, "have not rights")
				}
			} else {
				http.send(res, 456, "房间不存在！")
				return;
			}


		})

	});
});
app.get("/get_other_history_info",function(req,res){
	let uuid = req.query.uuid;
	db.get_other_history(uuid,function(ret){
		if(ret){
			console.log("获取他人的记录数据",ret.history)
			http.send(res,0,"ok",{info:JSON.parse(ret.history)})
		}
		else{
			http.send(res,1,"没有该历史记录")
		}
	})
})
app.get('/get_history_list', function (req, res) {
	var data = req.query;
	if (!check_account(req, res)) {
		return;
	}
	var userId = data.userId;
	var quanId = data.quanId;
	var isQuanzhu = Number(data.isQuanzhu);
	console.log("获取的是亲友圈的战绩 == " + quanId,isQuanzhu)
	if (quanId && isQuanzhu) {
		db.get_quan_history(quanId, function (qData) {
			console.log("获取圈历史记录 " + qData)
			if (qData) {
				var ghArr = [];
				if(qData.length > 0){
					for (var i = 0; i < qData.length; i++) {
						var his = JSON.parse(qData[i].history);
						ghArr.push(his);
					}
				}
				console.log("gharr === " + ghArr)
				http.send(res, 0, "获取到了历史记录", {
					history: ghArr,
				});
			} else {
				http.send(res, 0, "没有历史记录", {
					history: [],
				});
			}
		})
	} 
	else if(quanId){
		db.get_quan_history_user(quanId,userId, function (qData) {
			console.log("获取圈历史记录22 " + qData)
			if (qData) {
				var ghArr = [];
				if(qData.length > 0){
					for (var i = 0; i < qData.length; i++) {
						var his = JSON.parse(qData[i].history);
						ghArr.push(his);
					}
				}
				console.log("gharr222 === " + ghArr)
				http.send(res, 0, "获取到了历史记录", {
					history: ghArr,
				});
			} else {
				http.send(res, 0, "没有历史记录", {
					history: [],
				});
			}
		})
	}
	else {
		db.get_history(userId, function (gh) {
			if (gh) {
				console.log("获取战绩返回****",gh)
				let ghArr = []
				if(gh.length > 0){
					gh.forEach((el)=>{
						ghArr.push(JSON.parse(el.history))
					})
				}
				http.send(res, 0, "获取到了历史记录", {
					history: ghArr,
				});
				
			}
			else{
				http.send(res, 0, "没有历史记录", {
					history: [],
				});
			}
			
		})
	}
});
app.get("/get_act_content",function(req,res){
	db.get_act_content(function(data){
		if(data && data.length > 0){
			http.send(res,0,"活动信息",{data:data})
		}
		else{
			http.send(res,1,"没有活动信息")
		}
	})
});
app.get('/get_games_of_room', function (req, res) {
	var data = req.query;
	var uuid = data.uuid;
	if (uuid == null) {
		http.send(res, -1, "parameters don't match api requirements.");
		return;
	}
	if (!check_account(req, res)) {
		return;
	}
	db.get_games_of_room(uuid, function (data) {
		console.log(data);
		http.send(res, 0, "ok", {
			data: data
		});
	});
});

app.get('/get_detail_of_game', function (req, res) {
	var data = req.query;
	var uuid = data.uuid;
	var index = data.index;
	if (uuid == null || index == null) {
		http.send(res, -1, "parameters don't match api requirements.");
		return;
	}
	if (!check_account(req, res)) {
		return;
	}
	db.get_detail_of_game(uuid, index, function (data) {
		if(data){
			http.send(res, 0, "ok", {
				data: data
			});
		}
		else{
			http.send(res, 1, "没有记录");
		}
	});
});

app.get('/get_user_status', function (req, res) {
	if (!check_account(req, res)) {
		return;
	}
	var account = req.query.account;
	db.get_user_data(account, function (data) {
		if (data != null) {
			if (req.query.getLv) {
				if (data.kong == 1 && data.lv >= 2) {
					http.send(res, 0, "有权限创建朋友圈");
				} else {
					http.send(res, 2, "没有创建朋友圈权限");
				}
			} else {
				http.send(res, 0, "ok", {
					gems: data.gems,
					coins: data.coins,
					commission: data.commission,
					lv: data.lv,
					kong: data.kong,
					// ver: ver,
				});
			}

		} else {
			http.send(res, 1, "get user info failed.");
		}
	});

});
app.get('/get_user_info', function (req, res) {
	if (!check_account(req, res)) {
		return;
	}
	var userId = req.query.userId;
	db.get_user_data_by_userid(userId, function (ud) {
		if (ud != null) {
			var userName = crypto.fromBase64(ud.name);
			http.send(res, 0, "ok", {
				userName: userName
			});
		} else {
			http.send(res, 1, "get user info failed.");
		}
	});
});

app.get('/get_message', function (req, res) {
	if (!check_account(req, res)) {
		return;
	}
	var type = req.query.type;

	if (type == null) {
		http.send(res, -1, "parameters don't match api requirements.");
		return;
	}

	var version = req.query.version;
	db.get_message(type, version, function (data) {
		if (data != null) {
			http.send(res, 0, "ok", {
				msg: data.msg,
				version: data.version
			});
		} else {
			http.send(res, 1, "get message failed.");
		}
	});
});
app.get('/change_user_gems', function (req, res) {
	var data = req.query
	var gems = Number(data.gems);
	db.get_user_data_by_userid(data.cUid, function (cuData) {
		if (cuData) {
			var giveto_name = cuData.name;
			db.get_user_data_by_userid(data.dUid, function (duData) { //duid赠送者
				if (duData) {
					if (duData.lv == 2 || duData.lv == 3) {
						var give_name = duData.name;
						if (gems < 0) { //减少玩家的房卡
							console.log(gems + "  ddkjfdjf == " + cuData.gems)
							if (gems + cuData.gems < 0) {
								http.send(res, 2, "该玩家的房卡不够 ");
								return;
							}
						}
						if (gems > 0) { //增加玩家房卡；
							if (duData.gems - gems < 0) {
								http.send(res, 3, "你的房卡不够了")
								return;
							}
						}

						db.cost_gems(data.cUid, -gems, function (ret) {
							if (ret) {
								db.cost_gems(data.dUid, gems, function (ret1) {
									if (ret1) {
										var dGems = duData.gems - gems;
										db.add_give_gems_record(data.cUid, data.dUid, gems, giveto_name, give_name)
										http.send(res, 0, "操作成功!", {
											dGems: dGems
										})
									}
								})
							}
						})
					} else {
						http.send(res, 5, "你的代理权限被取消了")
					}

				} else {

				}

			})
		} else {
			http.send(res, 1, "该玩家不存在")
		}
	})
});
app.get('/change_user_rights', function (req, res) {
	var data = req.query
	var doNum = data.doNum;
	db.get_user_data_by_userid(data.cUid, function (cuData) {
		if (cuData) {
			if (cuData.lv == 3) {
				http.send(res, 3, "该玩家为管理员，无法设置他的权限")
				return;
			}
			if (doNum == 3 || doNum == 4) {
				if (doNum == 3) { //解除禁止
					var rights = 0
					var ddstr = "已解除禁止";
					if (cuData.commission == 0) {
						http.send(res, 2, "玩家游戏权限是开通的")
						return;
					}
				} else if (doNum == 4) { //禁止游戏
					var rights = 1;
					var ddstr = "已禁止游戏";
					if (cuData.commission == 1) {
						http.send(res, 2, "玩家游戏权限是关闭的")
						return;
					}
				}
				db.update_user_rights(data.cUid, rights, kong, doNum, function (ret) {
					if (ret) {
						http.send(res, 0, ddstr);
					}
				})
			}
			if (doNum == 5 || doNum == 6) {
				if (doNum == 6) { //隐藏代理权限
					var rights = 1;
					var ddstr = "已关闭代理权限";
					var kong = 0;
					if (cuData.lv == 1 && cuData.kong == 0) {
						http.send(res, 2, "玩家没有代理权限！")
						return;
					}
				} else if (doNum == 5) { //开放代理权限
					var rights = 2
					var ddstr = "已打开代理权限";
					var kong = 1;
					if (cuData.lv == 2 && cuData.kong == 1) {
						http.send(res, 2, "玩家代理权限已开放")
						return;
					}
				}
				db.update_user_rights(data.cUid, rights, kong, doNum, function (ret) {
					if (ret) {
						db.is_ht_exist(data.cUid, function (he) {
							if (he) {
								db.change_user_ht_status(data.cUid, kong, function (cht) {
									if (cht) {
										console.log("更改后台成功")
										http.send(res, 0, ddstr)
									}
								})
							} else {
								var str = "111111encypt"
								var secret = crypto.md5(crypto.md5(str.trim()))
								if (doNum == 5) {
									db.add_user_in_ht(data.cUid, secret, function (aht) {
										if (aht) {
											db.add_user_ht_access(aht, function (ha) {
												if (ha) {
													console.log("添加后台数据成功" + aht)
													http.send(res, 0, ddstr)
												}
											})


										}
									})
								}
							}
						})

					}
				})
			}

		} else {
			http.send(res, 1, "该玩家不存在")
		}
	})
});
app.get('/get_commission_num', function (req, res) {
	if (!check_account(req, res)) {
		return;
	}
	var account = req.query.account;
	db.get_user_data(account, function (data) {
		if (data != null) {
			http.send(res, 0, "ok", {
				commission: data.commission
			});
		} else {
			http.send(res, 1, "get commission failed.");
		}
	});
});
app.get('/is_server_online', function (req, res) {
	if (!check_account(req, res)) {
		return;
	}
	var ip = req.query.ip;
	var port = req.query.port;
	room_service.isServerOnline(ip, port, function (isonline) {
		var ret = {
			isonline: isonline
		};
		http.send(res, 0, "ok", ret);
	});
});



app.get("/create_quan", function (req, res) {
	var data = req.query;
	var creator = data.userId;
	var quanName = data.quanName;
	console.log("接收到创建亲友圈的消息 == " + creator)
	db.is_quan_exist(quanName, false, function (ret) {
		if (ret) {
			http.send(res, 4, "name have exist")
		} else {
			var generateQuanId = function () {
				console.log("一直执行这个函数")
				var quanId = "";
				for (var i = 0; i < 7; ++i) {
					quanId += Math.floor(Math.random() * 10);
				}
				db.is_quan_exist(false, quanId, function (ee) {
					if (ee) {
						generateQuanId();
					} else {
						db.create_quan(quanName, quanId, creator, function (qq) {
							if (qq) {
								console.log("创建亲友圈成功！！" + quanId);
								var retData = {
									id: quanId,
								}
								add_user_in_quan(res, quanId, creator, retData)

							} else {
								console.log("创建亲友圈失败");
								http.send(res, 1, "create quan fail");
							}
						})
					}
				})
			}
			generateQuanId();
		}
	});
});
app.get("/get_quan_rule",function(req,res){
	let quanId = req.query.quanId;
	db.get_quan_data(quanId,function(qdata){
		if(qdata){
			let rdata = {
				siRen:JSON.parse(qdata.siRen),
				sanRen:JSON.parse(qdata.sanRen),
				erRen:JSON.parse(qdata.erRen),
			}
			http.send(res,0,"获取到规则",{data:rdata})
		}
		else{
			http.send(res,1,"未获取到规则")
		}
	})
});
app.get("/update_quan_coindata",function(req,res){
	let quanId = req.query.quanId;
	let key = req.query.key
	db.get_quan_data(quanId,function(qdata){
		if(qdata){
			let info = JSON.parse(qdata[key])
			info.coinData.every = req.query.every;
			info.coinData.reduce = req.query.reduce;
			info.coinData.min = req.query.min;
			db.store_quan_rule(quanId, key, JSON.stringify(info), function (ret) {
				if(ret){
					http.send(res,0,"编辑成功")
				}
				else{
					http.send(res,1,"编辑失败2")
				}
			})
		
		}
		else{
			http.send(res,1,"编辑失败1")
		}
	})
});
app.get("/update_quan_wf",function(req,res){
	let quanId = req.query.quanId;
	let key = req.query.key
	let conf = JSON.parse(req.query.conf);
	// console.log("*****7777",conf)
	db.get_quan_data(quanId,function(qdata){
		if(qdata){
			let info = JSON.parse(qdata[key])
			Object.assign(info,conf)
			// console.log("付完之号",info)
			db.store_quan_rule(quanId, key, JSON.stringify(info), function (ret) {
				if(ret){
					http.send(res,0,"保存成功")
				}
				else{
					http.send(res,1,"保存失败2")
				}
			})
		
		}
		else{
			http.send(res,1,"保存失败1")
		}
	})
});
app.get("/refresh_room",function(req,res){
	let rKey = ['siRen', 'sanRen', 'erRen']
	let quanId = req.query.quanId
	db.get_quan_data(quanId,function(qdata){
		if(qdata){
			let temRule = [];
			let temKey = [];
			rKey.forEach(function(el){
				let rule = JSON.parse(qdata[el]);
				if(rule.haveRoom == 0){
					temRule.push(qdata[el]);
					temKey.push(el);
				}
			})
			if(temRule.length){
				refreshQuanRoom(temRule,temKey,qdata.id,qdata.creator,qdata.nickname,0,res)
			}
			else{
				http.send(res,0,"刷新好了")
			}
		}
	})
})
var refreshQuanRoom = function(rules,keys,quanId,quanZhu,quanMing,num,res){
	let conf = rules[num];
	room_service.createQuanRoom(conf, quanId, quanZhu,quanMing, function (err, roomId) {
		if (err == 0 && roomId != null) {
			let uconf = JSON.parse(conf)
			uconf.haveRoom = 1;
			db.store_quan_rule(quanId, keys[num], JSON.stringify(uconf), function (ret) {
				if (ret) {
					num += 1;
					if (rules[num]) {
						refreshQuanRoom(rules,keys,quanId,quanZhu,num,res)
					}
					else{
						http.send(res,0,"刷新好了")
					}
				}
			})
		}
		else{
			http.send(res,0,"刷新好了")
		}
	});
}
var initQuanRoom = function (quanId, quanZhu,quanMing, num) {
	let rKey = ['siRen', 'sanRen', 'erRen']
	let conf = JSON.stringify(quanRule[rKey[num]]);
	room_service.createQuanRoom(conf, quanId, quanZhu,quanMing, function (err, roomId) {
		if (err == 0 && roomId != null) {
			let uconf = JSON.parse(conf)
			uconf.haveRoom = 1;
			db.store_quan_rule(quanId, rKey[num], JSON.stringify(uconf), function (ret) {
				if (ret) {
					num += 1;
					if (rKey[num]) {
						initQuanRoom(quanId, quanZhu,quanMing, num)
					}
				}
			})
			console.log("圈子房间创建成功")
		} else {
			console.log("圈子房间创建失败")
			for (let i = num; i < rKey.length; i++) {
				let conf = quanRule[rKey[i]];
				db.store_quan_rule(quanId, rKey[i], JSON.stringify(conf), function (ret) {
					console.log("存储规则：", ret)
				})
			}

		}
	});
}
var add_user_in_quan = function (res, quanId, userId, retData) {
	db.get_user_data_by_userid(userId, function (uData) {
		if (!uData) return;
		var uQuan = uData.quan;
		if (uQuan == null) {
			var uQuan = [];
			uQuan.push(quanId);
		} else {
			uQuan = JSON.parse(uQuan);
			uQuan.push(quanId);
		}
		console.log("uquan ======" + uQuan)
		db.update_user_quan(uQuan, userId, function (result) {
			if (result) {
				db.get_quan_data(quanId, function (qData) {
					if (qData) {
						if (qData.quan || qData.quan == null) {
							var nickname = qData.nickname;
							if (qData.quan == null) {
								var qq = [];
								qq.push(uData.userid);
							} else {
								var qq = JSON.parse(qData.quan);
								qq.push(uData.userid);
							}
							db.update_quan_quan(qq, quanId, function (rsu) {
								if (rsu) {
									if (userId == qData.creator) {
										initQuanRoom(quanId, qData.creator,qData.nickname, 0)
									} else {
										let socketData = {
											eventName: "update_user_quans_push",
											sir: uData.userid,
											sendData: JSON.stringify({
												userId: uData.userid
											})
										}
										room_service.send_socket(socketData)

									}
									var str = "用户:" + crypto.fromBase64(uData.name) + "(ID:" + uData.userid + ")已成功加入\n亲友圈:" + nickname + "(ID:" + quanId + ")";
									http.send(res, 0, str, {
										id: retData.id
									});


								}
							})
						} else {
							console.log("没有获取到圈数据")
						}
					} else {
						console.log("没有圈子数据");
					}
				})
			}

		})

	})
};
app.get("/get_quans", function (req, res) {

	var userId = req.query.userId;
	db.get_user_data_by_userid(userId, function (uData) {
		if (uData) {
			if (uData.commission == 1) {
				http.send(res, 11, "没有游戏权限")
				return;
			}
			var lv = uData.lv;
			var kong = uData.kong;
			if (uData.quan && uData.quan.length > 0) {
				let arr = JSON.parse(uData.quan)
				db.select_quan_arr(arr, null, function (result) {
					if (result && result.length > 0) {
						let tdata = []
						result.forEach(element => {
							let quanInfo = {
								id: element.id,
								name: element.nickname,
								num: JSON.parse(element.quan).length,
								creator: element.creator,
								createtime: element.createtime,
							}
							tdata.push(quanInfo)
						});
						http.send(res, 0, "get quan info ok", {
							data: tdata,
							kong: kong,
							lv: lv,
						})
					} else {

					}
				})
			} else {
				http.send(res, 4, "is not have quans", {
					data: [],
					kong: kong,
					lv: lv,
				})
			}
		}

	})
});
app.get("/get_zhuos", function (req, res) {
	var quanId = req.query.quanId;
	db.get_quan_data(quanId, function (qData) {
		if (qData) {
			var quanName = qData.nickname;
			db.get_user_data_by_userid(qData.creator, function (uData) {
				if (uData) {
					var gems = uData.gems;
					let params = ["id", "base_info", "user_id0", "user_name0", "user_id1", "user_name1", "user_id2", "user_name2", "user_id3", "user_name3", "isStart"]
					db.get_quan_zhuos(quanId, params, function (ret) {
						console.log("获取的桌" + ret.length);
						if (ret) {
							ret.forEach(function (el) {
								let info = JSON.parse(el.base_info);
								el.base_info = info.seatNum;
							})
							http.send(res, 0, "have zhuo", {
								zhuos: ret,
								quanName: quanName,
								gems: gems,
								quanZhu: qData.creator,
							})
						} else {
							http.send(res, 1, "have not zhuo")
						}
					})
				}

			})
		}
	})

});
app.get("/request_to_quan", function (req, res) {
	var quanId = req.query.quanId;
	var userId = req.query.userId;
	var isok = req.query.isok;
	db.get_user_data_by_userid(userId, function (ruData) {
		if (ruData) {
			var uName = ruData.name;
			if (ruData.quan && ruData.quan.includes(quanId)) {
				http.send(res, 2, "你已经在这个圈子里了")
				return
			}
			db.get_quan_data(quanId, function (qData) {
				if (qData) {
					var creator = qData.creator;
					var quanName = qData.nickname;
					let socketData = {
						eventName: "get_applay_message",
						sir: qData.creator,
						sendData: JSON.stringify({
							quanId: req.query.quanId,
							creator: qData.creator
						})
					}
					db.get_quan_message(quanId, userId, function (mData) {
						if (mData && mData.length > 0) {
							if (mData[0].status == 0) {
								http.send(res, 3, "已经申请加入,请等待圈主审核");
								return;
							}
							if (mData[0].status == 2) {
								http.send(res, 222, "申请加入圈子被拒绝");
								return;
							}
							if (mData[0].status == 1) {
								http.send(res, 333, "已同意加入圈子");
								return;
							}
							// db.change_quan_message_status(userId, 2, 0, quanId, function (cd) {
							// 	if (cd) {
							// 		console.log("发送申请。。。")
							// 		room_service.send_socket(socketData)
							// 		http.send(res, 0, "申请加入提交成功！")
							// 	}
							// })
						} else {
							if (isok == 1) {
								http.send(res, 0, "是否申请！")
							} else {
								db.update_user_quan_message(quanId, userId, creator, quanName, uName, 1, function (qm) {
									if (qm) {

										room_service.send_socket(socketData)
										http.send(res, 0, "add success")
									} else {

									}
								})
							}

						}

					})
				} else {
					http.send(res, 4, "亲友圈不存在")
				}
			})
		}
	})

});
app.get("/get_re_message", function (req, res) {
	var userId = req.query.userId
	var quanId = req.query.quanId;
	var mesArr = [];
	db.get_re_message(quanId, function (mData) {
		if (mData) {
			// console.log("获取到的申请",mData)
			// if (mData.length > 1) {
			// 	mData.sort(function (a, b) {
			// 		return a.rtime - b.rtime;
			// 	})
			// }
			http.send(res, 0, "get re message ok", {
				mData: mData
			})
		} else {
			http.send(res, 1, "get re message err");
		}
	})
});
app.get("/get_quan_apply_message", function (req, res) {
	var userId = req.query.userId
	var mesArr = [];
	db.get_quan_applay_message(userId, function (mData) {
		if (mData) {
			// console.log("获取到的申请",mData)
			// if (mData.length > 1) {
			// 	mData.sort(function (a, b) {
			// 		return a.rtime - b.rtime;
			// 	})
			// }
			http.send(res, 0, "get apply record ok", {
				mData: mData
			})
		} else {
			http.send(res, 1, "get apply recor err");
		}
	})
});
app.get("/change_quan_message_status", function (req, res) {
	var userId = req.query.userId;
	db.change_quan_message_status(userId, 1, 8, null, function (cData) {
		if (cData) {
			http.send(res, 0, "change ok")
		} else {
			http.send(res, 1, "change fail")
		}
	})
});
app.get("/check_user_game", function (req, res) {
	var userId = req.query.userId;
	db.get_user_data_by_userid(userId, function (result) {
		if (result) {
			if (result.roomid) {
				http.send(res, 1, "玩家在游戏中，请玩家先退出游戏")
			} else {
				http.send(res, 0, "玩家不在游戏中")
			}

		} else {
			http.send(res, 2, "没有找到该玩家信息")
		}
	})
});
app.get("/answer_re_quan", function (req, res) {
	var result = req.query.result;
	var info = req.query.quanInfo;
	info = JSON.parse(info);
	var stt = req.query.result;
	db.change_quan_message_status(info.applicant, stt, info.quanid, function (cData) {
		if (cData) {
			if (result == 2) {
				http.send(res, 0, "已拒绝玩家 " + info.altname + "(ID:" + info.applicant + ") 请求")
			} else if (result == 1) {
				var retData = {
					id: info.quanid,
				}
				add_user_in_quan(res, info.quanid, info.applicant, retData)
			}
		} else {
			http.send(res, 1, "未找到相应请求数据")
		}
	})
});
app.get("/get_quan_member", function (req, res) {
	var quanId = req.query.quanId;
	var key = req.query.keyword;
	db.get_quan_data(quanId, function (qData) {
		if (qData) {
			let quanArr = JSON.parse(qData.quan)
			if (key) {
				let kindex = quanArr.findIndex((el) => {
					return el == key
				})
				if (kindex != -1) {
					quanArr = [key]
				} else {
					http.send(res, 1, "没有找到该玩家信息")
					return
				}

			}
			let canArr = ["userid", "coins", "gems", "name", "real_name", "name", "certification"]
			db.select_user_arr(quanArr, canArr, function (result) {
				if (result) {
					http.send(res, 0, "获取数据成功", {
						data: result
					})
				} else {
					http.send(res, 1, "没有找到该玩家信息!")
				}
			})

		} else {
			http.send(res, 1, "获取数据失败")
		}
	})
});
app.get("/delete_quan", function (req, res) {
	var quanId = req.query.quanId;
	var userId = req.query.userId;
	console.log("要删的亲友圈 == " + quanId);
	db.select_quan_room(quanId, function (qu) {
		if (qu) {
			http.send(res, 11, "圈子里有房间无法删除！");
		} else {
			db.get_quan_data(quanId, function (qData) {
				if (qData) {
					var mems = JSON.parse(qData.quan);
					if (qData.creator == userId) {
						db.delete_quan(quanId, function (dq) {
							if (dq) {
								var ee = 0;
								var doFun = function () {
									var userId = mems[ee].userId
									db.get_user_data_by_userid(userId, function (uData) {
										if (uData) {
											var quan = JSON.parse(uData.quan);
											if (quan) {
												for (var e = 0; e < quan.length; e++) {
													if (quan[e] == quanId) {
														quan.splice(e, 1);
														break;
													}
												}
												db.update_user_quan(quan, userId, function (uuq) {
													if (uuq) {
														ee++;
														// hallNetMgr.sendToUser(userId, "clear_user_from_quan", {
														// 	quanId: quanId
														// })
														if (ee < mems.length) {
															doFun();
														} else {
															http.send(res, 0, "删除亲友圈成功")
															return;
														}
													}
												})
											} else {
												ee++;
												if (ee < mems.length) {
													doFun();
												} else {
													http.send(res, 0, "删除亲友圈成功")
													return;
												}
											}

										}
									});
								}
								doFun();
							} else {
								http.send(res, 3, "删除亲友圈失败")
							}
						})
					} else {
						http.send(res, 2, "不是圈主")
					}
				} else {
					http.send(res, 1, "亲友圈不存在")
				}
			})
		}
	})

});
app.get("/add_quan_members", function (req, res) {
	var quanId = req.query.quanId;
	var addId = req.query.addId;
	db.get_user_data_by_userid(addId, function (uData) {
		if (uData) {
			var retData = {
				uName: uData.name,
			}
			var quans = JSON.parse(uData.quan);
			var isIn = false;
			if (quans && quans.length > 0) {
				for (var k = 0; k < quans.length; k++) {
					if (quans[k] == quanId) {
						isIn = true;
						break;
					}
				}
			}
			if (!isIn) {
				db.get_quan_data(quanId, function (qData) {
					if (qData) {
						add_user_in_quan(res, quanId, addId, retData)
					} else {
						http.send(res, 2, "亲友圈不存在")
					}
				})
			} else {
				http.send(res, 3, "玩家已经在这个亲友圈了")
			}
		} else {
			http.send(res, 1, "该玩家不存在")
		}
	})
});
app.get("/check_map_info", function (res, req) {
	var mapinfo = req.query.mapInfo;
	console.log("玩家获取到的地理位置信息 == " + mapinfo)
});
app.get("/update_user_coins", function (req, res) {
	console.log("更改玩家活力值", req.query)
	let info = req.query;
	db.get_user_data_by_userid(info.user, function (udata) {
		if (udata) {
			if (udata.roomid) {
				http.send(res, 1, "玩家在游戏内，无法操作")
			} else if (info.statu == 2 && udata.coins < info.num) {
				http.send(res, 1, "玩家活力值不足，无法扣除")
			} else {
				db.get_user_data_by_userid(info.admin, function (adata) {
					if (adata) {
						if (info.statu == 1 && adata.coins < info.num) {
							http.send(res, 1, "活力值不足，无法给玩家充值")
						} else {
							let coinsNum = info.num;
							if (info.statu == 2) {
								coinsNum = -coinsNum
							}
							db.update_user_coins(info.user, info.admin, coinsNum, function (result) {
								if (result) {
									http.send(res, 0, "操作成功")
								} else {
									http.send(res, 1, "操作失败")
								}
							})
						}
					} else {
						http.send(res, 1, "找不到玩家信息")
					}
				})
			}
		} else {
			http.send(res, 1, "找不到玩家信息")
		}
	})

})