-- Update organizations that are on free plan (were stored as 'starter' with free limits)
UPDATE organizations
SET subscription_plan = 'free'
WHERE subscription_plan = 'starter'
  AND max_members = 15;

-- Update the default for new organizations
ALTER TABLE organizations ALTER COLUMN subscription_plan SET DEFAULT 'free';
