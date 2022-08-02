module.exports = {
  up(queryInterface, Sequelize) {
    return queryInterface.createTable(
      'Requests',
      {
        id: {
          type: Sequelize.BIGINT,
          primaryKey: true,
          autoIncrement: true,
        },
        text: Sequelize.TEXT(),
        type: Sequelize.ENUM(['email', 'chat', 'voice']),
        orgId: {
          type: Sequelize.STRING,
          validate: {
            notEmpty: true,
          },
        },
        creatorId: {
          type: Sequelize.STRING,
          validate: {
            notEmpty: true,
          },
        },
        ResponseId: {
          type: Sequelize.BIGINT,
          validate: {
            notEmpty: true,
          },
        },
        createdAt: Sequelize.DATE,
        updatedAt: Sequelize.DATE,
        deletedAt: Sequelize.DATE,
      }
    ).then(() => {
      return queryInterface.createTable(
        'Responses',
        {
          id: {
            type: Sequelize.BIGINT,
            primaryKey: true,
            autoIncrement: true,
          },
          text: Sequelize.TEXT(),

          parentId: Sequelize.BIGINT,
          parentType: Sequelize.ENUM(['request', 'response']),

          weight: Sequelize.INTEGER,

          creatorId: Sequelize.STRING,
          createdAt: Sequelize.DATE,
          updatedAt: Sequelize.DATE,
          deletedAt: Sequelize.DATE,
        }
      );
    });
  },
  down(queryInterface) {
    return queryInterface.dropTable('Responses').then(() => {
      return queryInterface.dropTable('Requests');
    });
  },
};
