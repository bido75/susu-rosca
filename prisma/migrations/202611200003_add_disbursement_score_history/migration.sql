-- Add Disbursement (auditable payout record) and ScoreChange (trust-score history).
CREATE TABLE "Disbursement" (
    "id" UUID PRIMARY KEY,
    "circleId" UUID NOT NULL REFERENCES "Circle"("id") ON DELETE CASCADE,
    "cycleId" UUID NOT NULL REFERENCES "Cycle"("id") ON DELETE CASCADE,
    "recipientUserId" UUID NOT NULL REFERENCES "User"("id"),
    "amount" DECIMAL(12,2) NOT NULL,
    "paymentProvider" TEXT,
    "externalReference" TEXT,
    "recordedByUserId" UUID NOT NULL REFERENCES "User"("id"),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Disbursement_cycleId_key" UNIQUE ("cycleId")
);

CREATE INDEX "Disbursement_circleId_createdAt_idx" ON "Disbursement"("circleId", "createdAt");

CREATE TABLE "ScoreChange" (
    "id" UUID PRIMARY KEY,
    "userId" UUID NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
    "delta" INTEGER NOT NULL,
    "previousScore" INTEGER NOT NULL,
    "newScore" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "sourceEntity" TEXT NOT NULL,
    "sourceId" TEXT,
    "policyVersion" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "ScoreChange_userId_createdAt_idx" ON "ScoreChange"("userId", "createdAt");