-- Migration 007: Daily model usage aggregates
-- Run after 006_daily_provider_usage.sql

CREATE TABLE daily_model_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    model TEXT NOT NULL,
    usage_date DATE NOT NULL,
    total_tokens BIGINT NOT NULL DEFAULT 0,
    total_cost NUMERIC(18,8) NOT NULL DEFAULT 0,
    session_count BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (organization_id, model, usage_date)
);

-- Indexes
CREATE INDEX idx_daily_model_usage_org_id ON daily_model_usage(organization_id);
CREATE INDEX idx_daily_model_usage_model ON daily_model_usage(model);
CREATE INDEX idx_daily_model_usage_usage_date ON daily_model_usage(usage_date);
CREATE INDEX idx_daily_model_usage_org_model_date ON daily_model_usage(organization_id, model, usage_date DESC);