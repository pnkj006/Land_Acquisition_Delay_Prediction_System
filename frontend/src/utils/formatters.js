export function formatPercent(value) {
  if (value == null) return '—';
  if (Number.isNaN(value)) return '—';
  return new Intl.NumberFormat('en-IN', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1
  }).format(value)
}

export function formatRiskScore(score) {
  if (score == null) return '—';
  if (Number.isNaN(score)) return '—';
  return formatPercent(score / 100)
}

export function formatNumber(value) {
  if (value == null || Number.isNaN(value)) return '—'
  return new Intl.NumberFormat('en-IN').format(value)
}

export function formatDays(value) {
  if (value == null || Number.isNaN(value)) return '—'
  return `${value} day${Number(value) === 1 ? '' : 's'}`
}

export function formatDate(dateInput, options = {}) {
  if (!dateInput) return '—'
  const date = new Date(dateInput)
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    ...options,
  }).format(date)
}

/**
 * Compact date + 12-hour time, e.g. "16 Sep 2026, 09:49 AM".
 * Used by the dashboard's "Last Updated" KPI card so the timestamp
 * renders fully instead of truncating.
 */
export function formatDateTimeShort(dateInput) {
  if (!dateInput) return '—'
  const date = new Date(dateInput)
  if (Number.isNaN(date.getTime())) return '—'
  const datePart = formatDate(date)
  const timePart = new Intl.DateTimeFormat('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(date)
  return `${datePart}, ${timePart}`
}

export function truncateText(text, maxLength = 60) {
  if (!text) return ''
  return text.length > maxLength ? `${text.slice(0, maxLength - 1)}…` : text
}
