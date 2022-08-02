const { settings } = require('service-claire/helpers/config');

module.exports = (req, res, next) => {
  const { token } = req.body;
  if (token !== settings.token) {
    res.status(403).send({
      reason: 'Invalid token',
    });
  }

  next();
};
