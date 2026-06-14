-- Migration 006: Daily provider usage aggregates
-- Run after 005_daily_usage.sql

CREATE TABLE daily_provider_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    provider_id SMALLINT NOT NULL REFERENCES providers(id) ON DELETE RESTRICT,
    usage_date DATE NOT NULL,
    total_sessions BIGINT NOT NULL DEFAULT 0,
    total_tokens BIGINT NOT NULL DEFAULT 0,
    total_cost NUMERIC(18,8) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (organization_id, provider_id, usage_date)
);

-- Indexes
CREATE INDEX idx_daily_provider_usage_org_id ON daily_provider_usage(organization_id);
CREATE INDEX idx_daily_provider_usage_provider_id ON daily_provider_usage(provider_id);
CREATE INDEX idx_daily_provider_usage_usage_date ON daily_provider_usage(usage_date);
CREATE INDEX idx_daily_provider_usage_org_provider_date ON daily_provider_usage(organization_id, provider_id, usage_date DESC);