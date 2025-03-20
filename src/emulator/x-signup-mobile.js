const { chromium } = require('playwright');
const { randomStickyProxy, randomValues, randomString, randomInteger } = require('../utils/utils');
const config = require('../config');
const logger = require('../utils/logger');
const MRCCaptcha = require('../utils/mrccaptcha');
const fs = require('fs');
const MMOSolutionMailBox = require('../utils/mmosolution-mailbox');
const { MongoClient } = require('mongodb');

const ATTEMPTS = 20;
const THREADS = 4;
const GRID_COLUMNS = 4;
const DEVICE = 'android';
const BROWSER = 'chrome';
const SITE_KEY = '867D55F2-24FD-4C56-AB6D-589EDAF5E7C5';
const SCREEN = {
  WIDTH: 360,
  HEIGHT: 720
};
const usernames = fs.readFileSync('./assets/usernames.txt', 'utf-8').trim().split('\n').map(l => l.trim());

function extractDetails(proxy) {
  const url = new URL(proxy);

  return {
    server: url.host,
    username: url.username,
    password: url.password
  }
}

async function insertAccount(doc) {
  const uri = 'mongodb://localhost:27017';
  const client = new MongoClient(uri);

  try {
    await client.connect();

    const database = client.db('account-creator');
    const collection = database.collection('xaccounts');

    await collection.insertOne(doc);
  } catch (err) {
    logger.error(`Insert account error: ${err.message}`);
  } finally {
    await client.close();
  }
}

