const lingHome = [27, 28, 29, 30];
const huaWei = [[34,38],[35,39],[36,40],[37,41]]
 exports.check_fan_func = function(sd,k,game){ 
     let analyse = sd.tingMap[k].analyse
    if(pengpeng(sd,analyse)){
        console.log("有番 是碰碰胡")
        return true;
    }
    else if(qys(sd)){
        console.log("有番 清一色")
        return true;
    }
    else if(only_chi(sd,analyse)){
        console.log("有番 只吃不碰")
        return true;
    }
    else if(men_qing(sd)){
        console.log("有番 门清")
        return true;
    }
    else if(have_eye(analyse)){
        console.log("有番 有眼")
        return true;
    }
    else if(jian_ke(sd,analyse,game)){
        console.log("有番 箭刻")
        return true;
    }
    else if(feng_ke(sd,analyse,game)){
        console.log("有番 风刻")
        return true;
    }
    else if(have_ling(sd,analyse,game)){
        console.log("有番 有令")
        return true;
    }
    else if(hys(sd,game)){
        console.log("有番 混一色")
        return true;
    }
    else if(fhdw(sd)){
        console.log("有番 翻花对位")
        return true;
    }
    else{
        return false;
    }
}
function only_chi(sd,analyse){
    if(sd.pengs.length > 0 || sd.angangs.length > 0 || sd.wangangs.length > 0 || sd.diangangs.length > 0)return false;
    let keyHome = [31,32,33,lingHome[sd.seatIndex]]
    if(keyHome.includes(analyse.jiang)) return false;
    let item = analyse.item
    let index = item.findIndex(function(pa){
        return pa[0] == pa[1]
    })
    return index == -1;
}
function men_qing(sd){
    if(sd.pengs.length > 0 || sd.chis.length > 0 || sd.wangangs.length > 0 || sd.diangangs.length > 0){
        return false
    }
    else{
        return true
    }
};
function have_eye(analyse){
    let home = [1,4,7,10,13,16,19,22,25]
    return home.includes(analyse.jiang)
}
function jian_ke(sd,analyse,game){
    if(game.conf.otherData.wuzi)return false;
    let index = -1;
    if(sd.pengs.length > 0){
        index = sd.pengs.findIndex(function(el){
            return el.pai == 31 || el.pai == 32 || el.pai == 33;
        })
    }
    if(index == -1){
        index = analyse.item.findIndex(function(el){
            return  el[0] == 31 || el[0] == 32 || el[0] == 33
        })
    }
    return index != -1;
}
function feng_ke(sd,analyse,game){
    if(game.conf.otherData.wuzi)return false
    let index = -1;
    let myling = lingHome[sd.seatIndex]
    console.log("有风刻",myling)
    if(sd.pengs.length > 0){
        index = sd.pengs.findIndex(function(el){
            return el.pai == myling
        })
    }
    if(sd.angangs.length > 0 && index == -1){
        index = sd.angangs.findIndex(function(el){
            return el.pai == myling
        })
    }
    if(sd.wangangs.length > 0 && index == -1){
        index = sd.wangangs.findIndex(function(el){
            return el.pai == myling
        })
    }
    if(sd.diangangs.length > 0 && index == -1){
        index = sd.diangangs.findIndex(function(el){
            return el.pai == myling
        })
    }
    if(index == -1){
        index = analyse.item.findIndex(function(el){
            return  el[0] == myling
        })
    }
    return index != -1;
};
function have_ling(sd,analyse,game){
    console.log("有令牌",game.gameLing)
    if(!game.conf.otherData.ling) return false;
    let index = -1;
    if(sd.pengs.length > 0){
        index = sd.pengs.findIndex(function(el){
            return el.pai == game.gameLing
        })
    }
    if(index == -1){
        index = analyse.item.findIndex(function(el){
            return el[0] == el[1] && el[0] == game.gameLing
        })
    }
    return index != -1;
}
function hys(sd,game){
    if(!game.conf.otherData.hunyise) return false;
    let allPais = [];
    sd.holds.forEach(element => {
        if(element < 27){
            allPais.push(element)
        }
       
    });
    if(sd.pengs.length > 0){
        sd.pengs.forEach(function(peng){
            if(peng.pai < 27){
                allPais.push(peng.pai)
            }
            
        })
    }
    if(sd.chis.length > 0){
        sd.chis.forEach(function(el){
            for(var k in el){
                if(el[k] < 27){
                    allPais.push(el[k])
                }
                
            }
        })
    }
    if(sd.angangs.length > 0 ){
        sd.angangs.forEach(function(el){
            if(el.pai < 27){
                allPais.push(el.pai)
            }
        })
    }
    if(sd.wangangs.length > 0 ){
        sd.wangangs.forEach(function(el){
            if(el.pai < 27){
                allPais.push(el.pai)
            }
        })
    }
    if(sd.diangangs.length > 0 ){
        sd.diangangs.forEach(function(el){
            if(el.pai < 27){
                allPais.push(el.pai)
            }
        })
    }
    let pai = allPais[0];
    let pindex = -1;
    if(pai < 9){
        pindex = allPais.findIndex(function(p){
            return p >= 9
        })
    }
    else if(pai < 18){
        pindex = allPais.findIndex(function(p){
            return p < 9 || p >= 18
        })
    }
    else if(pai < 27){
        pindex = allPais.findIndex(function(p){
            return p < 18
        })
    }
    return pindex == -1;
}
function fhdw(sd){
    let flowers = sd.flowerFolds;
    console.log("繁华对位））））",flowers,huaWei[sd.seatIndex])
    if(flowers.length>0){
        let index = flowers.findIndex(function(ff){
            return huaWei[sd.seatIndex].includes(ff);
        })
        return index != -1;
    }
    else{
        return false;
    }
}
function pengpeng(sd,analyse){
    if(sd.chis.length >0 ) return false;
    let index =  analyse.item.findIndex(function(el){
        return el[0] != el[1]
    })
    return index == -1;
}
function qys(sd){
    let allPais = [];
    sd.holds.forEach(element => {
        allPais.push(element)
    });
    if(sd.pengs.length > 0){
        sd.pengs.forEach(function(peng){
            allPais.push(peng.pai)
        })
    }
    if(sd.chis.length > 0){
        sd.chis.forEach(function(el){
            for(var k in el){
                allPais.push(el[k])
            }
        })
    }
    if(sd.angangs.length > 0 ){
        sd.angangs.forEach(function(el){
            allPais.push(el.pai)
        })
    }
    if(sd.wangangs.length > 0 ){
        sd.wangangs.forEach(function(el){
            allPais.push(el.pai)
        })
    }
    if(sd.diangangs.length > 0 ){
        sd.diangangs.forEach(function(el){
            allPais.push(el.pai)
        })
    }
    let pai = allPais[0];
    if(pai > 26) return false;
    let pindex = -1;
    if(pai < 9){
        pindex = allPais.findIndex(function(p){
            return p >= 9
        })
    }
    else if(pai < 18){
        pindex = allPais.findIndex(function(p){
            return p < 9 || p >= 18
        })
    }
    else if(pai < 27){
        pindex = allPais.findIndex(function(p){
            return p < 18
        })
    }
    return pindex == -1;
}