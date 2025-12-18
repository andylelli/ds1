CREATE TABLE IF NOT EXISTS opportunity_briefs (
    id VARCHAR(255) PRIMARY KEY,
    theme_name VARCHAR(255) NOT NULL,
    score INTEGER,
    phase VARCHAR(50),
    status VARCHAR(50),
    data JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_briefs_created_at ON opportunity_briefs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_briefs_status ON opportunity_briefs(status);
