var crypto = require('../utils/crypto');
var express = require('express');
var db = require('../utils/db');
var http = require('../utils/http');
var roomMgr = require("./roommgr");
var userMgr = require("./usermgr");
var tokenMgr = require("../utils/tokenmgr");
const {
	json
} = require('body-parser');
const {
	siRen
} = require('../utils/QuanRule');
// var quanService = require("./quan_service")

var app = express();
var config = null;

var serverIp = "";

//测试
app.all('*', function (req, res, next) {
	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Headers", "X-Requested-With");
	res.header("Access-Control-Allow-Methods", "PUT,POST,GET,DELETE,OPTIONS");
	res.header("X-Powered-By", ' 3.2.1');
	res.header("Content-Type", "application/json;charset=utf-8");
	next();
});

app.get('/get_server_info', function (req, res) {
	var serverId = req.query.serverid;
	var sign = req.query.sign;
	console.log(serverId);
	console.log(sign);
	if (serverId != config.SERVER_ID || sign == null) {
		http.send(res, 1, "invalid parameters");
		return;
	}

	var md5 = crypto.md5(serverId + config.ROOM_PRI_KEY);
	if (md5 != sign) {
		http.send(res, 1, "sign check failed.");
		return;
	}

	var locations = roomMgr.getUserLocations();
	var arr = [];
	for (var userId in locations) {
		var roomId = locations[userId].roomId;
		arr.push(userId);
		arr.push(roomId);
	}
	http.send(res, 0, "ok", {
		userroominfo: arr
	});
});

app.get('/create_room', function (req, res) {
	var userId = parseInt(req.query.userid);
	var sign = req.query.sign;
	var gems = req.query.gems;
	var conf = req.query.conf;
	var quanId = req.query.quanId;
	var quanZhu = req.query.quanZhu;
	var quanMing = req.query.quanMing;

	if (userId == null || sign == null || conf == null) {
		http.send(res, 1, "invalid parameters");
		return;
	}

	var md5 = crypto.md5(userId + conf + gems + config.ROOM_PRI_KEY);
	if (md5 != req.query.sign) {
		console.log("invalid reuqest.");
		http.send(res, 1, "sign check failed.");
		return;
	}

	conf = JSON.parse(conf);

	roomMgr.createRoom(userId, conf, gems, serverIp, config.SOCKET_PORT, quanId, quanZhu,quanMing, function (errcode, roomId, g) {
		if (errcode != 0 || roomId == null) {
			http.send(res, errcode, "create failed.");
			return;
		} else {
			http.send(res, 0, "ok", {
				roomid: roomId,
				gems: g
			});
		}
	});
});

app.get('/create_quan_room', function (req, res) {
	var sign = req.query.sign;
	var gems = req.query.gems;
	var conf = req.query.conf;
	var quanId = req.query.quanId;
	var quanZhu = req.query.quanZhu;
	var quanMing = req.query.quanMing;

	if (quanZhu == null || sign == null || conf == null) {
		http.send(res, 1, "invalid parameters");
		return;
	}

	var md5 = crypto.md5(quanZhu + conf + gems + config.ROOM_PRI_KEY);
	if (md5 != req.query.sign) {
		console.log("invalid reuqest.");
		http.send(res, 1, "sign check failed.");
		return;
	}

	conf = JSON.parse(conf);

	roomMgr.createRoom(quanZhu, conf, gems, serverIp, config.SOCKET_PORT, quanId, quanZhu,quanMing, function (errcode, roomId, g) {
		if (errcode != 0 || roomId == null) {
			http.send(res, errcode, "create failed.");
			return;
		} else {
			http.send(res, 0, "ok", {
				roomid: roomId,
				gems: g
			});
		}
	});
});


var createQuanroom = function (roomId) {
	let roomInfo = roomMgr.getRoom(roomId)
	let conf = roomInfo.conf
	let quanId = conf.quanId
	let quanZhu = conf.quanZhu
	if (!quanId) {
		console.log("不是圈子房间不用检测是否创建房间")
		return
	}
	let cidx = roomInfo.seats.findIndex(function (el) {
		return el.userId <= 0;
	})
	if (cidx == -1) {
		db.update_room_iskong(roomId, 1, function (iskong) {
			if (iskong) {
				db.get_quan_zhuos(quanId, ['base_info', 'isKong'], function (kongArr) {
					if (kongArr) {
						let findex = kongArr.findIndex(element => {
							let base_info = JSON.parse(element.base_info);
							return conf.seatNum == base_info.seatNum && element.isKong == 0
						});
						if (findex != -1) {
							return
						} else {
							db.get_user_data_by_userid(quanZhu, function (udata) {
								if (udata) {
									db.get_quan_data(quanId, function (qdata) {
										let key = "siRen"
										if (conf.seatNum == 3) {
											key = "sanRen"
										} else if (conf.seatNum == 2) {
											key = "erRen"
										}
										let ruleconf = JSON.parse(qdata[key])
										if (ruleconf)
											roomMgr.createRoom(quanZhu, ruleconf, udata.gems, serverIp, config.SOCKET_PORT, quanId, quanZhu,qdata.nickname, function (errcode, roomId, g) {
												let uconf = ruleconf
												if (errcode != 0 || roomId == null) {
													console.log("满创建房间失败")
													uconf.haveRoom = 0;
												} else {
													uconf.haveRoom = 1;
													console.log("满创建房间成功")
												}
												db.store_quan_rule(quanId, key, JSON.stringify(uconf), function (ret) {
													console.log("存储规则######：", ret)
												})
											});
									})

								}
							})
						}
					}
				})
			}
		})


	}
}

