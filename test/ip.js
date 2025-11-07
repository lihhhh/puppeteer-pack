const request = require('request');


async function get_ip(){
    return new Promise((resolve, rej) => {
        var ip = ''
        url = 'http://47.100.29.176:1088/v1/proxy?region=us-west-1'
        request.get(url ,async function(error, response) {
            json_data = JSON.parse(response.body);
            msg = json_data['msg'];
            if(msg == '获取成功!'){
                ip = json_data['result'][0]['http_ip']
                console.log(ip);
                resolve(ip);
                // ip_data = ip.split('.');
                // if('54' == ip_data[0] || '52' == ip_data[0]){
                //     console.log(`ip不行,换个Ip...${ip}`)
                //     await get_ip()
                // }
                // else{
                //     console.log('---获取ip成功---');
                //     resolve(ip);
                // }
            }
            else{
                console.log('---获取代理失败---重试---');
                get_ip();
            }
        })
    })

}

// get_ip()

module.exports = get_ip