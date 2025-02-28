const { default: axios } = require("axios");
const config = require("./config");
const logger = require("./utils/logger");
const MRCCaptcha = require("./utils/mrccaptcha");
const { randomStickyProxy } = require("./utils/utils");
const {HttpProxyAgent, HttpsProxyAgent} = require('hpagent');
const { generateXSignupAndroidAppBlob } = require("./blobs");

const mrccaptcha = new MRCCaptcha();
const SITE_KEY = '867D55F2-24FD-4C56-AB6D-589EDAF5E7C5';
const DEVICE = 'x-app-android';

function extractAppUserAgent(userAgent) {
  const match = userAgent.match(/(TwitterAndroid\/[^\s]+ \([^\)]+\) \S+\/\d+ \([^\)]+\))/);
  return match ? match[1] : null;
}

async function main() {
  try {
    logger.info(`Starting...`);

    const proxy = randomStickyProxy(config.proxy.pattern, config.proxy.regions);
    logger.info(`Proxy: ${proxy}`);

    const userAgent = await mrccaptcha.getRandomUseragent(DEVICE);
    const appUserAgent = extractAppUserAgent(userAgent);
    logger.info(`Useragent: ${userAgent}`);
    logger.info(`App useragent: ${appUserAgent}`);

    const client = axios.create({
      headers: {
        'timezone': 'Asia/Ho_Chi_Minh', 
        'optimize-body': 'true', 
        'user-agent': appUserAgent, 
        'x-twitter-client-deviceid': '13d7b88583ec9e71', 
        'authorization': 'Bearer AAAAAAAAAAAAAAAAAAAAAFXzAwAAAAAAMHCxpeSDG1gLNLghVe8d74hl6k4%3DRUMF4xAQLsbeBhTSRrCiQpJtxoGWeyHrDb5te2jpGskWDFW82F', 
        'x-twitter-client-version': '10.82.0-release.0', 
        'os-version': '28', 
        'x-twitter-client-flavor': '', 
        'os-security-patch-level': '2019-07-05', 
        'accept': 'application/json', 
        'x-twitter-client': 'TwitterAndroid', 
        'x-attest-token': 'no_token', 
        'system-user-agent': 'Dalvik/2.1.0 (Linux; U; Android 9; SM-S9210 Build/PQ3A.190705.08211809)', 
        'x-twitter-client-adid': '62385207-32aa-4cd2-9a3a-865ec6628c13', 
        'x-twitter-client-language': 'vi-VN', 
        'x-client-uuid': '44a77e28-9e3f-4bd0-b3d4-1b0418d57cc9', 
        'twitter-display-size': '1080x1920x480', 
        'cache-control': 'no-store', 
        'x-twitter-client-appsetid': '38d56f0e-2205-d275-51e1-1dbd5d718b9a', 
        'x-twitter-active-user': 'yes', 
        'x-twitter-api-version': '5', 
        'x-twitter-client-limit-ad-tracking': '0', 
        'accept-language': 'vi-VN'
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
    const blob = await generateXSignupAndroidAppBlob(client);
    
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