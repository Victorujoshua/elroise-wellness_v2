-- Add free-text notes to the clients table for admin use
ALTER TABLE clients ADD COLUMN IF NOT EXISTS notes text;
