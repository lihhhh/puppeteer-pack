const Page = require('./puppeteer/Page')
const puppeteer = require('puppeteer')

module.exports = class Puppeteer {
    constructor() {
    }
    static async launch(options) {
        let browser = await puppeteer.launch(options)
        let _newPage = browser.newPage;
        browser.newPage = async function (ops) {
            let _page = await _newPage.call(browser, ops);

            // 设置header 语言请求头
            await _page.setExtraHTTPHeaders({
                'Accept-Language': `en`
            });

            return new Page(_page);
        }


        return browser;
    }
}