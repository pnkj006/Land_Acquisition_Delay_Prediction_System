/**
 * @fileoverview Jest global setup — loads .env.test so all tests use
 * the isolated test DB and controlled env vars.
 * This file runs before any test module is loaded.
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.test') });

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set in environment.');
}
const url = new URL(process.env.DATABASE_URL);
const dbName = url.pathname.replace(/^\//, '');
if (!dbName.endsWith('_test')) {
  throw new Error(`Jest requires a _test database. Got: "${dbName}". Check DATABASE_URL in .env.test.`);
}
