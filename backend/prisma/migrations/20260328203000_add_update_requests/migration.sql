-- CreateEnum
CREATE TYPE "UpdateRequestEntityType" AS ENUM ('product', 'variant');

-- CreateEnum
CREATE TYPE "UpdateRequestStatus" AS ENUM ('pending', 'approved', 'rejected');

-- CreateTable
CREATE TABLE "update_requests" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "entity_type" "UpdateRequestEntityType" NOT NULL,
    "entity_id" UUID NOT NULL,
    "requested_changes" JSONB NOT NULL,
    "requested_by" UUID NOT NULL,
    "status" "UpdateRequestStatus" NOT NULL DEFAULT 'pending',
    "reviewed_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "update_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "update_requests_organization_id_idx" ON "update_requests"("organization_id");

-- CreateIndex
CREATE INDEX "update_requests_organization_id_status_idx" ON "update_requests"("organization_id", "status");

-- CreateIndex
CREATE INDEX "update_requests_entity_type_entity_id_idx" ON "update_requests"("entity_type", "entity_id");

-- AddForeignKey
ALTER TABLE "update_requests" ADD CONSTRAINT "update_requests_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "update_requests" ADD CONSTRAINT "update_requests_requested_by_fkey" FOREIGN KEY ("requested_by") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "update_requests" ADD CONSTRAINT "update_requests_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "update_requests" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "update_requests" FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation ON "update_requests";
CREATE POLICY tenant_isolation ON "update_requests" USING (organization_id = NULLIF(current_setting('app.organization_id', true), '')::uuid);
