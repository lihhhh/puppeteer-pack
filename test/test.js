let puppeteer = require('../index');


+async function () {
    let browser = await puppeteer.launch({
        headless:false
    })

    let page = await browser.newPage()

    await page.setViewport({
        width: 1280,
        height: 860
    })

    await page.goto("https://baidu.com")
    
    await page.waitFor(1000*30)

    await browser.close()
}()
