/*
  Warnings:

  - The values [ACTIVE,MAINTENANCE] on the enum `AssetStatus` will be removed. If these variants are still used in the database, this will fail.
  - A unique constraint covering the columns `[orgId,code]` on the table `assets` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `name` to the `assets` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "public"."AssetStatus_new" AS ENUM ('IN_USE', 'IN_STORAGE', 'IN_MAINTENANCE', 'DISPOSED');
ALTER TABLE "public"."assets" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "public"."assets" ALTER COLUMN "status" TYPE "public"."AssetStatus_new" USING ("status"::text::"public"."AssetStatus_new");
ALTER TYPE "public"."AssetStatus" RENAME TO "AssetStatus_old";
ALTER TYPE "public"."AssetStatus_new" RENAME TO "AssetStatus";
DROP TYPE "public"."AssetStatus_old";
ALTER TABLE "public"."assets" ALTER COLUMN "status" SET DEFAULT 'IN_USE';
COMMIT;

-- AlterTable
ALTER TABLE "public"."assets" ADD COLUMN     "code" TEXT,
ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "supplierId" UUID,
ALTER COLUMN "description" DROP NOT NULL,
ALTER COLUMN "status" SET DEFAULT 'IN_USE';

-- AlterTable
ALTER TABLE "public"."suppliers" ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "createdAt" SET DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "updatedAt" DROP DEFAULT;

-- CreateIndex
CREATE INDEX "assets_orgId_supplierId_idx" ON "public"."assets"("orgId", "supplierId");

-- CreateIndex
CREATE UNIQUE INDEX "assets_orgId_code_key" ON "public"."assets"("orgId", "code");

-- AddForeignKey
ALTER TABLE "public"."assets" ADD CONSTRAINT "assets_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "public"."suppliers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
