/**
 * @fileoverview Multer config for CSV file uploads (used by /imports/projects).
 * Keeps the file in memory (not disk) since import.service.js reads
 * file.buffer directly via parseCSV().
 */
const multer = require('multer');

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const isCsv =
    file.mimetype === 'text/csv' ||
    file.mimetype === 'application/vnd.ms-excel' ||
    file.originalname.toLowerCase().endsWith('.csv');

  if (!isCsv) {
    const err = new Error('Only CSV files are allowed');
    err.statusCode = 400;
    err.code = 'VALIDATION_ERROR';
    return cb(err);
  }
  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
});

/**
 * uploadSingle(fieldName) — factory matching how import.routes.js calls it.
 */
exports.uploadSingle = (fieldName) => upload.single(fieldName);