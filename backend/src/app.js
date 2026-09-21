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
expressJSDocSwagger(app)(swaggerOptions);

app.use(helmet());
app.use(cors());
// Custom Morgan format to ensure no request bodies are logged, and Authorization headers are redacted
morgan.token('redacted-headers', (req) => {
  const headers = { ...req.headers };
  if (headers.authorization) headers.authorization = '[REDACTED]';
  return JSON.stringify(headers);
});
app.use(morgan(':method :url :status :res[content-length] - :response-time ms'));
app.use('/api/v1/auth/signup', (req, res, next) => {
  const { ALLOW_PUBLIC_SIGNUP } = require('./config/env');
  if (!ALLOW_PUBLIC_SIGNUP) {
    return res.status(404).json({ success: false, message: 'Not found' });
  }
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
