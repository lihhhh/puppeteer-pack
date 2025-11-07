const Page = require('./puppeteer/Page')
const puppeteer = require('puppeteer');
const path = require('path');
const inject = require('fs').readFileSync(path.join(__dirname,'./libs/inject.js'),'utf-8');

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

            await _page.evaluateOnNewDocument(function (inject) {
                eval(inject);
                window.navigator.chrome = {
                    runtime: {}
                };
    
                delete navigator.__proto__.webdriver;
            },inject)

            return new Page(_page);
        }


        return browser;
    }
}