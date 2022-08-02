const { client } = require('../src/services/Elastic');

const db = process.env.NODE_ENV || 'development';

module.exports = {
  async up() {
    try {
      const exists = await client.indices.get({
        index: `${db}_requests`,
      });

      if (!exists) {
        await client.indices.create({
          index: `${db}_requests`,
        });
      }
    } catch (err) {
      await client.indices.create({
        index: `${db}_requests`,
      });
    }

    await client.indices.putMapping({
      index: `${db}_requests`,
      type: 'request',
      body: {
        request: {
          properties: {
            text: {
              type: 'text',
              term_vector: 'yes',
            },
          },
        },
      },
    });
  },
  down() {
    return client.indices.deleteMapping({
      index: `${db}_requests`,
      type: 'request',
      body: {
        request: {
          properties: {
            text: {
              type: 'text',
              term_vector: 'yes',
            },
          },
        },
      },
    }).then(() => {
      return client.indices.delete({
        index: `${db}_requests`,
      });
    });
  },
};
