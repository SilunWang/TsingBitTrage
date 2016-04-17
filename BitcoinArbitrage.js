//////////////////////////////////////////////////////////////
// Bitcoin Arbitrage Program
// BitcoinArbitrage.js
// Oct 31, 2015
// Lianqiang Mao, Yuhang Liu
////////////////////////////////////////////////////////////// 
var partner = "3554048"; //API Partner 
var secretKey = "8FB523C1C4363B68D2A9784050B62A22"; 
var wsUri = "wss://real.okcoin.cn:10440/websocket/okcoinapi"; 
var WebSocket = require('ws');
var websocket = new WebSocket(wsUri);
var output;
var lastHeartBeat = new Date().getTime();
var overtime = 3000;
var okbuy3, oksell3, huobibuy3, huobisell3;

var g_isConnect = 0; //Huobi connection parameter
var io = require('socket.io-client');
var option = {
    'force new connection': true,
    reconnection: true
};
var socket = io.connect('hq.huobi.com:80', option);

function checkConnect() {
    websocket.send("{'event':'ping'}");
    if ((new Date().getTime() - lastHeartBeat) > overtime) {
        console.log("OKCoin: Socket disconnected, try reconnecting");
        okcoin_testWebSocket();
    }
}

function spotTrade(channel, symbol, type, price, amount) { 
    doSend("{'event':'addChannel','channel':'" + channel + "','parameters':{'partner':'" + partner + "','secretkey':'" + secretKey + "','symbol':'" + symbol + "','type':'" + type + "','price':'" + price + "','amount':'" + amount + "'}}");
}

function spotCancelOrder(channel, symbol, order_id) { 
    doSend("{'event':'addChannel','channel':'" + channel + "','parameters':{'partner':'" + partner + "','secretkey':'" + secretKey + "','symbol':'" + symbol + "','order_id':'" + order_id + "'}}");
}

function okcoin_testWebSocket() {
    
    websocket.onopen = function(evt) {
        onOpen(evt)
    };
    websocket.onclose = function(evt) {
        onClose(evt)
    };
    websocket.onmessage = function(evt) {
        onMessage(evt)
    };
    websocket.onerror = function(evt) {
        onError(evt)
    };
}

function onOpen(evt) {
    console.log("OKCoin: Connected");
    doSend("{'event':'addChannel','channel':'ok_sub_spotcny_btc_depth_20'}"); 
}

function onClose(evt) {
    console.log("OKCoin: Disconnected");
}

function onMessage(evt) {
    var re_data = evt.data;
    if (re_data.indexOf("[") == 0) {
        re_data = re_data.substring(1, re_data.length - 1);
    }
    var data_obj = JSON.parse(re_data)
    if (data_obj.event == 'pong') {
        lastHeartBeat = new Date().getTime(); 
    } else if (data_obj.channel == 'ok_spotusd_trade' || data_obj.channel == 'ok_spotcny_trade') {
        
    } else if (data_obj.channel == 'ok_spotusd_cancel_order' || data_obj.channel == 'ok_spotcny_cancel_order') {
    } else {
        console.log(re_data);
        // oksell3 = data_obj.data.asks[17][0];// OKCoin Price-ask 3
        // okbuy3 = data_obj.data.bids[2][0];// OKCoin Price-bid 3
    }
}

function onError(evt) {
    console.log(evt.data);
}

function doSend(message) {
    websocket.send(message);
}

// acquire error msg
exports.dumpError = function(err) {
    var errMsg = '';

    if (typeof err === 'object') {
        if (err.message) {
            errMsg = '\nHuobi: Message: ' + err.message;
        }
        if (err.stack) {
            errMsg += '\nHuobi: Stacktrace:';
            errMsg += '====================';
            errMsg += err.stack;
        }
    } else {
        errMsg = '\nHuobi: dumpError :: argument is not an object';
    }

    return errMsg;
}

