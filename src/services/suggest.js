const logger = require('service-claire/helpers/logger');
const stopWords = require('../stopWords');
const {
  Request,
  Response,
  sequelize,
} = require('../models');
const {
  REQUEST,
  RESPONSE,
} = require('../constants/responseParentTypes');
const Elastic = require('../services/Elastic');

const elastic = Elastic.client;
const db = process.env.NODE_ENV || 'development';

/**
 * Given a request chain, suggest at most 3 responses
 *
 * @apiParam {String} text
 * @apiParam {String} type One of email, chat, etc
 * @apiParam {Number} limit (Optional) A number between 1 and 10, defaults to 3
 */
const suggestResponse = async ({
  text,
  type,
  accountId,
  limit: suggestedLimit,
}) => {
  const limit = Math.max(1, Math.min(10, suggestedLimit || 3));

  if (!text) {
    throw new Error('Text is required');
  }

  if (!type) {
    throw new Error('A type is required');
  }

  try {
    const data = await elastic.search({
      index: `${db}_requests`,
      size: 10, // Default to 10
      body: {
        query: {
          bool: {
            must: [
              { match: { accountId } },
              { match: { type } },
              {
                // TODO also score on match frequency
                more_like_this: {
                  fields: ['text'],
                  like_text: text,
                  min_doc_freq: 1,
                  min_term_freq: 1,
                  stop_words: stopWords,
                },
              },
            ],
          },
        },
      },
    });

    // Get the documents to postgres
    const requestIds = data.hits.hits.map(h => h._source.requestId);

    if (requestIds.length === 0) {
      return [];
    }

    // TODO use the cool sequelize.cast stuff
    // TODO fix query to ignore deletedAt
    const requests = await Request.sequelize.query(
      `
        SELECT * FROM "Requests"
        WHERE
          id = ANY('{${requestIds.slice(0, limit).join(',')}}'::int[])
          AND "accountId" = ?
      `,
      {
        replacements: [
          accountId,
        ],
        type: Request.sequelize.QueryTypes.SELECT,
        logging: false,
        model: Request,
      }
    );
    const responses = await Response.findAll({
      order: [['weight', 'DESC']],
      where: {
        weight: {
          $gte: 0,
        },
        parentType: REQUEST,
        parentId: {
          $any: sequelize.cast(requests.map(r => r.id), 'int[]'),
        },
      },
      attributes: Response.cleanAttributes,
    });

    return responses;
  } catch (err) {
    logger.error(err);
    return null;
  }
};


/**
 * Given a response uuid, suggest at most 3 responses
 */
const suggestResponseResponse = async ({
  responseUuid: uuid,
  accountId,
}) => {
  try {
    const response = await Response.findOne({
      where: {
        accountId,
        uuid,
      },
    });

    if (!response) {
      return [];
    }

    const responses = await Response.findAll({
      attributes: Response.cleanAttributes,
      order: [['weight', 'DESC']],
      where: {
        weight: {
          $gte: 0,
        },
        accountId,
        parentId: response.id,
        parentType: RESPONSE,
      },
    });

    return responses;
  } catch (err) {
    logger.error(err);
    return null;
  }
};


/**
 * Given a request chain, add a new response suggestion
 */
const createResponse = ({
  type,
  requestText,
  responseText,
  accountId,
}) => {
  // XXX requestText, responseText and type are required

  // XXX DO NOT CREATE A NEW REQUEST OR ELASTIC ENTRY IF THERE
  // IS AN EXACT REQUEST_TEXT MATCH
  return sequelize.transaction((t) => {
    return Request.create({
      type,
      text: requestText,
      accountId,
    }, {
      returning: true,
      transaction: t,
    }).then((request) => {
      return Response.create({
        text: responseText,
        parentId: request.id,
        parentType: REQUEST,
        weight: 1,
        accountId,
      }, {
        returning: true,
        transaction: t,
      }).then((response) => {
        // Add to elastic search
        return elastic.create({
          index: `${db}_requests`,
          id: `${request.id}-int`,
          type: REQUEST,
          body: {
            text: requestText,
            requestId: request.id,
            accountId,
            type,
          },
        }).then(() => {
          return {
            uuid: response.uuid,
          };
        });
      });
    }).catch((err) => {
      logger.error(err);
      return null;
    });
  });
};


/**
 * Given a response uuid, add a new response suggestion
 */
const createResponseResponse = ({
  accountId,
  responseUuid: uuid,
  responseText,
  type,
}) => {
  return Response.findOne({
    where: {
      accountId,
      uuid,
    },
  }).then((response) => {
    return Response.create({
      text: responseText,
      parentId: response.id,
      parentType: RESPONSE,
      weight: 1,
      accountId,
      type,
    }, {
      returning: true,
    }).then((newResponse) => {
      return {
        done: true,
        uuid: newResponse.uuid,
      };
    });
  }).catch((err) => {
    logger.error(err);
  });
};


const improve = async ({
  responseUuid: uuid,
  from,
  type, // request-response, response-response
  accountId,
}) => {
  try {
    if (type === 'request-response') {
      await Response.update({
        weight: sequelize.literal('weight + 1'),
      }, {
        where: {
          uuid,
          accountId,
          parentType: REQUEST,
        },
      });
    } else {
      const response = await Response.findOne({
        where: {
          accountId,
          uuid: from,
        },
      });

      await Response.update({
        weight: sequelize.literal('weight + 1'),
      }, {
        where: {
          uuid,
          accountId,
          parentId: response.id,
          parentType: RESPONSE,
        },
        returning: true,
      });
    }
  } catch (err) {
    logger.error(err);
  }
};

const lessen = async ({
  responseUuid: uuid,
  from,
  type,
  accountId,
}) => {
  try {
    if (type === 'request-response') {
      await Response.update({
        weight: sequelize.literal('weight - 1'),
      }, {
        where: {
          uuid,
          accountId,
          parentType: REQUEST,
        },
      });
    } else {
      const response = await Response.findOne({
        where: {
          accountId,
          uuid: from,
        },
      });

      await Response.update({
        weight: sequelize.literal('weight - 1'),
      }, {
        where: {
          uuid,
          accountId,
          parentId: response.id,
          parentType: RESPONSE,
        },
      });
    }
  } catch (err) {
    logger.error(err);
  }
};

module.exports = {
  suggestResponse,
  suggestResponseResponse,
  createResponse,
  createResponseResponse,
  improve,
  lessen,
};
