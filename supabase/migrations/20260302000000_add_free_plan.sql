-- Add 'free' to subscription_plan enum
ALTER TYPE subscription_plan ADD VALUE IF NOT EXISTS 'free' BEFORE 'starter';
