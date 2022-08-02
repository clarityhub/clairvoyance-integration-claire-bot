module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable(
      'Messages',
      {
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

        createdAt: Sequelize.DATE,
        updatedAt: Sequelize.DATE,
        deletedAt: Sequelize.DATE,
      }
    );
  },
  down: (queryInterface) => {
    return queryInterface.dropTable('Messages');
  },
};
