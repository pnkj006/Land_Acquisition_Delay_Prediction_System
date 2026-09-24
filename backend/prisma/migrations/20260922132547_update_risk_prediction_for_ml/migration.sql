/*
  Warnings:

  - You are about to drop the column `top_factors` on the `risk_predictions` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "rp_project_id_desc";

-- AlterTable
ALTER TABLE "projects" ADD COLUMN     "administrator_id" INTEGER,
ADD COLUMN     "project_manager_id" INTEGER;

-- AlterTable
ALTER TABLE "risk_predictions" DROP COLUMN "top_factors",
ADD COLUMN     "prediction" TEXT,
ADD COLUMN     "probability" DOUBLE PRECISION,
ADD COLUMN     "risk_factors" JSONB,
ADD COLUMN     "threshold" DOUBLE PRECISION;

-- CreateIndex
CREATE INDEX "projects_project_manager_id_idx" ON "projects"("project_manager_id");

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_administrator_id_fkey" FOREIGN KEY ("administrator_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_project_manager_id_fkey" FOREIGN KEY ("project_manager_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
