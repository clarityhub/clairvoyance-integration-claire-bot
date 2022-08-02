const elasticsearch = require('elasticsearch');
const { settings } = require('service-claire/helpers/config');

const options = {
  host: `${settings.elastic.host}:${settings.elastic.port}`,
  maxRetries: 10,
  requestTimeout: Infinity,
  keepAlive: true,
};

if (settings.elastic.username) {
  options.httpAuth = `${settings.elastic.username}:${settings.elastic.password}`;
}

const client = new elasticsearch.Client(options);

module.exports = {
  client,
};
