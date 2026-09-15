-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'PROJECT_MANAGER');

-- CreateEnum
CREATE TYPE "RiskLevel" AS ENUM ('HIGH', 'MEDIUM', 'LOW');

-- CreateEnum
CREATE TYPE "StakeholderResponsiveness" AS ENUM ('HIGH', 'MEDIUM', 'LOW');

-- CreateEnum
CREATE TYPE "ProjectType" AS ENUM ('HIGHWAY', 'RAILWAY', 'IRRIGATION', 'POWER', 'INDUSTRIAL', 'OTHER');

-- CreateEnum
CREATE TYPE "DelayStatus" AS ENUM ('DELAYED', 'ON_TIME');

-- CreateEnum
CREATE TYPE "ProjectStage" AS ENUM ('NOTIFICATION', 'APPROVAL', 'LAND_ACQUISITION', 'COMPENSATION', 'REHABILITATION', 'POSSESSION');

-- CreateEnum
CREATE TYPE "RecommendationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DISMISSED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "Priority" AS ENUM ('HIGH', 'MEDIUM', 'LOW');

-- CreateEnum
CREATE TYPE "AlertSeverity" AS ENUM ('HIGH', 'MEDIUM', 'LOW');

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projects" (
    "id" SERIAL NOT NULL,
    "project_id" TEXT NOT NULL,
    "project_type" "ProjectType",
    "land_area_hectares" DOUBLE PRECISION,
    "number_of_affected_families" INTEGER,
    "compensation_status" TEXT,
    "approval_timeline_days" INTEGER,
    "legal_disputes_count" INTEGER DEFAULT 0,
    "possession_status" TEXT,
    "rehabilitation_progress_pct" DOUBLE PRECISION,
    "stakeholder_responsiveness" "StakeholderResponsiveness",
    "historical_performance_score" DOUBLE PRECISION,
    "administrator_id" INTEGER,
    "project_manager_id" INTEGER,
    "manager" TEXT,
    "location" TEXT,
    "state" TEXT,
    "district" TEXT,
    "altitude_m" DOUBLE PRECISION,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "delay_status" "DelayStatus",
    "delay_days" INTEGER,
    "risk_score" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_status_history" (
    "id" SERIAL NOT NULL,
    "project_id" INTEGER NOT NULL,
    "compensation_status" TEXT,
    "approval_timeline_days" INTEGER,
    "legal_disputes_count" INTEGER,
    "possession_status" TEXT,
    "rehabilitation_progress_pct" DOUBLE PRECISION,
    "stakeholder_responsiveness" "StakeholderResponsiveness",
    "recorded_by" INTEGER,
    "recorded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "project_status_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "risk_predictions" (
    "id" SERIAL NOT NULL,
    "project_id" INTEGER NOT NULL,
    "risk_score" DOUBLE PRECISION NOT NULL,
    "risk_level" "RiskLevel" NOT NULL,
    "delay_probability" DOUBLE PRECISION,
    "model_version" TEXT,
    "predicted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "risk_predictions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stage_risks" (
    "id" SERIAL NOT NULL,
    "prediction_id" INTEGER NOT NULL,
    "stage" "ProjectStage" NOT NULL,
    "risk" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "stage_risks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recommendations" (
    "id" SERIAL NOT NULL,
    "project_id" INTEGER NOT NULL,
    "prediction_id" INTEGER,
    "recommendation" TEXT NOT NULL,
    "priority" "Priority" NOT NULL,
    "status" "RecommendationStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "recommendations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alerts" (
    "id" SERIAL NOT NULL,
    "project_id" INTEGER NOT NULL,
    "user_id" INTEGER,
    "type" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "severity" "AlertSeverity" NOT NULL,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER,
    "action" TEXT NOT NULL,
    "project_id" INTEGER,
    "details" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "import_history" (
    "id" SERIAL NOT NULL,
    "file_name" TEXT NOT NULL,
    "total_rows" INTEGER NOT NULL,
    "successful_rows" INTEGER NOT NULL,
    "failed_rows" INTEGER NOT NULL,
    "errors" JSONB,
    "imported_by" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "import_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "projects_project_id_key" ON "projects"("project_id");

-- CreateIndex
CREATE INDEX "projects_risk_score_idx" ON "projects"("risk_score");

-- CreateIndex
CREATE INDEX "projects_project_type_idx" ON "projects"("project_type");

-- CreateIndex
CREATE INDEX "projects_state_idx" ON "projects"("state");

-- CreateIndex
CREATE INDEX "projects_district_idx" ON "projects"("district");

-- CreateIndex
CREATE INDEX "projects_project_manager_id_idx" ON "projects"("project_manager_id");

-- CreateIndex
CREATE INDEX "project_status_history_project_id_idx" ON "project_status_history"("project_id");

-- CreateIndex
CREATE INDEX "risk_predictions_project_id_idx" ON "risk_predictions"("project_id");

-- CreateIndex
CREATE INDEX "risk_predictions_predicted_at_idx" ON "risk_predictions"("predicted_at");

-- CreateIndex
CREATE INDEX "stage_risks_prediction_id_idx" ON "stage_risks"("prediction_id");

-- CreateIndex
CREATE INDEX "recommendations_project_id_idx" ON "recommendations"("project_id");

-- CreateIndex
CREATE INDEX "recommendations_status_idx" ON "recommendations"("status");

-- CreateIndex
CREATE INDEX "alerts_project_id_idx" ON "alerts"("project_id");

-- CreateIndex
CREATE INDEX "alerts_user_id_idx" ON "alerts"("user_id");

-- CreateIndex
CREATE INDEX "alerts_is_read_idx" ON "alerts"("is_read");

-- CreateIndex
CREATE INDEX "alerts_severity_idx" ON "alerts"("severity");

-- CreateIndex
CREATE INDEX "audit_logs_user_id_idx" ON "audit_logs"("user_id");

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");

-- CreateIndex
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at");

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_administrator_id_fkey" FOREIGN KEY ("administrator_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_project_manager_id_fkey" FOREIGN KEY ("project_manager_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_status_history" ADD CONSTRAINT "project_status_history_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_status_history" ADD CONSTRAINT "project_status_history_recorded_by_fkey" FOREIGN KEY ("recorded_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "risk_predictions" ADD CONSTRAINT "risk_predictions_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stage_risks" ADD CONSTRAINT "stage_risks_prediction_id_fkey" FOREIGN KEY ("prediction_id") REFERENCES "risk_predictions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recommendations" ADD CONSTRAINT "recommendations_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recommendations" ADD CONSTRAINT "recommendations_prediction_id_fkey" FOREIGN KEY ("prediction_id") REFERENCES "risk_predictions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "import_history" ADD CONSTRAINT "import_history_imported_by_fkey" FOREIGN KEY ("imported_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
