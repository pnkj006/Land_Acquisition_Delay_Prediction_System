-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.

ALTER TYPE "Role" ADD VALUE 'SENIOR_OFFICIAL';
ALTER TYPE "Role" ADD VALUE 'STAFF';

-- AlterTable: audit_logs — add RBAC columns (resource, resource_id, role snapshot)
ALTER TABLE "audit_logs" ADD COLUMN     "resource" TEXT,
ADD COLUMN     "resource_id" INTEGER,
ADD COLUMN     "role" TEXT;

-- AlterTable: users — add is_active flag
ALTER TABLE "users" ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable: import_history — change relation name only (DB column stays imported_by)
-- No SQL needed; relation rename is Prisma-level only.

-- CreateTable: project_assignments
CREATE TABLE "project_assignments" (
    "id" SERIAL NOT NULL,
    "project_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,

    CONSTRAINT "project_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable: user_permissions
CREATE TABLE "user_permissions" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "resource" TEXT NOT NULL,
    "action" TEXT NOT NULL,

    CONSTRAINT "user_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "project_assignments_project_id_idx" ON "project_assignments"("project_id");

-- CreateIndex
CREATE INDEX "project_assignments_user_id_idx" ON "project_assignments"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "project_assignments_project_id_user_id_key" ON "project_assignments"("project_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_permissions_user_id_resource_action_key" ON "user_permissions"("user_id", "resource", "action");

-- AddForeignKey
ALTER TABLE "project_assignments" ADD CONSTRAINT "project_assignments_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_assignments" ADD CONSTRAINT "project_assignments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_permissions" ADD CONSTRAINT "user_permissions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: import_history — add ON DELETE SET NULL to imported_by FK
-- (The existing FK may not have SET NULL; re-create it if present)
ALTER TABLE "import_history" DROP CONSTRAINT IF EXISTS "import_history_imported_by_fkey";
ALTER TABLE "import_history" ADD CONSTRAINT "import_history_imported_by_fkey" FOREIGN KEY ("imported_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey: audit_logs — add ON DELETE SET NULL to user_id FK
-- (Re-create with SET NULL if not already)
ALTER TABLE "audit_logs" DROP CONSTRAINT IF EXISTS "audit_logs_user_id_fkey";
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Normalize existing project codes (collision check: if this UPDATE causes a unique violation,
-- the migration will fail and must be resolved manually before proceeding)
UPDATE "projects" SET "project_id" = UPPER(TRIM("project_id"));

-- Backfill project_assignments from project_manager_id (PM role only)
INSERT INTO "project_assignments" ("project_id", "user_id")
SELECT p.id, p.project_manager_id
FROM "projects" p
JOIN "users" u ON u.id = p.project_manager_id
WHERE p.project_manager_id IS NOT NULL AND u.role = 'PROJECT_MANAGER'
ON CONFLICT DO NOTHING;

-- NOTE: administrator_id is NOT backfilled (per plan §3.2)
