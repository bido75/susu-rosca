-- Add Fair-Value slot configuration flag (display-only distribution convention).
ALTER TABLE "Circle" ADD COLUMN "fairValueSlots" BOOLEAN NOT NULL DEFAULT true;
