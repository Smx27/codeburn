-- Migration 004: Aggregation runs tracking
-- Run after 003_sync_tracking.sql

CREATE TABLE aggregation_runs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    aggregation_type TEXT NOT NULL,  -- 'daily', 'historical_backfill'
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'running',  -- 'running', 'completed', 'failed'
    records_processed BIGINT NOT NULL DEFAULT 0,
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_aggregation_runs_org_id ON aggregation_runs(organization_id);
CREATE INDEX idx_aggregation_runs_status ON aggregation_runs(status);
CREATE INDEX idx_aggregation_runs_started_at ON aggregation_runs(started_at);
CREATE INDEX idx_aggregation_runs_type ON aggregation_runs(aggregation_type);