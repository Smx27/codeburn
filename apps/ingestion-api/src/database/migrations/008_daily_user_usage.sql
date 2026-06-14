-- Migration 008: Daily user usage aggregates
-- Run after 007_daily_model_usage.sql

CREATE TABLE daily_user_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    usage_date DATE NOT NULL,
    session_count BIGINT NOT NULL DEFAULT 0,
    token_count BIGINT NOT NULL DEFAULT 0,
    cost NUMERIC(18,8) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (organization_id, user_id, usage_date)
);

-- Indexes
CREATE INDEX idx_daily_user_usage_org_id ON daily_user_usage(organization_id);
CREATE INDEX idx_daily_user_usage_user_id ON daily_user_usage(user_id);
CREATE INDEX idx_daily_user_usage_usage_date ON daily_user_usage(usage_date);
CREATE INDEX idx_daily_user_usage_org_user_date ON daily_user_usage(organization_id, user_id, usage_date DESC);