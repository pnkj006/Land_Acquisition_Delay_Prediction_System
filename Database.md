users
┌─────────────────────────────────────────┐
│                  users                  │
├──────────────────────┬──────────────────┤
│ id                   │ Primary Key      │
│ name                 │ User name        │
│ email                │ Login email      │
│ password_hash        │ Hashed password  │
│ role                 │ ADMIN / PM       │
│ created_at           │ Timestamp        │
│ updated_at           │ Timestamp        │
└──────────────────────┴──────────────────┘
. projects
┌──────────────────────────────────────────────┐
│                   projects                   │
├────────────────────────────┬─────────────────┤
│ id                         │ Primary Key     │
│ project_id                 │ Unique ID       │
│ project_type               │ Project type    │
│ land_area_hectares         │ Land area       │
│ number_of_affected_families│ Affected fam.   │
│ compensation_status        │ Compensation    │
│ approval_timeline_days     │ Approval days   │
│ legal_disputes_count       │ Legal disputes  │
│ possession_status          │ Possession      │
│ rehabilitation_progress_pct│ Rehabilitation  │
│ stakeholder_responsiveness  │ Responsiveness  │
│ historical_performance_score│ Historical     │
│ administrator_id           │ Administrator   │
│ manager                    │ Manager         │
│ location                   │ Location        │
│ altitude_m                 │ Altitude        │
│ latitude                   │ Latitude        │
│ longitude                  │ Longitude       │
│ delay_status               │ Delayed/On Time │
│ delay_days                 │ Delay duration  │
│ risk_score                 │ Dataset score   │
│ created_at                 │ Timestamp       │
│ updated_at                 │ Timestamp       │
└────────────────────────────┴─────────────────┘
project_status
┌──────────────────────────────────────────┐
│          project_status_history           │
├────────────────────────┬─────────────────┤
│ id                     │ Primary Key     │
│ project_id             │ Project FK      │
│ compensation_status    │ Snapshot        │
│ approval_timeline_days │ Snapshot        │
│ legal_disputes_count   │ Snapshot        │
│ possession_status      │ Snapshot        │
│ rehabilitation_progress_pct │ Snapshot  │
│ stakeholder_responsiveness │ Snapshot    │
│ recorded_by            │ User FK         │
│ recorded_at            │ Timestamp       │
└────────────────────────┴─────────────────┘
risk_predictions
┌─────────────────────────────────────────┐
│             risk_predictions             │
├──────────────────────┬──────────────────┤
│ id                   │ Primary Key      │
│ project_id           │ Project FK       │
│ risk_score           │ Predicted score  │
│ risk_level           │ LOW/MEDIUM/HIGH  │
│ delay_probability    │ Probability      │
│ model_version        │ ML model version │
│ predicted_at         │ Timestamp        │
└──────────────────────┴──────────────────┘
7. stage_risks
┌─────────────────────────────────────────┐
│                stage_risks               │
├──────────────────────┬──────────────────┤
│ id                   │ Primary Key      │
│ prediction_id        │ Prediction FK    │
│ stage                │ Acquisition stage│
│ risk                 │ Stage risk score │
└──────────────────────┴──────────────────┘
recommendation
┌─────────────────────────────────────────┐
│              recommendations             │
├──────────────────────┬──────────────────┤
│ id                   │ Primary Key      │
│ project_id           │ Project FK       │
│ prediction_id        │ Prediction FK    │
│ recommendation       │ Suggested action │
│ priority             │ HIGH/MEDIUM/LOW  │
│ status               │ Action status    │
│ created_at           │ Timestamp        │
│ updated_at           │ Timestamp        │
└──────────────────────┴──────────────────┘
alerts
┌─────────────────────────────────────────┐
│                  alerts                  │
├──────────────────────┬──────────────────┤
│ id                   │ Primary Key      │
│ project_id           │ Project FK       │
│ type                 │ Alert type       │
│ message              │ Alert message    │
│ severity             │ HIGH/MEDIUM/LOW  │
│ is_read              │ Read status      │
│ created_at            │ Timestamp        │
└──────────────────────┴──────────────────┘
audit_logs
┌─────────────────────────────────────────┐
│                audit_logs                │
├──────────────────────┬──────────────────┤
│ id                   │ Primary Key      │
│ user_id              │ User FK          │
│ action               │ Performed action │
│ project_id           │ Project FK       │
│ details              │ Additional data  │
│ created_at            │ Timestamp        │
└──────────────────────┴──────────────────┘
11. import_history
┌─────────────────────────────────────────┐
│              import_history              │
├──────────────────────┬──────────────────┤
│ id                   │ Primary Key      │
│ file_name             │ CSV filename     │
│ total_rows            │ Total records    │
│ successful_rows       │ Imported records │
│ failed_rows           │ Failed records   │
│ errors                │ Error details    │
│ imported_by           │ Admin/User FK    │
│ created_at            │ Timestamp        │
