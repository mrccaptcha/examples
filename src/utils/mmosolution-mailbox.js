const axios = require('axios');

class MMOSolutionMailBox {
  constructor(email) {
    const [username, domain] = email.trim().split('@');
    this.domain = domain;
    this.username = username;
    this.client = axios.create({
      baseURL: `https://mail-api.mmosolution.org`
    });
  }

  get email() {
    return [this.username, this.domain].join('@');
  }

  setUsername(username) {
    this.username = username;
  }

  setDomain(domain) {
    this.domain = domain;
  }

  async getInboxes() {
    const response = await this.client.request({
      method: 'GET',
      url: `/api/inbox`,
      headers: {
        'x-mail-user': this.email
      },
    });

    const {success, error, mails} = response.data;

    if (!success || !mails) {
      throw new Error(error || 'Get inboxes unknown error');
    }
    
    return mails.map(mail => {
      return {
        id: mail.messageId,
        sender: mail.sender.address,
        subject: mail.subject,
        time: new Date(mail.date),
        body: mail.text
      }
    });
  }

  async readInbox(inboxId) {
    return inboxId;
  }
}

module.exports = MMOSolutionMailBox;