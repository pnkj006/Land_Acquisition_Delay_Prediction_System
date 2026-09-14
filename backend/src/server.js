/**
 * @fileoverview Entry point — starts the HTTP server.
 */
const app = require('./app');
const { PORT } = require('./config/env');
const logger = require('./config/logger');

app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});