module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn(
      'Responses',
      'uuid',
      {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        validate: {
          notEmpty: true,
        },
      }
    );
  },
  down: (queryInterface) => {
    return queryInterface.removeColumn(
      'Responses',
      'uuid'
    );
  },
};