// Write error information into log
exports.quicklog = function(s) {
    var logpath = "./error.log";
    var fs = require('fs');
    s = s.toString().replace(/\r\n|\r/g, '\n'); // hack
    var fd = fs.openSync(logpath, 'a+', 0666);
    fs.writeSync(fd, s + '\n');
    fs.closeSync(fd);
}

exports.systemlog = function(s) {
    console.log(s);
}


exports.checkConnection = function() {
    try {
        exports.systemlog("Huobi: checkConnection start");

        if (g_isConnect == 2) {
            exports.systemlog("Huobi: checkConnection checking");
            exports.connect();
        }
    } catch (err) {
        var errMsg = exports.dumpError(err);
        exports.quicklog(errMsg);
    }
};


exports.connect = function() {
    try {
        if (g_isConnect == 3) {
            console.log('Huobi: websocket client is connecting to push server:');
            return;
        }

        g_isConnect = 3;
        console.log('Huobi: websocket client connecting to push server:');

        socket.on('connect', function() {
            g_isConnect = 1;
            console.log('Huobi: websocket client connect to push server: ' + socket.socket.sessionid);

            var strMsg = '{"symbolList":{"tradeDetail":[{"symbolId":"btccny","pushType":"pushLong"}]},"version":1,"msgType":"reqMsgSubscribe","requestIndex":1404103038520}';

            var json = JSON.parse(strMsg);
            socket.emit('request', json);
        });

        socket.on('disconnect', function() {
            g_isConnect = 2;
            console.log('Huobi: websocket client disconnect from push server:' + socket.socket.sessionid);
        });

        socket.on('reconnect', function() {
            g_isConnect = 1;
            console.log('Huobi: websocket client reconnect from push server:' + socket.socket.sessionid);
        });
        socket.on('request', function(data) {
            //console.log(JSON.stringify(data));
        });

    } catch (err) {
        var errMsg = exports.dumpError(err);
        exports.quicklog(errMsg);
    }
};

function avrg (s){
    var ttl = 0;
    for (var i = 0; i < s.length; i++){
        ttl = s[i] + ttl;
    }
    return ttl/s.length;
}

var huobitrade = require('./HuobiTrade.js');
var t =Date.now();
var arr1 = new Array();
var arr2 = new Array();
var i = 0;
var count = 0;
var prcsprd1, prcsprd2; //Price Spread
exports.getmsg = function() {
        socket.on('message', function(data) {
            huobisell3 = data.payload.topAsks[0].price[2];
            huobibuy3 = data.payload.topBids[0].price[2];
            if (Date.now() - t > 499) { // Determine the time interval 
                prcsprd1 = huobibuy3 - oksell3;
                prcsprd2 = okbuy3 - huobisell3;
                console.log(prcsprd1);
                console.log(prcsprd2);
                t = Date.now();
                if (i < 500){
                    arr1.push(prcsprd1);
                    arr2.push(prcsprd2);
                    i++;
                }
                else {
                    arr1.shift();
                    arr2.shift();
                    arr1.push(prcsprd1);
                    arr2.push(prcsprd2);

                    if (prcsprd1 > avrg(arr1) && prcsprd1 > 0.5){
                        huobitrade.HuobiTrade('sell', huobibuy3 - 10, 0.1);
                        spotTrade("ok_spotcny_trade", "btc_cny", "buy", oksell3 + 10, 0.1);
                        console.log("buy OKCoin sell Huobi " + count);
                        count++;
                    }
                    if (prcsprd2 > avrg(arr2) && prcsprd2 > 0.5){
                        huobitrade.HuobiTrade('buy', huobisell3 + 10, 0.1);
                        spotTrade("ok_spotcny_trade", "btc_cny", "sell", okbuy3 - 10, 0.1);
                        console.log("buy Huobi sell OKCoin " + count);
                        count++;
                    }
                }

            };
        });
    }

okcoin_testWebSocket();
setInterval(checkConnect, 30000); //检查连接情况
setInterval(exports.checkConnection, 30000); //检查连接情况
exports.connect();
exports.getmsg();
