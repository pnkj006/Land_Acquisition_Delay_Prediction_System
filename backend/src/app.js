/**
 * @fileoverview Express app setup: middleware + route mounting.
 * All routes are mounted with RBAC guards (§6 of the RBAC V7 plan).
 */
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const expressJSDocSwagger = require('express-jsdoc-swagger');
const swaggerOptions = require('./config/swagger');
const errorMiddleware = require('./middlewares/error.middleware');

const app = express();

/**
 * Trust proxy (G3).
 * TRUST_PROXY unset / "false" -> false (backend exposed directly; X-Forwarded-For is ignored)
 * TRUST_PROXY=1 (or any number) -> trust that many proxy hops (e.g. 1 on Render, 1 for a single ALB)
 * Anything else is passed through as-is (e.g. "loopback" or a CIDR list).
 * Avoid "true": it trusts every hop and lets clients spoof their IP.
 */
const trustProxyEnv = process.env.TRUST_PROXY;
let trustProxy = false;
if (trustProxyEnv && trustProxyEnv !== 'false') {
  trustProxy = /^\d+$/.test(trustProxyEnv) ? Number(trustProxyEnv) : trustProxyEnv;
}
app.set('trust proxy', trustProxy);

// API docs: not exposed in production.
if (process.env.NODE_ENV !== 'production') {
  expressJSDocSwagger(app)(swaggerOptions);
}

app.use(helmet());

// CORS (F-04): origin allowlist from CORS_ORIGINS (comma-separated). Credentials are not enabled
// because tokens are sent in the Authorization header.
const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:5173')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);
app.use(
  cors({
    // Disallowed origins simply get no CORS headers (no error thrown -> no 500).
    origin: (origin, callback) => callback(null, !origin || allowedOrigins.includes(origin)),
  })
);

// Request logging: method, URL, status, size, time only. No headers or bodies are logged.
app.use(morgan(':method :url :status :res[content-length] - :response-time ms'));

app.use('/api/v1/auth/signup', (req, res, next) => {
  const { ALLOW_PUBLIC_SIGNUP } = require('./config/env');
  if (!ALLOW_PUBLIC_SIGNUP) {
    return res.status(404).json({ success: false, message: 'Not found' });
  }
  next();
});

app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: true, limit: '100kb' }));

// Health check — public
app.get('/api/v1/health', (req, res) => {
  res.status(200).json({ success: true, message: 'OK', data: { status: 'healthy' } });
});

// --- Routes ---
app.use('/api/v1/config', require('./routes/config.routes'));
app.use('/api/v1/auth', require('./routes/auth.routes'));
app.use('/api/v1/projects', require('./routes/project.routes'));
app.use('/api/v1/projects', require('./routes/status.routes'));
app.use('/api/v1/projects', require('./routes/risk.routes'));
app.use('/api/v1/dashboard', require('./routes/dashboard.routes'));
app.use('/api/v1/analytics', require('./routes/analytics.routes'));
app.use('/api/v1/alerts', require('./routes/alert.routes'));
app.use('/api/v1/imports', require('./routes/import.routes'));
app.use('/api/v1/users', require('./routes/user.routes'));
app.use('/api/v1/audit-logs', require('./routes/audit.routes'));
app.use('/api/v1/map', require('./routes/map.routes'));
// Recommendation routes mounted at root (paths include /projects/:id/recommendations and /recommendations/:id)
app.use('/api/v1', require('./routes/recommendation.routes'));

// 404 fallback
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    error: { code: 'NOT_FOUND', details: null },
  });
});

app.use(errorMiddleware);

module.exports = app;