-- Add supplier code + make phone optional.
-- Steps:
-- 1) Add new nullable columns
-- 2) Backfill supplier.code deterministically
-- 3) Add NOT NULL + unique constraint
-- 4) Drop NOT NULL on phone

ALTER TABLE "suppliers"
  ADD COLUMN IF NOT EXISTS "code" TEXT;

-- Backfill missing codes.
-- Format: SUP-0001, SUP-0002 per organization_id, ordered by created_at then id for stability.
WITH ranked AS (
  SELECT
    id,
    organization_id,
    ROW_NUMBER() OVER (PARTITION BY organization_id ORDER BY created_at ASC, id ASC) AS rn
  FROM suppliers
  WHERE code IS NULL OR code = ''
)
UPDATE suppliers s
SET code = 'SUP-' || LPAD(r.rn::TEXT, 4, '0')
FROM ranked r
WHERE s.id = r.id;

-- Ensure no null/empty remains (safe guard).
UPDATE suppliers
SET code = 'SUP-' || LPAD(1::TEXT, 4, '0')
WHERE code IS NULL OR code = '';

ALTER TABLE "suppliers"
  ALTER COLUMN "code" SET NOT NULL;

-- Make phone optional
ALTER TABLE "suppliers"
  ALTER COLUMN "phone" DROP NOT NULL;

-- Unique per tenant
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM   pg_constraint
    WHERE  conname = 'suppliers_organization_id_code_key'
  ) THEN
    ALTER TABLE "suppliers"
      ADD CONSTRAINT "suppliers_organization_id_code_key" UNIQUE ("organization_id", "code");
  END IF;
END$$;

