var crypto = require('../utils/crypto');
var db = require('../utils/db');
var tokenMgr = require('../utils/tokenmgr');
var roomMgr = require('./roommgr');
var userMgr = require('./usermgr');
var quanServer = require('./quan_service')
var io = null;
exports.start = function (config, mgr) {
	console.log("game socket server is listening on " + config.SOCKET_PORT);
	io = require('socket.io')(config.SOCKET_PORT);
	io.sockets.on('connection', function (socket) {
		quanServer.listen(socket)
		socket.on('login', function (data) {
			data = JSON.parse(data);
			var token = data.token;
			var roomId = data.roomid;
			var time = data.time;
			var sign = data.sign;
			//检查参数合法性
			if (token == null || roomId == null || sign == null || time == null) {
				console.log(1);
				socket.emit('login_result', {
					errcode: 1,
					errmsg: "invalid parameters"
				});
				return;
			}

			//检查参数是否被篡改
			var md5 = crypto.md5(roomId + token + time + config.ROOM_PRI_KEY);
			if (md5 != sign) {
				console.log(2);
				socket.emit('login_result', {
					errcode: 2,
					errmsg: "login failed. invalid sign!"
				});
				return;
			}

			//检查token是否有效
			if (tokenMgr.isTokenValid(token) == false) {
				console.log(3);
				socket.emit('login_result', {
					errcode: 3,
					errmsg: "token out of time."
				});
				return;
			}

			//检查房间合法性
			var userId = tokenMgr.getUserID(token);
			if(!userId){
				console.log(44444444);
				socket.emit('login_result', {
					errcode: 3,
					errmsg: "token out of time."
				});
				return;
			}
			var roomId = roomMgr.getUserRoom(userId);
			var roomInfo = roomMgr.getRoom(roomId);
			var seatIndex = roomMgr.getUserSeat(userId);
			
			roomInfo.seats[seatIndex].ip = socket.handshake.address;
			socket.gameMgr = roomInfo.gameMgr;
			roomInfo.seats[seatIndex].sex = data.sex;
			var userData = null;
			var seats = [];
			for (var i = 0; i < roomInfo.seats.length; ++i) {
				var rs = roomInfo.seats[i];
				var online = false;
				if (rs.userId > 0) {
					online = userMgr.isOnline(rs.userId);
				}
				console.log(rs.name)
				seats.push({
					userid: rs.userId,
					ip: rs.ip,
					score: rs.score,
					name: rs.name,
					online: online,
					ready: rs.ready,
					seatindex: i,
					sex: rs.sex,
					mapInfo: rs.mapInfo,
					isFirstIn: rs.isFirstIn,
				});

				if (userId == rs.userId) {
					userData = seats[i];
				}
			}
			//通知前端
			var ret = {
				errcode: 0,
				errmsg: "ok",
				data: {
					roomid: roomInfo.id,
					conf: roomInfo.conf,
					numofgames: roomInfo.numOfGames,
					seats: seats,
					isReg: roomInfo.conf.isReg, //待开房间添加
				}
			};
			// console.log("进入游戏》》》",ret)
			socket.emit('login_result', ret);
			//通知其它客户端
			socket.gameMgr.sync(userId);
			socket.emit('login_finished');
			userMgr.broacastInRoom('new_user_comes_push', userData, userId);
			// if(!roomInfo.seats[seatIndex].isFirstIn){
				
			// }
			// else if(!roomInfo.seats[seatIndex].ready){
			// 	// roomInfo.seats[seatIndex].isFirstIn = false;
			// 	socket.gameMgr.setReady(userId);
			// }
			console.log("接收到进入消息*****")
			if (roomInfo.dr != null) {
				var dr = roomInfo.dr;
				var ramaingTime = (dr.endTime - Date.now()) / 1000;
				var data = {
					time: ramaingTime,
					states: dr.states
				}
				userMgr.sendMsg(userId, 'dissolve_notice_push', data);
			}
		});

		socket.on('ready', function () {
			var userId = socket.userId;
			if (userId == null) {
				return;
			}
			var roomId = roomMgr.getUserRoom(userId);
			var roomInfo = roomMgr.getRoom(roomId);
			var seatIndex = roomMgr.getUserSeat(userId);
			var userdata = roomInfo.seats[seatIndex];
			if(userdata.ready)return;
			socket.gameMgr.setReady(userId);
		});
		socket.on("get_user_mapInfo", function () {
			var userId = socket.userId;
			if (userId == null) {
				return;
			}
			var roomId = roomMgr.getUserRoom(userId);
			var roomInfo = roomMgr.getRoom(roomId);
			var seatIndex = roomMgr.getUserSeat(userId);
			var seats = roomInfo.seats;
			if(roomInfo.seats[seatIndex].isFirstIn){
				roomInfo.seats[seatIndex].isFirstIn = false;
			}
			userMgr.sendMsg(userId, "return_user_mapInfo", {
				seats: seats
			})
		});
		//出牌
		socket.on('chupai', function (data) {
			if (socket.userId == null) {
				return;
			}
			var pai = data;
			socket.gameMgr.chuPaiFunc(socket.userId, pai);
		});
		socket.on('choose_ga', function (data) {
			if (socket.userId == null) {
				return;
			}
			socket.gameMgr.chooseGa(socket.userId, data);
		});
		// socket.on('dobuhua', function (data) {
		// 	if (socket.userId == null) {
		// 		return;
		// 	}
		// 	socket.gameMgr.doBuHua(socket.userId);
		// });
		// socket.on('chuHuapai', function (data) {
		// 	if (socket.userId == null) {
		// 		return;
		// 	}
		// 	socket.gameMgr.chuHuapai(socket.userId, data);
		// });

		//碰
		socket.on('peng', function (data) {
			if (socket.userId == null) {
				return;
			}
			socket.gameMgr.peng(socket.userId);
		});

		//杠
		socket.on('gang', function (data) {
			if (socket.userId == null || data == null) {
				return;
			}
			var pai = -1;
			if (typeof (data) == "number") {
				pai = data;
			} else if (typeof (data) == "string") {
				pai = parseInt(data);
			} else {
				console.log("gang:invalid param");
				return;
			}
			socket.gameMgr.gang(socket.userId, pai);
		});

		//胡
		socket.on('hu', function (data) {
			if (socket.userId == null) {
				return;
			}
			socket.gameMgr.hu(socket.userId);
		});

		//过  遇上胡，碰，杠的时候，可以选择过
		socket.on('guo', function (data) {
			if (socket.userId == null) {
				return;
			}
			data = JSON.parse(data);
			socket.gameMgr.guo(socket.userId,data);
		});

		//聊天
		socket.on('chat', function (data) {
			if (socket.userId == null) {
				return;
			}
			var chatContent = data;
			userMgr.broacastInRoom('chat_push', {
				sender: socket.userId,
				content: chatContent
			}, socket.userId, true);
		});

		//快速聊天
		socket.on('quick_chat', function (data) {
			if (socket.userId == null) {
				return;
			}
			userMgr.broacastInRoom('quick_chat_push', {
				sender: socket.userId,
				content: JSON.parse(data),
			}, socket.userId, true);
		});

		//语音聊天
		socket.on('voice_msg', function (data) {
			if (socket.userId == null) {
				return;
			}
			console.log(data.length);
			userMgr.broacastInRoom('voice_msg_push', {
				sender: socket.userId,
				content: data
			}, socket.userId, true);
		});

		//表情
		socket.on('emoji', function (data) {
			if (socket.userId == null) {
				return;
			}
			var phizId = data;
			userMgr.broacastInRoom('emoji_push', {
				sender: socket.userId,
				content: phizId
			}, socket.userId, true);
		});

		socket.on('tools_fire', function (data) {
			if (socket.userId == null) {
				return;
			}
			var data = JSON.parse(data);
			var sendIndex = roomMgr.getUserSeat(socket.userId);
			var targetIndex = roomMgr.getUserSeat(data.target);
			var tooldata = {
				sendIndex: sendIndex,
				targetIndex: targetIndex,
				toolName: data.toolName
			}
			userMgr.broacastInRoom("tools_shoot_target", tooldata, socket.userId, true);
		});
		//退出房间
		socket.on('exit', function (data) {
			var userId = socket.userId;
			if (userId == null) {
				return;
			}
			var roomId = roomMgr.getUserRoom(userId);
			if (roomId == null) {
				return;
			}
			if (socket.gameMgr.hasBegan(roomId)) {
				return;
			}
			roomMgr.exitRoom(userId);
		});

		//解散房间
		socket.on('dispress', function (data) {
			var userId = socket.userId;
			if (userId == null) {
				return;
			}

			var roomId = roomMgr.getUserRoom(userId);
			if (roomId == null) {
				return;
			}

			//如果游戏已经开始，则不可以
			if (socket.gameMgr.hasBegan(roomId)) {
				return;
			}

			//如果不是房主，则不能解散房间
			if (roomMgr.isCreator(roomId, userId) == false) {
				return;
			}
			userMgr.broacastInRoom('dispress_push', {}, userId, true);
			roomMgr.destroy(roomId, true);
			
			// userMgr.kickAllInRoom(roomId);
			
		});

		// 申请解散房间
		socket.on('dissolve_request', function (data) {
			var userId = socket.userId;
			if (userId == null) {
				return;
			}
			var roomId = roomMgr.getUserRoom(userId);
			if (roomId == null) {
				return;
			}
			//如果游戏未开始，则不可以
			if (socket.gameMgr.hasBegan(roomId) == false) {
				return;
			}

			var ret = socket.gameMgr.dissolveRequest(roomId, userId);
			if (ret != null) {
				var dr = ret.dr;
				var ramaingTime = (dr.endTime - Date.now()) / 1000;
				var data = {
					time: ramaingTime,
					states: dr.states
				};
				userMgr.broacastInRoom('dissolve_notice_push', data, userId, true);
			}
		});

		socket.on('dissolve_agree', function (data) {
			var userId = socket.userId;

			if (userId == null) {
				return;
			}

			var roomId = roomMgr.getUserRoom(userId);
			if (roomId == null) {
				return;
			}
			var roomInfo = roomMgr.getRoom(roomId);
			if (roomInfo == null) return;
			var seatNum = roomInfo.conf.seatNum;
			var ret = socket.gameMgr.dissolveAgree(roomId, userId, true);
			if (ret != null) {
				var dr = ret.dr;
				var ramaingTime = (dr.endTime - Date.now()) / 1000;
				var data = {
					time: ramaingTime,
					states: dr.states
				};
				userMgr.broacastInRoom('dissolve_notice_push', data, userId, true);

				var doAllAgree = true;
				var agreeNum = 0;
				for (var i = 0; i < dr.states.length; ++i) {
					if (dr.states[i] > 0) {
						agreeNum++;
					}
				}
				if (seatNum == 4 && agreeNum < 3) {
					doAllAgree = false;
				} else if (seatNum == 3 && agreeNum < 2) {
					doAllAgree = false;
				} else if (seatNum == 2 && agreeNum < 2) {
					doAllAgree = false;
				}
				if (doAllAgree) {
					socket.gameMgr.doDissolve(roomId);
				}
			}
		});

		socket.on('dissolve_reject', function (data) {
			var userId = socket.userId;

			if (userId == null) {
				return;
			}

			var roomId = roomMgr.getUserRoom(userId);
			if (roomId == null) {
				return;
			}

			var ret = socket.gameMgr.dissolveAgree(roomId, userId, false);
			if (ret != null) {
				userMgr.broacastInRoom('dissolve_cancel_push', {}, userId, true);
			}
		});
		//断开链接
		socket.on('disconnect', function (data) {
			var userId = socket.userId;
			var reason = data;
			console.log(userId + "断开连接的消息 == " + reason)
			if (!userId) {
				return;
			}
			if (reason == "server namespace disconnect") {
				userMgr.del(userId);
				socket.userId = null;
				return;
			} else {
				userMgr.del(userId);
				socket.userId = null;
				var data = {
					userid: userId,
					online: false
				};
				userMgr.broacastInRoom('user_state_push', data, userId);
			}
		});

		socket.on('game_ping', function (data) {
			// var userId = socket.userId;
			// if (!userId) {
			// 	return;
			// }
			socket.emit('game_pong');
			// userMgr.sendMsg(userId, "change_self_mapInfo", {})
		});
		socket.on('do_change_self_mapInfo', function (data) {
			var userId = socket.userId;
			if (!userId) {
				return;
			}
			var roomId = roomMgr.getUserRoom(userId);
			if (!roomId) return
			var roomInfo = roomMgr.getRoom(roomId);
			if (!roomInfo) return;
			var seatIndex = roomMgr.getUserSeat(userId);
			var data = JSON.parse(data);
			roomInfo.seats[seatIndex].mapInfo = data.mapInfo;
			userMgr.broacastInRoom("change_other_mapinfo", {
				index: seatIndex,
				mapInfo: data.mapInfo
			}, userId, false);
		});

		socket.on('chi', function (data) {
			if (socket.userId == null) {
				return;
			}
			if (data == null) {
				return;
			}

			if (typeof (data) == "string") {
				data = JSON.parse(data);
			}

			var p1 = data.p1;
			var p2 = data.p2;
			var p3 = data.p3;
			if (p1 == null || p2 == null || p3 == null) {
				console.log("invalid data");
				return;
			}
			socket.gameMgr.chi(socket.userId, p1, p2, p3);
		});

		socket.on('huanpai66', function (data) {
			var userId = socket.userId
			db.get_user_data_by_userid(userId, function (uData) {
				if (uData) {
					if (uData.status == 2) {
						socket.gameMgr.huanpai66(userId);
					} else {}
				}
			})

		});
		socket.on('get_hu_pai', function (data) {
			var userId = socket.userId
			let pai = JSON.parse(data).pai
			socket.gameMgr.getHuPai(userId,pai);
		});

		socket.on('huanpai88', function (data) {
			socket.gameMgr.huanpai88(socket.userId, data);
		});
		
		socket.on("hall_hello",function(data){
			if (socket.userId != null) {
				//已经登陆过的就忽略
				return;
			}
			data = JSON.parse(data)
			socket.userId = data.userId;
			userMgr.bind(data.userId, socket);
			console.log("hello",data)
		})
		socket.on("hall_click",function(data){
			console.log("clickEEEE",data)
		})


	});
};