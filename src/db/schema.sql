CREATE TABLE IF NOT EXISTS events (
  id BIGSERIAL PRIMARY KEY,
  event_id TEXT,
  correlation_id TEXT,
  source TEXT,
  topic TEXT NOT NULL,
  type TEXT NOT NULL,
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  archived_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_events_topic_id ON events (topic, id);
CREATE INDEX IF NOT EXISTS idx_events_correlation_id ON events (correlation_id);
CREATE INDEX IF NOT EXISTS idx_events_event_id ON events (event_id);
CREATE INDEX IF NOT EXISTS idx_events_archived_at ON events (archived_at);

CREATE TABLE IF NOT EXISTS consumer_offsets (
  consumer_name TEXT NOT NULL,
  topic TEXT NOT NULL,
  last_event_id BIGINT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (consumer_name, topic)
);

CREATE TABLE IF NOT EXISTS events_archive (
  id BIGINT PRIMARY KEY,
  topic TEXT NOT NULL,
  type TEXT NOT NULL,
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  archived_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC,
  potential TEXT,
  margin TEXT,
  data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  product_id TEXT,
  amount NUMERIC,
  status TEXT,
  source TEXT,
  data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ads (
  id TEXT PRIMARY KEY,
  platform TEXT,
  product TEXT,
  budget NUMERIC,
  status TEXT,
  data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
