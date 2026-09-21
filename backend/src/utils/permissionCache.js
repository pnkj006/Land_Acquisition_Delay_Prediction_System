/**
 * @fileoverview In-memory permission cache to avoid DB roundtrips on every request.
 */
const { PERMISSION_CACHE_TTL_MS } = require('../config/env');

const cache = new Map();

exports.get = (userId) => {
  const entry = cache.get(userId);
  if (!entry) return null;

  if (PERMISSION_CACHE_TTL_MS > 0 && Date.now() - entry.loadedAt > PERMISSION_CACHE_TTL_MS) {
    cache.delete(userId);
    return null;
  }
  return entry;
};

exports.set = (userId, user) => {
  cache.set(userId, {
    user, // Store full user object (without password)
    isActive: user.is_active,
    loadedAt: Date.now()
  });
};

exports.invalidate = (userId) => {
  cache.delete(userId);
};
