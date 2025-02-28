const {webcrypto: crypto} = require('crypto');
const {decode} = require('entities');
const { randomString, randomInteger, randomValues, base64Decode } = require('../utils/utils');

const stringToArrayBuffer = (rawString) => {
  const bytes = new Uint8Array(rawString.length);
  for (let i = 0; i < rawString.length; i++) {
    bytes[i] = rawString.charCodeAt(i);
  }
  return bytes.buffer;
};

const generateSigningKeyPairUnextractable = async () => {
  return crypto.subtle.generateKey({
    name: 'ECDSA',
    namedCurve: 'P-256'
  }, false, ['sign']);
}

const exportPublicKeyAsSpki = async (publicKey) => {
  const publicKeyArrayBuffer = await crypto.subtle.exportKey('spki', publicKey);
  return Buffer.from(publicKeyArrayBuffer).toString('base64');
}

const sign = async (privateKey, data) => {
  const bufferResult = await crypto.subtle.sign({
    name: 'ECDSA',
    hash: { name: 'SHA-256' }
  }, privateKey, stringToArrayBuffer(data));

  return Buffer.from(bufferResult).toString('base64');
};

class FuncaptchaRobloxBlobGenerator {
  constructor(client) {
    this.client = client;
    this.nonce = '';
    this.csrfToken = '';
  }

  async getCsrf() {
    const {data} = await this.client({
      url: 'https://www.roblox.com/Login',
      method: 'GET',
      headers: {
        'sec-fetch-dest': 'document', 
        'sec-fetch-mode': 'navigate', 
        'sec-fetch-site': 'none',
      }
    });
    const csrfToken = data.match(/data-token="([^"]+)"/)?.[1];

    if (!csrfToken) {
      throw new Error('Get csrf-token error not found');
    }

    this.csrfToken = decode(csrfToken);

    this.client.defaults.headers['x-csrf-token'] = this.csrfToken;
  }

  async getNonce() {
    const {data} = await this.client({
      url: 'https://apis.roblox.com/hba-service/v1/getServerNonce',
      method: 'GET',
      headers: {
        'origin': 'https://www.roblox.com',
        'referer': 'https://www.roblox.com/',
        'sec-fetch-dest': 'empty', 
        'sec-fetch-mode': 'cors', 
        'sec-fetch-site': 'same-site',
      }
    });

    this.nonce = data;
  }

  async getBlob() {
    const SEPARATOR = '|';
    const {publicKey, privateKey} = await generateSigningKeyPairUnextractable();
    const clientPublicKey = await exportPublicKeyAsSpki(publicKey);
    const clientEpochTimestamp = Math.floor(Date.now() / 1000);
    const payload = [clientPublicKey, clientEpochTimestamp, this.nonce].join(SEPARATOR);
    const saiSignature = await sign(privateKey, payload);

    const {headers, data} = await this.client({
      url: 'https://auth.roblox.com/v2/signup',
      method: 'POST',
      headers: {
        'content-type': 'application/json;charset=UTF-8',
        'origin': 'https://www.roblox.com',
        'referer': 'https://www.roblox.com/',
        'sec-fetch-dest': 'empty', 
        'sec-fetch-mode': 'cors', 
        'sec-fetch-site': 'same-site',
      },
      data: {
        username: 'ny' + randomString(10),
        password: randomString(15),
        birthday: new Date(randomInteger(1970, 2006), randomInteger(1, 10), randomInteger(1, 28)).toISOString(),
        gender: randomValues([2, 3]),
        isTosAgreementBoxChecked: true,
        "agreementIds": [
          "05878906-9abb-4d5a-9a45-27ec161286aa",
          "ff5820fa-f4a1-4e7a-991f-46a0f86155f3"
        ],
        secureAuthenticationIntent: {
          clientPublicKey: clientPublicKey,
          clientEpochTimestamp: clientEpochTimestamp,
          serverNonce: this.nonce,
          saiSignature: saiSignature,
        },
      }
    });

    const challengeDataEncoded = headers['rblx-challenge-metadata'];

    if (!challengeDataEncoded || typeof challengeDataEncoded != 'string') {
      throw new Error(`Get challenge error not found: ${data}`);
    }

    const challengeData = JSON.parse(base64Decode(challengeDataEncoded));

    if (!challengeData.dataExchangeBlob) {
      throw new Error(`Not found blob`);
    }

    return {
      datablob: challengeData.dataExchangeBlob,
      metadata: {
        captchaId: challengeData.unifiedCaptchaId,
        clientPublicKey,
        clientEpochTimestamp,
        serverNonce: this.nonce,
        saiSignature,
        csrfToken: this.csrfToken
      }
    };
  }

  async generate() {
    try {
      await this.getCsrf();
      await this.getNonce();
      const {datablob, metadata} = await this.getBlob();

      return {
        blob: encodeURIComponent(datablob),
        metadata: metadata
      };
    }
    catch(error) {
      throw new Error(`Generate Roblox signup blob error: ${error?.message}`);
    }
  }
}

async function generateRobloxSignupBlob(client) {
  const generator = new FuncaptchaRobloxBlobGenerator(client);
  
  const {blob} = await generator.generate();

  return blob;
}

module.exports = generateRobloxSignupBlob;