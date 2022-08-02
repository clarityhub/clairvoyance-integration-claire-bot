module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn(
      'Requests',
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
      'Requests',
      'uuid'
    );
  },
};
