module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable(
      'Auths',
      {
        id: {
          type: Sequelize.BIGINT,
          primaryKey: true,
          autoIncrement: true,
        },

        accessToken: {
          type: Sequelize.STRING,
          allowNull: false,
          validate: {
            notEmpty: true,
          },
        },

        accountId: {
          type: Sequelize.BIGINT,
          allowNull: false,
          validate: {
            notEmpty: true,
          },
          unique: true,
        },

        createdAt: Sequelize.DATE,
        updatedAt: Sequelize.DATE,
        deletedAt: Sequelize.DATE,
      }, {
        timestamps: true,
        paranoid: false,
        indexes: [
          {
            unique: true,
            fields: ['accountId'],
          },
        ],
      }
    );
  },
  down: (queryInterface) => {
    return queryInterface.dropTable('Auths');
  },
};
