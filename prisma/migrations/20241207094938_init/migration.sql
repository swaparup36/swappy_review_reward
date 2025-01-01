-- AlterTable
ALTER TABLE "Tasks" ALTER COLUMN "participants" SET DEFAULT ARRAY[]::TEXT[];
