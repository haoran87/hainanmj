var db = require('../utils/db');
var assert = require('assert');
var userMgr = require("./usermgr")
var fs = require("fs");
var logf = function (roomId, logContent) {
	fs.appendFile('log/' + roomId + '.log', '' + Date.now() + ' ' + logContent + '\r\n', function () {});
};

var rooms = {};
var creatingRooms = {};

var userLocation = {};
var totalRooms = 0;
var JU_SHU = [4, 8 , 16];
exports.COST_GEMS = [2, 4 , 6];
var SEATNUM = [4, 3, 2];
exports.quanRoomInfo = [];
const TG = [30,30,60,120]

function generateRoomId() {
	var roomId = "";
	for (var i = 0; i < 6; ++i) {
		roomId += Math.floor(Math.random() * 10);
	}
	return roomId;
}

function constructRoomFromDb(dbdata) {
	var conf = JSON.parse(dbdata.base_info) //数据库 base_info 字节数不足容易出错
	var roomInfo = {
		uuid: dbdata.uuid,
		id: dbdata.id,
		numOfGames: dbdata.num_of_turns,
		createTime: dbdata.create_time,
		nextButton: dbdata.next_button,
		gameLing: dbdata.game_ling,
		lianzhuang: 0,
		seats: new Array(conf.seatNum),
		conf: conf,
		scoreList: [0, 0, 0, 0],
	};
	roomInfo.gameMgr = require("./gamemgr");
	var roomId = roomInfo.id;

	for (let i = 0; i < conf.seatNum; ++i) {
		let s = roomInfo.seats[i] = {};
		s.userId = dbdata["user_id" + i];
		s.score = dbdata["user_score" + i];
		s.name = dbdata["user_name" + i];
		console.log("aa == " + s.name)
		s.ready = false;
		s.seatIndex = i;
		s.numZiMo = 0;
		s.numJiePao = 0;
		s.numDianPao = 0;
		s.numAnGang = 0;
		s.numMingGang = 0;
		s.numHua = 0;
		s.isFirstIn = true;
		s.maxga = 0;
		s.eip ="";
		if (s.userId > 0) {
			s.isFirstIn = false;
			userLocation[s.userId] = {
				roomId: roomId,
				seatIndex: i
			};
		}
	}
	rooms[roomId] = roomInfo;
	totalRooms++;
	return roomInfo;
}


exports.createRoom = function (creator, roomConf, gems, ip, port, quanId, quanZhu,quanMing, callback) {
	if (roomConf == null || roomConf.type == null) {
		callback(1, null);
		return;
	}
	var junum = roomConf.jushu;
	var cost = exports.COST_GEMS[junum];
	if (cost > gems) {
		callback(2222, null);
		return;
	}
	var seatNum = SEATNUM[roomConf.mjType];
	var fnCreate = function () {
		var roomId = generateRoomId();
		if (rooms[roomId] != null || creatingRooms[roomId] != null) {
			fnCreate();
		} else {
			creatingRooms[roomId] = true;
			db.is_room_exist(roomId, function (ret) {
				if (ret) {
					delete creatingRooms[roomId];
					fnCreate();
				} else {
					var createTime = Math.ceil(Date.now() / 1000);
					var roomInfo = {
						uuid: "",
						id: roomId,
						numOfGames: 0,
						createTime: createTime,
						nextButton: 0,
						gameLing: 0,
						lianzhuang: 0,
						seats: [],
						endData: null,
						startTimer: null,
						scoreList: [0, 0, 0, 0],
						conf: {
							type: roomConf.type,
							baseScore: 2,
							maxGames: JU_SHU[junum],
							creator: creator,
							seatNum: seatNum,
							createTime: createTime,
							quanZhu: quanZhu || "",
							quanId: quanId || "",
							quanMing:quanMing || "",
							cost: cost,
							otherData: roomConf.otherData,
							coinData:roomConf.coinData || "",
							wanfa: roomConf.wanfa,
							func:roomConf.func,
							tg:TG[roomConf.tg]
						}
					};

					roomInfo.gameMgr = require("./gamemgr");
					console.log(roomInfo.conf);

					for (var i = 0; i < seatNum; ++i) {
						roomInfo.seats.push({
							userId: 0,
							score: 0,
							name: "",
							ready: false,
							seatIndex: i,
							numZiMo: 0,
							numJiePao: 0,
							numDianPao: 0,
							numAnGang: 0,
							numMingGang: 0,
							numHua: 0,
							isFirstIn: true,
							isPeep: false,
							sex: 0,
							maxga: 0,
							eip:"",
						});
					}
					db.create_room(roomInfo.id, roomInfo.conf, ip, port, createTime, creator, quanId, function (uuid) {
						delete creatingRooms[roomId];
						if (uuid != null) {
							roomInfo.uuid = uuid;
							rooms[roomId] = roomInfo; //rooms对象
							totalRooms++;
							if (quanZhu) {
								gems -= cost;
								db.cost_gems(quanZhu, cost, function (ret) {callback(0, roomId, gems);});
							}
							else{
								callback(0, roomId, gems);
							}
							
						} else {
							callback(3, null);
						}
					});
				}
			});
		}
	}
	fnCreate();
};
exports.destroy = function (roomId, backGems) {
	var roomInfo = rooms[roomId];
	if (roomInfo == null) {
		return;
	}
	var seatNum = roomInfo.conf.seatNum
	for (var i = 0; i < seatNum; ++i) {
		var userId = roomInfo.seats[i].userId;
		if (userId > 0) {
			delete userLocation[userId];
			db.set_room_id_of_user(userId, null);
		}
	}
	var conf = roomInfo.conf;
	if (conf.quanId) {
		// exports.quanRoomInfo.push(conf.quanId);
		if (backGems && conf.quanZhu) {
			var cost = conf.cost;
			db.cost_gems(conf.quanZhu, -cost, function (ret) {
				if (ret) {
					// exports.quanRoomInfo.push(conf.quanZhu);
				}

			})

		}
	}
	delete rooms[roomId];
	totalRooms--;
	db.delete_room(roomId);
}
exports.getTotalRooms = function () {
	return totalRooms;
}

