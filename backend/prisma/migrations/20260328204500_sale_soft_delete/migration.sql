-- AlterTable
ALTER TABLE "sales" ADD COLUMN IF NOT EXISTS "deleted_at" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "deleted_by" UUID;

CREATE INDEX IF NOT EXISTS "sales_organization_id_deleted_at_idx" ON "sales"("organization_id", "deleted_at");
CREATE INDEX IF NOT EXISTS "sales_deleted_at_idx" ON "sales"("deleted_at");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'sales_deleted_by_fkey'
  ) THEN
    ALTER TABLE "sales" ADD CONSTRAINT "sales_deleted_by_fkey" FOREIGN KEY ("deleted_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
