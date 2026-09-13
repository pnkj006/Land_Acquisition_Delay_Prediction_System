/**
 * @fileoverview Import Service
 */
const prisma = require('../config/database');
const logger = require('../config/logger');
const { parseCSV } = require('../utils/csvParser');
const { validateProjectRow } = require('../validators/import.validator');

exports.importProjects = async (file, userId) => {
  const rows = await parseCSV(file.buffer);
  
  let successCount = 0;
  const errorList = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    try {
      // Validate
      const validationResult = validateProjectRow(row, i);
      if (!validationResult.valid) {
        errorList.push({ row: i + 1, error: validationResult.error });
        continue;
      }
      
      const mappedRow = {
        project_id: row.project_id,
        project_type: row.project_type || null,
        land_area_hectares: row.land_area_hectares ? parseFloat(row.land_area_hectares) : null,
        number_of_affected_families: row.number_of_affected_families ? parseInt(row.number_of_affected_families) : null,
        compensation_status: row.compensation_status || null,
        approval_timeline_days: row.approval_timeline_days ? parseInt(row.approval_timeline_days) : null,
        legal_disputes_count: row.legal_disputes_count ? parseInt(row.legal_disputes_count) : null,
        possession_status: row.possession_status || null,
        rehabilitation_progress_pct: row.rehabilitation_progress_pct ? parseFloat(row.rehabilitation_progress_pct) : null,
        stakeholder_responsiveness: row.stakeholder_responsiveness || null,
        historical_performance_score: row.historical_performance_score ? parseFloat(row.historical_performance_score) : null,
        administrator_id: row.administrator_id || null,
        location: row.location || null,
        altitude_m: row.altitude_m ? parseFloat(row.altitude_m) : null,
        latitude: row.latitude ? parseFloat(row.latitude) : null,
        longitude: row.longitude ? parseFloat(row.longitude) : null,
        delay_status: row.delay_status || null,
        delay_days: row.delay_days ? parseInt(row.delay_days) : null,
        risk_score: row.risk_score ? parseFloat(row.risk_score) : null,
      };

      await prisma.project.upsert({
        where: { project_id: mappedRow.project_id },
        update: mappedRow,
        create: mappedRow
      });
      successCount++;
    } catch (error) {
      logger.error(`Error importing row ${i + 1}:`, error);
      errorList.push({ row: i + 1, error: error.message });
    }
  }

  const importHistory = await prisma.importHistory.create({
    data: {
      file_name: file.originalname,
      total_rows: rows.length,
      successful_rows: successCount,
      failed_rows: errorList.length,
      errors: errorList.length > 0 ? errorList : null,
      imported_by: userId
    }
  });

  return {
    importId: importHistory.id,
    totalRows: rows.length,
    successfulRows: successCount,
    failedRows: errorList.length,
    errors: errorList
  };
};

exports.listImports = async (page = 1, limit = 10, skip = 0) => {
  const [items, total] = await Promise.all([
    prisma.importHistory.findMany({
      skip,
      take: limit,
      include: {
        importer: { select: { id: true, name: true, email: true } }
      },
      orderBy: { created_at: 'desc' }
    }),
    prisma.importHistory.count()
  ]);

  return { items, total };
};
