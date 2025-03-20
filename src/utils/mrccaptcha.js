const axios = require("axios");
const config = require("../config");
const {wait} = require('./utils');

module.exports = class MRCCaptcha {
  constructor() {
    this.apikey = config.service.apikey;
    this.client = axios.create({
      baseURL: config.service.uri
    });
  }

  async createTask(sitekey, opts = {}) {
    try {
      const body = {
        apikey: this.apikey,
        sitekey
      };
  
      for (let key in opts) {
        body[key] = opts[key];
      }
  
      const {data} = await this.client({
        method: 'POST',
        url: '/captcha/FunCaptchaTokenTask',
        data: body
      });
      const {Code, Message, TaskId} = data;
  
      if (Code != 0) {
        throw new Error(Message);
      }
  
      return TaskId.toString();
    }
    catch(error) {
      throw new Error(`[MRCCAPTCHA] create task error: ${error.message}`);
    }
  }

  async getResult(taskId) {
    try {
      while (true) {
        const {data} = await this.client({
          method: 'GET',
          url: '/captcha/getresult',
          params: {
            apikey: this.apikey,
            taskId
          }
        });
        const {Code, Message, Status, Data} = data;
    
        if (Code != 0 || Status == 'ERROR') {
          throw new Error(Message);
        }

        if (Status == 'SUCCESS') {
          return {
            solution: Data.Token,
          };
        }

        await wait(3000);
      }
    }
    catch(error) {
      throw new Error(`[MRCCAPTCHA] solve error: ${error.message}`);
    }
  }

  async solve(sitekey, opts = {}) {
    const taskId = await this.createTask(sitekey, opts);
    const result = await this.getResult(taskId);

    return result;
  }

  async getRandomUseragent(device, {browser, model}) {
    try {
      const {data} = await this.client({
        method: 'GET',
        url: '/captcha/random-useragent',
        params: {device, browser, model},
        validateStatus: () => true
      });
      
      const {data: idata, error} = data;

      if (error) {
        throw new Error(error.message);
      }

      return idata.userAgent;
    }
    catch(error) {
      throw new Error(`[MRCCAPTCHA] get random useragent error: ${error.message}`);
    }
  }
}