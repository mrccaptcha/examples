const { default: axios } = require("axios");
const config = require("./config");
const logger = require("./utils/logger");
const MRCCaptcha = require("./utils/mrccaptcha");
const { randomStickyProxy } = require("./utils/utils");
const {HttpProxyAgent, HttpsProxyAgent} = require('hpagent');
const { generateRobloxSignupBlob } = require("./blobs");

const mrccaptcha = new MRCCaptcha();
const SITE_KEY = '476068BF-9607-4799-B53D-966BE98E2B81';
const DEVICE = 'ipad'; // android(chrome, edge), iphone(chrome, safari), windows(chrome, edge), ipad(chrome, safari), macos(chrome, edge, safari)
const BROWSER = 'chrome';

async function main() {
  try {
    logger.info(`Starting...`);

    const proxy = randomStickyProxy(config.proxy.pattern, config.proxy.regions);
    logger.info(`Proxy: ${proxy}`);

    const userAgent = await mrccaptcha.getRandomUseragent(DEVICE, BROWSER);
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
      }),
      validateStatus: () => true
    });

    logger.info(`Generating blob...`);
    const blob = await generateRobloxSignupBlob(client);
    
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