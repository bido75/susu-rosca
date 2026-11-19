-- SusuFlow PostgreSQL initial migration. Generated for Prisma's default quoted table/column naming.
CREATE TYPE "KycStatus" AS ENUM ('UNVERIFIED','PENDING','VERIFIED','REJECTED');
CREATE TYPE "Frequency" AS ENUM ('WEEKLY','BIWEEKLY','MONTHLY');
CREATE TYPE "CircleStatus" AS ENUM ('FORMING','ACTIVE','COMPLETED','CANCELLED');
CREATE TYPE "CircleMode" AS ENUM ('LEDGER','AUTOMATED_SIMULATED');
CREATE TYPE "MemberStatus" AS ENUM ('ACTIVE','DEFAULTED','WITHDRAWN');
CREATE TYPE "CycleStatus" AS ENUM ('PENDING','ACTIVE','DISBURSED');
CREATE TYPE "ContributionStatus" AS ENUM ('PENDING','SUBMITTED','VERIFIED','DEFAULTED');
CREATE TYPE "PaymentMethod" AS ENUM ('ZELLE','VENMO','ACH','CASH','CASHAPP','OTHER');
CREATE TYPE "SwapStatus" AS ENUM ('PENDING','ACCEPTED','REJECTED');
CREATE TABLE "User" (
 "id" UUID PRIMARY KEY,"email" TEXT NOT NULL UNIQUE,"fullName" TEXT NOT NULL,"phoneNumber" TEXT UNIQUE,
 "kycStatus" "KycStatus" NOT NULL DEFAULT 'UNVERIFIED',"susuTrustScore" INTEGER NOT NULL DEFAULT 100,
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,"updatedAt" TIMESTAMP(3) NOT NULL
);
CREATE TABLE "MagicLink" (
 "id" UUID PRIMARY KEY,"userId" UUID NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
 "tokenHash" TEXT NOT NULL UNIQUE,"expiresAt" TIMESTAMP(3) NOT NULL,"usedAt" TIMESTAMP(3),"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE "Session" (
 "id" UUID PRIMARY KEY,"userId" UUID NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
 "tokenHash" TEXT NOT NULL UNIQUE,"expiresAt" TIMESTAMP(3) NOT NULL,"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE "Circle" (
 "id" UUID PRIMARY KEY,"name" TEXT NOT NULL,"contributionAmount" DECIMAL(12,2) NOT NULL CHECK ("contributionAmount" BETWEEN 50 AND 5000),
 "currencySymbol" TEXT NOT NULL DEFAULT '$',"frequency" "Frequency" NOT NULL,"totalCycles" INTEGER NOT NULL CHECK ("totalCycles" BETWEEN 2 AND 30),
 "currentCycle" INTEGER NOT NULL DEFAULT 1,"status" "CircleStatus" NOT NULL DEFAULT 'FORMING',"mode" "CircleMode" NOT NULL DEFAULT 'LEDGER',
 "inviteCode" TEXT NOT NULL UNIQUE,"startDate" TIMESTAMP(3) NOT NULL,"createdBy" UUID NOT NULL REFERENCES "User"("id"),
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,"updatedAt" TIMESTAMP(3) NOT NULL,
 CONSTRAINT "Circle_cycle_bounds" CHECK ("currentCycle">=1 AND "currentCycle"<="totalCycles")
);
CREATE TABLE "CircleMember" (
 "id" UUID PRIMARY KEY,"circleId" UUID NOT NULL REFERENCES "Circle"("id") ON DELETE CASCADE,"userId" UUID NOT NULL REFERENCES "User"("id"),
 "slotNumber" INTEGER,"status" "MemberStatus" NOT NULL DEFAULT 'ACTIVE',"joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT "CircleMember_circleId_userId_key" UNIQUE ("circleId","userId"),
 CONSTRAINT "CircleMember_circleId_slotNumber_key" UNIQUE ("circleId","slotNumber"),
 CONSTRAINT "CircleMember_slot_positive" CHECK ("slotNumber" IS NULL OR "slotNumber">0)
);
CREATE TABLE "Cycle" (
 "id" UUID PRIMARY KEY,"circleId" UUID NOT NULL REFERENCES "Circle"("id") ON DELETE CASCADE,"cycleNumber" INTEGER NOT NULL,
 "recipientUserId" UUID,"status" "CycleStatus" NOT NULL DEFAULT 'PENDING',"dueDate" TIMESTAMP(3) NOT NULL,
 "disbursedAt" TIMESTAMP(3),"disbursementRef" TEXT,
 CONSTRAINT "Cycle_circleId_cycleNumber_key" UNIQUE ("circleId","cycleNumber")
);
CREATE TABLE "Contribution" (
 "id" UUID PRIMARY KEY,"cycleId" UUID NOT NULL REFERENCES "Cycle"("id") ON DELETE CASCADE,"userId" UUID NOT NULL REFERENCES "User"("id"),
 "amount" DECIMAL(12,2) NOT NULL CHECK ("amount">0),"status" "ContributionStatus" NOT NULL DEFAULT 'PENDING',
 "paymentMethod" "PaymentMethod","externalTxRef" TEXT,"verifiedBy" UUID REFERENCES "User"("id"),
 "verifiedAt" TIMESTAMP(3),"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,"updatedAt" TIMESTAMP(3) NOT NULL,
 CONSTRAINT "Contribution_cycleId_userId_key" UNIQUE ("cycleId","userId")
);
CREATE TABLE "SlotSwap" (
 "id" UUID PRIMARY KEY,"circleId" UUID NOT NULL REFERENCES "Circle"("id") ON DELETE CASCADE,"requesterId" UUID NOT NULL REFERENCES "User"("id"),
 "targetId" UUID NOT NULL REFERENCES "User"("id"),"status" "SwapStatus" NOT NULL DEFAULT 'PENDING',
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,"resolvedAt" TIMESTAMP(3),
 CONSTRAINT "SlotSwap_distinct_users" CHECK ("requesterId"<>"targetId")
);
CREATE TABLE "AuditLog" (
 "id" UUID PRIMARY KEY,"actorId" UUID NOT NULL REFERENCES "User"("id"),"circleId" UUID,
 "action" TEXT NOT NULL,"targetEntity" TEXT NOT NULL,"entityId" TEXT NOT NULL,
 "metadata" JSONB NOT NULL DEFAULT '{}'::jsonb,"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "AuditLog_circleId_createdAt_idx" ON "AuditLog"("circleId","createdAt");
CREATE INDEX "Contribution_cycleId_status_idx" ON "Contribution"("cycleId","status");
CREATE OR REPLACE FUNCTION susuflow_audit_append_only() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN RAISE EXCEPTION 'Audit entries are append-only'; END; $$;
CREATE TRIGGER "audit_no_mutation" BEFORE UPDATE OR DELETE ON "AuditLog" FOR EACH ROW EXECUTE FUNCTION susuflow_audit_append_only();
