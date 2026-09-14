# Database Schema

This document describes the database schema for the project risk management system.

---

## 1. `users`

Stores user authentication, role, and account information.

| Column | Description |
|---|---|
| `id` | Primary key |
| `name` | User's name |
| `email` | Login email address |
| `password_hash` | Hashed user password |
| `role` | User role (`ADMIN` / `PM`) |
| `created_at` | Record creation timestamp |
| `updated_at` | Record last-updated timestamp |

---

## 2. `projects`

Stores core project information, characteristics, risk factors, and current status.

| Column | Description |
|---|---|
| `id` | Primary key |
| `project_id` | Unique project identifier |
| `project_type` | Type/category of the project |
| `land_area_hectares` | Total affected land area in hectares |
| `number_of_affected_families` | Number of families affected by the project |
| `compensation_status` | Current compensation status |
| `approval_timeline_days` | Expected or actual approval timeline in days |
| `legal_disputes_count` | Number of ongoing legal disputes |
| `possession_status` | Current land possession status |
| `rehabilitation_progress_pct` | Rehabilitation progress percentage |
| `stakeholder_responsiveness` | Stakeholder responsiveness level |
| `historical_performance_score` | Historical project performance score |
| `administrator_id` | ID of the assigned administrator |
| `manager` | Project manager |
| `location` | Project location |
| `altitude_m` | Project altitude in meters |
| `latitude` | Geographic latitude |
| `longitude` | Geographic longitude |
| `delay_status` | Project delay status (`DELAYED` / `ON_TIME`) |
| `delay_days` | Number of days the project is delayed |
| `risk_score` | Risk score from the dataset/model |
| `created_at` | Record creation timestamp |
| `updated_at` | Record last-updated timestamp |

---

## 3. `project_status_history`

Maintains historical snapshots of important project status and risk-related attributes.

| Column | Description |
|---|---|
| `id` | Primary key |
| `project_id` | Foreign key referencing `projects.id` |
| `compensation_status` | Compensation status at the time of recording |
| `approval_timeline_days` | Approval timeline at the time of recording |
| `legal_disputes_count` | Number of legal disputes at the time of recording |
| `possession_status` | Possession status at the time of recording |
| `rehabilitation_progress_pct` | Rehabilitation progress at the time of recording |
| `stakeholder_responsiveness` | Stakeholder responsiveness at the time of recording |
| `recorded_by` | Foreign key referencing `users.id` |
| `recorded_at` | Timestamp when the snapshot was recorded |

---

## 4. `risk_predictions`

Stores machine-learning-based risk predictions generated for projects.

| Column | Description |
|---|---|
| `id` | Primary key |
| `project_id` | Foreign key referencing `projects.id` |
| `risk_score` | Predicted project risk score |
| `risk_level` | Predicted risk level (`LOW` / `MEDIUM` / `HIGH`) |
| `delay_probability` | Probability of project delay |
| `model_version` | Version of the ML model used for prediction |
| `predicted_at` | Timestamp when the prediction was generated |

---

## 5. `stage_risks`

Stores risk scores for individual stages of the project acquisition process.

| Column | Description |
|---|---|
| `id` | Primary key |
| `prediction_id` | Foreign key referencing `risk_predictions.id` |
| `stage` | Project acquisition stage |
| `risk` | Risk score for the specific stage |

---

## 6. `recommendations`

Stores recommended actions generated from project risk predictions.

| Column | Description |
|---|---|
| `id` | Primary key |
| `project_id` | Foreign key referencing `projects.id` |
| `prediction_id` | Foreign key referencing `risk_predictions.id` |
| `recommendation` | Suggested action for mitigating project risk |
| `priority` | Recommendation priority (`HIGH` / `MEDIUM` / `LOW`) |
| `status` | Current status of the recommendation |
| `created_at` | Record creation timestamp |
| `updated_at` | Record last-updated timestamp |

---

## 7. `alerts`

Stores alerts generated for projects based on risk conditions, status changes, or other important events.

| Column | Description |
|---|---|
| `id` | Primary key |
| `project_id` | Foreign key referencing `projects.id` |
| `type` | Type of alert |
| `message` | Alert message |
| `severity` | Alert severity (`HIGH` / `MEDIUM` / `LOW`) |
| `is_read` | Indicates whether the alert has been read |
| `created_at` | Timestamp when the alert was created |

---

## 8. `audit_logs`

Maintains an audit trail of user actions performed within the system.

| Column | Description |
|---|---|
| `id` | Primary key |
| `user_id` | Foreign key referencing `users.id` |
| `action` | Action performed by the user |
| `project_id` | Related project ID, if applicable |
| `details` | Additional information about the action |
| `created_at` | Timestamp when the action was recorded |

---

## 9. `import_history`

Tracks CSV/data import operations performed in the system.

| Column | Description |
|---|---|
| `id` | Primary key |
| `file_name` | Name of the imported CSV file |
| `total_rows` | Total number of rows in the imported file |
| `successful_rows` | Number of successfully imported rows |
| `failed_rows` | Number of rows that failed during import |
| `errors` | Details of import errors |
| `imported_by` | Foreign key referencing `users.id` |
| `created_at` | Timestamp when the import was performed |

---

## Entity Relationships

```text
users
  │
  ├──< projects
  │       │
  │       ├──< project_status_history
  │       │
  │       ├──< risk_predictions
  │       │       │
  │       │       └──< stage_risks
  │       │
  │       ├──< recommendations
  │       │
  │       └──< alerts
  │
  ├──< audit_logs
  │
  └──< import_history
