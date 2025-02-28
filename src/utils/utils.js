async function wait(ms) {
  return new Promise(function (resolve) {
    setTimeout(resolve, ms);
  });
}

function randomInteger(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomString(length) {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  const charactersLength = characters.length;

  for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }

  return result;
}

function randomValues(inputArray) {
  if (inputArray.length === 0) {
    throw new Error(`Array input empty`);
  }

  const randomIndex = Math.floor(Math.random() * inputArray.length);
  return inputArray[randomIndex];
}

function randomStickyProxy(proxyPattern, regions) {
  const region = regions[randomInteger(0, regions.length - 1)];

  return proxyPattern.replace('{{region}}', region).replace('{{session}}', randomString(18));
}

function base64Decode(base64String) {
  return Buffer.from(base64String, 'base64').toString('utf-8');
}

function md5(data) {
  return crypto.createHash('md5').update(data).digest("hex");
}

function base64Encode(text) {
  return Buffer.from(text, 'utf-8').toString('base64');
}


module.exports = {
  wait,
  randomStickyProxy,
  randomInteger,
  randomString,
  randomValues,
  base64Decode,
  base64Encode,
  md5
}