const statusCheck = require('service-claire/status/controller');

module.exports = function (router) {
  router.route('/status').get(statusCheck([]));
};
