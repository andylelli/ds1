-- Activity Log Table
-- Records all agent activities and system events for visibility

CREATE TABLE IF NOT EXISTS activity_log (
    id SERIAL PRIMARY KEY,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    agent VARCHAR(50) NOT NULL,
    action VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL, -- 'research', 'sourcing', 'store', 'marketing', 'operations', 'ceo', 'system'
    status VARCHAR(20) DEFAULT 'completed', -- 'started', 'completed', 'failed', 'warning'
    entity_type VARCHAR(50), -- 'product', 'order', 'campaign', 'session', etc.
    entity_id VARCHAR(100), -- ID of the related entity
    details JSONB, -- Structured data about the activity
    message TEXT, -- Human-readable description
    metadata JSONB -- Additional context
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_activity_log_timestamp ON activity_log(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_activity_log_agent ON activity_log(agent);
CREATE INDEX IF NOT EXISTS idx_activity_log_category ON activity_log(category);
CREATE INDEX IF NOT EXISTS idx_activity_log_status ON activity_log(status);
CREATE INDEX IF NOT EXISTS idx_activity_log_entity ON activity_log(entity_type, entity_id);

-- Index for recent activity queries
CREATE INDEX IF NOT EXISTS idx_activity_log_recent ON activity_log(timestamp DESC, category);

COMMENT ON TABLE activity_log IS 'Comprehensive activity log for all agent actions and system events';
COMMENT ON COLUMN activity_log.agent IS 'Agent name (e.g., CEO, Research, Marketing)';
COMMENT ON COLUMN activity_log.action IS 'Specific action taken (e.g., find_products, approve_product)';
COMMENT ON COLUMN activity_log.category IS 'High-level category for filtering';
COMMENT ON COLUMN activity_log.status IS 'Outcome of the activity';
COMMENT ON COLUMN activity_log.details IS 'Structured data (scores, metrics, etc.)';
COMMENT ON COLUMN activity_log.message IS 'Human-readable summary';
