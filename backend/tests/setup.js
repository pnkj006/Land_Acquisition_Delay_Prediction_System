/**
 * @fileoverview Jest global setup — loads .env.test so all tests use
 * the isolated test DB and controlled env vars.
 * This file runs before any test module is loaded.
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.test') });
