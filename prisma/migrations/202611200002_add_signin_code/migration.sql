-- Add a one-time sign-in code alongside the magic link.
ALTER TABLE "MagicLink" ADD COLUMN "codeHash" TEXT;
ALTER TABLE "MagicLink" ADD COLUMN "attempts" INTEGER NOT NULL DEFAULT 0;