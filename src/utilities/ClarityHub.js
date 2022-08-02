const rp = require('request-promise');

const params = (u) => {
  if (u) {
    return `?asUser=true&userUuid=${u}`;
  }
  return '';
};

module.exports = class ClarityHub {
  constructor({ accessToken, url, asUser }) {
    this.accessToken = accessToken;
    this.url = url || 'https://api.clarityhub.io';
    this.asUser = asUser || false;
  }

  suggest(opts) {
    const { messageUuid, chatUuid, suggestions } = opts;

    const options = {
      uri: `${this.url}/suggestions/messages/${messageUuid}${params(this.asUser)}`,
      method: 'POST',
      json: true,
      headers: {
        'access-token': this.accessToken,
      },
      body: {
        chatUuid,
        suggestions,
      },
    };
    return rp(options);
  }

  deleteSuggestion(opts) {
    const { uuid } = opts;
    const options = {
      uri: `${this.url}/suggestions/${uuid}${params(this.asUser)}`,
      method: 'DELETE',
      json: true,
      headers: {
        'access-token': this.accessToken,
      },
      body: {},
    };
    return rp(options);
  }

  createMessage(opts) {
    const { chatUuid, text } = opts;

    const options = {
      uri: `${this.url}/chats/${chatUuid}/msgs${params(this.asUser)}`,
      method: 'POST',
      json: true,
      headers: {
        'access-token': this.accessToken,
      },
      body: {
        text,
      },
    };
    return rp(options);
  }


  composeMessage(opts) {
    const { chatUuid, text } = opts;

    const options = {
      uri: `${this.url}/chats/${chatUuid}/compose${params(this.asUser)}`,
      method: 'POST',
      json: true,
      headers: {
        'access-token': this.accessToken,
      },
      body: {
        text,
      },
    };
    return rp(options);
  }
};
