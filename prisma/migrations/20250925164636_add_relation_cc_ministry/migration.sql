/*
  Warnings:

  - You are about to drop the column `kind` on the `cost_centers` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[ministryId]` on the table `cost_centers` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "public"."CostCenterType" AS ENUM ('MINISTRY', 'EVENT', 'GROUP');

-- AlterTable
ALTER TABLE "public"."cost_centers" DROP COLUMN "kind",
ADD COLUMN     "ministryId" UUID,
ADD COLUMN     "type" "public"."CostCenterType" NOT NULL DEFAULT 'GROUP';

-- CreateIndex
CREATE UNIQUE INDEX "uq_cost_centers_ministryId" ON "public"."cost_centers"("ministryId");

-- AddForeignKey
ALTER TABLE "public"."cost_centers" ADD CONSTRAINT "cost_centers_ministryId_fkey" FOREIGN KEY ("ministryId") REFERENCES "public"."ministries"("id") ON DELETE SET NULL ON UPDATE CASCADE;
