//////////////////////////////////////////////////////////////
// Bitcoin Arbitrage Program
// trade.js
// Apr 14, 2016
// Lianqiang Mao
////////////////////////////////////////////////////////////// 
var OKCoin = require('./okcoin.js');
var Huobi  = require('./huobi.js');
var HuobiTrade = require('./huobitrade.js')

OKCoin.websocket();
Huobi.connect();

setInterval(arbitrageTrade, 500);

function getSellBuyPrice() {

	var huobisell = Huobi.huobisell;
	var huobibuy  = Huobi.huobibuy;
	var oksell    = OKCoin.oksell;
	var okbuy     = OKCoin.okbuy;

	if (typeof(huobisell) != "undefined" && typeof(oksell) != "undefined") {
		
		// console.log(" Huobi : " + huobisell);
		// console.log(" Huobi : " + huobibuy);
		// console.log(" OKCoin: " + oksell);
		// console.log(" OKCoin: " + okbuy);

        return [huobisell, huobibuy, oksell, okbuy];
	}

}

var i = 0;
arr1 = new Array();
arr2 = new Array();

function arbitrageTrade() {

    priceArray = getSellBuyPrice();

    if ( priceArray != undefined ) {

        huobisell  = priceArray[0];
        huobibuy   = priceArray[1];
        oksell     = priceArray[2];
        okbuy      = priceArray[3];

        price_diff1 = huobibuy - oksell;
        price_diff2 = okbuy - huobisell;

        console.log("  Price_diff1: " + price_diff1);
        console.log("  Price_diff2: " + price_diff2);

        if (i < 50) {
            arr1.push(price_diff1);
            arr2.push(price_diff2);
            i++;
            console.log("Storing Data: " + i);
        }
        else if (i == 50) {
            console.log("Storing Finished");
            i++;
        }
        else {

            arr1.shift();
            arr2.shift();
            arr1.push(price_diff1);
            arr2.push(price_diff2);  

            avg1 = avrg(arr1);
            avg2 = avrg(arr2);

            if (price_diff1 > avg1 && price_diff1 > 0.5){

                HuobiTrade.HuobiTrade('sell', huobibuy - 10, 0.02);
                OKCoin.oktrade('buy', oksell + 10, 0.02);
                console.log("buy OKCoin sell Huobi ");
                // count++;

            }
            else if (price_diff2 > avg2 && price_diff2 > 0.5){

                HuobiTrade.HuobiTrade('buy', huobisell + 10, 0.02);
                OKCoin.oktrade('sell', okbuy - 10, 0.02);
                console.log("buy Huobi sell OKCoin ");
                // count++;

            }
        }
    }
}

function avrg (s){
    var ttl = 0;
    for (var i = 0; i < s.length; i++){
        ttl = s[i] + ttl;
    }
    return ttl/s.length;
}