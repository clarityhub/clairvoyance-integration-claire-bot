const { handleOauthCode } = require('../controllers/oauth');

module.exports = (router) => {
  router.route('/oauth')
    .get(handleOauthCode);
};
