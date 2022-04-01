const ACTION_CHUPAI = 1;
const ACTION_MOPAI = 2;
const ACTION_PENG = 3;
const ACTION_GANG = 4;
const ACTION_HU = 5;
const ACTION_ZIMO = 6;
const ACTION_CHI = 7;
const ACTION_OVER = 8;
const ACTION_BUHUA = 9;


cc.Class({
    extends: cc.Component,

    properties: {
        _lastAction: null,
        _actionRecords: null,
        _currentIndex: 0,
    },
    onLoad: function () {

    },

    clear: function () {
        this._lastAction = null;
        this._actionRecords = null;
        this._currentIndex = 0;
    },

    init: function (data) {
        this._actionRecords = data.action_records;
        if (this._actionRecords == null) {
            this._actionRecords = {};
        }
        this._currentIndex = 0;
        this._lastAction = null;
    },

    isReplay: function () {
        return this._actionRecords != null;
    },

    getNextAction: function () {
        if (this._currentIndex >= this._actionRecords.length) {
            return null;
        }
        return this._actionRecords[this._currentIndex++];
        // var si = this._actionRecords[this._currentIndex++];
        // var action = this._actionRecords[this._currentIndex++];
        // var pai = this._actionRecords[this._currentIndex++];
        // return {
        //     si: si,
        //     type: action,
        //     pai: pai
        // };
    },

    takeAction: function () {
        var action = this.getNextAction();
        
        // if (this._lastAction != null && this._lastAction.type == ACTION_CHUPAI) {
        //     if (action != null && action.type != ACTION_PENG && action.type != ACTION_GANG && action.type != ACTION_HU) {
        //         // cc.vv.MjNetMgr.doGuo(this._lastAction.si, this._lastAction.pai);
        //     }
        // }
        this._lastAction = action;
        if (action == null) {
            return -1;
        }
        console.log("回放动作****",action.type,"回放数据",action.data)
        if (action.type == ACTION_CHUPAI) {
            cc.vv.MjNetMgr.doChupai(action.si, action.data);
            return 1.0;
        } else if (action.type == ACTION_MOPAI) {
            cc.vv.MjNetMgr.doMopai(action.data);
            cc.vv.MjNetMgr.doTurnChange(action.si);
            return 0.5;
        } else if (action.type == ACTION_PENG) {
            var penginfo = action.pai;
            cc.vv.MjNetMgr.doPeng(action.data);
            cc.vv.MjNetMgr.doTurnChange(action.si);
            return 1.0;
        } else if (action.type == ACTION_GANG) {
            cc.vv.MjNetMgr.dispatchEvent('hangang_notify', action.si);
            cc.vv.MjNetMgr.doGang(action.data);
            cc.vv.MjNetMgr.doTurnChange(action.si);
            return 1.0;
        } else if (action.type == ACTION_HU) {
            cc.vv.MjNetMgr.doHu(action.data);
            return 1.5;
        } else if (action.type == ACTION_ZIMO) {
            cc.vv.MjNetMgr.doHu({
                seatindex: action.si,
                hupai: action.pai,
                iszimo: true
            });
            return 1.5;
        } else if (action.type == ACTION_CHI) {
            cc.vv.MjNetMgr.doChi(action.data);
            cc.vv.MjNetMgr.doTurnChange(action.si);
            return 1.0;
        }
        else if (action.type == ACTION_OVER) {
            cc.vv.MjNetMgr.doGameOver(action.data.results,action.data.time);
            this._actionRecords = null;
            return 1.0;
        }
        else if (action.type == ACTION_BUHUA) {
            cc.vv.MjNetMgr.buhuaFunc(action.data);
            return 1.0;
        }
    }

});