export const RISK_LEVELS = {
  HIGH: 'High',
  MEDIUM: 'Medium',
  LOW: 'Low',
}

export const PROJECT_STAGES = [
  'Notification',
  'Approval',
  'Land Acquisition',
  'Compensation',
  'Rehabilitation',
  'Possession',
]

export const PROJECT_TYPES = {
  ROAD: 'Road',
  RAIL: 'Rail',
  IRRIGATION: 'Irrigation',
  INDUSTRIAL: 'Industrial',
  URBAN: 'Urban Development',
}

// Field Update types for the Field Updates page (form + feed). Defined here
// with the other shared lists; the backend does not provide a list yet, so
// this is presentation metadata — not fabricated data.
export const FIELD_UPDATE_TYPES = [
  'Progress Update',
  'Compensation Status',
  'Land Acquisition Status',
  'Legal Issue',
  'Approval Status',
  'Rehabilitation Update',
  'Possession Update',
  'Documentation Issue',
  'Field Observation',
  'Other',
]

export const PRIORITY_LEVELS = {
  HIGH: 'High',
  MEDIUM: 'Medium',
  LOW: 'Low',
}

export const ACTION_STATUS = {
  PENDING: 'Pending',
  IN_PROGRESS: 'In Progress',
  DONE: 'Done',
}

export const DISTRICT_NAME = 'Cuttack District'
export const STATE_NAME = 'Odisha'

export const NAV_ITEMS = [
  { key: 'dashboard', label: 'Dashboard', icon: 'LayoutDashboard', path: '/dashboard' },
  { key: 'my-projects', label: 'My Projects', icon: 'FolderKanban', path: '/projects' },
  { key: 'risk-analysis', label: 'Risk Analysis', icon: 'AlertTriangle', path: '/risk-analysis' },
  { key: 'field-updates', label: 'Field Updates', icon: 'ClipboardList', path: '/field-updates' },
  { key: 'recommendations', label: 'Recommendations', icon: 'Lightbulb', path: '/recommendations' },
  { key: 'alerts', label: 'Alerts', icon: 'Bell', path: '/alerts' },
  { key: 'reports', label: 'Reports', icon: 'FileBarChart', path: '/reports' },
  { key: 'messages', label: 'Messages', icon: 'MessageSquare', path: '/messages' },
  { key: 'profile', label: 'Profile', icon: 'User', path: '/profile' },
  { key: 'settings', label: 'Settings', icon: 'Settings', path: '/settings' },
]
