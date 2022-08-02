const {
  EMAIL,
  CHAT,
  VOICE,
} = require('../constants/messageTypes');

module.exports = function (sequelize, Sequelize) {
  const Request = sequelize.define('Request', {
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

    text: Sequelize.TEXT(),
    type: Sequelize.ENUM([EMAIL, CHAT, VOICE]),

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

  Request.cleanAttributes = ['uuid', 'text', 'type', 'createdAt', 'updatedAt'];

  return Request;
};
