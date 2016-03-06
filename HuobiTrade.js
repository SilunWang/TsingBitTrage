//////////////////////////////////////////////////////////////
// Bitcoin Arbitrage Program
// HuobiTrade.js
// Oct 31, 2015
// Lianqiang Mao, Yuhang Liu
////////////////////////////////////////////////////////////// 
exports.HuobiTrade = function(method, price, amount) {
	var needle = require('needle');
	var qs = require('querystring');
	//var method, price, amount;
	var access_key = '4659843a-94bc1865-937a0a1f-4c963';
	var secret_key = '728346db-bec22dc3-06cbc919-08a9d';
	var created = Math.round(new Date().getTime() / 1000);
	var sign = createSign("access_key=" + access_key + "&" + "amount=" + amount + "&" + "coin_type=" + 1 + "&" + "created=" + created + "&" + "method=" + method + "&" + "price=" + price + "&" + "secret_key=" + secret_key);

	var params = qs.stringify({
		'access_key': access_key,
		'created': created,
		'price': price,
		'sign': sign,
		'amount': amount,
		'coin_type': 1,
		'method': method
	});

	var options = {
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded'
		}
	};

	function createSign(params) {
		var crypto = require('crypto');
		var md5 = crypto.createHash('md5');
		return md5.update(params).digest('hex');
	}

	needle.post('https://api.huobi.com/apiv2.php', params, options,
		function(err, resp, body) {
			//console.log(body);
		});
}