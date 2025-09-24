-- CreateTable
CREATE TABLE "public"."ministries" (
    "id" UUID NOT NULL,
    "orgId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ministries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."member_ministries" (
    "id" UUID NOT NULL,
    "orgId" UUID NOT NULL,
    "memberId" UUID NOT NULL,
    "ministryId" UUID NOT NULL,
    "role" TEXT,
    "sinceDate" TIMESTAMP(3),
    "untilDate" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "member_ministries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ministries_orgId_active_idx" ON "public"."ministries"("orgId", "active");

-- CreateIndex
CREATE UNIQUE INDEX "ministries_orgId_name_key" ON "public"."ministries"("orgId", "name");

-- CreateIndex
CREATE INDEX "member_ministries_orgId_ministryId_idx" ON "public"."member_ministries"("orgId", "ministryId");

-- CreateIndex
CREATE INDEX "member_ministries_orgId_memberId_idx" ON "public"."member_ministries"("orgId", "memberId");

-- AddForeignKey
ALTER TABLE "public"."ministries" ADD CONSTRAINT "ministries_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "public"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."member_ministries" ADD CONSTRAINT "member_ministries_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "public"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."member_ministries" ADD CONSTRAINT "member_ministries_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "public"."members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."member_ministries" ADD CONSTRAINT "member_ministries_ministryId_fkey" FOREIGN KEY ("ministryId") REFERENCES "public"."ministries"("id") ON DELETE CASCADE ON UPDATE CASCADE;
