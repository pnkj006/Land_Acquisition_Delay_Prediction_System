/**
 * @fileoverview Password hashing helpers using bcryptjs.
 */
const bcrypt = require('bcryptjs');

const SALT_ROUNDS = 10;

exports.hashPassword = async (plainPassword) => {
  return bcrypt.hash(plainPassword, SALT_ROUNDS);
};

exports.comparePassword = async (plainPassword, hash) => {
  return bcrypt.compare(plainPassword, hash);
};