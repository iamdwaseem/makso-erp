/*
  Warnings:

  - Added the required column `updated_at` to the `purchases` table without a default value. This is not possible if the table is not empty.
  - Added the required column `warehouse_id` to the `purchases` table without a default value. This is not possible if the table is not empty.
  - Added the required column `created_by` to the `sales` table without a default value. This is not possible if the table is not empty.
  - Added the required column `total_amount` to the `sales` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `sales` table without a default value. This is not possible if the table is not empty.
  - Added the required column `warehouse_id` to the `sales` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "PurchaseStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "SaleStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PaymentType" AS ENUM ('CASH', 'CREDIT');

-- AlterTable
ALTER TABLE "purchases" ADD COLUMN     "notes" TEXT,
ADD COLUMN     "status" "PurchaseStatus" NOT NULL DEFAULT 'SUBMITTED',
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "warehouse_id" UUID NOT NULL;

-- AlterTable
ALTER TABLE "sales" ADD COLUMN     "created_by" UUID NOT NULL,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "payment_type" "PaymentType" NOT NULL DEFAULT 'CASH',
ADD COLUMN     "status" "SaleStatus" NOT NULL DEFAULT 'SUBMITTED',
ADD COLUMN     "total_amount" DECIMAL(12,2) NOT NULL,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "warehouse_id" UUID NOT NULL;

-- CreateIndex
CREATE INDEX "purchases_warehouse_id_idx" ON "purchases"("warehouse_id");

-- CreateIndex
CREATE INDEX "sales_warehouse_id_idx" ON "sales"("warehouse_id");

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchases" ADD CONSTRAINT "purchases_warehouse_id_fkey" FOREIGN KEY ("warehouse_id") REFERENCES "warehouses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales" ADD CONSTRAINT "sales_warehouse_id_fkey" FOREIGN KEY ("warehouse_id") REFERENCES "warehouses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales" ADD CONSTRAINT "sales_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
