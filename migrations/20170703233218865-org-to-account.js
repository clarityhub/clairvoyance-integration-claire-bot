module.exports = {
  up: (queryInterface) => {
    return queryInterface.renameColumn(
      'Requests',
      'orgId',
      'accountId'
    );
  },
  down: (queryInterface) => {
    return queryInterface.renameColumn(
      'Requests',
      'accountId',
      'orgId'
    );
  },
};
