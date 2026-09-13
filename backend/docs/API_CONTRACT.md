# SIH 26017 — Land Acquisition Delay Prediction System
## Backend API Contract & Specification Reference

> **Module**: Access, Platform & Presentation Layer  
> **Protocol**: REST over HTTPS / JSON  
> **Base URL**: `/api/v1`  
> **Authentication**: `Authorization: Bearer <token>`  
> **API Version**: `v1.0.0`

---

## Table of Contents

1. [Architectural Overview & Global Conventions](#1-architectural-overview--global-conventions)
2. [Standard Response Envelope](#2-standard-response-envelope)
3. [Pagination Specification](#3-pagination-specification)
4. [Frozen Enums Reference](#4-frozen-enums-reference)
5. [Authentication Module (`/auth`)](#5-authentication-module-auth)
   - [POST /auth/login](#post-authlogin)
   - [POST /auth/logout](#post-authlogout)
   - [GET /auth/me](#get-authme)
6. [Dashboard Module (`/dashboard`)](#6-dashboard-module-dashboard)
   - [GET /dashboard/project-manager](#get-dashboardproject-manager)
   - [GET /dashboard/admin](#get-dashboardadmin)
7. [Analytics Module (`/analytics`)](#7-analytics-module-analytics)
   - [GET /analytics/risk-distribution](#get-analyticsrisk-distribution)
   - [GET /analytics/state-risk](#get-analyticsstate-risk-stubbed) *(STUBBED)*
   - [GET /analytics/district-risk](#get-analyticsdistrict-risk-stubbed) *(STUBBED)*
   - [GET /analytics/progress](#get-analyticsprogress)
   - [GET /analytics/risk-trend](#get-analyticsrisk-trend)
8. [Map & Geospatial Module (`/projects/map`)](#8-map--geospatial-module-projectsmap)
   - [GET /projects/map](#get-projectsmap)
9. [Alerts & Notifications Module (`/alerts`)](#9-alerts--notifications-module-alerts)
   - [GET /alerts](#get-alerts)
   - [PATCH /alerts/:alertId/read](#patch-alertsalertidread)
   - [PATCH /alerts/read-all](#patch-alertsread-all)
10. [Recommendations Interface (`/recommendations`)](#10-recommendations-interface-recommendations)
    - [GET /projects/:projectId/recommendations](#get-projectsprojectidrecommendations)
    - [PATCH /recommendations/:recommendationId](#patch-recommendationsrecommendationid)
11. [CSV Import Module (`/imports`)](#11-csv-import-module-imports)
    - [POST /imports/projects](#post-importsprojects)
    - [GET /imports](#get-imports)
12. [User Management Module (`/users`)](#12-user-management-module-users)
    - [GET /users](#get-users)
    - [POST /users](#post-users)
    - [PATCH /users/:userId](#patch-usersuserid)
    - [DELETE /users/:userId](#delete-usersuserid)
13. [Audit Logging Module (`/audit-logs`)](#13-audit-logging-module-audit-logs)
    - [GET /audit-logs](#get-audit-logs)
14. [Schema Flags for Teammate](#14-schema-flags-for-teammate)

---

## 1. Architectural Overview & Global Conventions

### 1.1 Base URL & Protocol
All API endpoints are mounted under the base path `/api/v1`. All requests and responses must use UTF-8 encoded JSON payloads, with the exception of file uploads which use `multipart/form-data`.

### 1.2 Authentication Header
All protected endpoints require a signed JSON Web Token (JWT) transmitted via the standard HTTP `Authorization` header:

```http
Authorization: Bearer <token>
```

Requests omitting the token or supplying an invalid/expired token will receive an immediate `401 Unauthorized` response.

### 1.3 Role-Based Access Control (RBAC)
The platform defines two authorized roles:
- `ADMIN`: Global administrative authority. Manages users, imports datasets, reviews system audit logs, views all projects, and monitors system-wide analytics.
- `PROJECT_MANAGER`: Field and divisional officers. Scoped strictly to projects where `project_manager_id` matches their authenticated user ID.

Requests with valid credentials but insufficient role privileges will receive a `403 Forbidden` response.

### 1.4 State-Changing Audit Tracking
All write operations (`POST`, `PATCH`, `DELETE`) on users, recommendations, alerts, and dataset imports write an immutable entry to the `audit_logs` table detailing the actor, action type, affected resource ID, and JSON metadata.

---

## 2. Standard Response Envelope

All API endpoints strictly adhere to a consistent, predictable top-level response envelope. Clients can reliably branch on the boolean `success` property.

### 2.1 Success Response Envelope
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {}
}
```

### 2.2 Error Response Envelope
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

### 2.3 Paginated Response Envelope
```json
{
  "success": true,
  "message": "Records retrieved successfully",
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

## 3. Pagination Specification

All endpoints returning collections implement unified query-string pagination:

| Parameter | Type | Default | Constraint | Description |
| :--- | :--- | :--- | :--- | :--- |
| `page` | `integer` | `1` | `min: 1` | 1-indexed page number |
| `limit` | `integer` | `10` | `min: 1, max: 100` | Number of items per page |

The metadata block inside `data.pagination` provides:
- `page`: Current active page
- `limit`: Requested batch size
- `total`: Total matching records across the database
- `totalPages`: Calculated total pages (`Math.ceil(total / limit)`)

---

## 4. Frozen Enums Reference

Both frontend clients and backend services must strictly use the following enumerated string constants. Any deviation in casing or value will be rejected by request validation schemas:

### Roles
- `ADMIN`
- `PROJECT_MANAGER`

### Risk Levels
- `HIGH`
- `MEDIUM`
- `LOW`

### Alert Severity
- `HIGH`
- `MEDIUM`
- `LOW`

### Recommendation Status
- `PENDING`: Initial state upon AI prediction generation
- `ACCEPTED`: Project Manager or Admin has agreed to adopt the action
- `DISMISSED`: Officer decided against adopting the recommendation
- `COMPLETED`: Action item was executed and resolved on the ground

### Priority Levels
- `HIGH`
- `MEDIUM`
- `LOW`

### Project Types
- `HIGHWAY`
- `RAILWAY`
- `IRRIGATION`
- `POWER`
- `INDUSTRIAL`
- `OTHER`

---

## 5. Authentication Module (`/auth`)

### POST /auth/login

#### Description
Authenticates user credentials (email and password). On successful verification, generates and returns a signed JWT access token alongside the user profile.

#### Authentication
- **Required**: No
- **Role**: Public

#### Query Parameters
*None.*

#### Request Body
```json
{
  "email": "user@sih26017.gov.in",
  "password": "SecurePassword123!"
}
```

#### Success Response
**Status**: `200 OK`
```json
{
  "success": true,
  "message": "Authentication successful",
  "data": {
    "user": {
      "id": 1,
      "name": "Rajesh Sharma",
      "email": "user@sih26017.gov.in",
      "role": "PROJECT_MANAGER",
      "created_at": "2026-03-01T10:00:00.000Z",
      "updated_at": "2026-03-01T10:00:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sZSI6IlBST0pFQ1RfTUFOQUdFUiIsImlhdCI6MTczNjgwMDAwMCwiZXhwIjoxNzM2ODg2NDAwfQ.exampleSignature"
  }
}
```

#### Error Responses
| Status | Code | Description |
| :--- | :--- | :--- |
| `400 Bad Request` | `VALIDATION_ERROR` | Email is invalid or password field is missing |
| `401 Unauthorized` | `INVALID_CREDENTIALS` | User not found or incorrect password |
| `500 Internal Server Error` | `INTERNAL_SERVER_ERROR` | Unexpected database or encryption failure |

---

### POST /auth/logout

#### Description
Invalidates the current session. Records a logout event in the audit trail. Clients must discard the stored JWT bearer token.

#### Authentication
- **Required**: Yes (`Authorization: Bearer <token>`)
- **Role**: ADMIN, PROJECT_MANAGER (Both)

#### Query Parameters
*None.*

#### Request Body
*None.*

#### Success Response
**Status**: `200 OK`
```json
{
  "success": true,
  "message": "Logged out successfully",
  "data": {
    "loggedOut": true
  }
}
```

#### Error Responses
| Status | Code | Description |
| :--- | :--- | :--- |
| `401 Unauthorized` | `UNAUTHORIZED` | Token missing, malformed, or expired |
| `500 Internal Server Error` | `INTERNAL_SERVER_ERROR` | Server error during audit write |

---

### GET /auth/me

#### Description
Retrieves the user profile associated with the currently authenticated JWT token. Useful for initial frontend state hydration on page reload.

#### Authentication
- **Required**: Yes (`Authorization: Bearer <token>`)
- **Role**: ADMIN, PROJECT_MANAGER (Both)

#### Query Parameters
*None.*

#### Request Body
*None.*

#### Success Response
**Status**: `200 OK`
```json
{
  "success": true,
  "message": "User profile retrieved successfully",
  "data": {
    "id": 1,
    "name": "Rajesh Sharma",
    "email": "user@sih26017.gov.in",
    "role": "PROJECT_MANAGER",
    "created_at": "2026-03-01T10:00:00.000Z",
    "updated_at": "2026-03-01T10:00:00.000Z"
  }
}
```

#### Error Responses
| Status | Code | Description |
| :--- | :--- | :--- |
| `401 Unauthorized` | `UNAUTHORIZED` | Token missing or invalid |
| `404 Not Found` | `USER_NOT_FOUND` | User account referenced by token no longer exists |
| `500 Internal Server Error` | `INTERNAL_SERVER_ERROR` | Unexpected server error |

---

## 6. Dashboard Module (`/dashboard`)

### GET /dashboard/project-manager

#### Description
Retrieves aggregated metrics, high-risk items, active alerts, and projects requiring immediate intervention, strictly scoped to projects where `project_manager_id` equals the authenticated user's ID.

#### Authentication
- **Required**: Yes (`Authorization: Bearer <token>`)
- **Role**: `PROJECT_MANAGER`

#### Query Parameters
*None.*

#### Request Body
*None.*

#### Success Response
**Status**: `200 OK`
```json
{
  "success": true,
  "message": "Project Manager dashboard retrieved successfully",
  "data": {
    "summary": {
      "totalProjects": 12,
      "highRiskProjects": 3,
      "mediumRiskProjects": 5,
      "lowRiskProjects": 4,
      "averageRiskScore": 0.54,
      "activeAlertsCount": 6
    },
    "highRiskProjects": [
      {
        "id": 101,
        "projectId": "NHAI-OD-2026-01",
        "projectType": "HIGHWAY",
        "location": "Khordha - Cuttack Corridor",
        "riskScore": 0.82,
        "riskLevel": "HIGH",
        "delayProbability": 0.85,
        "delayDays": 120,
        "topRiskFactors": [
          "Delayed land compensation disbursement",
          "Pending Section 19 gazette notification"
        ],
        "pendingRecommendationsCount": 2
      }
    ],
    "riskDistribution": {
      "HIGH": 3,
      "MEDIUM": 5,
      "LOW": 4
    },
    "recentAlerts": [
      {
        "id": 45,
        "projectId": "NHAI-OD-2026-01",
        "type": "LEGAL_DISPUTE_SURGE",
        "message": "3 new writ petitions filed in High Court challenging compensation",
        "severity": "HIGH",
        "isRead": false,
        "createdAt": "2026-09-12T08:30:00.000Z"
      }
    ],
    "attentionProjects": [
      {
        "id": 101,
        "projectId": "NHAI-OD-2026-01",
        "reason": "Risk score increased by 0.18 over previous snapshot",
        "urgency": "HIGH"
      }
    ]
  }
}
```

#### Error Responses
| Status | Code | Description |
| :--- | :--- | :--- |
| `401 Unauthorized` | `UNAUTHORIZED` | Missing or invalid bearer token |
| `403 Forbidden` | `FORBIDDEN` | Access denied; user does not have PROJECT_MANAGER role |
| `500 Internal Server Error` | `INTERNAL_SERVER_ERROR` | Database query failure |

---

### GET /dashboard/admin

#### Description
Provides an executive system-wide overview covering all infrastructure projects, nationwide risk distribution, stage-wise acquisition bottlenecks, and platform health indicators.

#### Authentication
- **Required**: Yes (`Authorization: Bearer <token>`)
- **Role**: `ADMIN`

#### Query Parameters
*None.*

#### Request Body
*None.*

#### Success Response
**Status**: `200 OK`
```json
{
  "success": true,
  "message": "Admin dashboard overview retrieved successfully",
  "data": {
    "summary": {
      "totalProjects": 148,
      "totalLandAreaHectares": 24500.5,
      "totalAffectedFamilies": 18450,
      "highRiskProjects": 28,
      "mediumRiskProjects": 54,
      "lowRiskProjects": 66,
      "criticalAlertsCount": 14,
      "totalProjectManagers": 32
    },
    "riskDistribution": {
      "HIGH": 28,
      "MEDIUM": 54,
      "LOW": 66
    },
    "stageRiskBreakdown": [
      { "stage": "NOTIFICATION", "averageRisk": 0.32, "affectedProjects": 18 },
      { "stage": "APPROVAL", "averageRisk": 0.45, "affectedProjects": 24 },
      { "stage": "LAND_ACQUISITION", "averageRisk": 0.72, "affectedProjects": 42 },
      { "stage": "COMPENSATION", "averageRisk": 0.68, "affectedProjects": 35 },
      { "stage": "REHABILITATION", "averageRisk": 0.58, "affectedProjects": 19 },
      { "stage": "POSSESSION", "averageRisk": 0.61, "affectedProjects": 10 }
    ],
    "recentAlerts": [
      {
        "id": 89,
        "projectId": "ECR-RL-2026-04",
        "type": "COMPENSATION_DISPUTE",
        "message": "Gram Sabha resolution opposed compensation rate",
        "severity": "HIGH",
        "isRead": false,
        "createdAt": "2026-09-13T14:10:00.000Z"
      }
    ],
    "systemHealth": {
      "activeImportsToday": 3,
      "unresolvedAlerts": 42,
      "lastModelPredictionSync": "2026-09-13T16:00:00.000Z"
    }
  }
}
```

#### Error Responses
| Status | Code | Description |
| :--- | :--- | :--- |
| `401 Unauthorized` | `UNAUTHORIZED` | Token missing or invalid |
| `403 Forbidden` | `FORBIDDEN` | Access denied; user does not have ADMIN role |
| `500 Internal Server Error` | `INTERNAL_SERVER_ERROR` | Server aggregation error |

---

## 7. Analytics Module (`/analytics`)

### GET /analytics/risk-distribution

#### Description
Returns project counts grouped by risk level (`HIGH`, `MEDIUM`, `LOW`) across the entire portfolio or broken down by project sector type.

#### Authentication
- **Required**: Yes (`Authorization: Bearer <token>`)
- **Role**: ADMIN, PROJECT_MANAGER (Both)

#### Query Parameters
| Name | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `projectType` | `string` | No | Filter by project category (`HIGHWAY`, `RAILWAY`, `IRRIGATION`, `POWER`, `INDUSTRIAL`, `OTHER`) |

#### Request Body
*None.*

#### Success Response
**Status**: `200 OK`
```json
{
  "success": true,
  "message": "Risk distribution retrieved successfully",
  "data": {
    "overall": {
      "HIGH": 28,
      "MEDIUM": 54,
      "LOW": 66,
      "total": 148
    },
    "byProjectType": [
      {
        "projectType": "HIGHWAY",
        "counts": { "HIGH": 12, "MEDIUM": 20, "LOW": 25 },
        "total": 57
      },
      {
        "projectType": "RAILWAY",
        "counts": { "HIGH": 8, "MEDIUM": 16, "LOW": 18 },
        "total": 42
      },
      {
        "projectType": "IRRIGATION",
        "counts": { "HIGH": 5, "MEDIUM": 10, "LOW": 12 },
        "total": 27
      }
    ]
  }
}
```

#### Error Responses
| Status | Code | Description |
| :--- | :--- | :--- |
| `400 Bad Request` | `VALIDATION_ERROR` | Invalid `projectType` query parameter |
| `401 Unauthorized` | `UNAUTHORIZED` | Token missing or invalid |
| `500 Internal Server Error` | `INTERNAL_SERVER_ERROR` | Database aggregation error |

---

### GET /analytics/state-risk [STUBBED]

#### Description
> [!NOTE]
> **STUBBED ENDPOINT**: Pending addition of `state String?` column to the `projects` table in Prisma schema. Returns mock state aggregates until the migration is completed by the schema owner.

Provides geographic risk concentrations and average scores by Indian state.

#### Authentication
- **Required**: Yes (`Authorization: Bearer <token>`)
- **Role**: ADMIN, PROJECT_MANAGER (Both)

#### Query Parameters
*None.*

#### Request Body
*None.*

#### Success Response
**Status**: `200 OK`
```json
{
  "success": true,
  "message": "State risk analytics retrieved successfully (stubbed - awaiting schema migration)",
  "data": {
    "states": [
      {
        "state": "Odisha",
        "totalProjects": 34,
        "averageRiskScore": 0.62,
        "highRiskCount": 9,
        "mediumRiskCount": 14,
        "lowRiskCount": 11
      },
      {
        "state": "Maharashtra",
        "totalProjects": 42,
        "averageRiskScore": 0.58,
        "highRiskCount": 8,
        "mediumRiskCount": 18,
        "lowRiskCount": 16
      },
      {
        "state": "Andhra Pradesh",
        "totalProjects": 26,
        "averageRiskScore": 0.49,
        "highRiskCount": 4,
        "mediumRiskCount": 11,
        "lowRiskCount": 11
      }
    ]
  }
}
```

#### Error Responses
| Status | Code | Description |
| :--- | :--- | :--- |
| `401 Unauthorized` | `UNAUTHORIZED` | Token missing or invalid |
| `500 Internal Server Error` | `INTERNAL_SERVER_ERROR` | Unexpected server error |

---

### GET /analytics/district-risk [STUBBED]

#### Description
> [!NOTE]
> **STUBBED ENDPOINT**: Pending addition of `district String?` and `state String?` columns to the `projects` table in Prisma schema. Returns mock district figures for the requested state.

Provides district-level granularity for localized administrative action within a state.

#### Authentication
- **Required**: Yes (`Authorization: Bearer <token>`)
- **Role**: ADMIN, PROJECT_MANAGER (Both)

#### Query Parameters
| Name | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `state` | `string` | No | Target state name (default: `Odisha`) |

#### Request Body
*None.*

#### Success Response
**Status**: `200 OK`
```json
{
  "success": true,
  "message": "District risk analytics retrieved successfully (stubbed - awaiting schema migration)",
  "data": {
    "state": "Odisha",
    "districts": [
      {
        "district": "Khordha",
        "totalProjects": 12,
        "averageRiskScore": 0.68,
        "highRiskCount": 4,
        "mediumRiskCount": 5,
        "lowRiskCount": 3
      },
      {
        "district": "Cuttack",
        "totalProjects": 8,
        "averageRiskScore": 0.55,
        "highRiskCount": 2,
        "mediumRiskCount": 4,
        "lowRiskCount": 2
      },
      {
        "district": "Ganjam",
        "totalProjects": 7,
        "averageRiskScore": 0.44,
        "highRiskCount": 1,
        "mediumRiskCount": 3,
        "lowRiskCount": 3
      }
    ]
  }
}
```

#### Error Responses
| Status | Code | Description |
| :--- | :--- | :--- |
| `401 Unauthorized` | `UNAUTHORIZED` | Token missing or invalid |
| `500 Internal Server Error` | `INTERNAL_SERVER_ERROR` | Unexpected server error |

---

### GET /analytics/progress

#### Description
Correlates physical acquisition progress metrics (rehabilitation %, compensation disbursed, legal dispute volume) against predicted risk levels and delay days across projects. Returns a paginated dataset.

#### Authentication
- **Required**: Yes (`Authorization: Bearer <token>`)
- **Role**: ADMIN, PROJECT_MANAGER (Both)

#### Query Parameters
| Name | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `page` | `integer` | No | Page number (default: `1`) |
| `limit` | `integer` | No | Page size (default: `10`, max: `100`) |
| `projectType` | `string` | No | Project type filter (`HIGHWAY`, `RAILWAY`, etc.) |
| `riskLevel` | `string` | No | Risk level filter (`HIGH`, `MEDIUM`, `LOW`) |

#### Request Body
*None.*

#### Success Response
**Status**: `200 OK`
```json
{
  "success": true,
  "message": "Progress analytics retrieved successfully",
  "data": {
    "items": [
      {
        "projectId": "NHAI-OD-2026-01",
        "projectType": "HIGHWAY",
        "rehabilitationProgressPct": 42.5,
        "compensationStatus": "PARTIAL",
        "possessionStatus": "PARTIAL",
        "legalDisputesCount": 4,
        "approvalTimelineDays": 180,
        "riskScore": 0.82,
        "riskLevel": "HIGH",
        "delayStatus": "DELAYED",
        "delayDays": 120
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 148,
      "totalPages": 15
    }
  }
}
```

#### Error Responses
| Status | Code | Description |
| :--- | :--- | :--- |
| `400 Bad Request` | `VALIDATION_ERROR` | Invalid pagination or filter parameters |
| `401 Unauthorized` | `UNAUTHORIZED` | Token missing or invalid |
| `500 Internal Server Error` | `INTERNAL_SERVER_ERROR` | Database query failure |

---

### GET /analytics/risk-trend

#### Description
Returns longitudinal historical trends of portfolio risk scores, tracking count of high-risk project discoveries and risk mitigations over selectable monthly/weekly intervals.

#### Authentication
- **Required**: Yes (`Authorization: Bearer <token>`)
- **Role**: ADMIN, PROJECT_MANAGER (Both)

#### Query Parameters
| Name | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `interval` | `string` | No | Aggregation frequency (`month`, `week`; default: `month`) |
| `months` | `integer` | No | Number of past months to analyze (default: `6`) |

#### Request Body
*None.*

#### Success Response
**Status**: `200 OK`
```json
{
  "success": true,
  "message": "Risk trend analytics retrieved successfully",
  "data": {
    "timeline": [
      {
        "period": "2026-04",
        "averageRiskScore": 0.48,
        "highRiskCount": 18,
        "mediumRiskCount": 42,
        "lowRiskCount": 60,
        "newHighRiskDetected": 5,
        "resolvedRisks": 2
      },
      {
        "period": "2026-05",
        "averageRiskScore": 0.52,
        "highRiskCount": 22,
        "mediumRiskCount": 46,
        "lowRiskCount": 58,
        "newHighRiskDetected": 7,
        "resolvedRisks": 3
      },
      {
        "period": "2026-06",
        "averageRiskScore": 0.55,
        "highRiskCount": 25,
        "mediumRiskCount": 50,
        "lowRiskCount": 60,
        "newHighRiskDetected": 6,
        "resolvedRisks": 3
      }
    ]
  }
}
```

#### Error Responses
| Status | Code | Description |
| :--- | :--- | :--- |
| `400 Bad Request` | `VALIDATION_ERROR` | Invalid interval parameter |
| `401 Unauthorized` | `UNAUTHORIZED` | Token missing or invalid |
| `500 Internal Server Error` | `INTERNAL_SERVER_ERROR` | Trend calculation error |

---

## 8. Map & Geospatial Module (`/projects/map`)

### GET /projects/map

#### Description
Supplies geospatial marker coordinates (`latitude`, `longitude`, `altitude_m`), project identifiers, and current ML risk predictions for interactive GIS mapping (Leaflet / Mapbox). 

*Note: `state` and `district` query filters are accepted in the interface but currently stubbed in the SQL query until teammate introduces the matching columns in `projects`.*

#### Authentication
- **Required**: Yes (`Authorization: Bearer <token>`)
- **Role**: ADMIN, PROJECT_MANAGER (Both)

#### Query Parameters
| Name | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `riskLevel` | `string` | No | Filter by risk level (`HIGH`, `MEDIUM`, `LOW`) |
| `projectType` | `string` | No | Filter by project category (`HIGHWAY`, `RAILWAY`, etc.) |
| `state` | `string` | No | *(Stubbed)* Filter by state name (e.g. `Odisha`) |
| `district` | `string` | No | *(Stubbed)* Filter by district name (e.g. `Khordha`) |

#### Request Body
*None.*

#### Success Response
**Status**: `200 OK`
```json
{
  "success": true,
  "message": "Map markers retrieved successfully",
  "data": {
    "markers": [
      {
        "id": 101,
        "projectId": "NHAI-OD-2026-01",
        "projectType": "HIGHWAY",
        "location": "Khordha - Cuttack Corridor",
        "latitude": 20.2961,
        "longitude": 85.8245,
        "altitudeM": 45.0,
        "riskScore": 0.82,
        "riskLevel": "HIGH",
        "delayProbability": 0.85,
        "delayDays": 120,
        "manager": "Rajesh Sharma"
      }
    ],
    "totalCount": 1
  }
}
```

#### Error Responses
| Status | Code | Description |
| :--- | :--- | :--- |
| `400 Bad Request` | `VALIDATION_ERROR` | Invalid query filter value |
| `401 Unauthorized` | `UNAUTHORIZED` | Token missing or invalid |
| `500 Internal Server Error` | `INTERNAL_SERVER_ERROR` | Database query failure |

---

## 9. Alerts & Notifications Module (`/alerts`)

### GET /alerts

#### Description
Returns paginated system alerts. If requested by a `PROJECT_MANAGER`, the query automatically scopes to alerts on projects assigned to that PM (`projects.project_manager_id = req.user.id`). Administrators receive global system alerts.

#### Authentication
- **Required**: Yes (`Authorization: Bearer <token>`)
- **Role**: ADMIN, PROJECT_MANAGER (Both)

#### Query Parameters
| Name | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `page` | `integer` | No | Page number (default: `1`) |
| `limit` | `integer` | No | Page size (default: `10`, max: `100`) |
| `severity` | `string` | No | Filter by severity (`HIGH`, `MEDIUM`, `LOW`) |
| `isRead` | `boolean` | No | Filter by read state (`true` or `false`) |
| `projectId` | `string` | No | Filter by unique project ID |

#### Request Body
*None.*

#### Success Response
**Status**: `200 OK`
```json
{
  "success": true,
  "message": "Alerts retrieved successfully",
  "data": {
    "items": [
      {
        "id": 45,
        "projectId": "NHAI-OD-2026-01",
        "type": "LEGAL_DISPUTE_SURGE",
        "message": "3 new writ petitions filed in High Court challenging compensation",
        "severity": "HIGH",
        "isRead": false,
        "createdAt": "2026-09-12T08:30:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 45,
      "totalPages": 5
    }
  }
}
```

#### Error Responses
| Status | Code | Description |
| :--- | :--- | :--- |
| `400 Bad Request` | `VALIDATION_ERROR` | Invalid severity enum or invalid boolean |
| `401 Unauthorized` | `UNAUTHORIZED` | Token missing or invalid |
| `500 Internal Server Error` | `INTERNAL_SERVER_ERROR` | Query failure |

---

### PATCH /alerts/:alertId/read

#### Description
Marks a single alert as read (`is_read: true`). For `PROJECT_MANAGER` users, the endpoint verifies that the alert belongs to a project assigned to the PM before updating.

#### Authentication
- **Required**: Yes (`Authorization: Bearer <token>`)
- **Role**: ADMIN, PROJECT_MANAGER (Both)

#### URL Parameters
| Name | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `alertId` | `integer` | Yes | Numeric primary key ID of the alert |

#### Query Parameters
*None.*

#### Request Body
```json
{
  "isRead": true
}
```
*(Optional body. If omitted, `isRead` defaults to `true`)*

#### Success Response
**Status**: `200 OK`
```json
{
  "success": true,
  "message": "Alert marked as read",
  "data": {
    "id": 45,
    "isRead": true,
    "updatedAt": "2026-09-13T18:15:00.000Z"
  }
}
```

#### Error Responses
| Status | Code | Description |
| :--- | :--- | :--- |
| `400 Bad Request` | `VALIDATION_ERROR` | Invalid non-integer alert ID |
| `401 Unauthorized` | `UNAUTHORIZED` | Token missing or invalid |
| `403 Forbidden` | `FORBIDDEN` | Alert belongs to a project outside the PM's jurisdiction |
| `404 Not Found` | `ALERT_NOT_FOUND` | No alert exists with the specified ID |
| `500 Internal Server Error` | `INTERNAL_SERVER_ERROR` | Database write failure |

---

### PATCH /alerts/read-all

#### Description
Marks all matching unread alerts as read in bulk. For `PROJECT_MANAGER`, this updates only alerts belonging to the manager's assigned projects. For `ADMIN`, it updates all unread alerts across the platform.

#### Authentication
- **Required**: Yes (`Authorization: Bearer <token>`)
- **Role**: ADMIN, PROJECT_MANAGER (Both)

#### Query Parameters
*None.*

#### Request Body
*None.*

#### Success Response
**Status**: `200 OK`
```json
{
  "success": true,
  "message": "All matching alerts marked as read",
  "data": {
    "updatedCount": 8
  }
}
```

#### Error Responses
| Status | Code | Description |
| :--- | :--- | :--- |
| `401 Unauthorized` | `UNAUTHORIZED` | Token missing or invalid |
| `500 Internal Server Error` | `INTERNAL_SERVER_ERROR` | Bulk update transaction failed |

---

## 10. Recommendations Interface (`/recommendations`)

### GET /projects/:projectId/recommendations

#### Description
Retrieves actionable AI-generated mitigation recommendations for a specific project, ordered by priority (`HIGH` > `MEDIUM` > `LOW`).

#### Authentication
- **Required**: Yes (`Authorization: Bearer <token>`)
- **Role**: ADMIN, PROJECT_MANAGER (Both)

#### URL Parameters
| Name | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `projectId` | `string` or `integer` | Yes | Business project ID (e.g. `NHAI-OD-2026-01`) or primary key `id` |

#### Query Parameters
| Name | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `status` | `string` | No | Filter by recommendation status (`PENDING`, `ACCEPTED`, `DISMISSED`, `COMPLETED`) |
| `priority` | `string` | No | Filter by priority (`HIGH`, `MEDIUM`, `LOW`) |

#### Request Body
*None.*

#### Success Response
**Status**: `200 OK`
```json
{
  "success": true,
  "message": "Recommendations retrieved successfully",
  "data": {
    "projectId": "NHAI-OD-2026-01",
    "recommendations": [
      {
        "id": 12,
        "projectId": 101,
        "predictionId": 34,
        "recommendation": "Expedite special Lok Adalat bench for 4 pending ownership disputes in Tehsil office.",
        "priority": "HIGH",
        "status": "PENDING",
        "createdAt": "2026-09-10T11:00:00.000Z",
        "updatedAt": "2026-09-10T11:00:00.000Z"
      },
      {
        "id": 13,
        "projectId": 101,
        "predictionId": 34,
        "recommendation": "Coordinate inter-departmental forest clearance sign-off with DFO Khordha.",
        "priority": "MEDIUM",
        "status": "ACCEPTED",
        "createdAt": "2026-09-10T11:00:00.000Z",
        "updatedAt": "2026-09-12T14:30:00.000Z"
      }
    ]
  }
}
```

#### Error Responses
| Status | Code | Description |
| :--- | :--- | :--- |
| `400 Bad Request` | `VALIDATION_ERROR` | Invalid status or priority parameter |
| `401 Unauthorized` | `UNAUTHORIZED` | Token missing or invalid |
| `404 Not Found` | `PROJECT_NOT_FOUND` | Specified project does not exist |
| `500 Internal Server Error` | `INTERNAL_SERVER_ERROR` | Database query failure |

---

### PATCH /recommendations/:recommendationId

#### Description
Updates the decision state of an AI-generated recommendation. Automatically writes an audit log to track decision-making efficacy.

#### Authentication
- **Required**: Yes (`Authorization: Bearer <token>`)
- **Role**: ADMIN, PROJECT_MANAGER (Both)

#### URL Parameters
| Name | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `recommendationId` | `integer` | Yes | Primary key ID of the recommendation |

#### Query Parameters
*None.*

#### Request Body
```json
{
  "status": "ACCEPTED"
}
```

#### Success Response
**Status**: `200 OK`
```json
{
  "success": true,
  "message": "Recommendation status updated successfully",
  "data": {
    "id": 12,
    "projectId": 101,
    "status": "ACCEPTED",
    "updatedAt": "2026-09-13T19:00:00.000Z"
  }
}
```

#### Error Responses
| Status | Code | Description |
| :--- | :--- | :--- |
| `400 Bad Request` | `VALIDATION_ERROR` | Status must be one of `PENDING`, `ACCEPTED`, `DISMISSED`, `COMPLETED` |
| `401 Unauthorized` | `UNAUTHORIZED` | Token missing or invalid |
| `404 Not Found` | `RECOMMENDATION_NOT_FOUND` | Recommendation ID not found |
| `500 Internal Server Error` | `INTERNAL_SERVER_ERROR` | Database update failure |

---

## 11. CSV Import Module (`/imports`)

### POST /imports/projects

#### Description
Ingests a bulk project dataset CSV via `multipart/form-data`. Parses, validates each row, and performs an **idempotent upsert** keyed on the business identifier `project_id`. Creates an `import_history` log entry and writes to `audit_logs`.

#### Authentication
- **Required**: Yes (`Authorization: Bearer <token>`)
- **Role**: `ADMIN`

#### Headers
```http
Content-Type: multipart/form-data
```

#### Form Fields
| Name | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `file` | `binary / File` | Yes | CSV file containing validated project columns |

#### Expected CSV Header Columns
```csv
project_id,project_type,land_area_hectares,number_of_affected_families,compensation_status,approval_timeline_days,legal_disputes_count,possession_status,rehabilitation_progress_pct,stakeholder_responsiveness,historical_performance_score,administrator_id,manager,location,altitude_m,latitude,longitude,delay_status,delay_days,risk_score
```

#### Success Response
**Status**: `201 Created`
```json
{
  "success": true,
  "message": "Project data imported successfully",
  "data": {
    "importId": 8,
    "fileName": "odisha_highways_q3_2026.csv",
    "totalRows": 100,
    "successfulRows": 98,
    "failedRows": 2,
    "errors": [
      {
        "row": 14,
        "projectId": "INVALID-ID-001",
        "message": "Invalid latitude coordinate: 125.4 is out of geographical bounds"
      },
      {
        "row": 67,
        "projectId": "NHAI-OD-2026-99",
        "message": "Invalid project_type 'AIRPORT'. Must match frozen enums."
      }
    ]
  }
}
```

#### Error Responses
| Status | Code | Description |
| :--- | :--- | :--- |
| `400 Bad Request` | `VALIDATION_ERROR` | No file uploaded under field `file`, non-CSV mimetype, or corrupted header |
| `401 Unauthorized` | `UNAUTHORIZED` | Token missing or invalid |
| `403 Forbidden` | `FORBIDDEN` | Non-admin user attempted import |
| `500 Internal Server Error` | `IMPORT_FAILED` | Unhandled stream parsing or database batch error |

---

### GET /imports

#### Description
Retrieves a paginated list of all past CSV batch imports, including total processed, success/failure counts, error logs, and who executed the import.

#### Authentication
- **Required**: Yes (`Authorization: Bearer <token>`)
- **Role**: `ADMIN`

#### Query Parameters
| Name | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `page` | `integer` | No | Page number (default: `1`) |
| `limit` | `integer` | No | Page size (default: `10`, max: `100`) |

#### Request Body
*None.*

#### Success Response
**Status**: `200 OK`
```json
{
  "success": true,
  "message": "Import history retrieved successfully",
  "data": {
    "items": [
      {
        "id": 8,
        "fileName": "odisha_highways_q3_2026.csv",
        "totalRows": 100,
        "successfulRows": 98,
        "failedRows": 2,
        "errors": "[{\"row\":14,\"projectId\":\"INVALID-ID-001\",\"message\":\"Invalid latitude\"}]",
        "importedBy": 1,
        "createdAt": "2026-09-13T17:45:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 8,
      "totalPages": 1
    }
  }
}
```

#### Error Responses
| Status | Code | Description |
| :--- | :--- | :--- |
| `401 Unauthorized` | `UNAUTHORIZED` | Token missing or invalid |
| `403 Forbidden` | `FORBIDDEN` | Access restricted to ADMIN |
| `500 Internal Server Error` | `INTERNAL_SERVER_ERROR` | Query failure |

---

## 12. User Management Module (`/users`)

### GET /users

#### Description
Retrieves a paginated list of system accounts with role filters and keyword search on name and email. Sensitive `password_hash` strings are omitted.

#### Authentication
- **Required**: Yes (`Authorization: Bearer <token>`)
- **Role**: `ADMIN`

#### Query Parameters
| Name | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `page` | `integer` | No | Page number (default: `1`) |
| `limit` | `integer` | No | Page size (default: `10`, max: `100`) |
| `role` | `string` | No | Role filter (`ADMIN`, `PROJECT_MANAGER`) |
| `search` | `string` | No | Case-insensitive search on `name` and `email` |

#### Request Body
*None.*

#### Success Response
**Status**: `200 OK`
```json
{
  "success": true,
  "message": "Users retrieved successfully",
  "data": {
    "items": [
      {
        "id": 1,
        "name": "Super Admin",
        "email": "admin@sih26017.gov.in",
        "role": "ADMIN",
        "createdAt": "2026-01-15T09:00:00.000Z",
        "updatedAt": "2026-01-15T09:00:00.000Z"
      },
      {
        "id": 2,
        "name": "Rajesh Sharma",
        "email": "r.sharma@sih26017.gov.in",
        "role": "PROJECT_MANAGER",
        "createdAt": "2026-02-10T10:30:00.000Z",
        "updatedAt": "2026-02-10T10:30:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 32,
      "totalPages": 4
    }
  }
}
```

#### Error Responses
| Status | Code | Description |
| :--- | :--- | :--- |
| `401 Unauthorized` | `UNAUTHORIZED` | Token missing or invalid |
| `403 Forbidden` | `FORBIDDEN` | Access restricted to ADMIN |
| `500 Internal Server Error` | `INTERNAL_SERVER_ERROR` | Database query failure |

---

### POST /users

#### Description
Creates a new administrative or Project Manager user. Hashes the password using `bcryptjs` and records creation in `audit_logs`.

#### Authentication
- **Required**: Yes (`Authorization: Bearer <token>`)
- **Role**: `ADMIN`

#### Query Parameters
*None.*

#### Request Body
```json
{
  "name": "Priyanka Jena",
  "email": "p.jena@sih26017.gov.in",
  "password": "Password@2026!",
  "role": "PROJECT_MANAGER"
}
```

#### Success Response
**Status**: `201 Created`
```json
{
  "success": true,
  "message": "User created successfully",
  "data": {
    "id": 33,
    "name": "Priyanka Jena",
    "email": "p.jena@sih26017.gov.in",
    "role": "PROJECT_MANAGER",
    "createdAt": "2026-09-13T19:30:00.000Z",
    "updatedAt": "2026-09-13T19:30:00.000Z"
  }
}
```

#### Error Responses
| Status | Code | Description |
| :--- | :--- | :--- |
| `400 Bad Request` | `VALIDATION_ERROR` | Invalid email format, password under 8 characters, or unknown role |
| `401 Unauthorized` | `UNAUTHORIZED` | Token missing or invalid |
| `403 Forbidden` | `FORBIDDEN` | Access restricted to ADMIN |
| `409 Conflict` | `EMAIL_ALREADY_EXISTS` | An account with this email address already exists |
| `500 Internal Server Error` | `INTERNAL_SERVER_ERROR` | Database insertion error |

---

### PATCH /users/:userId

#### Description
Modifies a user's name, email, or role, or resets their password.

#### Authentication
- **Required**: Yes (`Authorization: Bearer <token>`)
- **Role**: `ADMIN`

#### URL Parameters
| Name | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `userId` | `integer` | Yes | Primary key ID of the user to modify |

#### Query Parameters
*None.*

#### Request Body
```json
{
  "name": "Priyanka Jena Mohanty",
  "role": "PROJECT_MANAGER"
}
```

#### Success Response
**Status**: `200 OK`
```json
{
  "success": true,
  "message": "User updated successfully",
  "data": {
    "id": 33,
    "name": "Priyanka Jena Mohanty",
    "email": "p.jena@sih26017.gov.in",
    "role": "PROJECT_MANAGER",
    "updatedAt": "2026-09-13T19:35:00.000Z"
  }
}
```

#### Error Responses
| Status | Code | Description |
| :--- | :--- | :--- |
| `400 Bad Request` | `VALIDATION_ERROR` | Invalid input or invalid role enum |
| `401 Unauthorized` | `UNAUTHORIZED` | Token missing or invalid |
| `403 Forbidden` | `FORBIDDEN` | Access restricted to ADMIN |
| `404 Not Found` | `USER_NOT_FOUND` | No user found with provided ID |
| `409 Conflict` | `EMAIL_ALREADY_EXISTS` | New email is already assigned to another account |
| `500 Internal Server Error` | `INTERNAL_SERVER_ERROR` | Database update failure |

---

### DELETE /users/:userId

#### Description
Permanently deletes a user account from the system. Prevents an administrator from deleting their own active session account.

#### Authentication
- **Required**: Yes (`Authorization: Bearer <token>`)
- **Role**: `ADMIN`

#### URL Parameters
| Name | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `userId` | `integer` | Yes | Primary key ID of the user to delete |

#### Query Parameters
*None.*

#### Request Body
*None.*

#### Success Response
**Status**: `200 OK`
```json
{
  "success": true,
  "message": "User deleted successfully",
  "data": {
    "deletedUserId": 33
  }
}
```

#### Error Responses
| Status | Code | Description |
| :--- | :--- | :--- |
| `400 Bad Request` | `CANNOT_DELETE_SELF` | Administrators cannot delete their own active account |
| `401 Unauthorized` | `UNAUTHORIZED` | Token missing or invalid |
| `403 Forbidden` | `FORBIDDEN` | Access restricted to ADMIN |
| `404 Not Found` | `USER_NOT_FOUND` | User ID does not exist |
| `500 Internal Server Error` | `INTERNAL_SERVER_ERROR` | Database deletion or cascade failure |

---

## 13. Audit Logging Module (`/audit-logs`)

### GET /audit-logs

#### Description
Provides an immutable security and operational audit trail for system events (user authentications, data imports, status updates, recommendation decisions). Supports filtering by actor, project, and action type.

#### Authentication
- **Required**: Yes (`Authorization: Bearer <token>`)
- **Role**: `ADMIN`

#### Query Parameters
| Name | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `page` | `integer` | No | Page number (default: `1`) |
| `limit` | `integer` | No | Page size (default: `10`, max: `100`) |
| `userId` | `integer` | No | Filter logs by actor's user ID |
| `projectId` | `string` or `integer` | No | Filter logs by associated project identifier |
| `action` | `string` | No | Filter by action name (e.g. `LOGIN`, `UPDATE_RECOMMENDATION`, `IMPORT_PROJECTS`) |

#### Request Body
*None.*

#### Success Response
**Status**: `200 OK`
```json
{
  "success": true,
  "message": "Audit logs retrieved successfully",
  "data": {
    "items": [
      {
        "id": 142,
        "userId": 1,
        "action": "IMPORT_PROJECTS",
        "projectId": null,
        "details": "{\"importId\":8,\"fileName\":\"odisha_highways_q3_2026.csv\",\"successfulRows\":98,\"failedRows\":2}",
        "createdAt": "2026-09-13T17:45:02.000Z",
        "user": {
          "id": 1,
          "name": "Super Admin",
          "email": "admin@sih26017.gov.in"
        }
      },
      {
        "id": 143,
        "userId": 2,
        "action": "UPDATE_RECOMMENDATION",
        "projectId": 101,
        "details": "{\"recommendationId\":12,\"previousStatus\":\"PENDING\",\"newStatus\":\"ACCEPTED\"}",
        "createdAt": "2026-09-13T19:00:00.000Z",
        "user": {
          "id": 2,
          "name": "Rajesh Sharma",
          "email": "r.sharma@sih26017.gov.in"
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 143,
      "totalPages": 15
    }
  }
}
```

#### Error Responses
| Status | Code | Description |
| :--- | :--- | :--- |
| `400 Bad Request` | `VALIDATION_ERROR` | Invalid integer parameter for `userId` or `page` |
| `401 Unauthorized` | `UNAUTHORIZED` | Token missing or invalid |
| `403 Forbidden` | `FORBIDDEN` | Access restricted to ADMIN |
| `500 Internal Server Error` | `INTERNAL_SERVER_ERROR` | Database query failure |

---

## 14. Schema Flags for Teammate

The following pending database migrations must be applied by the teammate who owns the Prisma schema (`prisma/schema.prisma`) to complete backend feature integration:

### 1. Dedicated `project_manager_id` Foreign Key on `projects`
- **Field**: `project_manager_id Int?`
- **Relation**: `@relation("ManagedProjects", fields: [project_manager_id], references: [id])`
- **Rationale**: Reusing `administrator_id` is unsafe as administrative sanctioning officers and application Project Managers serve different roles. Matching on free-form string `manager` is fragile and violates referential integrity. A dedicated, indexed foreign key ensures high-performance scoping on the PM Dashboard (`/dashboard/project-manager`), Alert Scoping (`/alerts/read-all`), and Project Filtering.

### 2. Geographic Dimension: `state` on `projects`
- **Field**: `state String?`
- **Rationale**: Required for state-level spatial aggregations in `GET /analytics/state-risk` and map boundary filtering (`GET /projects/map?state=...`). Currently stubbed in the backend service layer.

### 3. Geographic Dimension: `district` on `projects`
- **Field**: `district String?`
- **Rationale**: Required for district risk hotspot analytics in `GET /analytics/district-risk` and localized filtering (`GET /projects/map?district=...`). Currently stubbed in the backend service layer.

### 4. Direct `user_id` FK on `alerts` (Recommended)
- **Field**: `user_id Int?` referencing `users(id)`
- **Rationale**: Currently, alert scoping relies on joining through `projects.project_manager_id`. Adding an optional `user_id` directly onto `alerts` enables targeted per-user administrative notifications and per-user read/unread tracking without requiring every alert to be tied to a project.
