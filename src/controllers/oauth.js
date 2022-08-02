const { settings } = require('service-claire/helpers/config');
const logger = require('service-claire/helpers/logger');
const {
  error,
} = require('service-claire/helpers/responses');
const rp = require('request-promise');
const {
  Auth,
} = require('../models');

const { authUrl } = settings;

const handleOauthOnboarding = async ({
  accessToken,
  accountId,
}) => {
  try {
    const [, created] = await Auth.findOrCreate({
      where: {
        accountId,
      },
      defaults: {
        accessToken,
        accountId,
      },
    });

    if (!created) {
      await Auth.update({
        accessToken,
      }, {
        where: {
          accountId,
        },
      });
    }

    return {
      wasAlreadyActive: !created,
    };
  } catch (err) {
    logger.error(err);
  }
};


/**
 * Use the given code to create an oauth access token.
 * This is usually caused by re-activating the integration.
 */
const handleOauthCode = async (req, res) => {
  const {
    code,
  } = req.query;

  try {
    const options = {
      method: 'POST',
      uri: `${authUrl}/auth/credentials/code/${code}/activate`,
      json: true,
      body: {
        clientId: settings.clientId,
        clientSecret: settings.clientSecret,
      },
    };

    // Get access token
    const response = await rp(options);

    const {
      wasAlreadyActive,
    } = await handleOauthOnboarding({
      accessToken: response.accessToken,
      accountId: response.accountId,
    });

    res.status(200).render('oauth', {
      wasAlreadyActive,
    });
  } catch (err) {
    logger.error(err);
    error(res)({});
  }
};

module.exports = {
  handleOauthCode,
  handleOauthOnboarding,
};
