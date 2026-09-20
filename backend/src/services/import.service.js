/**
 * @fileoverview Import Service
 * §8 of the RBAC V7 plan.
 */
const prisma = require('../config/database');
const logger = require('../config/logger');
const { parseCSV } = require('../utils/csvParser');
const { validateProjectRow } = require('../validators/import.validator');
const { log, logInTx } = require('./audit.service');

// Helper to log completely rejected imports (outside tx)
const importRejected = async (actor, action, fileName, details) => {
  await log(actor.id, action, null, {
    file_name: fileName,
    ...details
  }).catch(e => logger.error(`importRejected audit failed: ${e.message}`));
};

exports.importProjects = async (file, actor) => {
  let rows;
  try {
    rows = await parseCSV(file.buffer);
  } catch (err) {
    await importRejected(actor, 'import_projects_failed', file.originalname, { error: 'Invalid CSV format' });
    const error = new Error('Invalid CSV format');
    error.statusCode = 400;
    throw error;
  }

  const errorList = [];
  const mappedRows = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const validationResult = validateProjectRow(row, i);
    
    if (!validationResult.valid) {
      errorList.push({ row: i + 1, error: validationResult.error });
      continue;
    }
    
    // Normalize project_id
    const projectId = row.project_id.trim().toUpperCase();

    const mappedRow = {
      project_id: projectId,
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
      location: row.location || null,
      state: row.state || null,
      district: row.district || null,
      altitude_m: row.altitude_m ? parseFloat(row.altitude_m) : null,
      latitude: row.latitude ? parseFloat(row.latitude) : null,
      longitude: row.longitude ? parseFloat(row.longitude) : null,
      delay_status: row.delay_status || null,
      delay_days: row.delay_days ? parseInt(row.delay_days) : null,
      risk_score: row.risk_score ? parseFloat(row.risk_score) : null,
    };
    
    mappedRows.push(mappedRow);
  }

  // If any errors, reject entire file (all-or-nothing, §8.2)
  if (errorList.length > 0) {
    await importRejected(actor, 'import_projects_failed', file.originalname, { 
      errors: errorList.slice(0, 50), // limit details size
      failed_count: errorList.length 
    });
    
    const error = new Error('Validation failed for one or more rows. Import aborted.');
    error.statusCode = 400;
    error.details = errorList;
    throw error;
  }

  // All-or-nothing transaction
  const result = await prisma.$transaction(async (tx) => {
    let successCount = 0;
    
    for (const mappedRow of mappedRows) {
      await tx.project.upsert({
        where: { project_id: mappedRow.project_id },
        update: mappedRow,
        create: mappedRow
      });
      successCount++;
    }

    const importHistory = await tx.importHistory.create({
      data: {
        file_name: file.originalname,
        total_rows: rows.length,
        successful_rows: successCount,
        failed_rows: 0,
        errors: null,
        imported_by: actor.id
      }
    });

    await logInTx(tx, actor, 'projects_imported', 'imports', importHistory.id, {
      file_name: file.originalname,
      total_rows: rows.length,
      successful_rows: successCount
    });

    return importHistory;
  });

  return {
    importId: result.id,
    totalRows: rows.length,
    successfulRows: result.successful_rows,
    failedRows: 0,
    errors: []
  };
};

exports.listImports = async (user, page = 1, limit = 10, skip = 0) => {
  // Route enforces projects:read with requireScope: 'all', so no own-scope filtering needed.
  const where = {};

  const [items, total] = await Promise.all([
    prisma.importHistory.findMany({
      where,
      skip,
      take: limit,
      include: {
        uploader: { select: { id: true, name: true, email: true } }
      },
      orderBy: { created_at: 'desc' }
    }),
    prisma.importHistory.count({ where })
  ]);

  return { items, total };
};
