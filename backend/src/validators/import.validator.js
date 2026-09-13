/**
 * @description Validators for CSV import rows.
 */

/**
 * Synchronously validates a single CSV row object.
 * @param {Object} row 
 * @param {number} rowIndex 
 * @returns {Object} { valid: boolean, error?: string }
 */
function validateProjectRow(row, rowIndex) {
  if (!row.project_id || typeof row.project_id !== 'string' || row.project_id.trim() === '') {
    return { valid: false, error: 'project_id is required and must be non-empty' };
  }

  const validProjectTypes = ['HIGHWAY', 'RAILWAY', 'IRRIGATION', 'POWER', 'INDUSTRIAL', 'OTHER'];
  if (row.project_type && !validProjectTypes.includes(row.project_type)) {
    return { valid: false, error: `project_type must be one of: ${validProjectTypes.join(', ')}` };
  }

  if (row.land_area_hectares !== undefined && row.land_area_hectares !== null && row.land_area_hectares !== '') {
    const area = Number(row.land_area_hectares);
    if (isNaN(area) || area <= 0) {
      return { valid: false, error: 'land_area_hectares must be a positive number' };
    }
  }

  if (row.number_of_affected_families !== undefined && row.number_of_affected_families !== null && row.number_of_affected_families !== '') {
    const families = Number(row.number_of_affected_families);
    if (!Number.isInteger(families) || families < 0) {
      return { valid: false, error: 'number_of_affected_families must be a non-negative integer' };
    }
  }

  if (row.rehabilitation_progress_pct !== undefined && row.rehabilitation_progress_pct !== null && row.rehabilitation_progress_pct !== '') {
    const pct = Number(row.rehabilitation_progress_pct);
    if (isNaN(pct) || pct < 0 || pct > 100) {
      return { valid: false, error: 'rehabilitation_progress_pct must be between 0 and 100' };
    }
  }

  const validStakeholderResponsiveness = ['HIGH', 'MEDIUM', 'LOW'];
  if (row.stakeholder_responsiveness && !validStakeholderResponsiveness.includes(row.stakeholder_responsiveness)) {
    return { valid: false, error: `stakeholder_responsiveness must be one of: ${validStakeholderResponsiveness.join(', ')}` };
  }

  if (row.latitude !== undefined && row.latitude !== null && row.latitude !== '') {
    const lat = Number(row.latitude);
    if (isNaN(lat) || lat < -90 || lat > 90) {
      return { valid: false, error: 'latitude must be between -90 and 90' };
    }
  }

  if (row.longitude !== undefined && row.longitude !== null && row.longitude !== '') {
    const lng = Number(row.longitude);
    if (isNaN(lng) || lng < -180 || lng > 180) {
      return { valid: false, error: 'longitude must be between -180 and 180' };
    }
  }

  return { valid: true };
}

module.exports = { validateProjectRow };
