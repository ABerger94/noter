-- AlterTable
ALTER TABLE "Course" ADD COLUMN     "sortOrder" INTEGER NOT NULL DEFAULT 0;

-- Backfill existing rows with their current alphabetical order, so
-- reordering starts from where things already were instead of everything
-- tying at 0.
WITH ranked AS (
  SELECT "id", ROW_NUMBER() OVER (ORDER BY "name" ASC) - 1 AS rn
  FROM "Course"
)
UPDATE "Course"
SET "sortOrder" = ranked.rn
FROM ranked
WHERE "Course"."id" = ranked."id";
