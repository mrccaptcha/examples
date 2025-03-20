const { default: axios } = require("axios");
const config = require("./config");
const logger = require("./utils/logger");
const MRCCaptcha = require("./utils/mrccaptcha");
const { randomStickyProxy } = require("./utils/utils");
const {HttpProxyAgent, HttpsProxyAgent} = require('hpagent');
const { generateXSignupBlob } = require("./blobs");

const mrccaptcha = new MRCCaptcha();
const SITE_KEY = '0152B4EB-D2DC-460A-89A1-629838B529C9';
const DEVICE = 'android'; // android(chrome, edge), iphone(chrome, safari), windows(chrome, edge), ipad(chrome, safari), macos(chrome, edge, safari), x-app-android(need extract app useragent, see example in ./src/x-singup-android-app.js)
const BROWSER = 'chrome';

async function main() {
  try {
    logger.info(`Starting...`);

    const proxy = randomStickyProxy(config.proxy.pattern, config.proxy.regions);
    logger.info(`Proxy: ${proxy}`);

    const userAgent = await mrccaptcha.getRandomUseragent(DEVICE, {browser: BROWSER});
    logger.info(`Useragent: ${userAgent}`);

    const client = axios.create({
      headers: {
        'authorization': `Bearer AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA`,
        'origin': 'https://x.com',
        'x-twitter-active-user': 'yes',
        'x-twitter-client-language': 'en',
        'accept': '*/*',
        'accept-language': 'en,en-US;q=0.9',
        'user-agent': userAgent,
        'sec-ch-ua': '"Chromium";v="130", "Microsoft Edge";v="130", "Not?A_Brand";v="99"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"'
      },
      httpAgent: new HttpProxyAgent({
        proxy: proxy
      }),
      httpsAgent: new HttpsProxyAgent({
        proxy: proxy,
        rejectUnauthorized: false
      })
    });

    logger.info(`Generating blob...`);
    const blob = await generateXSignupBlob(client);
    
    logger.info(`Blob generated, solving captcha...`);
    const {solution} = await mrccaptcha.solve(SITE_KEY, {
      proxy: proxy,
      userAgent: userAgent,
      datablob: blob
    });

    logger.info(`Solved, solution: ${solution}`);
  }
  catch(error) {
    logger.error(error.message);
  }
}

main();