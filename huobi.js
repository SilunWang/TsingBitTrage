//////////////////////////////////////////////////////////////
// Bitcoin Arbitrage Program
// huobi.js
// Apr 14, 2016
// Lianqiang Mao
////////////////////////////////////////////////////////////// 

var output;

var okbuy3, oksell3, huobibuy3, huobisell3;

var g_isConnect = 0; //Huobi connection parameter
var io = require('socket.io-client');
var option = {
    'force new connection': true,
    reconnection: true
};
var socket = io.connect('hq.huobi.com:80', option);
module.exports.huobi_socket = socket;

// acquire error msg
function dumpError(err) {
    var errMsg = '';

    if (typeof err === 'object') {
        if (err.message) {
            errMsg = '\nHuobi : Message: ' + err.message;
        }
        if (err.stack) {
            errMsg += '\nHuobi : Stacktrace:';
            errMsg += '====================';
            errMsg += err.stack;
        }
    } else {
        errMsg = '\nHuobi : dumpError :: argument is not an object';
    }

    return errMsg;
}

// Write error information into log
function quicklog(s) {
    var logpath = "./error.log";
    var fs = require('fs');
    s = s.toString().replace(/\r\n|\r/g, '\n'); // hack
    var fd = fs.openSync(logpath, 'a+', 0666);
    fs.writeSync(fd, s + '\n');
    fs.closeSync(fd);
}

function systemlog(s) {
    console.log(s);
}


function checkConnection() {
    try {
        systemlog("Huobi : check connection");

        if (g_isConnect == 2) {
            systemlog("Huobi : socket disconnected, try reconnecting");
            connect();
        }

    } catch (err) {
        var errMsg = dumpError(err);
        quicklog(errMsg);
    }
};


function connect() {

    try {
        if (g_isConnect == 3) {
            console.log('Huobi : connecting');
            return;
        }

        g_isConnect = 3;
        console.log('Huobi : connecting');

        socket.on('connect', function() {
            g_isConnect = 1;
            console.log('Huobi : connected: ' + socket.socket.sessionid);
            var strMsg = '{"symbolList":{"tradeDetail":[{"symbolId":"btccny","pushType":"pushLong"}]},"version":1,"msgType":"reqMsgSubscribe","requestIndex":1}';
            var json = JSON.parse(strMsg);
            socket.emit('request', json);
        });

        socket.on('disconnect', function() {
            g_isConnect = 2;
            console.log('Huobi : websocket client disconnect from push server:' + socket.socket.sessionid);
        });

        socket.on('reconnect', function() {
            g_isConnect = 1;
            console.log('Huobi : websocket client reconnect from push server:' + socket.socket.sessionid);
        });

        socket.on('message', function(data) {
            huobisell3 = data.payload.topAsks[0].price[2];
            huobibuy3 = data.payload.topBids[0].price[2];
            module.exports.huobisell = huobisell3;
            module.exports.huobibuy  = huobibuy3;
            // console.log("huobisell: " + huobisell3);
            // console.log("huobibuy: " + huobibuy3)
        });

    } catch (err) {
        var errMsg = dumpError(err);
        quicklog(errMsg);
    }
};

setInterval(checkConnection, 30000); //检查连接情况
module.exports.connect = connect;
// module.exports.getmsg  = getmsg;