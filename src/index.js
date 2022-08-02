const express = require('express');
const bodyParser = require('body-parser');
const { settings } = require('service-claire/helpers/config');
const helmet = require('service-claire/middleware/helmet');
const errorHandler = require('service-claire/middleware/errors');
const logger = require('service-claire/helpers/logger');
const path = require('path');
const routes = require('./routes');

// XXX add a Bugsnag token here
logger.register('');

const app = express();

app.enable('trust proxy');
app.use(helmet());
app.use(bodyParser.json());
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, '/views'));
app.use('/suggestions', routes);
app.use(errorHandler);

const server = app.listen(
  settings.port,
  () => logger.log(`✅ 🗯🗯🗯 integration-claire-bot running on port ${settings.port}`)
);

module.exports = { app, server }; // For testing
