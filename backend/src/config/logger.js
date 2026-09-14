/**
 * @fileoverview Minimal logger used across the app.
 * Keeps the same interface (info/warn/error) so swapping in
 * winston/pino later doesn't require touching call sites.
 */
const format = (level, message) => {
  const timestamp = new Date().toISOString();
  return `[${timestamp}] [${level}] ${message}`;
};

module.exports = {
  info: (message) => console.log(format('INFO', message)),
  warn: (message) => console.warn(format('WARN', message)),
  error: (message, err) => {
    console.error(format('ERROR', message));
    if (err && err.stack) console.error(err.stack);
  },
};