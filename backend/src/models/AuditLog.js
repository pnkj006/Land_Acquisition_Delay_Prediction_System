/**
 * @description Field reference constants for the `audit_logs` Prisma model.
 */
const AuditLogFields = {
  id: 'id',
  user_id: 'user_id',
  action: 'action',
  project_id: 'project_id',
  details: 'details',
  created_at: 'created_at'
};

const AuditActions = {
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT',
  CREATE_USER: 'CREATE_USER',
  UPDATE_USER: 'UPDATE_USER',
  DELETE_USER: 'DELETE_USER',
  MARK_ALERT_READ: 'MARK_ALERT_READ',
  MARK_ALL_ALERTS_READ: 'MARK_ALL_ALERTS_READ',
  IMPORT_PROJECTS: 'IMPORT_PROJECTS',
  UPDATE_RECOMMENDATION: 'UPDATE_RECOMMENDATION'
};

module.exports = { AuditLogFields, AuditActions };
