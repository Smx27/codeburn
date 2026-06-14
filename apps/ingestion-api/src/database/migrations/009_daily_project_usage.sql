-- Migration 009: Daily project usage aggregates
-- Run after 008_daily_user_usage.sql

CREATE TABLE daily_project_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    project_name TEXT NOT NULL,
    usage_date DATE NOT NULL,
    session_count BIGINT NOT NULL DEFAULT 0,
    token_count BIGINT NOT NULL DEFAULT 0,
    cost NUMERIC(18,8) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (organization_id, project_name, usage_date)
);

-- Indexes
CREATE INDEX idx_daily_project_usage_org_id ON daily_project_usage(organization_id);
CREATE INDEX idx_daily_project_usage_project_name ON daily_project_usage(project_name);
CREATE INDEX idx_daily_project_usage_usage_date ON daily_project_usage(usage_date);
CREATE INDEX idx_daily_project_usage_org_project_date ON daily_project_usage(organization_id, project_name, usage_date DESC);