module.exports = {
  up: (queryInterface) => {
    return queryInterface.removeColumn(
      'Requests',
      'creatorId'
    );
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.addColumn('Requests', 'creatorId', {
      type: Sequelize.BIGINT,
      validate: {
        notEmpty: true,
      },
    });
  },
};
