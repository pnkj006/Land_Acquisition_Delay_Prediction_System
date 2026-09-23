-- Drop foreign keys first
ALTER TABLE "projects" DROP CONSTRAINT IF EXISTS "projects_project_manager_id_fkey";
ALTER TABLE "projects" DROP CONSTRAINT IF EXISTS "projects_administrator_id_fkey";

-- Drop the columns
ALTER TABLE "projects" DROP COLUMN IF EXISTS "project_manager_id";
ALTER TABLE "projects" DROP COLUMN IF EXISTS "administrator_id";
ALTER TABLE "projects" DROP COLUMN IF EXISTS "manager";