exports.getRoom = function (roomId) {
	return rooms[roomId];
};

// 待开房间 判断是否待开房间
exports.isReg = function (roomId) {
	var roomInfo = rooms[roomId];
	if (roomInfo == null) {
		return false;
	}
	return roomInfo.conf.isReg;
}

exports.isCreator = function (roomId, userId) {
	var roomInfo = rooms[roomId];
	if (roomInfo == null) {
		return false;
	}
	return roomInfo.conf.creator == userId;
};
exports.isQuan = function (roomId) {
	var roomInfo = rooms[roomId];
	if (roomInfo == null) {
		return false;
	}
	var conf = roomInfo.conf
	if (conf.quanId) {
		return true;
	} else {
		return false;
	}
};
exports.isQuanZhu = function (roomId, userId) {
	var roomInfo = rooms[roomId];
	if (roomInfo == null) {
		return false;
	}
	var conf = roomInfo.conf
	return conf.quanZhu == userId;
};
exports.getConf = function (roomId) {
	var roomInfo = rooms[roomId];
	if (roomInfo == null) {
		return null;
	}
	return roomInfo.conf;
}
exports.enterRoom = function (roomId, userId, userName, mapInfo,eip, callback) {
	var room = rooms[roomId];
	var fnTakeSeat = function (room) {
		if (exports.getUserRoom(userId) == roomId) {
			//已存在
			room.seats[userLocation[userId].seatIndex].eip = eip
			return 11;
		}
		if(room.conf.func){
			let eindex = room.seats.findIndex(element => {
				return element.eip == eip;
			});
			if(eindex != -1){
				return 10;
			}
		}
		for (var i = 0; i < room.conf.seatNum; ++i) {
			var seat = room.seats[i];
			if (seat.userId <= 0) {
				seat.userId = userId;
				seat.name = userName;
				seat.mapInfo = mapInfo;
				seat.eip = eip;
				userLocation[userId] = {
					roomId: roomId,
					seatIndex: i
				};
				db.update_seat_info(roomId, i, seat.userId, "", seat.name);
				return 0;
			}
		}
		//房间已满
		return 1;
	}
	db.get_user_data_by_userid(userId, function (data) {
		if (room) {
			var ret = fnTakeSeat(room);
			callback(ret);
		} else {
			db.get_room_data(roomId, function (dbdata) {
				if (dbdata == null) {
					//找不到房间
					callback(2);
				} else {
					//construct room.
					room = constructRoomFromDb(dbdata);
					//
					var ret = fnTakeSeat(room);
					callback(ret);
				}
			});
		}
	})

};

exports.setReady = function (userId, value) {
	var roomId = exports.getUserRoom(userId);
	if (roomId == null) {
		return;
	}

	var room = exports.getRoom(roomId);
	if (room == null) {
		return;
	}

	var seatIndex = exports.getUserSeat(userId);
	if (seatIndex == null) {
		return;
	}

	var s = room.seats[seatIndex];
	s.ready = value;
	if (value) {
		userMgr.broacastInRoom('user_ready_push', {
			userid: userId,
			ready: true
		}, userId, true);
	}

}

exports.getUserRoom = function (userId) {
	var location = userLocation[userId];
	if (location != null) {
		return location.roomId;
	}
	return null;
};
// 20180116 
exports.isGameRunning = function (roomId) {
	// 房间开始    20180116 修改
	var room = rooms[roomId];
	var begin = room.gameMgr.isGameRunning(roomId);
	return begin;
}

exports.getUserSeat = function (userId) {
	var location = userLocation[userId];
	//console.log(userLocation[userId]);
	if (location != null) {
		return location.seatIndex;
	}
	return null;
};

exports.getUserLocations = function () {
	return userLocation;
};

exports.exitRoom = function (userId) {
	var location = userLocation[userId];
	if (location == null) return;
	var roomId = location.roomId;
	var seatIndex = location.seatIndex;
	var room = rooms[roomId];
	if (room == null || seatIndex == null) {
		return;
	}
	console.log("退出房间22")
	userMgr.broacastInRoom('exit_notify_push', userId, userId, false);
	userMgr.sendMsg(userId, "exit_result");
	// userMgr.gameDdisconnect(userId,true);
	var seat = room.seats[seatIndex];
	seat.userId = 0;
	seat.name = "";
	seat.eip = "";
	seat.ready = false;
	seat.isFirstIn = true;
	var user_id = "user_id" + seatIndex;
	var user_name = "user_name" + seatIndex;
	delete userLocation[userId];
	db.set_room_id_of_user(userId, null);
	db.set_userid_of_room(user_id, roomId, user_name);
};