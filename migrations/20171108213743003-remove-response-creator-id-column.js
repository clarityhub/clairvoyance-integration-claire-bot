module.exports = {
  up: (queryInterface) => {
    return queryInterface.removeColumn(
      'Responses',
      'creatorId'
    );
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.addColumn('Responses', 'creatorId', {
      type: Sequelize.BIGINT,
      validate: {
        notEmpty: true,
      },
    });
  },
};
