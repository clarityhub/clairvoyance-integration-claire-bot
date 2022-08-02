const checkTokenMiddleware = require('../middleware/checkToken');
const { callback } = require('../controllers/callback');

module.exports = (router) => {
  router.route('/callback')
    .post(
      checkTokenMiddleware,
      callback
    );
};
