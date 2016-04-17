//////////////////////////////////////////////////////////////
// Bitcoin Arbitrage Program
// okcoin.js
// Apr 14, 2016
// Lianqiang Mao
//////////////////////////////////////////////////////////////
var cd = require('./credentials.js');

var api_key = cd.api_key; 
var secretKey = cd.secretKey; 

var wsUri = "wss://real.okcoin.cn:10440/websocket/okcoinapi"; 

var WebSocket = require('ws');
var websocket = new WebSocket(wsUri);

console.log("OKCoin: connecting");

module.exports.okcoin_socket = websocket;

var okbuy3, oksell3;

var lastHeartBeat;

function checkConnect() {
    console.log("OKCoin: check connection")
    websocket.send("{'event':'ping'}");
    if ((new Date().getTime() - lastHeartBeat) > 35000) {
        console.log("OKCoin: socket disconnected, try reconnecting");
        okcoin_WebSocket();
    }
}

function createSign(params) {
    var crypto = require('crypto');
    var md5 = crypto.createHash('md5');
    return md5.update(params).digest('hex').toUpperCase();
}

function spotTrade(type, price, amount) { 

    var channel = "ok_spotcny_trade";
    var symbol  = "btc_cny";

    var sign = createSign("amount=" + amount + "&" 
        + "api_key=" + api_key + "&" 
        + "price=" + price + "&" 
        + "symbol=" + symbol + "&" 
        + "type=" + type + "&"
        + "secret_key=" + secretKey);

    websocket.send("{'event':'addChannel','channel':'" + channel + "','parameters':{'api_key':'" + api_key + "','sign':'" + sign + "','symbol':'" + symbol + "','type':'" + type + "','price':'" + price + "','amount':'" + amount + "'}}");

}

function spotCancelOrder(channel, symbol, order_id) { 
    websocket.send("{'event':'addChannel','channel':'" + channel + "','parameters':{'api_key':'" + api_key + "','sign':'" + sign + "','symbol':'" + symbol + "','order_id':'" + order_id + "'}}");
}

function okcoin_WebSocket() {

    lastHeartBeat = new Date().getTime();

    websocket.onopen = function(evt) {
        onOpen(evt)
    };

    websocket.onmessage = function(evt) {
        onMessage(evt) 
    };

    websocket.onclose = function(evt) {
        onClose(evt)
    };

    websocket.onerror = function(evt) {
        onError(evt)
    };

}

function onOpen(evt) {
    console.log("OKCoin: connected");
    websocket.send("{'event':'addChannel','channel':'ok_sub_spotcny_btc_depth_20'}"); 
}

function onMessage(evt) {
    var re_data = evt.data;
    if (re_data.indexOf("[") == 0) {
        re_data = re_data.substring(1, re_data.length - 1);
    }
    var data_obj = JSON.parse(re_data)
    if (data_obj.event == 'pong') {
        lastHeartBeat = new Date().getTime(); 
    }
    else if (data_obj.channel == 'ok_spotcny_trade') {
        console.log("OKCoin Trade: ");
        console.log(re_data);
    }
    else {
        try {
            oksell3 = data_obj.data.asks[17][0];// OKCoin Price-ask 3
            okbuy3 = data_obj.data.bids[2][0];// OKCoin Price-bid 3
            module.exports.oksell = oksell3;
            module.exports.okbuy  = okbuy3;
            // console.log("oksell: " + oksell3);
            // console.log("okbuy: " + okbuy3);
        }
        catch(err) {
            // console.log(err);
        }
    }
}

function onClose(evt) {
    console.log("OKCoin: disconnected");
}

function onError(evt) {
    console.log("OKCoin: error: " + evt.data);
    console.log("It it possibly because of using incorrect IP address.")
}

function doSend(message) {
    websocket.send(message);
}

setInterval(checkConnect, 30000); //检查连接情况

module.exports.websocket = okcoin_WebSocket;
module.exports.oktrade   = spotTrade;