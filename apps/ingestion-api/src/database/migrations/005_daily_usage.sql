-- Migration 005: Daily organization-level usage aggregates
-- Run after 004_aggregation_runs.sql

CREATE TABLE daily_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    usage_date DATE NOT NULL,
    total_sessions BIGINT NOT NULL DEFAULT 0,
    total_users BIGINT NOT NULL DEFAULT 0,
    total_input_tokens BIGINT NOT NULL DEFAULT 0,
    total_output_tokens BIGINT NOT NULL DEFAULT 0,
    total_tokens BIGINT NOT NULL DEFAULT 0,
    total_cost NUMERIC(18,8) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (organization_id, usage_date)
);

-- Indexes
CREATE INDEX idx_daily_usage_org_id ON daily_usage(organization_id);
CREATE INDEX idx_daily_usage_usage_date ON daily_usage(usage_date);
CREATE INDEX idx_daily_usage_org_date ON daily_usage(organization_id, usage_date DESC);