const { default: axios } = require("axios");
const config = require("./config");
const logger = require("./utils/logger");
const MRCCaptcha = require("./utils/mrccaptcha");
const { randomStickyProxy } = require("./utils/utils");
const {HttpProxyAgent, HttpsProxyAgent} = require('hpagent');
const { generateMSSignupBlob } = require("./blobs");

const mrccaptcha = new MRCCaptcha();
const SITE_KEY = 'B7D8911C-5CC8-A9A3-35B0-554ACEE604DA';
const DEVICE = 'android'; // android(chrome, edge), iphone(chrome, safari), windows(chrome, edge), ipad(chrome, safari), macos(chrome, edge, safari)
const BROWSER = 'chrome';

async function testSolution(solution, prepareData, client, errorData) {
  const {data} = await client({
    method: 'POST',
    url: 'https://signup.live.com/API/CreateAccount?lic=1',
    headers: { 
      'accept': '*/*', 
      'canary': prepareData.canary, 
      'Content-Type': 'application/json', 
      'origin': 'https://signup.live.com', 
      'priority': 'u=1, i', 
      'sec-fetch-dest': 'empty', 
      'sec-fetch-mode': 'cors', 
      'sec-fetch-site': 'same-origin', 
      'tcxt': 'undefined', 
      'uiflvr': '1001', 
      'x-ms-apitransport': 'xhr', 
      'x-ms-apiversion': '2', 
      'Host': 'signup.live.com', 
      'Cookie': prepareData.cookie + '; mkt1=vi-VN'
    },
    data : {
      "BirthDate": "15:11:1999",
      "CheckAvailStateMap": [
          "sonlian243244@hotmail.com:false"
      ],
      "Country": "VN",
      "EvictionWarningShown": [],
      "FirstName": "lina",
      "IsRDM": false,
      "IsOptOutEmailDefault": true,
      "IsOptOutEmailShown": 1,
      "IsOptOutEmail": true,
      "IsUserConsentedToChinaPIPL": false,
      "LastName": "son",
      "LW": 1,
      "MemberName": "sonlian243244@hotmail.com",
      "RequestTimeStamp": "2025-03-12T14:45:14.271Z",
      "ReturnUrl": "",
      "SignupReturnUrl": "",
      "SuggestedAccountType": "EASI",
      "SiteId": "",
      "VerificationCodeSlt": "",
      "WReply": "",
      "MemberNameChangeCount": 2,
      "MemberNameAvailableCount": 2,
      "MemberNameUnavailableCount": 0,
      "Password": "sonlian23424242",
      "RiskAssessmentDetails": errorData.riskAssessmentDetails,
      "RepMapRequestIdentifierDetails": errorData.repMapRequestIdentifierDetails,
      "HFId": "1e871f435fc247f7b8c5f72887cefbf5",
      "HPId": "B7D8911C-5CC8-A9A3-35B0-554ACEE604DA",
      "HSol": solution,
      "HType": "enforcement",
      "HId": solution,
      "uiflvr": 1001,
      "scid": 100118,
      "uaid": prepareData.uaid,
      "hpgid": 200225
    },
    validateStatus: () => true
  });

  console.log(data)
}

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
      })
    });

    logger.info(`Generating blob...`);
    const {blob, prepareData, errorData} = await generateMSSignupBlob(client);
    
    logger.info(`Blob generated, solving captcha...`);
    const {solution} = await mrccaptcha.solve(SITE_KEY, {
      proxy: proxy,
      userAgent: userAgent,
      datablob: blob,
      lang: 'vi'
    });

    logger.info(`Solved, solution: ${solution}`);

    //await testSolution(solution, prepareData, client, errorData);
  }
  catch(error) {
    logger.error(error.message);
  }
}

main();