-- Add payment evidence uploads (screenshots/receipts) linked to contributions.
CREATE TABLE "ContributionEvidence" (
    "id" UUID PRIMARY KEY,
    "contributionId" UUID NOT NULL REFERENCES "Contribution"("id") ON DELETE CASCADE,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "storageKey" TEXT NOT NULL UNIQUE,
    "uploadedBy" UUID NOT NULL REFERENCES "User"("id"),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "ContributionEvidence_contributionId_idx" ON "ContributionEvidence"("contributionId");