-- Add per-user and per-client email notification preference.
-- Defaults to true so all existing records continue receiving emails.
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS notify_email boolean NOT NULL DEFAULT true;
ALTER TABLE clients      ADD COLUMN IF NOT EXISTS notify_email boolean NOT NULL DEFAULT true;
