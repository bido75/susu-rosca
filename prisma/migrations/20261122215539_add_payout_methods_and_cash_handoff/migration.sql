-- CreateEnum
CREATE TYPE "PayoutMethodKind" AS ENUM ('ZELLE', 'CASHAPP', 'VENMO', 'ACH', 'CASH');

-- CreateEnum
CREATE TYPE "PayoutMethodStatus" AS ENUM ('ENTERED', 'CONFIRMED', 'DISABLED');

-- CreateEnum
CREATE TYPE "PayoutAcknowledgmentType" AS ENUM ('RECEIVED', 'NOT_RECEIVED', 'WRONG_AMOUNT', 'WRONG_IDENTIFIER', 'DUPLICATE', 'OTHER');

-- CreateEnum
CREATE TYPE "CashHandoffRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'DISPUTED');

-- CreateEnum
CREATE TYPE "CashHandoffRole" AS ENUM ('PAYER', 'RECIPIENT', 'WITNESS');

-- DropForeignKey
ALTER TABLE "AuditLog" DROP CONSTRAINT "AuditLog_actorId_fkey";

-- DropForeignKey
ALTER TABLE "Circle" DROP CONSTRAINT "Circle_createdBy_fkey";

-- DropForeignKey
ALTER TABLE "CircleMember" DROP CONSTRAINT "CircleMember_circleId_fkey";

-- DropForeignKey
ALTER TABLE "CircleMember" DROP CONSTRAINT "CircleMember_userId_fkey";

-- DropForeignKey
ALTER TABLE "Contribution" DROP CONSTRAINT "Contribution_cycleId_fkey";

-- DropForeignKey
ALTER TABLE "Contribution" DROP CONSTRAINT "Contribution_userId_fkey";

-- DropForeignKey
ALTER TABLE "Contribution" DROP CONSTRAINT "Contribution_verifiedBy_fkey";

-- DropForeignKey
ALTER TABLE "ContributionEvidence" DROP CONSTRAINT "ContributionEvidence_contributionId_fkey";

-- DropForeignKey
ALTER TABLE "ContributionEvidence" DROP CONSTRAINT "ContributionEvidence_uploadedBy_fkey";

-- DropForeignKey
ALTER TABLE "Cycle" DROP CONSTRAINT "Cycle_circleId_fkey";

-- DropForeignKey
ALTER TABLE "Disbursement" DROP CONSTRAINT "Disbursement_circleId_fkey";

-- DropForeignKey
ALTER TABLE "Disbursement" DROP CONSTRAINT "Disbursement_cycleId_fkey";

-- DropForeignKey
ALTER TABLE "Disbursement" DROP CONSTRAINT "Disbursement_recipientUserId_fkey";

-- DropForeignKey
ALTER TABLE "Disbursement" DROP CONSTRAINT "Disbursement_recordedByUserId_fkey";

-- DropForeignKey
ALTER TABLE "Dispute" DROP CONSTRAINT "Dispute_circleId_fkey";

-- DropForeignKey
ALTER TABLE "Dispute" DROP CONSTRAINT "Dispute_cycleId_fkey";

-- DropForeignKey
ALTER TABLE "Dispute" DROP CONSTRAINT "Dispute_raisedBy_fkey";

-- DropForeignKey
ALTER TABLE "Dispute" DROP CONSTRAINT "Dispute_resolvedBy_fkey";

-- DropForeignKey
ALTER TABLE "MagicLink" DROP CONSTRAINT "MagicLink_userId_fkey";

-- DropForeignKey
ALTER TABLE "ScoreChange" DROP CONSTRAINT "ScoreChange_userId_fkey";

-- DropForeignKey
ALTER TABLE "Session" DROP CONSTRAINT "Session_userId_fkey";

-- DropForeignKey
ALTER TABLE "SlotSwap" DROP CONSTRAINT "SlotSwap_circleId_fkey";

-- DropForeignKey
ALTER TABLE "SlotSwap" DROP CONSTRAINT "SlotSwap_requesterId_fkey";

-- DropForeignKey
ALTER TABLE "SlotSwap" DROP CONSTRAINT "SlotSwap_targetId_fkey";

-- DropIndex
DROP INDEX "Contribution_cycleId_status_idx";

