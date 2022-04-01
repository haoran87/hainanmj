cc.Class({
    extends: cc.Component,

    properties: {
        updatePanel: {
            default: null,
            type: cc.Node
        },
        manifestUrl: {
            type: cc.Asset,
            default: null,
        },
        percent: {
            default: null,
            type: cc.Label
        },
        lblErr: {
            default: null,
            type: cc.Label
        },
        progressNode: {
            default: null,
            type: cc.Node
        },
       
        _needRestart: false,
        _failed: false,
        _oldPercent: 0,
        _progress: null,
    },

    checkCb: function (event) {
        console.log('checkCb Code: ' + event.getEventCode());
        if (jsb.EventAssetsManager) {
            switch (event.getEventCode()) {
                case jsb.EventAssetsManager.ERROR_NO_LOCAL_MANIFEST:
                    console.log("No local manifest file found, hot update skipped.");
                    // cc.eventManager.removeListener(this._checkListener);
                    this.lblErr.string += 'ERROR_NO_LOCAL_MANIFEST\n';
                    break;
                case jsb.EventAssetsManager.ERROR_DOWNLOAD_MANIFEST:
                    console.log("没有找到更新资源文件")
                    cc.director.loadScene("loading");
                    this.lblErr.string += 'ERROR_DOWNLOAD_MANIFEST\n';
                    break;
                case jsb.EventAssetsManager.ERROR_PARSE_MANIFEST:
                    console.log("Fail to download manifest file, hot update skipped.");
                    this.lblErr.string += 'ERROR_PARSE_MANIFEST\n';
                    break;
                case jsb.EventAssetsManager.ALREADY_UP_TO_DATE:
                    console.log("Already up to date with the latest remote version.");
                    this.lblErr.string += "游戏不需要更新\n";
                    cc.director.loadScene("loading");
                    break;
                case jsb.EventAssetsManager.NEW_VERSION_FOUND:
                    this._am.setEventCallback(null);
                    this._needUpdate = true;
                    this.percent.string = '0%';
                    this.progressNode.active = true;
                    this.updatePanel.active = true;
                    this.lblErr.string += 'NEW_VERSION_FOUND\n';
                    break;
                default:
                    this.lblErr.string += 'default\n';
                    break;
            }
            this.hotUpdate();
        }

    },

    updateCb: function (event) {
        if (!this._needRestart && !this._failed) {
            switch (event.getEventCode()) {
                case jsb.EventAssetsManager.ERROR_NO_LOCAL_MANIFEST:
                    console.log('No local manifest file found, hot update skipped.');
                    this._failed = true;
                    this.lblErr.string += 'ERROR_NO_LOCAL_MANIFEST\n';
                    break;
                case jsb.EventAssetsManager.UPDATE_PROGRESSION:
                    var percent = event.getPercent();
                    var percentByFile = event.getPercentByFile();
                    var msg = event.getMessage();
                    if (msg) {
                        console.log(msg);
                    }
                    if (typeof (percent) == "number" && !isNaN(percent) && Math.floor(percent * 100) > this._oldPercent) {
                        this._oldPercent = Math.floor(percent * 100);
                        this.percent.string = this._oldPercent + '%';
                        this.progressNode.getComponent(cc.ProgressBar).progress = percent;
                    }
                    break;
                case jsb.EventAssetsManager.ERROR_DOWNLOAD_MANIFEST:
                    this.lblErr.string += 'ERROR_DOWNLOAD_MANIFEST\n';
                    break;
                case jsb.EventAssetsManager.ERROR_PARSE_MANIFEST:
                    console.log('Fail to download manifest file, hot update skipped.');
                    this._failed = true;
                    this.lblErr.string += 'ERROR_PARSE_MANIFEST\n';
                    break;
                case jsb.EventAssetsManager.ALREADY_UP_TO_DATE:
                    console.log('Already up to date with the latest remote version.');
                    this._failed = true;
                    this.lblErr.string += 'ALREADY_UP_TO_DATE\n';
                    break;
                case jsb.EventAssetsManager.UPDATE_FINISHED:
                    console.log('更新完了 ' + event.getMessage());
                    this._am.setEventCallback(null);
                    this._needRestart = true;
                    this.percent.string = 100 + '%'; //.toFixed(2)
                    this.progressNode.getComponent(cc.ProgressBar).progress = 1;
                    this.lblErr.string += 'UPDATE_FINISHED\n';
                    break;
                case jsb.EventAssetsManager.UPDATE_FAILED:
                    console.log('Update _failed. ' + event.getMessage());
                    this._failCount++;
                    if (this._failCount < 5) {
                        this._am.downloadFailedAssets();
                    } else {
                        console.log('Reach maximum fail count, exit update process');
                        this._failCount = 0;
                        this._failed = true;
                    }
                    this.lblErr.string += 'UPDATE_FAILED\n';
                    break;
                case jsb.EventAssetsManager.ERROR_UPDATING:
                    console.log('Asset update error: ' + event.getAssetId() + ', ' + event.getMessage());
                    this.lblErr.string += 'ERROR_UPDATING\n';
                    break;
                case jsb.EventAssetsManager.ERROR_DECOMPRESS:
                    console.log(event.getMessage());
                    this.lblErr.string += 'ERROR_DECOMPRESS\n';
                    break;
                default:
                    this.lblErr.string += 'default\n';
                    break;
            }
        }

        if (this._failed) {
            this.updatePanel.active = false;
            this.lblErr.string += '_failed\n';
        }

        if (this._needRestart) {
            var searchPaths = jsb.fileUtils.getSearchPaths();
            console.log("更新完毕   更换更新信息2" + searchPaths)
            var newPaths = this._am.getLocalManifest().getSearchPaths();
            console.log('searchPaths is ' + searchPaths + ' newPaths is ' + newPaths);
            Array.prototype.unshift(searchPaths, newPaths);
            cc.sys.localStorage.setItem('HotUpdateSearchPaths', JSON.stringify(searchPaths));
            jsb.fileUtils.setSearchPaths(searchPaths);
            this.lblErr.string += "游戏资源更新完毕\n";
            this.percent.string = '100%';
            this.progressNode.getComponent(cc.ProgressBar).progress = 1;
            this._am = null;
            setTimeout(function () {
                cc.game.restart()
            }, 500)
        }
    },

    hotUpdate: function () {
        if (this._am && this._needUpdate) {
            this.lblErr.string += "开始更新游戏资源...\n";
            this._am.setEventCallback(this.updateCb.bind(this));
            this._failCount = 0;
            this._am.update();
        }
    },

    onLoad: function () {
        if (!cc.sys.isNative) {
            console.log('Hot update is only available in Native build');
            return;
        }
        this.updatePanel.active = false;
        this.percent.string = ""
        this.progressNode.active = false;
        this.progressNode.getComponent(cc.ProgressBar).progress = 0;
        console.log("热更新界面")
        var storagePath = ((jsb.fileUtils ? jsb.fileUtils.getWritablePath() : '/') + 'tiantianqipai_asset');
        this._am = new jsb.AssetsManager(this.manifestUrl.nativeUrl, storagePath);
        console.log('Storage path for remote asset : ' + storagePath);
        console.log('Local manifest URL : ' + this.manifestUrl.nativeUrl);
        this._needUpdate = false;
        if (this._am.getLocalManifest().isLoaded()) {
            this._am.setEventCallback(this.checkCb.bind(this));
            console.log("执行了+++")
            this._am.checkUpdate();
        } else {

        }
    },
    onDestroy: function () {
        if (this._am) {
            this._am.setEventCallback(null);
            this._am = null;
        }
    },
});