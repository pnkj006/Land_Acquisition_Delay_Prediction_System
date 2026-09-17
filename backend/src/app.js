/**
 * @fileoverview Express app setup: middleware + route mounting.
 * Route imports are commented out until each module is built —
 * uncomment as controllers/routes land.
 */
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const errorMiddleware = require('./middlewares/error.middleware');

const app = express();

app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/api/v1/health', (req, res) => {
  res.status(200).json({ success: true, message: 'OK', data: { status: 'healthy' } });
});

// --- Routes (mount as each module is ready) ---
app.use('/api/v1/auth', require('./routes/auth.routes'));
app.use('/api/v1/projects', require('./routes/project.routes'));
app.use('/api/v1/projects', require('./routes/status.routes'));
app.use('/api/v1/projects', require('./routes/risk.routes'));
// app.use('/api/v1/dashboard', require('./routes/dashboard.routes'));
// app.use('/api/v1/analytics', require('./routes/analytics.routes'));
// app.use('/api/v1/alerts', require('./routes/alert.routes'));
// app.use('/api/v1/imports', require('./routes/import.routes'));
// app.use('/api/v1/users', require('./routes/user.routes'));
// app.use('/api/v1/audit-logs', require('./routes/audit.routes'));

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