-- Variant size (separate from color in UI)
ALTER TABLE "variants" ADD COLUMN IF NOT EXISTS "size" TEXT NOT NULL DEFAULT '';

-- Purchase soft delete (restore re-applies stock)
ALTER TABLE "purchases" ADD COLUMN IF NOT EXISTS "deleted_at" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "deleted_by" UUID;

CREATE INDEX IF NOT EXISTS "purchases_organization_id_deleted_at_idx" ON "purchases"("organization_id", "deleted_at");
CREATE INDEX IF NOT EXISTS "purchases_deleted_at_idx" ON "purchases"("deleted_at");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'purchases_deleted_by_fkey'
  ) THEN
    ALTER TABLE "purchases" ADD CONSTRAINT "purchases_deleted_by_fkey" FOREIGN KEY ("deleted_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
