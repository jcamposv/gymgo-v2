-- Reduce free plan member limit from 15 to 5
-- This encourages personal trainers to upgrade sooner
UPDATE organizations
SET max_members = 5
WHERE subscription_plan = 'free'
  AND (max_members = 15 OR max_members IS NULL);
