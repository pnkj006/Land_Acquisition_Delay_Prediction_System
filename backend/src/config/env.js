/**
 * @fileoverview Loads and validates required environment variables.
 * Fails fast on startup if anything critical is missing.
 */
require('dotenv').config();

const REQUIRED_VARS = ['DATABASE_URL', 'JWT_SECRET'];

for (const key of REQUIRED_VARS) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

module.exports = {
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  DATABASE_URL: process.env.DATABASE_URL,
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '1d',
  ML_SERVICE_URL: process.env.ML_SERVICE_URL || 'http://localhost:8000',
  // When false (default), POST /auth/signup returns 404 and the frontend hides the link.
  // Admins create users via POST /users. Set to 'true' only in dev/testing.
  ALLOW_PUBLIC_SIGNUP: process.env.ALLOW_PUBLIC_SIGNUP === 'true',
  PERMISSION_CACHE_TTL_MS: parseInt(process.env.PERMISSION_CACHE_TTL_MS || '60000', 10),
};