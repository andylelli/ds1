-- Migration: Add metadata columns to events table
-- Date: 2024-05-23

ALTER TABLE events ADD COLUMN IF NOT EXISTS event_id TEXT; -- Using TEXT for UUID to be safe/simple, or UUID type if PG supports it (it does)
ALTER TABLE events ADD COLUMN IF NOT EXISTS correlation_id TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS source TEXT;

-- Add indexes for new columns
CREATE INDEX IF NOT EXISTS idx_events_correlation_id ON events (correlation_id);
CREATE INDEX IF NOT EXISTS idx_events_event_id ON events (event_id);