-- CreateTable
CREATE TABLE "PayoutReceivingMethod" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "kind" "PayoutMethodKind" NOT NULL,
    "identifier" TEXT,
    "label" TEXT,
    "status" "PayoutMethodStatus" NOT NULL DEFAULT 'ENTERED',
    "isPreferred" BOOLEAN NOT NULL DEFAULT false,
    "confirmedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PayoutReceivingMethod_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CirclePayoutPreference" (
    "id" UUID NOT NULL,
    "circleId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "receivingMethodId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CirclePayoutPreference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CyclePayoutInstruction" (
    "id" UUID NOT NULL,
    "circleId" UUID NOT NULL,
    "cycleId" UUID NOT NULL,
    "recipientUserId" UUID NOT NULL,
    "receivingMethodId" UUID NOT NULL,
    "kind" "PayoutMethodKind" NOT NULL,
    "identifier" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "status" "PayoutMethodStatus" NOT NULL DEFAULT 'CONFIRMED',
    "supersededAt" TIMESTAMP(3),
    "confirmedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CyclePayoutInstruction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PayoutAcknowledgment" (
    "id" UUID NOT NULL,
    "cycleId" UUID NOT NULL,
    "recipientUserId" UUID NOT NULL,
    "type" "PayoutAcknowledgmentType" NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PayoutAcknowledgment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CashHandoffRequest" (
    "id" UUID NOT NULL,
    "circleId" UUID NOT NULL,
    "cycleId" UUID NOT NULL,
    "recipientUserId" UUID NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "reason" TEXT NOT NULL,
    "proposedDate" TIMESTAMP(3) NOT NULL,
    "arrangement" TEXT NOT NULL,
    "status" "CashHandoffRequestStatus" NOT NULL DEFAULT 'PENDING',
    "approvedBy" UUID,
    "approvedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "witnessUserId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CashHandoffRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CashHandoffConfirmation" (
    "id" UUID NOT NULL,
    "handoffId" UUID NOT NULL,
    "role" "CashHandoffRole" NOT NULL,
    "userId" UUID NOT NULL,
    "confirmedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CashHandoffConfirmation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PayoutReceivingMethod_userId_idx" ON "PayoutReceivingMethod"("userId");

-- CreateIndex
CREATE INDEX "CirclePayoutPreference_circleId_idx" ON "CirclePayoutPreference"("circleId");

-- CreateIndex
CREATE UNIQUE INDEX "CirclePayoutPreference_circleId_userId_key" ON "CirclePayoutPreference"("circleId", "userId");

-- CreateIndex
CREATE INDEX "CyclePayoutInstruction_cycleId_version_idx" ON "CyclePayoutInstruction"("cycleId", "version");

-- CreateIndex
CREATE INDEX "CyclePayoutInstruction_circleId_cycleId_idx" ON "CyclePayoutInstruction"("circleId", "cycleId");

-- CreateIndex
CREATE INDEX "PayoutAcknowledgment_cycleId_idx" ON "PayoutAcknowledgment"("cycleId");

-- CreateIndex
CREATE INDEX "CashHandoffRequest_circleId_status_idx" ON "CashHandoffRequest"("circleId", "status");

-- CreateIndex
CREATE INDEX "CashHandoffConfirmation_handoffId_idx" ON "CashHandoffConfirmation"("handoffId");

-- CreateIndex
CREATE UNIQUE INDEX "CashHandoffConfirmation_handoffId_role_key" ON "CashHandoffConfirmation"("handoffId", "role");

-- AddForeignKey
ALTER TABLE "MagicLink" ADD CONSTRAINT "MagicLink_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Circle" ADD CONSTRAINT "Circle_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CircleMember" ADD CONSTRAINT "CircleMember_circleId_fkey" FOREIGN KEY ("circleId") REFERENCES "Circle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CircleMember" ADD CONSTRAINT "CircleMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cycle" ADD CONSTRAINT "Cycle_circleId_fkey" FOREIGN KEY ("circleId") REFERENCES "Circle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contribution" ADD CONSTRAINT "Contribution_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "Cycle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contribution" ADD CONSTRAINT "Contribution_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contribution" ADD CONSTRAINT "Contribution_verifiedBy_fkey" FOREIGN KEY ("verifiedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContributionEvidence" ADD CONSTRAINT "ContributionEvidence_contributionId_fkey" FOREIGN KEY ("contributionId") REFERENCES "Contribution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContributionEvidence" ADD CONSTRAINT "ContributionEvidence_uploadedBy_fkey" FOREIGN KEY ("uploadedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SlotSwap" ADD CONSTRAINT "SlotSwap_circleId_fkey" FOREIGN KEY ("circleId") REFERENCES "Circle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SlotSwap" ADD CONSTRAINT "SlotSwap_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SlotSwap" ADD CONSTRAINT "SlotSwap_targetId_fkey" FOREIGN KEY ("targetId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Disbursement" ADD CONSTRAINT "Disbursement_circleId_fkey" FOREIGN KEY ("circleId") REFERENCES "Circle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Disbursement" ADD CONSTRAINT "Disbursement_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "Cycle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Disbursement" ADD CONSTRAINT "Disbursement_recipientUserId_fkey" FOREIGN KEY ("recipientUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Disbursement" ADD CONSTRAINT "Disbursement_recordedByUserId_fkey" FOREIGN KEY ("recordedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScoreChange" ADD CONSTRAINT "ScoreChange_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dispute" ADD CONSTRAINT "Dispute_circleId_fkey" FOREIGN KEY ("circleId") REFERENCES "Circle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dispute" ADD CONSTRAINT "Dispute_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "Cycle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dispute" ADD CONSTRAINT "Dispute_raisedBy_fkey" FOREIGN KEY ("raisedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dispute" ADD CONSTRAINT "Dispute_resolvedBy_fkey" FOREIGN KEY ("resolvedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayoutReceivingMethod" ADD CONSTRAINT "PayoutReceivingMethod_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CirclePayoutPreference" ADD CONSTRAINT "CirclePayoutPreference_circleId_fkey" FOREIGN KEY ("circleId") REFERENCES "Circle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CirclePayoutPreference" ADD CONSTRAINT "CirclePayoutPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CirclePayoutPreference" ADD CONSTRAINT "CirclePayoutPreference_receivingMethodId_fkey" FOREIGN KEY ("receivingMethodId") REFERENCES "PayoutReceivingMethod"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CyclePayoutInstruction" ADD CONSTRAINT "CyclePayoutInstruction_circleId_fkey" FOREIGN KEY ("circleId") REFERENCES "Circle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CyclePayoutInstruction" ADD CONSTRAINT "CyclePayoutInstruction_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "Cycle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CyclePayoutInstruction" ADD CONSTRAINT "CyclePayoutInstruction_recipientUserId_fkey" FOREIGN KEY ("recipientUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CyclePayoutInstruction" ADD CONSTRAINT "CyclePayoutInstruction_receivingMethodId_fkey" FOREIGN KEY ("receivingMethodId") REFERENCES "PayoutReceivingMethod"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayoutAcknowledgment" ADD CONSTRAINT "PayoutAcknowledgment_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "Cycle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayoutAcknowledgment" ADD CONSTRAINT "PayoutAcknowledgment_recipientUserId_fkey" FOREIGN KEY ("recipientUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CashHandoffRequest" ADD CONSTRAINT "CashHandoffRequest_circleId_fkey" FOREIGN KEY ("circleId") REFERENCES "Circle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CashHandoffRequest" ADD CONSTRAINT "CashHandoffRequest_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "Cycle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CashHandoffRequest" ADD CONSTRAINT "CashHandoffRequest_recipientUserId_fkey" FOREIGN KEY ("recipientUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CashHandoffRequest" ADD CONSTRAINT "CashHandoffRequest_approvedBy_fkey" FOREIGN KEY ("approvedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CashHandoffRequest" ADD CONSTRAINT "CashHandoffRequest_witnessUserId_fkey" FOREIGN KEY ("witnessUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CashHandoffConfirmation" ADD CONSTRAINT "CashHandoffConfirmation_handoffId_fkey" FOREIGN KEY ("handoffId") REFERENCES "CashHandoffRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CashHandoffConfirmation" ADD CONSTRAINT "CashHandoffConfirmation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
