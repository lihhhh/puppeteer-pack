const puppeteer = require('puppeteer');
const get_code = require('./code');
const devices = require('puppeteer/DeviceDescriptors');
const register_email = require('./email');
const string_random = require('string-random');
const get_ip = require('./ip');
const path = require('path');


(async () => {
    const ip = await get_ip();
    console.log(ip);
    const email = await register_email();
    const index = Math.ceil(Math.random()*10)
    const name_list = ['Jack', 'Tom', 'David', 'Smith', 'Jones', 'Williams', 'Brown', 'Taylor', 'Miller', 'Davis', 'Garcia', 'Rodriguez']
    const first_name = name_list[index]
    const last_name = string_random(7, { numbers: false }).toLowerCase()
    console.log(last_name);
    const password = `${last_name}123`
    console.log(password);
    const image_path = path.join(__dirname,'58006bee826e5d17.jpg');

    const browser = await puppeteer.launch({
        headless: false,
        args: [
            `--proxy-server=socks5://${ip}:8808`,
            `--window-size=${1260},${800}`
        ]
    });
    const page = await browser.newPage();
    await page.setExtraHTTPHeaders({
        'Accept-Language': `en`
    });
    
    await page.emulate(devices['iPhone X']);
    await page.goto('https://www.baidu.com/');
    await page.waitFor(2400);
    await page.goto('https://www.instagram.com/');
    await page.waitFor(2700);
    // await page.setUserAgent('Mozilla/5.0 (Linux; U; Android 4.0.2; en-us; Galaxy Nexus Build/ICL53F) AppleWebKit/534.30 (KHTML, like Gecko) Version/4.0 Mobile Safari/534.30');
    await page.goto('https://m.facebook.com/reg/?ref=dbl&soft=hjk');
    await page.waitFor(3000);

    // 输入name页面
    const input1 = await page.$('#firstname_input');
    await page.tap('#firstname_input');
    await page.waitFor(1200);
    await input1.type(first_name);
    const input2 = await page.$('#lastname_input');
    await page.tap('#lastname_input');
    await page.waitFor(1100);
    await input2.type(last_name);
    await page.waitFor(1400);
    await page.tap('button[value=Next]');
    await page.waitFor(3100);

    // 输入年月日页面
    await page.tap('button[value=Next]');
    await page.waitFor(3200);
    // 判断是否有yes弹框
    let yes = await page.$('a[data-sigil=default_birthday_popup_yes]');
    if(yes){
        await page.tap('a[data-sigil=default_birthday_popup_yes]');
        await page.waitFor(2500);
    }

    console.log('输入邮箱页面');
    await page.tap('a[data-sigil=switch_phone_to_email]');
    await page.waitFor(1500);
    const input3 = await page.$('input[id=contactpoint_step_input]');
    await page.tap('input[id=contactpoint_step_input]');
    console.log(email)
    await input3.type(email);
    await page.waitFor(2100);
    await page.tap('button[value=Next]');
    await page.waitFor(3200);

    console.log('性别页面');
    await page.tap('input[name=sex]');
    await page.waitFor(1500);
    await page.tap('button[value=Next]');
    await page.waitFor(2200);

    console.log('设置密码页面');
    const input4 = await page.$('input[id=password_step_input]');
    await page.tap('input[id=password_step_input]');
    await page.waitFor(1200);
    await input4.type(password);
    await page.waitFor(4100);
    const button = await page.$('#mobile-reg-form > div[data-sigil=multi_step_next_button_block] > div:nth-child(2) > button:nth-child(4)');
    await button.tap();
    await page.waitFor(15000);

    // not now界面
    console.log('not now页面');
    await page.tap('a[role=button]');
    console.log('验证码页面')
    await page.waitFor(10000);

    // 获取邮箱验证码
    console.log('正在获取验证码...')
    var email_code = await get_code(email.split('@')[0]);
    console.log('获取到了验证码' + email_code);

    // 验证码界面
    const input5 = await page.$('input[type=number]');
    await page.tap('input[type=number]');
    await page.waitFor(1200);
    await input5.type(email_code);
    await page.waitFor(3000);
    // let attr = await page.$('a[use=primary]');
    // let attr = await page.findInnerText('Confirm','a')
    await page.tap('form[method=post] a');
    await page.waitFor(12000);

    // 增加手机号页面
    // await page.waitForSelector('div[data-sigil=mChromeHeaderRight] a');
    console.log('手机号页面')
    // let attr1 = await page.findInnerText('Next','a')
    // console.log(attr1)
    await page.tap('div[data-sigil=mChromeHeaderRight] a');
    await page.waitFor(3500);

    // 增加头像页面
    console.log('增加头像页面');
    const input6 = await page.$('input[data-sigil=photo_file]');
    console.log('touxiang', input6);
    if(input6){
        console.log(image_path);
        await input6.uploadFile(image_path);
        await page.waitFor(10000);
        await page.tap('div[data-sigil=mChromeHeaderRight] a');
        await page.waitFor(3500);
    }
    else{
        await page.waitForSelector('input[data-sigil=photo_file]');
        await input6.uploadFile(image_path);
        await page.waitFor(3500);
        await page.tap('div[data-sigil=mChromeHeaderRight] a');
        await page.waitFor(3500);
    }


    // 下载app页面
    await page.tap('div[data-sigil=mChromeHeaderRight] a');
    await page.waitFor(3500);

    await page.waitFor(1000000);
    await browser.close();
})()