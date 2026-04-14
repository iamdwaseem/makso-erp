-- Make supplier.code optional (not required).
ALTER TABLE "suppliers"
  ALTER COLUMN "code" DROP NOT NULL;

