let puppeteer = require('../index');
const devices = require('puppeteer/DeviceDescriptors');
const iPhone = devices['iPhone 6'];


async function run(){
    let browser = await puppeteer.launch({
        headless:false,
        args:[
            // `--proxy-server=socks5://18.144.133.204:1080`,
            // `--disable-extensions-except=/Users/lihao/tn_code/multiple-page/multiple-page`
        ]
    })

    let page = await browser.newPage()

    await page.emulate(iPhone);

    await page.goto("https://m.facebook.com/reg/?ref=dbl&soft=hjk")
    
    await page.waitFor(1000*3000)

    await browser.close()
}

run()