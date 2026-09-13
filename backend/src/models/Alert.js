/**
 * @description Field reference constants for the `alerts` Prisma model.
 */
const AlertFields = {
  id: 'id',
  project_id: 'project_id',
  type: 'type',
  message: 'message',
  severity: 'severity',
  is_read: 'is_read',
  created_at: 'created_at'
};

const AlertSeverity = {
  HIGH: 'HIGH',
  MEDIUM: 'MEDIUM',
  LOW: 'LOW'
};

module.exports = { AlertFields, AlertSeverity };
