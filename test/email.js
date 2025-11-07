const request = require('request');
const string_random = require('string-random');


async function register_email(){
    var email_name = string_random(8, { numbers: false }) + '@trustarline.com'
    email_name = email_name.toLowerCase();
    console.log(email_name);
    var form_data = {
        email: email_name,
        uname: '',
        tel: '',
        active: '1',
        password: '12345678',
        password2: '12345678',
        _method: 'put',
        _forward: '%2FUsers'
    }
    var headers = {
        cookie: 'rltoken=65337fb8710c43942043a8dc3ba06d09; PHPSESSID=5css6s60ttvube86gmt07i9mb0; rlsession=a2c647eafdd53f60f7a2724a2952c479' 
    }

    request.post({url:'http://mail.trustarline.com:8010/Users/edit', form:form_data, headers:headers}, function(error, response, body) {
        console.log(response.statusCode);
    })
    
    return email_name 
}

// register_email();
module.exports = register_email

