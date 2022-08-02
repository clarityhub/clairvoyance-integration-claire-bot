module.exports = function (sequelize, Sequelize) {
  const Message = sequelize.define('Message', {
    id: {
      type: Sequelize.BIGINT,
      primaryKey: true,
      autoIncrement: true,
    },

    chatUuid: {
      type: Sequelize.UUID,
    },

    accountId: {
      type: Sequelize.BIGINT,
    },

    messageUuid: {
      type: Sequelize.UUID,
    },

    participantId: {
      type: Sequelize.UUID,
    },

    participantType: {
      type: Sequelize.STRING,
    },

    text: {
      type: Sequelize.TEXT,
    },

    responseUuid: {
      type: Sequelize.UUID,
    },

    editResponseUuid: {
      type: Sequelize.UUID,
    },
  });

  return Message;
};
