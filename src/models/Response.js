const {
  EMAIL,
  CHAT,
  VOICE,
} = require('../constants/messageTypes');
const {
  REQUEST,
  RESPONSE,
} = require('../constants/responseParentTypes');

module.exports = function (sequelize, Sequelize) {
  const Response = sequelize.define('Response', {
    id: {
      type: Sequelize.BIGINT,
      primaryKey: true,
      autoIncrement: true,
    },

    uuid: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
      validate: {
        notEmpty: true,
      },
    },

    text: Sequelize.TEXT('long'),
    type: Sequelize.ENUM([EMAIL, CHAT, VOICE]),

    parentId: Sequelize.BIGINT,
    parentType: Sequelize.ENUM([REQUEST, RESPONSE]),

    weight: Sequelize.INTEGER,

    accountId: {
      type: Sequelize.BIGINT,
      validate: {
        notEmpty: true,
      },
    },

    createdAt: Sequelize.DATE,
    updatedAt: Sequelize.DATE,
    deletedAt: Sequelize.DATE,
  }, {
    timestamps: true,
    paranoid: true,
  });

  Response.cleanAttributes = ['uuid', 'text', 'parentType', 'weight', 'createdAt', 'updatedAt'];

  return Response;
};
