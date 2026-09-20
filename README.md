# Land Acquisition Delay Prediction System (Odisha)

An intelligent prediction and monitoring platform for government infrastructure projects (Roads, Irrigation, Railways) across Odisha. It leverages ML (SHAP-explained models) to identify delay risks and provide actionable insights for Project Managers and State Officials.

## Architecture

| Service | Stack | Local port |
|---|---|---|
| Frontend | React + Vite (React Router, Leaflet, Charts) | `5173` |
| Backend | Node.js + Express + Prisma | `5000` |
| ML Service | FastAPI (scikit-learn, SHAP, pandas) | `8000` |
| Database | PostgreSQL | `5432` (`5433` under Docker) |

The backend calls the ML service over HTTP, authenticated with the shared `X_INTERNAL_TOKEN` header.

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
| `stages_events:write` | Yes | No | Yes (in scope) | Yes (in scope) |

*(Note: `csv_import` batch functionality is strictly reserved for ADMIN global scope via `projects:write`.)*

## Environment Variables

| Variable | Used by | Purpose |
|---|---|---|
| `DATABASE_URL` | Backend | PostgreSQL connection string |
| `JWT_SECRET` | Backend | Signs auth tokens |
| `X_INTERNAL_TOKEN` | Backend, ML Service | Shared secret for backend → ML calls (must match in both) |
| `ML_SERVICE_URL` | Backend | Base URL of the ML service |
| `VITE_API_URL` | Frontend | Backend URL as seen from the browser (build-time) |

## Running with Docker (recommended)

Runs the database, ML service, backend and frontend with a single command.

### Prerequisites
- [Docker](https://docs.docker.com/get-docker/) 24+ with the Compose plugin (`docker compose version`)

### Quick start

1. **Create the environment file** (in the repository root, next to `docker-compose.yml`):
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and set strong values for `POSTGRES_PASSWORD`, `JWT_SECRET` and `X_INTERNAL_TOKEN`. Generate secrets with:
   ```bash
   openssl rand -hex 32
   ```

2. **Build and start everything:**
   ```bash
   docker compose up --build -d
   ```
   On start, the backend applies pending Prisma migrations automatically (`prisma migrate deploy`).

3. **Seed the database** (first run only):
   ```bash
   docker compose exec backend npx prisma db seed
   ```

4. **Open the app:**

   | What | URL |
   |---|---|
   | Frontend | http://localhost:5173 |
   | Backend API | http://localhost:5000 |
   | ML Service docs (Swagger) | http://localhost:8000/docs |

### Everyday commands

```bash
docker compose ps                       # status of all services
docker compose logs -f backend          # follow logs for one service
docker compose restart backend          # restart one service
docker compose up --build -d backend    # rebuild after code changes
docker compose exec backend npx prisma studio   # inspect data (Prisma Studio)
docker compose down                     # stop containers (data is kept)
docker compose down -v                  # stop AND delete the database volume
```

### Notes
- **Persistent data:** Postgres data lives in the named volume `pgdata`; it survives `docker compose down`, but not `down -v`.
- **Changing `VITE_API_URL`:** the value is baked into the frontend at build time, so rebuild with `docker compose up --build -d frontend`. If you deploy on a server, set it to the server's public backend URL, and make sure the backend's CORS settings allow the frontend origin.
- **Ports already in use:** change the left-hand side of the `ports:` mapping in `docker-compose.yml` (e.g. `"5174:80"`).
- **ML model:** the ML image expects the trained model artifacts (e.g. `model.pkl`) to be present in `ML_work/` at build time. Run the training pipeline first if they are not committed.

### Troubleshooting

| Symptom | Fix |
|---|---|
| `Set JWT_SECRET in .env` (or similar) on `up` | `.env` is missing or a required variable is empty |
| Backend restarts in a loop | `docker compose logs backend` — usually a bad `DATABASE_URL` or a failed migration |
| Backend gets `401`/`403` from ML service | `X_INTERNAL_TOKEN` differs between services; it is read from the same `.env`, so recreate with `docker compose up -d --force-recreate` |
| Frontend loads but API calls fail | Wrong `VITE_API_URL` at build time, or CORS not allowing `http://localhost:5173` |
| Need a completely clean slate | `docker compose down -v --rmi local` then `docker compose up --build -d` |

## Development Setup (without Docker)

Use this when you want hot-reload while developing. You need Node.js 20+, Python 3.11+ and a local PostgreSQL instance.

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
2. Install dependencies: `pip install -r requirements.txt`.
3. Export the shared token: `export X_INTERNAL_TOKEN="your_secure_token"` (must match the backend's value).
4. Start the prediction server: `uvicorn app:app --reload`.

## Testing

```bash
cd backend
npm test
```

E2E tests use `backend/.env.test`; the database name **must** end in `_test` so real data is never touched.