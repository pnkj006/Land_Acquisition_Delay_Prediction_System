# Land Acquisition Delay Prediction System (Odisha)

An intelligent prediction and monitoring platform for government infrastructure projects (Roads, Irrigation, Railways) across Odisha. It leverages ML (SHAP models) to identify delay risks and provide actionable insights for Project Managers and State Officials.

## Role-Based Access Control (RBAC V7)

The platform enforces strict functional access control using an explicit role matrix.

### Roles
- **ADMIN**: Super-user access. Manages users, roles, global assignments, and system config.
- **SENIOR_OFFICIAL**: Global read-only oversight across all projects and analytics.
- **PROJECT_MANAGER**: Write access restricted exclusively to assigned projects.
- **STAFF**: Basic read access restricted exclusively to assigned projects.

### Scope Matrix
| Resource/Action | ADMIN | SENIOR_OFFICIAL | PROJECT_MANAGER | STAFF |
|---|---|---|---|---|
| `users:*` | Yes | No | No | No |
| `projects:write` | Yes | No | Yes (in scope) | No |
| `projects:read` | Yes | Yes | Yes (in scope) | Yes (in scope) |
| `assignments:write` | Yes | No | Yes (in scope) | No |
| `stages_events:write`| Yes | No | Yes (in scope) | Yes (in scope)|

*(Note: `csv_import` batch functionality is strictly reserved for ADMIN global scope via `projects:write`.)*

## Development Setup

### Backend (Node.js/Express + Prisma + PostgreSQL)
1. Copy `backend/.env.example` to `backend/.env` and configure `DATABASE_URL`, `JWT_SECRET`, and `X_INTERNAL_TOKEN`.
2. Copy `backend/.env.test.example` to `backend/.env.test` for E2E testing (DB name must end in `_test`).
3. Run `npm install` inside `backend/`.
4. Run `npx prisma generate`.
5. Run `npx prisma migrate dev` and `npx prisma db seed`.
6. Start with `npm run dev`.

### Frontend (React + Vite)
1. Navigate to `frontend/`.
2. Run `npm install`.
3. Start with `npm run dev`.

### ML Service (FastAPI)
1. Navigate to `ML_work/`.
2. Export the shared token: `export X_INTERNAL_TOKEN="your_secure_token"`.
3. Start the prediction server: `uvicorn app:app --reload`.
