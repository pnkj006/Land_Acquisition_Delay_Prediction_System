/**
 * @fileoverview Shared helper: resolves a :projectId route param to a
 * Prisma where clause. Accepts either the numeric primary key `id`
 * or the business `project_id` string (e.g. "NHAI-OD-2026-01").
 */
exports.resolveProjectWhere = (projectIdParam) => {
  const asNumber = Number(projectIdParam);
  if (Number.isInteger(asNumber) && String(asNumber) === String(projectIdParam)) {
    return { id: asNumber };
  }
  return { project_id: projectIdParam };
};