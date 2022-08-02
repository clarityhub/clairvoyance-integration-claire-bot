module.exports = function (sequelize, Sequelize) {
  const Auth = sequelize.define('Auth', {
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
  });

  return Auth;
};
