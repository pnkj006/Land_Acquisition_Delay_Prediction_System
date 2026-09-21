-- CreateEnum
CREATE TYPE "PredictionStatus" AS ENUM ('PENDING', 'DONE', 'FAILED');

-- AlterTable
ALTER TABLE "projects" ADD COLUMN "current_stage" "ProjectStage";

-- AlterTable
ALTER TABLE "risk_predictions" 
  ADD COLUMN "status" "PredictionStatus",
  ADD COLUMN "started_at" TIMESTAMP(3),
  ADD COLUMN "finished_at" TIMESTAMP(3),
  ADD COLUMN "error_message" VARCHAR(500),
  ALTER COLUMN "risk_score" DROP NOT NULL,
  ALTER COLUMN "risk_level" DROP NOT NULL,
  DROP COLUMN "delay_probability";

-- 1. Backfill RiskPrediction status
UPDATE "risk_predictions" SET "status" = 'DONE', "finished_at" = "predicted_at";

-- 2. Fix 0-1 scale bug on existing ML predictions where it might be 0-1 instead of 0-100
UPDATE "risk_predictions" 
SET "risk_score" = "risk_score" * 100 
WHERE "risk_score" <= 1 AND "risk_level" != 'LOW';

-- 3. Add Partial Unique Index for Dedup
CREATE UNIQUE INDEX "rp_one_pending_per_project" ON "risk_predictions" ("project_id") WHERE ("status" = 'PENDING');

-- 4. Add index for lifecycle ordering
CREATE INDEX "rp_project_id_desc" ON "risk_predictions" ("project_id", "id" DESC);
