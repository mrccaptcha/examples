require('dotenv').config();

const config = {
  service: {
    uri: process.env.SERVICE_URI,
    apikey: process.env.SERVICE_API_KEY,
  },
  proxy: {
    pattern: process.env.PROXY_PATTERN || '',
    regions: process.env.PROXY_REGIONS ? process.env.PROXY_REGIONS.trim().split(',').map(r => r.trim()) : []
  },
};

if (!config.service.uri || !config.service.apikey) {
  throw new Error(`Required envs SERVICE_URI & API_KEY`);
}

if (!config.proxy.pattern || !config.proxy.regions || config.proxy.regions.length == 0) {
  throw new Error(`Required envs PROXY_PATTERN & PROXY_REGIONS`);
}

module.exports = config;