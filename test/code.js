const request = require('request-promise');


async function get_code(eamil){
    console.log('在获取的邮箱前缀：',eamil);
    var url = `http://54.252.179.170:8031/watch?email=${eamil}`
    let a = await request({
        url,
        timeout:1000*60*3
    })
    const code = a.match(/FB-(\d+)/);
    if(code){
        return code[1]
    }
    else{
        throw new Error();
    }
}


module.exports = get_code