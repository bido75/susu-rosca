-- Make the Fair-Value early-slot fee / anchor bonus percentage configurable
-- (previously hardcoded at 2%). Organizers can lower it or set it to 0 to
-- remove the adjustment (e.g. when members settle a dispute over fairness).
ALTER TABLE "Circle" ADD COLUMN "fairValueBonusPercent" DECIMAL(5,2) NOT NULL DEFAULT 2.00;