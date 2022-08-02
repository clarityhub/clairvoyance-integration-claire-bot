module.exports = {
  up(queryInterface) {
    return queryInterface.changeColumn(
      'Responses',
      'creatorId',
      {
        type: 'BIGINT USING CAST("creatorId" as BIGINT)',
        // type: Sequelize.BIGINT,
        allowNull: false,
        validate: {
          notEmpty: true,
        },
      }
    );
  },

  down(queryInterface) {
    return queryInterface.changeColumn(
      'Responses',
      'creatorId',
      {
        type: 'VARCHAR(255) USING CAST("creatorId" as VARCHAR)',
        // type: Sequelize.STRING,
        allowNull: false,
        validate: {
          notEmpty: true,
        },
      }
    );
  },
};
