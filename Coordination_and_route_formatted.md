# Predictive Analytics System for Early Detection of Land Acquisition Delays

> **SIH 2026 — Problem Statement 26017**
>
> An AI-powered decision-support system for the early detection and prediction of land acquisition delays in infrastructure projects. The system monitors project progress, analyzes current project conditions, predicts delay risk, identifies contributing factors, and provides actionable recommendations to authorized officers.

## Table of Contents

1. [Project Objective](#1-project-objective)
2. [Data Source and Data Flow](#2-data-source-and-data-flow)
3. [Technology Architecture](#3-technology-architecture)
4. [Frontend Project Structure](#4-frontend-project-structure)
5. [Backend Project Structure](#5-backend-project-structure)
6. [Frontend Routes](#6-frontend-routes)
7. [Backend API Contract](#7-backend-api-contract)
8. [Frontend ↔ Backend Mapping](#8-frontend--backend-mapping)
9. [API Response Contract](#9-api-response-contract)
10. [Pagination Contract](#10-pagination-contract)
11. [Frozen Enums](#11-frozen-enums)
12. [Important API Query Parameters](#12-important-api-query-parameters)
13. [Authentication Contract](#13-authentication-contract)
14. [Role-Based Access](#14-role-based-access)
15. [CSV Import Flow](#15-csv-import-flow)
16. [Project Manager Status Update Flow](#16-project-manager-status-update-flow)
17. [ML Service Responsibility](#17-ml-service-responsibility)
18. [Project Details Data Flow](#18-project-details-data-flow)
19. [Dashboard Structure](#19-dashboard-structure)
20. [Git / Development Rules](#20-git--development-rules)

---

---

## 1. Project Objective
Land acquisition for infrastructure projects can be delayed because of:

- Administrative approvals
- Legal disputes
- Ownership conflicts
- Delayed compensation
- Incomplete documentation
- Rehabilitation and resettlement issues
- Inter-department coordination problems
- Delayed possession
- Low stakeholder responsiveness

The system aims to identify projects that are likely to experience delays before the delay becomes critical.

**Core Workflow**
Project Data
     ↓
Current Project Status
     ↓
Feature Preparation
     ↓
ML Prediction
     ↓
Risk Score
     ↓
Risk Factors
     ↓
Stage-wise Risk
     ↓
Recommendations
     ↓
Officer Action
     ↓
Status Update
     ↓
New Prediction

**Core Concept**
> **Core Principle:** Historical data teaches the model. Current data tells the model what is happening now.


---


The prototype uses an approved/prepared CSV import mechanism for project data.

**Data Flow**
Prepared / Approved CSV
        ↓
Admin Upload
        ↓
Backend Validation
        ↓
PostgreSQL
        ↓
Project Manager Updates Current Status
        ↓
ML Prediction

The system must not claim that it has live government API integration.


---


## 3. Technology Architecture
                    ┌──────────────────────┐
                    │      Frontend        │
                    │ React + Vite         │
                    │ React Router         │
                    │ Leaflet              │
                    │ Charts                │
                    └──────────┬───────────┘
                               │
                         REST API / JSON
                               │
                               ↓
                    ┌──────────────────────┐
                    │       Backend        │
                    │ Node.js + Express    │
                    │ Authentication       │
                    │ Validation           │
                    │ Business Logic       │
                    │ PostgreSQL           │
                    └──────────┬───────────┘
                               │
                         ML Prediction
                               │
                               ↓
                    ┌──────────────────────┐
                    │     ML Service       │
                    │      Python          │
                    │ Feature Processing   │
                    │ Prediction Model     │
                    └──────────────────────┘


---


## 4. Frontend Project Structure
```text
frontend/
│
├── public/
│   ├── assets/
│   │   ├── logo.svg
│   │   ├── emblem.svg
│   │   └── ...
│   ├── favicon.ico
│   └── manifest.json
│
├── src/
│   │
│   ├── assets/
│   │   ├── images/
│   │   ├── icons/
│   │   └── fonts/
│   │
│   ├── components/
│   │   ├── common/
│   │   │   ├── Button.jsx
│   │   │   ├── Input.jsx
│   │   │   ├── Select.jsx
│   │   │   ├── Modal.jsx
│   │   │   ├── Loader.jsx
│   │   │   ├── EmptyState.jsx
│   │   │   ├── ErrorState.jsx
│   │   │   ├── Pagination.jsx
│   │   │   ├── SearchBar.jsx
│   │   │   ├── FilterDropdown.jsx
│   │   │   ├── StatusBadge.jsx
│   │   │   ├── RiskBadge.jsx
│   │   │   ├── ProgressBar.jsx
│   │   │   └── ConfirmDialog.jsx
│   │   │
│   │   ├── layout/
│   │   │   ├── Sidebar.jsx
│   │   │   ├── Navbar.jsx
│   │   │   ├── DashboardLayout.jsx
│   │   │   └── PageHeader.jsx
│   │   │
│   │   ├── dashboard/
│   │   │   ├── SummaryCard.jsx
│   │   │   ├── ProjectTable.jsx
│   │   │   ├── RiskDistribution.jsx
│   │   │   ├── RiskTrendChart.jsx
│   │   │   ├── StateRiskChart.jsx
│   │   │   ├── DistrictRiskChart.jsx
│   │   │   ├── RecentAlerts.jsx
│   │   │   └── AttentionProjects.jsx
│   │   │
│   │   ├── projects/
│   │   │   ├── ProjectCard.jsx
│   │   │   ├── ProjectTable.jsx
│   │   │   ├── ProjectFilters.jsx
│   │   │   ├── ProjectProgress.jsx
│   │   │   ├── AcquisitionTimeline.jsx
│   │   │   ├── StageRisk.jsx
│   │   │   ├── RiskFactors.jsx
│   │   │   ├── Recommendations.jsx
│   │   │   ├── RiskHistory.jsx
│   │   │   └── UpdateStatusForm.jsx
│   │   │
│   │   ├── map/
│   │   │   ├── RiskMap.jsx
│   │   │   ├── MapMarker.jsx
│   │   │   └── MapPopup.jsx
│   │   │
│   │   ├── alerts/
│   │   │   ├── AlertList.jsx
│   │   │   ├── AlertCard.jsx
│   │   │   └── AlertFilters.jsx
│   │   │
│   │   ├── analytics/
│   │   │   ├── RiskAnalytics.jsx
│   │   │   ├── ProgressAnalytics.jsx
│   │   │   ├── StateAnalytics.jsx
│   │   │   ├── DistrictAnalytics.jsx
│   │   │   └── DelayAnalytics.jsx
│   │   │
│   │   ├── admin/
│   │   │   ├── DataImport.jsx
│   │   │   ├── ImportHistory.jsx
│   │   │   ├── UserTable.jsx
│   │   │   ├── UserForm.jsx
│   │   │   ├── ManagerAssignment.jsx
│   │   │   ├── AuditLogTable.jsx
│   │   │   └── AuditLogFilters.jsx
│   │   │
│   │   └── auth/
│   │       ├── LoginForm.jsx
│   │       └── ProtectedRoute.jsx
│   │
│   ├── pages/
│   │   ├── auth/
│   │   │   └── Login.jsx
│   │   │
│   │   ├── project-manager/
│   │   │   ├── ProjectManagerDashboard.jsx
│   │   │   ├── MyProjects.jsx
│   │   │   └── ProjectDetails.jsx
│   │   │
│   │   ├── admin/
│   │   │   ├── AdminDashboard.jsx
│   │   │   ├── AllProjects.jsx
│   │   │   ├── DataImport.jsx
│   │   │   ├── UserManagement.jsx
│   │   │   └── AuditLogs.jsx
│   │   │
│   │   ├── shared/
│   │   │   ├── RiskMapPage.jsx
│   │   │   ├── AlertsPage.jsx
│   │   │   ├── AnalyticsPage.jsx
│   │   │   └── Profile.jsx
│   │   │
│   │   ├── NotFound.jsx
│   │   └── Unauthorized.jsx
│   │
│   ├── api/
│   │   ├── axios.js
│   │   ├── auth.api.js
│   │   ├── projects.api.js
│   │   ├── status.api.js
│   │   ├── risk.api.js
│   │   ├── recommendations.api.js
│   │   ├── dashboard.api.js
│   │   ├── analytics.api.js
│   │   ├── map.api.js
│   │   ├── alerts.api.js
│   │   ├── imports.api.js
│   │   ├── users.api.js
│   │   └── audit.api.js
│   │
│   ├── context/
│   │   ├── AuthContext.jsx
│   │   └── NotificationContext.jsx
│   │
│   ├── hooks/
│   │   ├── useAuth.js
│   │   ├── useProjects.js
│   │   ├── useDashboard.js
│   │   ├── useRisk.js
│   │   ├── useAlerts.js
│   │   ├── useAnalytics.js
│   │   └── useDebounce.js
│   │
│   ├── routes/
│   │   ├── AppRoutes.jsx
│   │   ├── RoleRoute.jsx
│   │   └── routeConfig.js
│   │
│   ├── utils/
│   │   ├── constants.js
│   │   ├── formatters.js
│   │   ├── riskUtils.js
│   │   ├── dateUtils.js
│   │   └── validation.js
│   │
│   ├── styles/
│   │   ├── index.css
│   │   └── map.css
│   │
│   ├── App.jsx
│   └── main.jsx
│
├── .env
├── .env.example
├── .gitignore
├── eslint.config.js
├── index.html
├── package.json
├── package-lock.json
├── README.md
└── vite.config.js
```


---


## 5. Backend Project Structure
```text
backend/
│
├── src/
│   │
│   ├── config/
│   │   ├── env.js
│   │   ├── database.js
│   │   └── logger.js
│   │
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── dashboard.controller.js
│   │   ├── project.controller.js
│   │   ├── status.controller.js
│   │   ├── risk.controller.js
│   │   ├── recommendation.controller.js
│   │   ├── alert.controller.js
│   │   ├── analytics.controller.js
│   │   ├── map.controller.js
│   │   ├── import.controller.js
│   │   ├── user.controller.js
│   │   └── audit.controller.js
│   │
│   ├── services/
│   │   ├── auth.service.js
│   │   ├── project.service.js
│   │   ├── status.service.js
│   │   ├── risk.service.js
│   │   ├── recommendation.service.js
│   │   ├── alert.service.js
│   │   ├── analytics.service.js
│   │   ├── map.service.js
│   │   ├── import.service.js
│   │   ├── user.service.js
│   │   ├── audit.service.js
│   │   └── ml.service.js
│   │
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── dashboard.routes.js
│   │   ├── project.routes.js
│   │   ├── status.routes.js
│   │   ├── risk.routes.js
│   │   ├── recommendation.routes.js
│   │   ├── alert.routes.js
│   │   ├── analytics.routes.js
│   │   ├── map.routes.js
│   │   ├── import.routes.js
│   │   ├── user.routes.js
│   │   └── audit.routes.js
│   │
│   ├── models/
│   │   ├── User.js
│   │   ├── Project.js
│   │   ├── ProjectStatus.js
│   │   ├── RiskPrediction.js
│   │   ├── RiskFactor.js
│   │   ├── StageRisk.js
│   │   ├── Recommendation.js
│   │   ├── Alert.js
│   │   ├── AuditLog.js
│   │   └── ImportHistory.js
│   │
│   ├── validators/
│   │   ├── auth.validator.js
│   │   ├── project.validator.js
│   │   ├── status.validator.js
│   │   ├── risk.validator.js
│   │   ├── user.validator.js
│   │   └── import.validator.js
│   │
│   ├── middlewares/
│   │   ├── auth.middleware.js
│   │   ├── role.middleware.js
│   │   ├── error.middleware.js
│   │   ├── validation.middleware.js
│   │   ├── upload.middleware.js
│   │   ├── rateLimit.middleware.js
│   │   └── audit.middleware.js
│   │
│   ├── utils/
│   │   ├── jwt.js
│   │   ├── password.js
│   │   ├── csvParser.js
│   │   ├── pagination.js
│   │   ├── response.js
│   │   ├── riskUtils.js
│   │   ├── dateUtils.js
│   │   └── constants.js
│   │
│   ├── jobs/
│   │   ├── prediction.job.js
│   │   ├── alert.job.js
│   │   └── cleanup.job.js
│   │
│   ├── queues/
│   │   ├── prediction.queue.js
│   │   └── alert.queue.js
│   │
│   ├── ml/
│   │   ├── featureBuilder.js
│   │   ├── predictionClient.js
│   │   └── riskMapper.js
│   │
│   ├── integrations/
│   │   └── notifications/
│   │       ├── email.service.js
│   │       └── sms.service.js
│   │
│   ├── app.js
│   └── server.js
│
├── prisma/
│   ├── schema.prisma
│   └── seed.js
│
├── ml-service/
│   ├── app.py
│   ├── requirements.txt
│   ├── model/
│   │   ├── train.py
│   │   ├── predict.py
│   │   └── preprocessing.py
│   └── utils/
│       └── feature_schema.py
│
├── uploads/
│   └── .gitkeep
│
├── tests/
│   ├── auth.test.js
│   ├── project.test.js
│   ├── status.test.js
│   ├── risk.test.js
│   ├── import.test.js
│   └── dashboard.test.js
│
├── .env
├── .env.example
├── .gitignore
├── Dockerfile
├── docker-compose.yml
├── package.json
├── package-lock.json
└── README.md
```


---


## 6. Frontend Routes
These are browser routes, not API routes.

**PUBLIC**
========================================

GET     /
`GET /login`
**PROJECT MANAGER**
========================================

`GET /pm/dashboard`
`GET /pm/projects`
`GET /pm/projects/:projectId`
`GET /pm/risk-map`
`GET /pm/alerts`
`GET /pm/analytics`
`GET /pm/profile`
**ADMIN**
========================================

`GET /admin/dashboard`
`GET /admin/projects`
`GET /admin/projects/:projectId`
`GET /admin/risk-map`
`GET /admin/alerts`
`GET /admin/analytics`
`GET /admin/import`
`GET /admin/users`
`GET /admin/audit-logs`
`GET /admin/profile`
**ERROR**
========================================

`GET /unauthorized`
GET     *


---


## 7. Backend API Contract
**Base URL**
`/api/v1`

**Example:**
http://localhost:5000`/api/v1`


---


**AUTH**
`POST `/api/v1`/auth/login`
`POST `/api/v1`/auth/logout`
`GET `/api/v1`/auth/me`

---


**PROJECTS**
`GET `/api/v1`/projects`
`POST `/api/v1`/projects`
`GET `/api/v1`/projects/:projectId`
`PATCH `/api/v1`/projects/:projectId`
`DELETE `/api/v1`/projects/:projectId`
`PATCH `/api/v1`/projects/:projectId/assign-manager`

---


**PROJECT STATUS**
`GET `/api/v1`/projects/:projectId/status`
`PATCH `/api/v1`/projects/:projectId/status`

---


**RISK**
`GET `/api/v1`/projects/:projectId/risk`
`GET `/api/v1`/projects/:projectId/risk/history`
`GET `/api/v1`/projects/:projectId/risk/stages`
`GET `/api/v1`/projects/:projectId/risk/factors`

---


**RECOMMENDATIONS**
`GET `/api/v1`/projects/:projectId/recommendations`
`PATCH `/api/v1`/recommendations/:recommendationId`

---


**DASHBOARDS**
`GET `/api/v1`/dashboard/project-manager`
`GET `/api/v1`/dashboard/admin`

---


**ANALYTICS**
`GET `/api/v1`/analytics/risk-distribution`
`GET `/api/v1`/analytics/state-risk`
`GET `/api/v1`/analytics/district-risk`
`GET `/api/v1`/analytics/progress`
`GET `/api/v1`/analytics/risk-trend`

---


**MAP**
`GET `/api/v1`/projects/map`

---


**ALERTS**
`GET `/api/v1`/alerts`
`PATCH `/api/v1`/alerts/:alertId/read`
`PATCH `/api/v1`/alerts/read-all`

---


**DATA IMPORT**
`POST `/api/v1`/imports/projects`
`GET `/api/v1`/imports`

---


**USERS**
`GET `/api/v1`/users`
`POST `/api/v1`/users`
`PATCH `/api/v1`/users/:userId`
`DELETE `/api/v1`/users/:userId`

---


**AUDIT LOGS**
`GET `/api/v1`/audit-logs`

---


**SYSTEM**
`GET `/api/v1`/health`

---


## 8. Frontend ↔ Backend Mapping
FRONTEND PAGE
                        BACKEND API
==============================================================

/login
    ↓
`POST `/api/v1`/auth/login`
/pm/dashboard
    ↓
`GET `/api/v1`/dashboard/project-manager`
/pm/projects
    ↓
`GET `/api/v1`/projects`
/pm/projects/:projectId
    ↓
`GET `/api/v1`/projects/:projectId`
`GET `/api/v1`/projects/:projectId/status`
`GET `/api/v1`/projects/:projectId/risk`
`GET `/api/v1`/projects/:projectId/risk/history`
`GET `/api/v1`/projects/:projectId/risk/stages`
`GET `/api/v1`/projects/:projectId/risk/factors`
`GET `/api/v1`/projects/:projectId/recommendations`
/pm/risk-map
    ↓
`GET `/api/v1`/projects/map`
/pm/alerts
    ↓
`GET `/api/v1`/alerts`
`PATCH `/api/v1`/alerts/:alertId/read`
`PATCH `/api/v1`/alerts/read-all`
/pm/analytics
    ↓
`GET `/api/v1`/analytics/risk-distribution`
`GET `/api/v1`/analytics/progress`
`GET `/api/v1`/analytics/risk-trend`
/admin/dashboard
    ↓
`GET `/api/v1`/dashboard/admin`
/admin/projects
    ↓
`GET `/api/v1`/projects`
/admin/projects/:projectId
    ↓
`GET `/api/v1`/projects/:projectId`
`GET `/api/v1`/projects/:projectId/risk`
`GET `/api/v1`/projects/:projectId/risk/history`
`GET `/api/v1`/projects/:projectId/risk/stages`
`GET `/api/v1`/projects/:projectId/risk/factors`
`GET `/api/v1`/projects/:projectId/recommendations`
/admin/risk-map
    ↓
`GET `/api/v1`/projects/map`
/admin/alerts
    ↓
`GET `/api/v1`/alerts`
/admin/analytics
    ↓
`GET `/api/v1`/analytics/risk-distribution`
`GET `/api/v1`/analytics/state-risk`
`GET `/api/v1`/analytics/district-risk`
`GET `/api/v1`/analytics/progress`
`GET `/api/v1`/analytics/risk-trend`
/admin/import
    ↓
`POST `/api/v1`/imports/projects`
`GET `/api/v1`/imports`
/admin/users
    ↓
`GET `/api/v1`/users`
`POST `/api/v1`/users`
`PATCH `/api/v1`/users/:userId`
`DELETE `/api/v1`/users/:userId`
/admin/audit-logs
    ↓
`GET `/api/v1`/audit-logs`

---


## 9. API Response Contract
All successful API responses should follow this structure:

```json
{
  "success": true,
  "message": "Operation successful",
  "data": {}
}
```

All error responses should follow this structure:

```json
{
  "success": false,
  "message": "Project not found",
  "error": {
    "code": "PROJECT_NOT_FOUND",
    "details": null
  }
}
```

The frontend must not depend on different response formats for different endpoints.


---


## 10. Pagination Contract
Paginated endpoints should use:

?page=1&limit=10

Response:

```json
{
  "success": true,
  "data": {
    "items": [],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 100,
      "totalPages": 10
    }
  }
}
```


---


## 11. Frozen Enums
Both frontend and backend must use the exact same enum values.

**Roles**
**ADMIN**
**PROJECT_MANAGER**
**Risk Levels**
HIGH
MEDIUM
LOW

**Project Types**
HIGHWAY
RAILWAY
IRRIGATION
POWER
INDUSTRIAL
OTHER

**Stakeholder Responsiveness**
HIGH
MEDIUM
LOW

**Recommendation Status**
PENDING
IN_PROGRESS
COMPLETED
DISMISSED

**Priority**
HIGH
MEDIUM
LOW

**Alert Severity**
HIGH
MEDIUM
LOW

**Project Stages**
NOTIFICATION
APPROVAL
LAND_ACQUISITION
COMPENSATION
REHABILITATION
POSSESSION


---

## 12. Important API Query Parameters
**Projects**
?page=1
&limit=10
&search=highway
&state=Odisha
&district=Khordha
&projectType=HIGHWAY
&riskLevel=HIGH
&managerId=usr_002
&sortBy=riskScore
&sortOrder=desc

All filters are optional.

**Alerts**
?page=1
&limit=20
&severity=HIGH
&isRead=false

**Users**
?page=1
&limit=10
&role=PROJECT_MANAGER
&search=manager

**Audit Logs**
?page=1
&limit=20
&userId=usr_001
&action=UPDATE_STATUS
&projectId=proj_001

**District Analytics**
?state=Odisha

Map

?riskLevel=HIGH
&state=Odisha
&district=Khordha


---


## 13. Authentication Contract
The frontend sends the access token using:

`Authorization: Bearer <accessToken>`

The frontend should not make assumptions about how the backend internally verifies the token.

**Authentication responsibilities:**
**Frontend**
    ↓
Store/use access token
    ↓
Send Authorization header
    ↓
**Backend**
    ↓
Verify token
    ↓
Identify user
    ↓
Check role
    ↓
Allow / reject request


---


## 14. Role-Based Access
**ADMIN**
Admin can:

View all projects
Create projects
Update projects
Delete projects
Assign project managers
View all risks
View analytics
View risk map
View alerts
Import CSV data
Manage users
View audit logs

**PROJECT_MANAGER**
Project Manager can:

View assigned projects
View project details
Update current project status
View risk
View risk history
View stage-wise risk
View risk factors
View recommendations
Update recommendation status
View risk map
View alerts
View analytics relevant to assigned projects


---


## 15. CSV Import Flow
The current prototype does not use live government APIs.

Admin
  ↓
Select CSV file
  ↓
`POST `/api/v1`/imports/projects`
  ↓
Backend receives multipart/form-data
  ↓
Parse CSV
  ↓
Validate every row
  ↓
Check duplicate projectId
  ↓
Insert / update project data
  ↓
Store import history
  ↓
Return import summary

**Expected import response:**
```json
{
  "success": true,
  "message": "Project data imported successfully",
  "data": {
    "importId": "imp_001",
    "totalRows": 100,
    "successfulRows": 96,
    "failedRows": 4,
    "errors": []
  }
}
```


---


## 16. Project Manager Status Update Flow
Project Manager
      ↓
Open Project Details
      ↓
View current project data
      ↓
Update current status
      ↓
`PATCH `/api/v1`/projects/:projectId/status`
      ↓
Backend validates data
      ↓
Save status
      ↓
Build ML features
      ↓
Call ML service
      ↓
Receive prediction
      ↓
Store prediction
      ↓
Generate risk factors
      ↓
Generate recommendations
      ↓
Generate alerts if required
      ↓
Return updated risk


---


## 17. ML Service Responsibility
The backend is responsible for:

Receiving project data
Validating project data
Preparing ML features
Calling ML service
Storing predictions
Serving predictions to frontend

The ML service is responsible for:

Feature preprocessing
Model inference
Risk prediction
Stage-level prediction where supported

The frontend must not directly call the ML service.

**CORRECT:**
**Frontend**
   ↓
Backend API
   ↓
ML Service

**WRONG:**
**Frontend**
   ↓
ML Service


---


## 18. Project Details Data Flow
The Project Details screen follows:

PROJECT
   ↓
CURRENT STATUS
   ↓
OVERALL RISK
   ↓
STAGE RISKS
   ↓
RISK FACTORS
   ↓
**RECOMMENDATIONS**
   ↓
RISK HISTORY

The main system story is:

«Project → Current Status → Risk → Reason → Recommendation → Officer Action → Updated Risk»


---


## 19. Dashboard Structure
The system has two main dashboards.

**Project Manager Dashboard**
**Purpose:**
«Which of my projects are at risk, why are they at risk, and what should I do?»

**Main sections:**
Summary Cards
My Projects
High-Risk Projects
Risk Distribution
Recent Alerts
Projects Requiring Attention


---


**Admin / Senior Officer Dashboard**
**Purpose:**
«What is happening across all projects, where are the major risks, and which projects need attention?»

**Main sections:**
Overall Summary
All Projects
Risk Distribution
State-wise Risk
District-wise Risk
Progress Analytics
Risk Trends
Risk Map
Recent Alerts


---


## 20. Git / Development Rules
Never commit secrets

Do not commit:
.env
API keys
Passwords
Database credentials
JWT secrets
Cloud credentials
Private tokens

Commit:

.env.example

**Example:**
DATABASE_URL=
JWT_SECRET=
ML_SERVICE_URL=
VITE_API_BASE_URL=
