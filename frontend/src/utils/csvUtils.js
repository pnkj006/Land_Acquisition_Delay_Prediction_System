/**
 * Dependency-free CSV export helpers.
 *
 * The project has no CSV/PDF library installed and there is no existing export
 * utility, so CSV is built with plain string handling and downloaded through a
 * Blob + object URL. Nothing is uploaded anywhere — the file is generated
 * entirely in the browser from data already on screen.
 */

/**
 * Escapes a single CSV cell: wraps in double quotes when the value contains a
 * comma, quote, or newline, and doubles any embedded quote characters.
 */
function escapeCell(value) {
  if (value === null || value === undefined) return ''
  const text = String(value)
  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`
  }
  return text
}

/**
 * Builds a CSV string from a header row and an array of row arrays.
 *
 * @param {string[]} headers column titles
 * @param {Array<Array<string|number|null|undefined>>} rows cell values
 * @returns {string} CSV document (CRLF line endings for spreadsheet safety)
 */
export function buildCsv(headers, rows) {
  const headerLine = headers.map(escapeCell).join(',')
  const bodyLines = rows.map((row) => row.map(escapeCell).join(','))
  return [headerLine, ...bodyLines].join('\r\n')
}

/**
 * Triggers a browser download of the given text content as a file.
 * Uses a Blob so even large exports do not hit URL length limits.
 *
 * @param {string} filename suggested download name
 * @param {string} content file contents
 * @param {string} mimeType MIME type of the payload
 */
export function downloadTextFile(filename, content, mimeType = 'text/csv;charset=utf-8;') {
  // Prepend a BOM so Excel reads UTF-8 correctly.
  const blob = new Blob([`\uFEFF${content}`], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.style.display = 'none'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  // Release the object URL on the next tick so the download can start.
  setTimeout(() => URL.revokeObjectURL(url), 0)
}

/**
 * Builds and downloads a CSV file in one step.
 *
 * @param {string} filename suggested download name
 * @param {string[]} headers column titles
 * @param {Array<Array<string|number|null|undefined>>} rows cell values
 */
export function exportCsv(filename, headers, rows) {
  downloadTextFile(filename, buildCsv(headers, rows), 'text/csv;charset=utf-8;')
}

/**
 * Builds a timestamped export filename, e.g. `project-report-2026-09-18.csv`.
 *
 * @param {string} prefix filename prefix
 * @param {string} extension file extension without the dot
 * @returns {string} filename
 */
export function timestampedFilename(prefix, extension = 'csv') {
  const now = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  const stamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
  return `${prefix}-${stamp}.${extension}`
}