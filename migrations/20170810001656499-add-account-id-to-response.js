module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn(
      'Responses',
      'accountId',
      {
        type: Sequelize.BIGINT,
        validate: {
          notEmpty: true,
        },
      }
    );
  },
  down: (queryInterface) => {
    return queryInterface.removeColumn(
      'Responses',
      'accountId'
    );
  },
};
