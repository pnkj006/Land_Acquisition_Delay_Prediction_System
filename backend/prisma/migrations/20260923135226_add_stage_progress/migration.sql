-- CreateTable
CREATE TABLE "stage_progress" (
    "id" SERIAL NOT NULL,
    "project_id" INTEGER NOT NULL,
    "stage" "ProjectStage" NOT NULL,
    "progress_pct" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "updated_by" INTEGER,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stage_progress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "stage_progress_project_id_idx" ON "stage_progress"("project_id");

-- CreateIndex
CREATE UNIQUE INDEX "stage_progress_project_id_stage_key" ON "stage_progress"("project_id", "stage");

-- AddForeignKey
ALTER TABLE "stage_progress" ADD CONSTRAINT "stage_progress_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stage_progress" ADD CONSTRAINT "stage_progress_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