async function xSignup(index) {
  const column = index % GRID_COLUMNS;
  const row = Math.floor(index / GRID_COLUMNS);
  const posX = column * SCREEN.WIDTH;
  const posY = row * SCREEN.HEIGHT;

  const username = randomValues(usernames);
  const email = randomString(10).toLowerCase() + `@mmosolution.org`;
  const birthday = `${randomInteger(1990, 2005)}-0${randomInteger(1, 9)}-0${randomInteger(1, 9)}`;
  const password = randomString(10);

  logger.info(`[${index}] Starting signup nickname (${username} - ${email})...`);

  const proxy = randomStickyProxy(config.proxy.pattern, config.proxy.regions);
  const mrccaptcha = new MRCCaptcha();
  const mailBox = new MMOSolutionMailBox(email);
  logger.info(`[${index}] Proxy: ${proxy}`);

  const userAgent = await mrccaptcha.getRandomUseragent(DEVICE, BROWSER);
  logger.info(`[${index}] UserAgent: ${userAgent}`);

  logger.info(`[${index}] launching browser...`);
  const browser = await chromium.launch({
    headless: false,
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    proxy: extractDetails(proxy),
    args: [
      `--window-size=${SCREEN.WIDTH},${SCREEN.HEIGHT}`,
      '--disable-blink-features=AutomationControlled',
      '--enable-webgl',
      '--use-gl=swiftshader',
      '--enable-accelerated-2d-canvas',
      "--no-first-run",
      "--disable-extensions",
      "--disable-infobars",
      `--window-position=${posX},${posY}`
    ],
    ignoreHTTPSErrors: true,
  });

  try {
    const context = await browser.newContext({
      viewport: null,
      userAgent: userAgent,
      permissions: ["geolocation"],
    });

    await context.addInitScript("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})");

    const page = await context.newPage();

    logger.info(`[${index}] goto x.com`);
    await page.goto('https://x.com');
    await page.waitForTimeout(2000);

    const [onboardingResponse] = await Promise.all([
      page.waitForResponse(response => 
        response.url().includes('/1.1/onboarding/task.json') && response.status() === 200 && response.request().method() == 'POST'
      ),
      (async () => {
        logger.info(`[${index}] click create account btn`);
        await page.click('a[role="link"][data-testid="signupButton"]');

        logger.info(`[${index}] wait dialog open`);
        await page.waitForSelector('div[data-viewportview="true"] input');
      })()
    ]);

    const onboardingData = await onboardingResponse.json();
    const task = onboardingData.subtasks.find(task => task.subtask_id.includes('ArkoseEmail'));
    const blob = encodeURIComponent(new URL(task.web_modal.url).searchParams.get('data'));

    logger.info(`[${index}] solving captcha`);
    const {solution} = await mrccaptcha.solve(SITE_KEY, {
      proxy: proxy,
      userAgent: userAgent,
      datablob: blob
    });
    logger.info(`[${index}] captcha solved, solution: ${solution}`);

    logger.info(`[${index}] fill username`);
    await page.fill('div[data-viewportview="true"] input[autocomplete="name"]', username);
    await page.waitForTimeout(1000);

    logger.info(`[${index}] fill email`);
    await page.fill('div[data-viewportview="true"] input[autocomplete="email"]', email);
    await page.waitForTimeout(1000);

    logger.info(`[${index}] fill birthday`);
    await page.fill('div[data-viewportview="true"] input[type="date"]', birthday);
    await page.waitForTimeout(1000);

    logger.info(`[${index}] click next`);
    await page.click('button[data-testid="ocfSignupNextLink"]');
    
    logger.info(`[${index}] wait captcha load`);
    await page.waitForResponse(response => 
      response.url().includes('client-api.arkoselabs.com/fc/gt2/public_key/') && response.status() === 200 && response.request().method() == 'POST'
    );
    await page.waitForTimeout(5000);

    logger.info(`[${index}] captcha loaded, post mrccaptcha solution`);
    await page.evaluate(({sitekey, solution}) => {
      postMessage(JSON.stringify({
        eventId: "challenge-complete",
        publicKey: sitekey,
        payload: {
          sessionToken: solution
        }
      }), "*");
    }, {
      sitekey: SITE_KEY,
      solution: solution
    });

    logger.info(`[${index}] wait otp from ${mailBox.email}`);
    const waitEmailOtpTimeout = 30 * 1000;
    const startTime = Date.now();
    let otp = null;
    
    while (true) {
      if (waitEmailOtpTimeout && Date.now() - startTime > waitEmailOtpTimeout) {
        throw new Error(`[${index}] Wait otp timed out!`);
      }

      const inboxes = await mailBox.getInboxes();
      const [lastXMail] = inboxes.filter(mail => mail.sender.endsWith('twitter.com') || mail.sender.endsWith('x.com'));

      if (lastXMail) {
        const numbers = lastXMail.subject.match(/\d+/g);

        if (numbers) {
          otp = numbers[0];
          break;
        }
      }

      await page.waitForTimeout(2000);
    }

    logger.info(`[${index}] fill otp`);
    await page.focus('input[name="verfication_code"]');
    await page.keyboard.insertText(otp);
    await page.waitForTimeout(3000);

    logger.info(`[${index}] click next`);
    await page.evaluate(() => {
      document.querySelector('[role="main"] [role="group"] > :nth-child(2) > :nth-child(3) button[role="button"]').click();
    });
    await page.waitForSelector('input[name="password"]');
    await page.waitForTimeout(1000);

    logger.info(`[${index}] fill password`);
    await page.focus('input[name="password"]');
    await page.keyboard.insertText(password);
    await page.waitForTimeout(3000);

    const [enterPasswordResponse] = await Promise.all([
      page.waitForResponse(async (response) => {
        const isCorrectUrl = response.url().includes('/1.1/onboarding/task.json');
        const isPost = response.request().method() === 'POST';
    
        if (isCorrectUrl && isPost) {
          const postData = response.request().postData();
    
          if (postData && postData.includes('EnterPassword')) {
            return true;
          }
        }
    
        return false;
      }),
      (async () => {
        logger.info(`[${index}] click signup`);
        await page.evaluate(() => {
          document.querySelector('button[data-testid="LoginForm_Login_Button"]').click();
        });
        await page.waitForSelector('button[data-testid="ocfSelectAvatarSkipForNowButton"]');
      })()
    ]);

    const enterPasswordData = await enterPasswordResponse.json();
    const openAccount = enterPasswordData.subtasks.find(subtask => subtask.subtask_id.includes('OpenAccount'))?.open_account;

    await Promise.all([
      page.waitForTimeout(2000),
      insertAccount({
        uid: openAccount.user.screen_name,
        name: openAccount.user.name || username,
        rest_id: openAccount.user.id_str,
        email: mailBox.email,
        password: password,
        registration_time: new Date(),
        useragent: userAgent
      })
    ]);

    await browser.close();

    logger.info(`[${index}] x signup completed!`);
    return;
  }
  catch(error) {
    await browser.close();
    logger.error(`[${index}] x signup error: ${error.message}`);
    return;
  }
}

async function main() {
  logger.info(`Start X signup with ${ATTEMPTS} attempts and ${THREADS} threads`);
  
  let index = 0;

  async function worker(wIndex) {
    while (index < ATTEMPTS) {
      index++;
      await xSignup(wIndex);
    }
  }
  const workers = Array.from({ length: THREADS }).fill(1).map((v, i) => worker(i));

  await Promise.all(workers);

  process.exit(1);
}

main();