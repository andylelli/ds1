-- Research Staging Tables Migration
-- Creates tables for staging research results before approval

-- Research staging table
CREATE TABLE IF NOT EXISTS research_staging (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(50) NOT NULL,           -- Links to research session
    item_type VARCHAR(50) NOT NULL,            -- 'product', 'trend', 'competitor'
    
    -- Core data
    name VARCHAR(255) NOT NULL,
    description TEXT,
    raw_data JSONB NOT NULL,                   -- Full API response
    
    -- Analysis results
    confidence_score INTEGER CHECK (confidence_score >= 0 AND confidence_score <= 100),
    source VARCHAR(50) NOT NULL,               -- 'google_trends', 'meta_ads', 'ai_synthesis'
    trend_evidence TEXT,                       -- Why this item was flagged
    
    -- Review workflow
    status VARCHAR(20) DEFAULT 'pending',      -- 'pending', 'approved', 'rejected', 'needs_info'
    reviewed_by VARCHAR(100),
    reviewed_at TIMESTAMP,
    review_notes TEXT,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,                      -- Auto-expire old items
    
    CONSTRAINT valid_status CHECK (status IN ('pending', 'approved', 'rejected', 'needs_info'))
);

-- Research sessions (groups of staging items)
CREATE TABLE IF NOT EXISTS research_sessions (
    id VARCHAR(50) PRIMARY KEY,
    category VARCHAR(100) NOT NULL,
    research_type VARCHAR(50) NOT NULL,        -- 'product_discovery', 'trend_analysis', 'competitor'
    source_modes JSONB,                        -- Which adapters were used
    
    -- Summary stats
    total_items INTEGER DEFAULT 0,
    pending_items INTEGER DEFAULT 0,
    approved_items INTEGER DEFAULT 0,
    rejected_items INTEGER DEFAULT 0,
    
    -- Timestamps
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    reviewed_at TIMESTAMP,
    
    status VARCHAR(20) DEFAULT 'in_progress'   -- 'in_progress', 'awaiting_review', 'reviewed', 'expired'
);

-- Indexes for quick lookups
CREATE INDEX IF NOT EXISTS idx_staging_status ON research_staging(status);
CREATE INDEX IF NOT EXISTS idx_staging_session ON research_staging(session_id);
CREATE INDEX IF NOT EXISTS idx_staging_type ON research_staging(item_type);
CREATE INDEX IF NOT EXISTS idx_staging_confidence ON research_staging(confidence_score DESC);
CREATE INDEX IF NOT EXISTS idx_staging_created ON research_staging(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON research_sessions(status);
CREATE INDEX IF NOT EXISTS idx_sessions_category ON research_sessions(category);

-- Comments for documentation
COMMENT ON TABLE research_staging IS 'Staging area for research results requiring human review';
COMMENT ON TABLE research_sessions IS 'Groups research staging items into reviewable sessions';
COMMENT ON COLUMN research_staging.confidence_score IS 'AI confidence score 0-100, higher = more confident';
COMMENT ON COLUMN research_staging.raw_data IS 'Complete data from API/AI for audit trail';
COMMENT ON COLUMN research_sessions.source_modes IS 'JSON object tracking which adapters were used (trends: live/mock, research: live/mock)';
