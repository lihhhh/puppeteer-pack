const q = require('q')
const debugError = require('debug')(`puppeteer:error`);
const request = require('request')
const UserAgent = require('user-agents');
const Agent = require('socks5-https-client/lib/Agent');
const async = require('async');

function computeQuadArea(quad) {
    // Compute sum of all directed areas of adjacent triangles
    // https://en.wikipedia.org/wiki/Polygon#Simple_polygons
    let area = 0;
    for (let i = 0; i < quad.length; ++i) {
        const p1 = quad[i];
        const p2 = quad[(i + 1) % quad.length];
        area += (p1.x * p2.y - p2.x * p1.y) / 2;
    }
    return Math.abs(area);
}


module.exports = class Page {
    constructor(page) {
        this.page = page;
        this._request = {
            defaults: {
                pool: {}
            }
        };
        let owns = Object.getOwnPropertyNames(this.page).concat(Object.getOwnPropertyNames(this.page.__proto__))
        try {
            owns.map(it => {
                if (!(it in this)) {
                    Object.defineProperty(this, it, {
                        get() {
                            return this.page[it];
                        },
                        set(value) {
                            return value;
                        }
                    })
                }
            })
        } catch (err) {
            debugger
        }
    }
    /**
     * 
     * @param {*} num  执行滚动次数
     */
    async autoScroll(num = 2) {
        console.log('info', '滚动页面')
        for (let i = 0; i < num; i++) {
            await this.touchStart(100, 550)

            await this.touchMove(100, 550, 100, 0)

            await this.touchEnd()

            console.log('info', '等待1-3s进行第二次滚动...')
            await this.page.waitFor(this.getRanTime(1000, 2000))
        }
    }
    /**
     * 
     * @param {Number} x1 from
     * @param {Number} y1 from
     * @param {Number} x2 to
     * @param {Number} y2 to
     * @param {Object} option 
     *      @param {Number} steps   执行touchmove次数
     *      @param {Number} delay   每次执行的延迟
     */
    async touchMove(x1 = 0, y1 = 0, x2 = 0, y2 = 0, option = {}) {
        let _option = {
            steps: 25,
            delay: 10,
            ...option
        };
        await this.page.touchscreen._client.send('Runtime.evaluate', {
            expression: 'new Promise(x => requestAnimationFrame(() => requestAnimationFrame(x)))',
            awaitPromise: true
        });
        for (let i = 0; i < _option.steps; i++) {
            let touchPoints = [{ x: x1, y: y1 - (y1 / _option.steps) * (i + 1) }];
            // console.log(touchPoints)
            await new Promise(r => setTimeout(r, _option.delay));
            await this.page.touchscreen._client.send('Input.dispatchTouchEvent', {
                type: 'touchMove',
                touchPoints,
                modifiers: this.page.touchscreen._keyboard._modifiers
            })
        }
    }
    async touchStart(x, y) {
        await this.page.touchscreen._client.send('Runtime.evaluate', {
            expression: 'new Promise(x => requestAnimationFrame(() => requestAnimationFrame(x)))',
            awaitPromise: true
        });
        const touchPoints = [{ x: Math.round(x), y: Math.round(y) }];

        await this.page.touchscreen._client.send('Input.dispatchTouchEvent', {
            type: 'touchStart',
            touchPoints,
            modifiers: this.page.touchscreen._keyboard._modifiers
        });
    }
    async touchEnd() {
        await this.page.touchscreen._client.send('Input.dispatchTouchEvent', {
            type: 'touchEnd',
            touchPoints: [],
            modifiers: this.page.touchscreen._keyboard._modifiers
        });
    }
    /**
   * @return {!Promise<!{x: number, y: number}>}
   */
    async _clickablePoint() {
        const [result, layoutMetrics] = await Promise.all([
            this._client.send('DOM.getContentQuads', {
                objectId: this._remoteObject.objectId
            }).catch(debugError),
            this._client.send('Page.getLayoutMetrics'),
        ]);
        if (!result || !result.quads.length)
            throw new Error('Node is either not visible or not an HTMLElement');
        // 过滤掉面积太小无法点击的四边形。
        const { clientWidth, clientHeight } = layoutMetrics.layoutViewport;
        const quads = result.quads.map(quad => this._fromProtocolQuad(quad)).map(quad => this._intersectQuadWithViewport(quad, clientWidth, clientHeight)).filter(quad => computeQuadArea(quad) > 1);
        if (!quads.length)
            throw new Error('Node is either not visible or not an HTMLElement');
        // 矩形四边形的四个点。
        const quad = quads[0];
        let maxX = 0;
        let maxY = 0;
        let minX = 10000;
        let minY = 10000;

        for (const point of quad) {
            if (point.x > maxX) {
                maxX = point.x;
            }
            if (point.y > maxY) {
                maxY = point.y;
            }
            if (point.x < minX) {
                minX = point.x;
            }
            if (point.y < minY) {
                minY = point.y;
            }
        }


        let x = Math.round(minX + Math.random() * (maxX - minX));
        let y = Math.round(minY + Math.random() * (maxY - minY));

        return {
            x, y
        }

    }
    /**
     * 自定义点击事件
     * @param {*} selector 
     */
    async tap(selector) {
        // await this.tap(selector)
        // console.log('info', `自定义tap事件 selector->${selector}`)
        let el;
        try {
            el = await this.page.$(selector)
        } catch (e) {
            console.log('error', `selector未找到:${selector}`)
        }

        try {
            await el._scrollIntoViewIfNeeded();
        } catch (e) {
            try {
                await this.page.evaluate((selector) => {
                    document.querySelector(selector).scrollIntoView({ block: 'center', inline: 'center', behavior: 'instant' })
                }, selector)
            } catch (err) {

            }
        }
        console.log('info', "点击目标移入可视区域,等待片刻...")
        await this.waitFor(this.getRanTime(2000, 1000))
        try {
            var { x, y } = await this._clickablePoint.call(el);
        } catch (e) {
            console.log('error', "[tap()]未找到点击x,y坐标")
            return;
        }

        console.log('warn', `tap点击x:${x},y:${y}`)
        await this.touchStart(x, y)
        let time = this.getRanTime(50, 50);
        console.log('warn', `touch抬起时间:${time}ms`)
        await this.waitFor(time)
        console.log('warn', `touchEnd`)
        await this.touchEnd()
    }
    /**
     * 获取 一个新的UserAgent
     */
    getUserAgent(option) {
        let _ua = new UserAgent(option || { deviceCategory: 'mobile' })

        return _ua.toString();
    }
    async init() {
    }
    /**
     * 页面随机点
     * @param {Array} range 随机范围  [[矩形x,矩形y],[width,height]]
     * 
     */
    randomClick(range = [[420, 0], [250, 800]]) {
        var _width = range[1][0];
        var _height = range[1][1];

        var _clickX = Math.random() * _width + range[0][0];
        var _clickY = Math.random() * _height + range[0][1];

        console.log('info', `鼠标点击:[${_clickX},${_clickY}]`)

        return this.page.mouse.click(_clickX, _clickY)
    }
    /**
     * 
     * @param {Number} ran 
     * @param {Number} add 
     */
    getRanTime(ran = 3000, add = 2000) {
        return Math.random() * ran + add;
    }
    /**
     * 带cookie信息的请求
     * @param {*} options 
     */
    request(options) {
        var defer = q.defer();
        this.reqNum = this.reqNum || 0;

        (async () => {
            let cookies = await this.page.cookies();
            let csrftoken = cookies.find(it => it.name == 'csrftoken')
            let ck = cookies.map(it => it.name + '=' + it.value)
            let rollout_hash = await this.page.evaluate(() => {
                return _sharedData.rollout_hash;
            })
            let defaults = {
                rejectUnauthorized: false,//忽略证书验证
                agentClass: Agent,
                strictSSL: true,
                // agentOptions: {
                //     socksHost: this.data.proxy.replace(/.*?(\d+\.\d+\.\d+\.\d+).*/g, '$1'),
                //     socksPort: 8808
                // },
                headers: {
                    "X-Instagram-AJAX": rollout_hash,
                    "X-CSRFToken": csrftoken.value,
                    "Cookie": ck.join(';'),
                    "referer": "https://www.instagram.com/"
                },
                ...this._request.defaults
            };

            let req = request.defaults(defaults)

            // console.log('warn', JSON.stringify(defaults))

            this.reqNum += 1;

            // console.log('warn', `req请求数:${this.reqNum}`)
            req(options, (err, res, body) => {
                this.reqNum -= 1;
                try {
                    console.log('info', `statusCode:${res.statusCode},body:${body}`)
                    res.status = res.statusCode;
                    defer.resolve(res)
                } catch (err) {
                    defer.reject(err)
                }
            })
        })()

        return defer.promise;
    }
    /**
     * 同type 文本输入
     * @param {*} selector 
     * @param {*} value 
     */
    async randomType(selector, value) {

        await this.page.click(selector, { clickCount: 3 })

        await this.page.waitFor(this.getRanTime())

        for (let i = 0; i < value.length; i++) {
            await this.page.type(selector, value[i], {
                delay: Math.random() * 100 + 20
            })
        }

        return '';
    }
    /**
     * 找到链接 并点击
     * @param {*} href 
     * @param {*} eq 
     */
    async findHrefClick(href, eq) {
        let tg = await this.page.evaluate((href, eq) => {
            document.querySelectorAll('a').forEach(el => {
                if (eq) {
                    if (el.getAttribute('href') == href) {
                        el.setAttribute('a-target', '')
                    }
                } else {
                    if (el.getAttribute('href').indexOf(href) >= 0) {
                        el.setAttribute('a-target', '')
                    }
                }

            })
            return 'a-target';
        }, href, eq)

        await this.tap(`[${tg}]`)

        return;
    }
    /**
     * 找到包含指定文本的dom 并返回标记属性
     * @param {String} text 
     * @param {String} selector 
     */
    async findInnerText(text, selector = "*") {
        let tg = await this.page.evaluate((selector, text) => {
            let attr = "attr-" + new Date().getTime();
            let out = '';
            document.querySelectorAll(selector).forEach(el => {
                if (el.innerText == text) {
                    el.setAttribute(attr, '')
                    out = attr;
                }
            })
            return out;
        }, selector, text)

        return tg ? `[${tg}]` : '';
    }
    /**
     * 找到页面所有指定属性的值  如 找到页面上所有的a标签href的值  findAttrAll('a', 'href') 
     * @param {String} selector 
     * @param {String} attr 
     * 
     * @return {Array}
     */
    async findAttrAll(selector, attr) {
        var out = await this.page.evaluate((selector, attr) => {
            var list = [];
            document.querySelectorAll(selector).forEach(el => {
                let temp = el.getAttribute(attr);
                if (temp) list.push(temp)
            })
            return list
        }, selector, attr)

        out = out.filter(it => /^\//.test(it))
        return out;
    }
    /**
     * 带重连操作的  goto
     * @param {*} url 
     * @param {*} max 
     */
    goto(url, max = 5) {
        var defer = q.defer()

        let i = 0;
        let _deep = async () => {
            try {
                let timeout = 30000 + Math.random() * 5000;
                console.log('info', `goto 超时时间: ${timeout}`)
                await this.page.goto(url, {
                    timeout
                })
            } catch (err) {
                if (err.message.indexOf('Session closed') >= 0) {
                    console.log('error', '浏览器已关闭')
                    return defer.reject('浏览器已关闭')
                }
                console.log('error', `进入${url}页面超时,正在进行第${i + 1}次重连`)
                i++
                if (i < max) {
                    return _deep()
                } else {
                    return defer.reject('重连次数过多,跳过')
                }
            }
            defer.resolve()
        }
        _deep()

        return defer.promise;
    }
};