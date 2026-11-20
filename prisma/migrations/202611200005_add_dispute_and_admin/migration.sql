-- Add admin flag and dispute model.
ALTER TABLE "User" ADD COLUMN "isAdmin" BOOLEAN NOT NULL DEFAULT false;

CREATE TYPE "DisputeStatus" AS ENUM ('OPEN','RESOLVED');

CREATE TABLE "Dispute" (
    "id" UUID PRIMARY KEY,
    "circleId" UUID NOT NULL REFERENCES "Circle"("id") ON DELETE CASCADE,
    "cycleId" UUID NOT NULL REFERENCES "Cycle"("id") ON DELETE CASCADE,
    "raisedBy" UUID NOT NULL REFERENCES "User"("id"),
    "description" TEXT NOT NULL,
    "status" "DisputeStatus" NOT NULL DEFAULT 'OPEN',
    "resolution" TEXT,
    "resolvedBy" UUID REFERENCES "User"("id"),
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "Dispute_circleId_status_idx" ON "Dispute"("circleId", "status");