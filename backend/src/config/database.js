/**
 * @fileoverview Single shared Prisma client instance.
 * Every service does: const prisma = require('../config/database');
 */
const { PrismaClient } = require('@prisma/client');
const logger = require('./logger');

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development'
    ? ['query', 'warn', 'error']
    : ['warn', 'error'],
});

if (process.env.NODE_ENV !== 'test') {
  prisma
    .$connect()
    .then(() => logger.info('Database connected'))
    .catch((err) => {
      logger.error('Database connection failed', err);
      process.exit(1);
    });
}

module.exports = prisma;