app.get('/enter_room', function (req, res) {
	var userId = parseInt(req.query.userId);
	var name = req.query.name;
	var roomId = req.query.roomId;
	var sign = req.query.sign;
	var eip = req.query.eip;
	var mapInfo = req.query.mapInfo;
	if (userId == null || roomId == null || sign == null) {
		http.send(res, 1, "invalid parameters");
		return;
	}
	var md5 = crypto.md5(userId + name + roomId + config.ROOM_PRI_KEY);
	console.log(req.query);
	console.log(md5);
	if (md5 != sign) {
		http.send(res, 2, "sign check failed.");
		return;
	}
	//安排玩家坐下
	console.log("安排玩家坐下")
	roomMgr.enterRoom(roomId, userId, name, mapInfo,eip, function (ret) {
		if (ret == 0 || ret == 11) {
			if (ret == 0) {
				createQuanroom(roomId)
			}
			var token = tokenMgr.createToken(userId, 5000);
			console.log("创建token了", token)
			http.send(res, 0, "ok", {
				token: token
			});
		} else {
			if (ret == 1) {
				http.send(res, 4, "room is full.");
			} else if (ret == 2) {
				http.send(res, 3, "can't find room.");
			} else if (ret == 2222) {
				http.send(res, 2222, "gems not enough");
			} else if (ret == 5) {
				http.send(res, 5, "game is runing");
			}
			else if (ret == 10) {
				http.send(res, 10, "same ip");
			}
		}
	});
});

app.get("/send_to_socket", function (req, res) {
	console.log(typeof (req.query.sendData))
	let sendData = JSON.parse(req.query.sendData)
	userMgr.sendMsg(req.query.sir, req.query.eventName, sendData)
	http.send(res, 0, "ok", {
		msg: "发送成功" + req.query.eventName
	})
});


app.get('/ping', function (req, res) {
	var sign = req.query.sign;
	var md5 = crypto.md5(config.ROOM_PRI_KEY);
	if (md5 != sign) {
		return;
	}
	http.send(res, 0, "pong");
});

app.get('/is_room_runing', function (req, res) {
	var roomId = req.query.roomid;
	var sign = req.query.sign;
	if (roomId == null || sign == null) {
		http.send(res, 1, "invalid parameters");
		return;
	}

	var md5 = crypto.md5(roomId + config.ROOM_PRI_KEY);
	if (md5 != sign) {
		http.send(res, 2, "sign check failed.");
		return;
	}
	http.send(res, 0, "ok", {
		runing: true
	});
});

var gameServerInfo = null;
var lastTickTime = 0;

//向大厅服定时心跳
function update() {
	if (lastTickTime + config.HTTP_TICK_TIME < Date.now()) {
		lastTickTime = Date.now();
		gameServerInfo.load = roomMgr.getTotalRooms();
		http.get(config.HALL_ROOM_IP, config.HALL_PORT, "/register_gs", gameServerInfo, function (ret, data) {
			if (ret == true) {
				if (data.errcode != 0) {
					console.log(data.errmsg);
				}

				if (data.ip != null) {
					serverIp = data.ip;
				}
			} else {
				//
				lastTickTime = 0;
			}
		});

		var mem = process.memoryUsage();
		var format = function (bytes) {
			return (bytes / 1024 / 1024).toFixed(2) + 'MB';
		};
	}
}

exports.start = function ($config) {
	config = $config;
	gameServerInfo = {
		id: config.SERVER_ID,
		clientip: config.CLIENT_IP,
		clientport: config.SOCKET_PORT,
		httpPort: config.HTTP_PORT,
		load: roomMgr.getTotalRooms(),
	};
	setInterval(update, 1000);
	app.listen(config.HTTP_PORT, config.FOR_HALL_IP);
	console.log("game server is listening on " + config.FOR_HALL_IP + ":" + config.HTTP_PORT);
};