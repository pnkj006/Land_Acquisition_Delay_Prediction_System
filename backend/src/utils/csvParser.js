/**
 * @fileoverview Parses a CSV file buffer into an array of row objects,
 * using the header row as keys. Used by import.service.js.
 */
const { parse } = require('csv-parse');

/**
 * parseCSV(buffer) -> Promise<Array<Object>>
 * Each row becomes { column_name: value, ... } based on the CSV header row.
 */
exports.parseCSV = (buffer) => {
  return new Promise((resolve, reject) => {
    parse(
      buffer,
      {
        columns: true,       // use first row as object keys
        skip_empty_lines: true,
        trim: true,
      },
      (err, records) => {
        if (err) return reject(err);
        resolve(records);
      }
    );
  });
};