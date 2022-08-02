module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn(
      'Responses',
      'type',
      Sequelize.ENUM(['email', 'chat', 'voice'])
    );
  },
  down: (queryInterface) => {
    return queryInterface.removeColumn(
      'Responses',
      'type'
    );
  },
};
